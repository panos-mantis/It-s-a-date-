import dns from 'node:dns';
import mongoose from 'mongoose';

export interface ConnectOptions {
  dbName?: string;
  dnsServers?: string[];
}

export async function connectDb(uri: string, opts: ConnectOptions = {}): Promise<typeof mongoose> {
  if (opts.dnsServers?.length) dns.setServers(opts.dnsServers);
  return mongoose.connect(uri, opts.dbName ? { dbName: opts.dbName } : {});
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
