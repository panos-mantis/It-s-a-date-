import dns from 'node:dns';
import mongoose from 'mongoose';

export interface ConnectOptions {
  dbName?: string;
  dnsServers?: string[];
}

/**
 * Connects mongoose without automatic collection creation or index builds: on the legacy prod DB
 * an automatic unique email index would be built before the migration dedupes emails. Indexes
 * are built only by explicit `syncIndexes()` (the migration, the seed, the test DB helper).
 */
export async function connectDb(uri: string, opts: ConnectOptions = {}): Promise<typeof mongoose> {
  if (opts.dnsServers?.length) dns.setServers(opts.dnsServers);
  // Global defaults too, so models on any connection inherit them.
  mongoose.set('autoIndex', false);
  mongoose.set('autoCreate', false);
  return mongoose.connect(uri, {
    autoIndex: false,
    autoCreate: false,
    ...(opts.dbName ? { dbName: opts.dbName } : {}),
  });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
