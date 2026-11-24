// Idempotent migration from the legacy schema (users/tags/dates) to the new one.
//
// It works in two phases: plan everything from a snapshot (pure, shared by dry and real runs, and
// fails on bad data before anything is written), then apply the writes in an order where a crash
// at any point leaves a state that a re-run plans and completes correctly. No transactions.
import mongoose, { Types, type mongo } from 'mongoose';
import { slugify } from '../lib/slug.js';
import { allModels } from '../models/index.js';
import { tagDefaultFor } from './legacy-tags.js';

export interface MigrationReport {
  tags: { converted: number; created: number; merged: number };
  users: { converted: number; merged: number; deleted: number; demoted: number };
  ideas: { converted: number; approved: number; pending: number; legacyCollectionRenamed: boolean };
  /** Whether indexes were actually synced (always false on a dry run). */
  indexesSynced: boolean;
  dryRun: boolean;
}

/** Extra output for `--verbose`. Never contains email addresses. */
export interface MigrationDetails {
  tags: { name: string; slug: string; icon: string; placeType: string }[];
  mergedEmailGroupSizes: number[];
}

type ObjectId = mongo.ObjectId;

interface RawTag {
  _id: ObjectId;
  tagName?: unknown;
  name?: unknown;
  slug?: unknown;
  icon?: unknown;
}
interface RawUser {
  _id: ObjectId;
  email?: unknown;
  isAdmin?: unknown;
  /** Computed in the projection: `password` or `isAdmin` present. The hash is never loaded. */
  legacy: boolean;
}
interface RawDate {
  _id: ObjectId;
  tittle?: unknown;
  text?: unknown;
  creator?: unknown;
  review?: unknown;
  tags?: unknown;
}

const LEGACY_DATES = 'legacy_dates';
const LEGACY_TAG = { tagName: { $exists: true } };
const LEGACY_USER = { $or: [{ password: { $exists: true } }, { isAdmin: { $exists: true } }] };
const present = (field: string) => ({ $ne: [{ $type: field }, 'missing'] });

const hex = (id: ObjectId) => id.toHexString();
// ObjectIds start with their creation time, so hex order is age order.
const oldestFirst = <T extends { _id: ObjectId }>(a: T, b: T) =>
  hex(a._id).localeCompare(hex(b._id));
const isObjectId = (v: unknown): v is ObjectId =>
  (v as { _bsontype?: unknown } | null)?._bsontype === 'ObjectId';
const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** Sets the given fields and, when missing, timestamps from the `_id`; values are literals. */
function convertPipeline(id: ObjectId, set: Record<string, unknown>, unset: string[]) {
  const ts = id.getTimestamp();
  const literals = Object.fromEntries(Object.entries(set).map(([k, v]) => [k, { $literal: v }]));
  return [
    {
      $set: {
        ...literals,
        createdAt: { $ifNull: ['$createdAt', { $literal: ts }] },
        updatedAt: { $ifNull: ['$updatedAt', { $literal: ts }] },
      },
    },
    { $unset: unset },
  ];
}

interface Snapshot {
  tags: RawTag[];
  users: RawUser[];
  dates: RawDate[] | null;
  /** `_id`s of dates that already exist in `ideas`. */
  copiedIdeaIds: Set<string>;
}

async function collectionExists(db: mongo.Db, name: string): Promise<boolean> {
  return db.listCollections({ name }, { nameOnly: true }).hasNext();
}

async function takeSnapshot(db: mongo.Db): Promise<Snapshot> {
  const tags = await db.collection<RawTag>('tags').find({}).toArray();
  const users = await db
    .collection<RawUser>('users')
    .find(
      {},
      {
        projection: {
          email: 1,
          isAdmin: 1,
          legacy: { $or: [present('$password'), present('$isAdmin')] },
        },
      },
    )
    .toArray();
  if (!(await collectionExists(db, 'dates'))) {
    return { tags, users, dates: null, copiedIdeaIds: new Set() };
  }
  const dates = await db.collection<RawDate>('dates').find({}).toArray();
  const copied = await db
    .collection('ideas')
    .find({ _id: { $in: dates.map((d) => d._id) } }, { projection: { _id: 1 } })
    .toArray();
  return { tags, users, dates, copiedIdeaIds: new Set(copied.map((d) => hex(d._id))) };
}

