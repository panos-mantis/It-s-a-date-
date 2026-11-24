import bcrypt from 'bcryptjs';
import mongoose, { Types, type mongo } from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { createAdmin } from '../features/users/create-admin.js';
import { IdeaModel, TagModel, UserModel, type ITag } from '../models/index.js';
import { testEnv } from '../test/env.js';
import { useTestDb } from '../test/db.js';
import { runMigration, runMigrationWithDetails } from './migrate.js';

useTestDb();

const at = (iso: string) => Types.ObjectId.createFromTime(Date.parse(iso) / 1000);

const tagFood = at('2021-01-01T00:00:00Z');
const tagBoardGame = at('2021-01-02T00:00:00Z');
const tagFoodDup = at('2021-01-03T00:00:00Z');
const oldestA = at('2021-02-01T00:00:00Z');
const newerA = at('2021-02-02T00:00:00Z');
const userB = at('2021-02-03T00:00:00Z');
const legacyDateId = at('2021-03-01T00:00:00Z');
const otherId = at('2021-03-02T00:00:00Z');

let db: mongo.Db;

/** Drops every collection (and index) so fixtures mirror prod, which has no unique indexes. */
async function insertLegacyFixtures(): Promise<void> {
  db = mongoose.connection.db as mongo.Db;
  for (const c of await db.listCollections({}, { nameOnly: true }).toArray()) {
    await db.dropCollection(c.name);
  }
  await db.collection('tags').insertMany([
    { _id: tagFood, tagName: 'food', __v: 0 },
    { _id: tagBoardGame, tagName: 'Board game', __v: 0 },
    { _id: tagFoodDup, tagName: 'Food', __v: 0 },
  ]);
  await db.collection('users').insertMany([
    {
      _id: oldestA,
      name: 'Ana',
      email: 'a@x.com',
      password: await bcrypt.hash('pw-oldest', 4),
      isAdmin: true,
      personalRates: [],
      __v: 0,
    },
    {
      _id: newerA,
      name: 'Ana again',
      email: ' A@X.com ',
      password: await bcrypt.hash('pw-newer', 4),
      isAdmin: false,
      personalRates: [{ dateId: 'x', rate: 4 }],
      __v: 0,
    },
    {
      _id: userB,
      name: 'Bo',
      email: 'b@x.com',
      password: await bcrypt.hash('pw-b', 4),
      isAdmin: false,
      personalRates: [],
      __v: 0,
    },
  ]);
  await db.collection('dates').insertMany([
    {
      _id: legacyDateId,
      tittle: 'Restaurant hop.',
      text: 'Three courses, three places.',
      creator: newerA,
      overallRates: [5, 4],
      image: 'https://firebasestorage.googleapis.com/v0/b/x/o/dead.jpg',
      review: true,
      tags: ['food', 'Board game'],
      __v: 0,
    },
    {
      _id: otherId,
      tittle: 'Dance class',
      text: 'Salsa for beginners.',
      creator: userB,
      overallRates: [],
      image: '',
      review: false,
      tags: ['dancing'],
      __v: 0,
    },
  ]);
}

beforeEach(insertLegacyFixtures);

describe('runMigration (dry run)', () => {
  it('computes the report and writes nothing', async () => {
    const dry = await runMigration(db, { dryRun: true });
    expect(dry).toMatchObject({
      dryRun: true,
      users: { converted: 3, merged: 1, deleted: 1, demoted: 1 },
      ideas: { converted: 2, approved: 1, pending: 1, legacyCollectionRenamed: true },
      tags: { converted: 3, merged: 1, created: 1 },
      indexesSynced: false,
    });
    expect(await db.collection('dates').countDocuments()).toBe(2);
    expect(await db.collection('users').countDocuments({ password: { $exists: true } })).toBe(3);
    expect(await db.collection('tags').countDocuments({ tagName: { $exists: true } })).toBe(3);
    expect(await db.listCollections({ name: 'ideas' }).hasNext()).toBe(false);
    expect(await db.listCollections({ name: 'legacy_dates' }).hasNext()).toBe(false);
    expect(await db.collection('users').indexes()).toHaveLength(1); // _id only
  });

  it('matches the report of the real run', async () => {
    const dry = await runMigration(db, { dryRun: true });
    const real = await runMigration(db, { dryRun: false });
    expect({ ...real, dryRun: true, indexesSynced: false }).toEqual(dry);
  });
});

