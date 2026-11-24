import { loadDotEnvFile, mongoDbName } from '../../config/env.js';
import { askLine } from './prompt.js';

export const PROD_DB = 'ItsADate';

export interface Target {
  dbName: string;
  isProd: boolean;
}

const isProdName = (name: string) => name.toLowerCase() === PROD_DB.toLowerCase();

/** Picks the database: `--db` wins over the URI. Production must be named explicitly. */
export function resolveTarget(input: { uri: string; dbFlag?: string }): Target {
  const flag = input.dbFlag?.trim() ?? '';
  const dbName = flag || mongoDbName(input.uri).trim();
  if (!dbName) throw new Error('No database name: pass --db <name> or put one in MONGODB_URI');
  const isProd = isProdName(dbName);
  if (isProd && !isProdName(flag)) {
    throw new Error(`MONGODB_URI points at production; pass --db ${PROD_DB} explicitly to proceed`);
  }
  return { dbName, isProd };
}

/** Prod needs the operator to retype the exact DB name; other targets are just announced. */
export async function confirmTarget(
  target: Target,
  ask: (question: string) => Promise<string> = askLine,
): Promise<void> {
  if (!target.isProd) {
    console.log(`Target database: ${target.dbName}`);
    return;
  }
  const answer = await ask(`PRODUCTION database. Type "${target.dbName}" to confirm: `);
  if (answer.trim() !== target.dbName) {
    throw new Error('Database name did not match, aborting. Nothing was written.');
  }
}

/**
 * Connection settings for scripts. Deliberately not loadEnv(): scripts need only the URI (and
 * optional DNS servers), and prod is guarded by resolveTarget/confirmTarget instead.
 */
export function loadScriptEnv(
  source: NodeJS.ProcessEnv = process.env,
  readDotEnv = true,
): { uri: string; dnsServers?: string[] } {
  if (readDotEnv) loadDotEnvFile();
  const uri = source.MONGODB_URI?.trim();
  if (!uri) throw new Error('MONGODB_URI is not set (put it in apps/api/.env)');
  const dnsServers = source.DNS_SERVERS?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return { uri, dnsServers: dnsServers?.length ? dnsServers : undefined };
}