interface TagOut {
  _id: ObjectId;
  name: string;
  slug: string;
  icon: string;
}

interface Plan {
  report: Omit<MigrationReport, 'indexesSynced' | 'dryRun'>;
  details: MigrationDetails;
  tags: { deleteIds: ObjectId[]; convert: TagOut[]; create: TagOut[] };
  users: {
    repoint: { from: ObjectId[]; to: ObjectId }[];
    deleteIds: ObjectId[];
    convert: { _id: ObjectId; email: string }[];
  };
  ideas: { insert: Record<string, unknown>[]; renameTo: string | null };
}

function planTags(snap: Snapshot, problems: string[]) {
  const groups = new Map<string, { legacy: (RawTag & { name: string })[]; modern: RawTag[] }>();
  const groupFor = (slug: string) => {
    let g = groups.get(slug);
    if (!g) groups.set(slug, (g = { legacy: [], modern: [] }));
    return g;
  };
  let converted = 0;
  for (const t of snap.tags) {
    if ('tagName' in t) {
      converted++;
      const name = nonEmpty(t.tagName) ? t.tagName.trim() : '';
      const slug = slugify(name);
      if (!slug) problems.push(`tag ${hex(t._id)}: tagName has no letters or digits`);
      else groupFor(slug).legacy.push({ ...t, name });
    } else if (nonEmpty(t.slug)) {
      groupFor(t.slug).modern.push(t);
    } else {
      problems.push(`tag ${hex(t._id)}: neither tagName nor slug`);
    }
  }

  const deleteIds: ObjectId[] = [];
  const convert: TagOut[] = [];
  const final: TagOut[] = [];
  for (const [slug, g] of groups) {
    g.legacy.sort(oldestFirst);
    g.modern.sort(oldestFirst);
    if (g.modern.length > 1) problems.push(`tags: more than one migrated tag has slug "${slug}"`);
    // A tag already in the new shape always wins: ideas may reference it, and it is never touched.
    const modern = g.modern[0];
    const keeper = modern ? undefined : g.legacy[0];
    for (const t of g.legacy) if (t !== keeper) deleteIds.push(t._id);
    if (modern) {
      final.push({
        _id: modern._id,
        name: nonEmpty(modern.name) ? modern.name : slug,
        slug,
        icon: typeof modern.icon === 'string' ? modern.icon : '',
      });
    } else if (keeper) {
      const out = { _id: keeper._id, name: keeper.name, slug, icon: tagDefaultFor(slug).icon };
      convert.push(out);
      final.push(out);
    }
  }

  // Tag names used by dates that have no tag doc at all.
  const bySlug = new Map(final.map((t) => [t.slug, t._id]));
  const create: TagOut[] = [];
  for (const d of snap.dates ?? []) {
    for (const name of Array.isArray(d.tags) ? d.tags : []) {
      if (!nonEmpty(name)) continue;
      const slug = slugify(name);
      if (!slug || bySlug.has(slug)) continue;
      const out = {
        _id: new Types.ObjectId(),
        name: name.trim(),
        slug,
        icon: tagDefaultFor(slug).icon,
      };
      bySlug.set(slug, out._id);
      create.push(out);
      final.push(out);
    }
  }

  return {
    report: { converted, created: create.length, merged: deleteIds.length },
    ops: { deleteIds, convert, create },
    final,
    bySlug,
  };
}

