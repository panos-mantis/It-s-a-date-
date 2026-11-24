import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { createTestIdea } from '../test/factories.js';
import { useTestDb } from '../test/db.js';
import { IdeaModel, RatingModel, SaveModel, TagModel, UserModel } from '../models/index.js';
import { SEED_IDEAS } from './ideas.js';
import { hashSeed, mulberry32 } from './random.js';
import { runSeed } from './seed.js';
import { SAMPLE_USERS, TEAM_USER } from './users.js';

useTestDb();

describe('mulberry32', () => {
  it('is deterministic and in [0, 1)', () => {
    const a = mulberry32(hashSeed('x'));
    const b = mulberry32(hashSeed('x'));
    const xs = Array.from({ length: 5 }, () => a());
    expect(xs).toEqual(Array.from({ length: 5 }, () => b()));
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });
});

describe('runSeed dev', () => {
  it('seeds approved ideas, is idempotent and keeps aggregates consistent', async () => {
    const first = await runSeed({ mode: 'dev' });
    expect(first.ideasInserted).toBe(SEED_IDEAS.length);
    expect(await IdeaModel.countDocuments({ status: 'approved' })).toBe(SEED_IDEAS.length);
    expect(await UserModel.countDocuments()).toBe(SAMPLE_USERS.length);
    expect(first.ratings).toBeGreaterThan(0);
    expect(first.saves).toBeGreaterThan(0);

    const counts = {
      ratings: await RatingModel.countDocuments(),
      saves: await SaveModel.countDocuments(),
    };
    const second = await runSeed({ mode: 'dev' });
    expect(second).toMatchObject({ ideasInserted: 0, ideasExisting: SEED_IDEAS.length });
    expect({
      ratings: await RatingModel.countDocuments(),
      saves: await SaveModel.countDocuments(),
    }).toEqual(counts);

    for (const idea of await IdeaModel.find({ seedKey: { $exists: true } })) {
      expect(idea.ratingCount).toBe(await RatingModel.countDocuments({ idea: idea._id }));
      expect(idea.saveCount).toBe(await SaveModel.countDocuments({ idea: idea._id }));
    }
    const spread = new Set((await IdeaModel.find()).map((i) => Math.round(i.ratingAvg * 10)));
    expect(spread.size).toBeGreaterThanOrEqual(5);
  });

  it('stores bcrypt hashes for seeded users and no images', async () => {
    await runSeed({ mode: 'dev' });
    for (const idea of await IdeaModel.find()) expect(idea.image).toBeNull();
    const users = await UserModel.find().select('+passwordHash');
    for (const u of users) expect(u.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('lets a migrated tag keep its name', async () => {
    await TagModel.create({ name: 'Board game', slug: 'board-game', icon: 'dice-5' });
    await runSeed({ mode: 'dev' });
    expect((await TagModel.findOne({ slug: 'board-game' }))?.name).toBe('Board game');
    expect(await TagModel.countDocuments()).toBe(8);
  });

  it('builds the unique indexes before writing', async () => {
    await UserModel.collection.drop().catch(() => undefined);
    await runSeed({ mode: 'dev' });
    const indexes = await UserModel.collection.indexes();
    expect(indexes.some((i) => i.unique && i.key.email === 1)).toBe(true);
  });

  it('remove deletes seed content only', async () => {
    await runSeed({ mode: 'dev' });
    const real = await UserModel.create({
      name: 'Real',
      email: 'real@real.test',
      passwordHash: 'x',
    });
    const idea = await createTestIdea({ creator: real._id });
    const report = await runSeed({ mode: 'dev', remove: true });
    expect(report.removed).toBe(SEED_IDEAS.length);
    expect(await IdeaModel.countDocuments()).toBe(1);
    expect(await IdeaModel.findById(idea._id)).not.toBeNull();
    expect(await RatingModel.countDocuments()).toBe(0);
    expect(await SaveModel.countDocuments()).toBe(0);
    expect(await UserModel.countDocuments()).toBe(1);
  });

  it('reset removes then seeds again', async () => {
    await runSeed({ mode: 'dev' });
    const report = await runSeed({ mode: 'dev', reset: true });
    expect(report.ideasInserted).toBe(SEED_IDEAS.length);
    expect(await IdeaModel.countDocuments()).toBe(SEED_IDEAS.length);
  });
});

describe('runSeed prod', () => {
  it('authors by the team user with no fake activity', async () => {
    await runSeed({ mode: 'prod' });
    expect(await RatingModel.countDocuments()).toBe(0);
    expect(await SaveModel.countDocuments()).toBe(0);
    expect(await UserModel.countDocuments()).toBe(1);
    const ideas = await IdeaModel.find({ seedKey: { $exists: true } }).populate<{
      creator: { name: string };
    }>('creator');
    expect(ideas).toHaveLength(SEED_IDEAS.length);
    expect(new Set(ideas.map((i) => i.creator.name))).toEqual(new Set([TEAM_USER.name]));
  });

  it('refuses to adopt a team account the seed did not create', async () => {
    await UserModel.create({
      name: 'Mallory',
      email: TEAM_USER.email,
      passwordHash: 'x'.repeat(60),
    });
    await expect(runSeed({ mode: 'prod' })).rejects.toThrow(
      `${TEAM_USER.email} exists but was not created by the seed; fix it before seeding`,
    );
    expect(await IdeaModel.countDocuments()).toBe(0);
  });

  it('refuses reset', async () => {
    await expect(runSeed({ mode: 'prod', reset: true })).rejects.toThrow();
  });

  it('remove keeps the team user when they have non-seed ideas', async () => {
    await runSeed({ mode: 'prod' });
    const team = await UserModel.findOne({ email: TEAM_USER.email });
    await createTestIdea({ creator: team!._id });
    await runSeed({ mode: 'prod', remove: true });
    expect(await UserModel.countDocuments({ email: TEAM_USER.email })).toBe(1);
    await IdeaModel.deleteMany({});
    await runSeed({ mode: 'prod', remove: true });
    expect(await UserModel.countDocuments({ email: TEAM_USER.email })).toBe(0);
  });
});

describe('runSeed remove safety', () => {
  const maya = SAMPLE_USERS[0]!;

  it('prod remove never touches sample-user accounts', async () => {
    await UserModel.create({ name: 'Maya', email: maya.email, passwordHash: 'x' });
    await runSeed({ mode: 'prod' });
    await runSeed({ mode: 'prod', remove: true });
    expect(await UserModel.countDocuments({ email: maya.email })).toBe(1);
  });

  it('dev remove keeps a sample user who owns a non-seed idea', async () => {
    await runSeed({ mode: 'dev' });
    const user = await UserModel.findOne({ email: maya.email });
    await createTestIdea({ creator: user!._id });
    await runSeed({ mode: 'dev', remove: true });
    expect(await UserModel.countDocuments({ email: maya.email })).toBe(1);
    expect(await UserModel.countDocuments()).toBe(1);
  });

  it('removes a sample user activity on real ideas and recomputes their stats', async () => {
    await runSeed({ mode: 'dev' });
    const real = await UserModel.create({ name: 'R', email: 'r@real.test', passwordHash: 'x' });
    const idea = await createTestIdea({ creator: real._id });
    const users = await UserModel.find({ email: { $in: SAMPLE_USERS.map((u) => u.email) } });
    await RatingModel.create({ idea: idea._id, user: users[0]!._id, value: 5 });
    await RatingModel.create({ idea: idea._id, user: users[1]!._id, value: 3 });
    await SaveModel.create({ idea: idea._id, user: users[0]!._id });
    await IdeaModel.updateOne({ _id: idea._id }, { ratingAvg: 4, ratingCount: 2, saveCount: 1 });
    await runSeed({ mode: 'dev', remove: true });
    const after = await IdeaModel.findById(idea._id);
    expect(after).toMatchObject({ ratingAvg: 0, ratingCount: 0, saveCount: 0 });
    expect(await RatingModel.countDocuments()).toBe(0);
    expect(await SaveModel.countDocuments()).toBe(0);
  });
});

describe('runSeed legacy guard', () => {
  it('refuses when a legacy dates collection exists, before any write', async () => {
    await mongoose.connection.db!.collection('dates').insertOne({ tittle: 'x' });
    try {
      await expect(runSeed({ mode: 'dev' })).rejects.toThrow(/legacy data.*migrate/);
      expect(await TagModel.countDocuments()).toBe(0);
    } finally {
      await mongoose.connection.db!.collection('dates').drop();
    }
  });
});
