// Deliberately not useTestDb(): this file connects through connectDb() itself, in a fresh worker,
// the way the server and the scripts do, to prove a connection never creates collections or
// indexes on its own (the legacy prod DB has none, and its emails are not unique yet).
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it, inject } from 'vitest';
import { runMigration } from '../migrate/migrate.js';
import { IdeaModel, RatingModel, SaveModel, TagModel, UserModel } from '../models/index.js';
import { connectDb, disconnectDb } from './connect.js';

const dbName = `itsadate_connect_${randomUUID().replace(/-/g, '')}`;
const client = new mongoose.mongo.MongoClient(inject('mongoUri'));
const raw = client.db(dbName);

const names = async () =>
  (await raw.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name).sort();

beforeAll(async () => {
  await client.connect();
  const creator = new mongoose.Types.ObjectId();
  await raw.collection('users').insertMany([
    { _id: creator, name: 'A', email: 'a@x.com', password: 'h', isAdmin: true },
    { name: 'A2', email: 'A@x.com ', password: 'h2', isAdmin: false },
  ]);
  await raw.collection('tags').insertOne({ tagName: 'food' });
  await raw
    .collection('dates')
    .insertOne({ tittle: 'T', text: 'X', creator, review: true, tags: ['food'] });
  await connectDb(inject('mongoUri'), { dbName });
  // Let every model finish its automatic init, which is where collections/indexes would appear.
  await Promise.all([UserModel, TagModel, IdeaModel, RatingModel, SaveModel].map((m) => m.init()));
}, 60_000);

afterAll(async () => {
  await raw.dropDatabase();
  await disconnectDb();
  await client.close();
});

describe('connectDb', () => {
  it('turns off automatic index building and collection creation', () => {
    expect(mongoose.connection.config).toMatchObject({ autoIndex: false, autoCreate: false });
    expect(mongoose.get('autoIndex')).toBe(false);
    expect(mongoose.get('autoCreate')).toBe(false);
  });

  it('leaves a legacy database untouched until the migration syncs indexes', async () => {
    expect(await names()).toEqual(['dates', 'tags', 'users']);
    expect(await raw.collection('users').indexes()).toHaveLength(1);

    await runMigration(mongoose.connection.db as mongoose.mongo.Db, { dryRun: true });
    expect(await names()).toEqual(['dates', 'tags', 'users']);
    expect(await raw.collection('users').indexes()).toHaveLength(1);
    expect(await raw.collection('tags').indexes()).toHaveLength(1);

    await runMigration(mongoose.connection.db as mongoose.mongo.Db, { dryRun: false });
    const userIndexes = await raw.collection('users').indexes();
    expect(userIndexes).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'email_1', unique: true })]),
    );
    expect(await raw.collection('users').countDocuments()).toBe(1);
  });
});
