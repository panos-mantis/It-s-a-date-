import { randomBytes } from 'node:crypto';
import mongoose, { type Types } from 'mongoose';
import { authService } from '../features/auth/auth.service.js';
import { ideasRepository } from '../features/ideas/ideas.repository.js';
import { ratingsRepository } from '../features/ratings/ratings.repository.js';
import { savesRepository } from '../features/saves/saves.repository.js';
import {
  allModels,
  IdeaModel,
  RatingModel,
  SaveModel,
  TagModel,
  UserModel,
} from '../models/index.js';
import { SEED_IDEAS } from './ideas.js';
import { hashSeed, mulberry32 } from './random.js';
import { SEED_TAGS } from './tags.js';
import { SAMPLE_USERS, TEAM_USER, type SeedUser } from './users.js';

export interface SeedOptions {
  mode: 'dev' | 'prod';
  reset?: boolean;
  remove?: boolean;
}

export interface SeedReport {
  tags: number;
  ideasInserted: number;
  ideasExisting: number;
  users: number;
  ratings: number;
  saves: number;
  removed?: number;
}

const RATE_SHARE = 0.6;
const SAVE_SHARE = 0.3;

/** Creates the user if missing, with a random password nobody ever sees. Returns the user id. */
async function ensureUser(u: SeedUser): Promise<Types.ObjectId> {
  const existing = await UserModel.findOne({ email: u.email }).select('_id').exec();
  if (existing) return existing._id;
  const passwordHash = await authService.hashPassword(randomBytes(24).toString('hex'));
  const created = await UserModel.create({ name: u.name, email: u.email, passwordHash });
  return created._id;
}

async function upsertTags(): Promise<Map<string, Types.ObjectId>> {
  await TagModel.bulkWrite(
    SEED_TAGS.map((t) => ({
      updateOne: { filter: { slug: t.slug }, update: { $setOnInsert: t }, upsert: true },
    })),
  );
  const tags = await TagModel.find({ slug: { $in: SEED_TAGS.map((t) => t.slug) } }).exec();
  return new Map(tags.map((t) => [t.slug, t._id]));
}

/** Recomputes the stored aggregates of the given ideas from the ratings and saves collections. */
async function refreshAggregates(ids: Iterable<Types.ObjectId>): Promise<void> {
  for (const id of ids) {
    const stats = await ratingsRepository.statsForIdea(String(id));
    await ideasRepository.setRatingStats(String(id), stats);
    await ideasRepository.setSaveCount(String(id), await savesRepository.countForIdea(String(id)));
  }
}

/** Dev only. Deletes sample users who own nothing else, plus their activity, and fixes the stats. */
async function removeSampleUsers(): Promise<void> {
  const users = await UserModel.find({ email: { $in: SAMPLE_USERS.map((u) => u.email) } })
    .select('_id')
    .exec();
  for (const user of users) {
    if ((await IdeaModel.countDocuments({ creator: user._id }).exec()) > 0) continue;
    const touched = new Map<string, Types.ObjectId>();
    for (const r of await RatingModel.find({ user: user._id }).select('idea').exec()) {
      touched.set(String(r.idea), r.idea);
    }
    for (const s of await SaveModel.find({ user: user._id }).select('idea').exec()) {
      touched.set(String(s.idea), s.idea);
    }
    await RatingModel.deleteMany({ user: user._id }).exec();
    await SaveModel.deleteMany({ user: user._id }).exec();
    await UserModel.deleteOne({ _id: user._id }).exec();
    await refreshAggregates(touched.values());
  }
}

/** Deletes every seeded idea with its ratings and saves, then the seed users. Returns ideas removed. */
async function removeSeed(mode: 'dev' | 'prod'): Promise<number> {
  const ids = (
    await IdeaModel.find({ seedKey: { $exists: true } })
      .select('_id')
      .exec()
  ).map((i) => i._id);
  await RatingModel.deleteMany({ idea: { $in: ids } }).exec();
  await SaveModel.deleteMany({ idea: { $in: ids } }).exec();
  await IdeaModel.deleteMany({ _id: { $in: ids } }).exec();
  if (mode === 'dev') await removeSampleUsers();
  if (mode === 'prod') {
    const team = await UserModel.findOne({ email: TEAM_USER.email }).select('_id').exec();
    if (team && (await IdeaModel.countDocuments({ creator: team._id }).exec()) === 0) {
      await UserModel.deleteOne({ _id: team._id }).exec();
    }
  }
  return ids.length;
}