describe('runMigration', () => {
  it('converts dates into ideas with the same _id and resolved tags', async () => {
    const report = await runMigration(db, { dryRun: false });
    expect(report).toMatchObject({ dryRun: false, indexesSynced: true });
    expect(report.ideas.legacyCollectionRenamed).toBe(true);

    const idea = await IdeaModel.findById(legacyDateId).populate<{ tags: ITag[] }>('tags');
    expect(idea).toMatchObject({
      title: 'Restaurant hop.',
      description: 'Three courses, three places.',
      status: 'approved',
      image: null,
      budget: null,
      duration: null,
      placeType: 'restaurant',
      ratingAvg: 0,
      ratingCount: 0,
      saveCount: 0,
    });
    expect(idea?.tags.map((t) => t.slug)).toEqual(['food', 'board-game']);
    expect(String(idea?.creator)).toBe(String(oldestA));
    expect(idea?.createdAt).toEqual(legacyDateId.getTimestamp());

    const other = await IdeaModel.findById(otherId);
    expect(other).toMatchObject({ status: 'pending', placeType: 'none' });

    const raw = await db.collection('ideas').findOne({ _id: legacyDateId });
    expect(raw).not.toHaveProperty('tittle');
    expect(raw).not.toHaveProperty('overallRates');
    expect(await db.listCollections({ name: 'dates' }).hasNext()).toBe(false);
    expect(await db.collection('legacy_dates').countDocuments()).toBe(2);
  });

  it('converts tags, merges same-slug tags and creates tags only named by dates', async () => {
    await runMigration(db, { dryRun: false });
    const tags = await TagModel.find().sort({ slug: 1 }).lean();
    expect(tags.map((t) => [String(t._id), t.name, t.slug, t.icon])).toEqual([
      [String(tagBoardGame), 'Board game', 'board-game', 'dice-5'],
      [expect.any(String), 'dancing', 'dancing', 'music'],
      [String(tagFood), 'food', 'food', 'utensils'],
    ]);
    expect(tags.every((t) => !('tagName' in t))).toBe(true);
    expect(tags.find((t) => t.slug === 'food')?.createdAt).toEqual(tagFood.getTimestamp());
  });

  it('converts users, demotes admins and builds the unique email index', async () => {
    await runMigration(db, { dryRun: false });
    expect(await UserModel.countDocuments({ role: 'admin' })).toBe(0);
    expect(await UserModel.countDocuments({ role: 'user' })).toBe(2);
    const raw = await db.collection('users').findOne({ _id: oldestA });
    expect(raw).toMatchObject({ email: 'a@x.com', role: 'user' });
    expect(raw).not.toHaveProperty('password');
    expect(raw).not.toHaveProperty('isAdmin');
    expect(raw).not.toHaveProperty('personalRates');
    expect(raw?.createdAt).toEqual(oldestA.getTimestamp());
    await expect(
      UserModel.create({ name: 'Dup', email: 'b@x.com', passwordHash: 'h' }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('merges case-variant duplicates and keeps the oldest password', async () => {
    await runMigration(db, { dryRun: false });
    expect(await UserModel.countDocuments({ email: 'a@x.com' })).toBe(1);
    expect(await UserModel.exists({ _id: newerA })).toBeNull();
    const app = createApp({ env: testEnv() });
    const ok = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'A@x.com', password: 'pw-oldest' });
    expect(ok.status).toBe(200);
    const old = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'a@x.com', password: 'pw-newer' });
    expect(old.status).toBe(401);
  });

  it('does not demote admins or resurrect ideas on re-run', async () => {
    await runMigration(db, { dryRun: false });
    await createAdmin({ email: 'owner@x.com', name: 'Owner', password: 'long-enough-pw' });
    await IdeaModel.deleteOne({ _id: legacyDateId });
    await IdeaModel.updateOne({ _id: otherId }, { budget: 2 });

    const again = await runMigration(db, { dryRun: false });
    expect(again).toMatchObject({
      users: { converted: 0, merged: 0, deleted: 0, demoted: 0 },
      ideas: { converted: 0, legacyCollectionRenamed: false },
      tags: { converted: 0, merged: 0, created: 0 },
    });
    expect((await UserModel.findOne({ email: 'owner@x.com' }))?.role).toBe('admin');
    expect(await IdeaModel.findById(legacyDateId)).toBeNull();
    expect((await IdeaModel.findById(otherId))?.budget).toBe(2);
  });

  it('resumes a partial run: skips ideas already copied and keeps an existing new tag', async () => {
    // State after a crash: one idea already copied, a dup tag already gone, keeper converted.
    await db.collection('ideas').insertOne({ _id: otherId, title: 'Already copied' });
    await db.collection('tags').deleteOne({ _id: tagFoodDup });
    await db
      .collection('tags')
      .updateOne(
        { _id: tagFood },
        { $set: { name: 'food', slug: 'food', icon: 'utensils' }, $unset: { tagName: '' } },
      );
    await db.collection('tags').insertOne({ _id: tagFoodDup, tagName: 'FOOD' });

    const report = await runMigration(db, { dryRun: false });
    expect(report).toMatchObject({
      tags: { converted: 2, merged: 1, created: 1 },
      ideas: { converted: 1, approved: 1, pending: 0, legacyCollectionRenamed: true },
    });
    expect((await IdeaModel.findById(otherId))?.title).toBe('Already copied');
    expect(await TagModel.countDocuments({ slug: 'food' })).toBe(1);
    expect(String((await TagModel.findOne({ slug: 'food' }))?._id)).toBe(String(tagFood));
  });

  it('renames dates to a timestamped name when legacy_dates is taken', async () => {
    await db.collection('legacy_dates').insertOne({ tittle: 'from an earlier copy' });
    await runMigration(db, { dryRun: false });
    const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
    expect(names).not.toContain('dates');
    expect(names.filter((n) => /^legacy_dates_\d{14}$/.test(n))).toHaveLength(1);
    expect(await db.collection('legacy_dates').countDocuments()).toBe(1);
  });

  it('returns tag and merged-group details without email addresses', async () => {
    const { details } = await runMigrationWithDetails(db, { dryRun: true });
    expect(details.tags).toEqual(
      expect.arrayContaining([
        { name: 'food', slug: 'food', icon: 'utensils', placeType: 'restaurant' },
        { name: 'dancing', slug: 'dancing', icon: 'music', placeType: 'none' },
      ]),
    );
    expect(details.tags).toHaveLength(3);
    expect(details.mergedEmailGroupSizes).toEqual([2]);
    expect(JSON.stringify(details)).not.toMatch(/@/);
  });

  it('aborts before writing anything when legacy data is unusable', async () => {
    await db.collection('dates').updateOne({ _id: otherId }, { $unset: { tittle: '' } });
    await expect(runMigration(db, { dryRun: true })).rejects.toThrow(String(otherId));
    await expect(runMigration(db, { dryRun: false })).rejects.toThrow(/nothing was written/);
    expect(await db.collection('users').countDocuments({ password: { $exists: true } })).toBe(3);
    expect(await db.collection('tags').countDocuments({ tagName: { $exists: true } })).toBe(3);
    expect(await db.listCollections({ name: 'ideas' }).hasNext()).toBe(false);
  });

  it('refuses to write to a database other than the mongoose connection', async () => {
    const other = mongoose.connection.getClient().db(`${db.databaseName}_other`);
    await expect(runMigration(other, { dryRun: false })).rejects.toThrow(/connection/);
    expect(await db.collection('dates').countDocuments()).toBe(2);
  });
});
