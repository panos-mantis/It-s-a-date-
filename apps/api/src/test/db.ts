import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, inject } from 'vitest';
import { connectDb, disconnectDb } from '../db/connect.js';
import { allModels } from '../models/index.js';

/** Registers hooks that give a test file its own isolated in-memory database. */
export function useTestDb(): void {
  const dbName = `itsadate_test_${randomUUID().replace(/-/g, '')}`;

  beforeAll(async () => {
    await connectDb(inject('mongoUri'), { dbName });
    await Promise.all(allModels.map((m) => m.syncIndexes()));
  }, 60_000);

  afterEach(async () => {
    await Promise.all(allModels.map((m) => m.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await disconnectDb();
  });
}