/** Deterministic dev activity: each idea gets a target average, each user rates around it. */
function planActivity(
  ideaIds: Map<string, Types.ObjectId>,
  userIds: Types.ObjectId[],
): {
  ratings: { idea: Types.ObjectId; user: Types.ObjectId; value: number }[];
  saves: { idea: Types.ObjectId; user: Types.ObjectId }[];
} {
  const ratings: { idea: Types.ObjectId; user: Types.ObjectId; value: number }[] = [];
  const saves: { idea: Types.ObjectId; user: Types.ObjectId }[] = [];
  for (const idea of SEED_IDEAS) {
    const ideaId = ideaIds.get(idea.seedKey);
    if (!ideaId) continue;
    const target = 2.5 + mulberry32(hashSeed(`target:${idea.seedKey}`))() * 2.5;
    SAMPLE_USERS.forEach((u, i) => {
      const userId = userIds[i];
      if (!userId) return;
      const rand = mulberry32(hashSeed(`${idea.seedKey}:${u.email}`));
      if (rand() < RATE_SHARE) {
        const value = Math.min(5, Math.max(1, Math.round(target + (rand() - 0.5) * 1.6)));
        ratings.push({ idea: ideaId, user: userId, value });
      }
      if (rand() < SAVE_SHARE) saves.push({ idea: ideaId, user: userId });
    });
  }
  return { ratings, saves };
}

export async function runSeed(opts: SeedOptions): Promise<SeedReport> {
  if (opts.reset && opts.mode === 'prod') throw new Error('--reset is only allowed in dev mode');

  // A migrated-but-not-yet-converted database must go through the migration first.
  const legacy = await mongoose.connection.db?.listCollections({ name: 'dates' }).toArray();
  if (legacy && legacy.length > 0) {
    throw new Error(
      'This database still has legacy data. Run `npm run migrate -w @itsadate/api` first.',
    );
  }

  // Connections never build indexes (see connectDb), so a fresh dev DB gets them here.
  await Promise.all(allModels.map((m) => m.syncIndexes()));

  const report: SeedReport = {
    tags: 0,
    ideasInserted: 0,
    ideasExisting: 0,
    users: 0,
    ratings: 0,
    saves: 0,
  };

  if (opts.remove || opts.reset) {
    report.removed = await removeSeed(opts.mode);
    if (opts.remove && !opts.reset) return report;
  }

  const tagIds = await upsertTags();
  report.tags = tagIds.size;

  const authors: Types.ObjectId[] = [];
  for (const u of opts.mode === 'dev' ? SAMPLE_USERS : [TEAM_USER]) {
    authors.push(await ensureUser(u));
  }
  report.users = authors.length;

  const result = await IdeaModel.bulkWrite(
    SEED_IDEAS.map((idea, i) => ({
      updateOne: {
        filter: { seedKey: idea.seedKey },
        update: {
          $setOnInsert: {
            seedKey: idea.seedKey,
            title: idea.title,
            description: idea.description,
            image: null,
            tags: idea.tags.map((s) => need(tagIds.get(s), `tag ${s}`)),
            placeType: idea.placeType,
            budget: idea.budget,
            duration: idea.duration,
            creator: need(authors[i % authors.length], 'author'),
            status: 'approved',
          },
        },
        upsert: true,
      },
    })),
  );
  report.ideasInserted = result.upsertedCount;
  report.ideasExisting = SEED_IDEAS.length - result.upsertedCount;

  if (opts.mode === 'prod') return report;

  const seeded = await IdeaModel.find({ seedKey: { $in: SEED_IDEAS.map((i) => i.seedKey) } })
    .select('_id seedKey')
    .exec();
  const ideaIds = new Map(seeded.map((i) => [i.seedKey as string, i._id]));
  const { ratings, saves } = planActivity(ideaIds, authors);

  if (ratings.length > 0) {
    await RatingModel.bulkWrite(
      ratings.map((r) => ({
        updateOne: {
          filter: { idea: r.idea, user: r.user },
          update: { $setOnInsert: r },
          upsert: true,
        },
      })),
    );
  }
  if (saves.length > 0) {
    await SaveModel.bulkWrite(
      saves.map((s) => ({
        updateOne: {
          filter: { idea: s.idea, user: s.user },
          update: { $setOnInsert: s },
          upsert: true,
        },
      })),
    );
  }
  report.ratings = ratings.length;
  report.saves = saves.length;

  await refreshAggregates(ideaIds.values());
  return report;
}

function need<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Seed bug: missing ${what}`);
  return value;
}
