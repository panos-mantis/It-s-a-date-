// Seeds curated date ideas. Usage:
//   npm run seed -w @itsadate/api -- [--mode dev|prod] [--reset] [--remove] [--db <dbname>]
// dev adds sample users with deterministic ratings and saves; prod adds only the curated ideas,
// authored by the team user. --reset (dev only) removes seed content first. --remove deletes it.
import { connectDb, disconnectDb } from '../db/connect.js';
import { runSeed } from '../seed/seed.js';
import { parseArgs, type ParsedArgs } from './lib/args.js';
import { describeScriptError } from './lib/describe-error.js';
import { confirmTarget, loadScriptEnv, resolveTarget } from './lib/target.js';

const USAGE =
  'Usage: npm run seed -w @itsadate/api -- [--mode dev|prod] [--reset] [--remove] [--db <dbname>]';

async function main(): Promise<void> {
  // Parse args first: a usage error must not load env or connect.
  let args: ParsedArgs;
  try {
    args = parseArgs(process.argv.slice(2), {
      mode: 'string',
      reset: 'boolean',
      remove: 'boolean',
      db: 'string',
    });
  } catch (e) {
    console.error(`${(e as Error).message}\n${USAGE}`);
    process.exit(1);
  }
  const mode = args.mode ?? 'dev';
  if (mode !== 'dev' && mode !== 'prod') {
    console.error(`--mode must be dev or prod\n${USAGE}`);
    process.exit(1);
  }
  const reset = args.reset === true;
  const remove = args.remove === true;
  if (reset && mode === 'prod') {
    console.error(`--reset is only allowed with --mode dev\n${USAGE}`);
    process.exit(1);
  }

  const { uri, dnsServers } = loadScriptEnv();
  const target = resolveTarget({ uri, dbFlag: args.db as string | undefined });
  if (mode === 'dev' && target.isProd) {
    throw new Error('Use --mode prod for the production database (no fake ratings in prod)');
  }
  await confirmTarget(target);

  await connectDb(uri, { dbName: target.dbName, dnsServers });
  try {
    const report = await runSeed({ mode, reset, remove });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await disconnectDb();
  }
}

main().catch((e: unknown) => {
  console.error(describeScriptError(e));
  process.exit(1);
});
