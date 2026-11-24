// Own database via connectDb (no useTestDb) so the first check sees a database with no indexes.
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it, inject } from 'vitest';
import { allModels } from '../models/index.js';
import { connectDb, disconnectDb } from './connect.js';
import { missingIndexes } from './index-check.js';

const dbName = `itsadate_indexcheck_${randomUUID().replace(/-/g, '')}`;

beforeAll(async () => {
  await connectDb(inject('mongoUri'), { dbName });
}, 60_000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDb();
});

describe('missingIndexes', () => {
  it('reports declared indexes that do not exist yet, then none after syncIndexes', async () => {
    const before = await missingIndexes();
    expect(before.map((m) => m.model)).toEqual(expect.arrayContaining(['User', 'Idea', 'Rating']));
    expect(before).toContainEqual({ model: 'User', index: 'email' });
    expect(before).toContainEqual({ model: 'Idea', index: 'seedKey' });

    await Promise.all(allModels.map((m) => m.syncIndexes()));
    expect(await missingIndexes()).toEqual([]);
  });
});