function planUsers(snap: Snapshot, problems: string[]) {
  const groups = new Map<string, RawUser[]>();
  for (const u of snap.users) {
    if (!nonEmpty(u.email)) {
      problems.push(`user ${hex(u._id)}: missing email`);
      continue;
    }
    const email = u.email.trim().toLowerCase();
    groups.set(email, [...(groups.get(email) ?? []), u]);
  }

  const legacy = snap.users.filter((u) => u.legacy);
  const repoint: Plan['users']['repoint'] = [];
  const deleteIds: ObjectId[] = [];
  const creatorMap = new Map<string, ObjectId>();
  const mergedEmailGroupSizes: number[] = [];
  const convert: Plan['users']['convert'] = [];

  for (const [email, members] of groups) {
    members.sort(oldestFirst);
    const modern = members.filter((u) => !u.legacy);
    if (modern.length > 1) {
      problems.push(
        `users ${modern.map((u) => hex(u._id)).join(', ')}: migrated accounts share an email`,
      );
      continue;
    }
    // Oldest account wins; an account already in the new shape is never touched, so it wins too.
    const keeper = (modern[0] ?? members[0]) as RawUser;
    const dups = members.filter((u) => u !== keeper);
    if (dups.length) {
      mergedEmailGroupSizes.push(members.length);
      repoint.push({ from: dups.map((u) => u._id), to: keeper._id });
      for (const u of dups) {
        deleteIds.push(u._id);
        creatorMap.set(hex(u._id), keeper._id);
      }
    }
    if (keeper.legacy) convert.push({ _id: keeper._id, email });
  }

  return {
    report: {
      converted: legacy.length,
      merged: mergedEmailGroupSizes.length,
      deleted: deleteIds.length,
      demoted: legacy.filter((u) => u.isAdmin === true).length,
    },
    ops: { repoint, deleteIds, convert },
    creatorMap,
    mergedEmailGroupSizes,
  };
}

function planIdeas(
  snap: Snapshot,
  tagIdBySlug: Map<string, ObjectId>,
  creatorMap: Map<string, ObjectId>,
  problems: string[],
) {
  const insert: Record<string, unknown>[] = [];
  let approved = 0;
  for (const d of snap.dates ?? []) {
    if (snap.copiedIdeaIds.has(hex(d._id))) continue;
    if (!nonEmpty(d.tittle) || !nonEmpty(d.text) || !isObjectId(d.creator)) {
      problems.push(`date ${hex(d._id)}: needs tittle, text and creator`);
      continue;
    }
    const slugs = [
      ...new Set((Array.isArray(d.tags) ? d.tags : []).filter(nonEmpty).map(slugify)),
    ].filter(Boolean);
    const status = d.review === true ? 'approved' : 'pending';
    if (status === 'approved') approved++;
    const ts = d._id.getTimestamp();
    insert.push({
      _id: d._id,
      title: d.tittle.trim(),
      description: d.text,
      image: null,
      tags: slugs.map((s) => tagIdBySlug.get(s) as ObjectId),
      placeType: slugs[0] ? tagDefaultFor(slugs[0]).placeType : 'none',
      budget: null,
      duration: null,
      creator: creatorMap.get(hex(d.creator)) ?? d.creator,
      status,
      ratingAvg: 0,
      ratingCount: 0,
      saveCount: 0,
      createdAt: ts,
      updatedAt: ts,
      __v: 0,
    });
  }
  return { insert, approved, pending: insert.length - approved };
}

async function legacyDatesName(db: mongo.Db): Promise<string> {
  if (!(await collectionExists(db, LEGACY_DATES))) return LEGACY_DATES;
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14); // YYYYMMDDHHmmss, UTC
  const name = `${LEGACY_DATES}_${stamp}`;
  if (await collectionExists(db, name)) throw new Error(`Collection ${name} already exists`);
  return name;
}

async function plan(db: mongo.Db): Promise<Plan> {
  const snap = await takeSnapshot(db);
  const problems: string[] = [];
  const tags = planTags(snap, problems);
  const users = planUsers(snap, problems);
  const ideas = planIdeas(snap, tags.bySlug, users.creatorMap, problems);
  if (problems.length) {
    throw new Error(
      `Legacy data needs fixing first, nothing was written:\n- ${problems.join('\n- ')}`,
    );
  }
  return {
    report: {
      tags: tags.report,
      users: users.report,
      ideas: {
        converted: ideas.insert.length,
        approved: ideas.approved,
        pending: ideas.pending,
        legacyCollectionRenamed: snap.dates !== null,
      },
    },
    details: {
      tags: tags.final
        .map((t) => ({
          name: t.name,
          slug: t.slug,
          icon: t.icon,
          placeType: tagDefaultFor(t.slug).placeType,
        }))
        .sort((a, b) => a.slug.localeCompare(b.slug)),
      mergedEmailGroupSizes: users.mergedEmailGroupSizes,
    },
    tags: tags.ops,
    users: users.ops,
    ideas: { insert: ideas.insert, renameTo: snap.dates ? await legacyDatesName(db) : null },
  };
}

// Each write only matches documents still in legacy shape, and every step is safe to repeat:
// - tags: duplicates are deleted before their keeper is converted; a re-run regroups by slug.
// - users: creators are re-pointed, then duplicates deleted, then keepers converted, so a
//   duplicate stays legacy (and is found again) until it is gone.
// - ideas: inserted with the date's `_id` (existing ones skipped); `dates` is renamed last.
async function apply(db: mongo.Db, p: Plan): Promise<void> {
  const tags = db.collection<RawTag>('tags');
  if (p.tags.deleteIds.length) {
    await tags.deleteMany({ _id: { $in: p.tags.deleteIds }, ...LEGACY_TAG });
  }
  for (const t of p.tags.convert) {
    await tags.updateOne(
      { _id: t._id, ...LEGACY_TAG },
      convertPipeline(t._id, { name: t.name, slug: t.slug, icon: t.icon }, ['tagName']),
    );
  }
  for (const t of p.tags.create) {
    const now = new Date();
    await tags.updateOne(
      { slug: t.slug },
      {
        $setOnInsert: {
          _id: t._id,
          name: t.name,
          icon: t.icon,
          createdAt: now,
          updatedAt: now,
          __v: 0,
        },
      },
      { upsert: true },
    );
  }

  const users = db.collection<RawUser>('users');
  for (const { from, to } of p.users.repoint) {
    for (const name of ['dates', 'ideas']) {
      await db.collection(name).updateMany({ creator: { $in: from } }, { $set: { creator: to } });
    }
  }
  if (p.users.deleteIds.length) {
    await users.deleteMany({ _id: { $in: p.users.deleteIds }, ...LEGACY_USER });
  }
  for (const u of p.users.convert) {
    await users.updateOne({ _id: u._id, ...LEGACY_USER }, [
      { $set: { passwordHash: '$password' } },
      ...convertPipeline(u._id, { email: u.email, role: 'user' }, [
        'password',
        'isAdmin',
        'personalRates',
      ]),
    ]);
  }

  const ideas = db.collection('ideas');
  for (const doc of p.ideas.insert) {
    try {
      await ideas.insertOne(doc);
    } catch (err) {
      if ((err as { code?: unknown }).code !== 11000) throw err;
    }
  }
  if (p.ideas.renameTo) await db.renameCollection('dates', p.ideas.renameTo);
}

export async function runMigrationWithDetails(
  db: mongo.Db,
  opts: { dryRun: boolean },
): Promise<{ report: MigrationReport; details: MigrationDetails }> {
  // syncIndexes runs through the models, i.e. on mongoose's connection: it must be this db.
  if (!opts.dryRun && db !== mongoose.connection.db) {
    throw new Error('runMigration: db must be the database of the open mongoose connection');
  }
  const p = await plan(db);
  if (!opts.dryRun) {
    await apply(db, p);
    // Builds the unique email/slug indexes now that duplicates are gone.
    for (const model of allModels) await model.syncIndexes();
  }
  return {
    report: { ...p.report, indexesSynced: !opts.dryRun, dryRun: opts.dryRun },
    details: p.details,
  };
}

export async function runMigration(
  db: mongo.Db,
  opts: { dryRun: boolean },
): Promise<MigrationReport> {
  return (await runMigrationWithDetails(db, opts)).report;
}
