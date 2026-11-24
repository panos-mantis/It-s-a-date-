// Migrates the legacy schema in place. Usage:
//   npm run migrate -w @itsadate/api -- [--dry-run] [--verbose] [--db <dbname>]
// Take a backup (mongodump) first. A dry run writes nothing and skips the prod confirmation.
import mongoose, { type mongo } from 'mongoose';
import { connectDb, disconnectDb } from '../db/connect.js';
import { runMigrationWithDetails } from '../migrate/migrate.js';
import { parseArgs, type ParsedArgs } from './lib/args.js';
import { confirmTarget, loadScriptEnv, resolveTarget } from './lib/target.js';

const USAGE = 'Usage: npm run migrate -w @itsadate/api -- [--dry-run] [--verbose] [--db <dbname>]';

async function main(): Promise<void> {
  // Parse args first: a usage error must not load env or connect.
  let args: ParsedArgs;
  try {
    args = parseArgs(process.argv.slice(2), {
      'dry-run': 'boolean',
      verbose: 'boolean',
      db: 'string',
    });
  } catch (e) {
    console.error(`${(e as Error).message}\n${USAGE}`);
    process.exit(1);
  }
  const dryRun = args['dry-run'] === true;

  const { uri, dnsServers } = loadScriptEnv();
  const target = resolveTarget({ uri, dbFlag: args.db as string | undefined });
  if (dryRun) console.log(`Dry run against ${target.dbName}: nothing will be written`);
  else await confirmTarget(target);

  await connectDb(uri, { dbName: target.dbName, dnsServers });
  try {
    const { report, details } = await runMigrationWithDetails(mongoose.connection.db as mongo.Db, {
      dryRun,
    });
    console.log(JSON.stringify(report, null, 2));
    if (args.verbose) {
      console.log('Tags:');
      for (const t of details.tags) {
        console.log(`  ${t.name} -> slug ${t.slug}, icon ${t.icon}, placeType ${t.placeType}`);
      }
      console.log(`Merged email groups: ${details.mergedEmailGroupSizes.length}`);
      details.mergedEmailGroupSizes.forEach((size, i) => {
        console.log(`  group ${i + 1}: ${size} accounts merged into 1`);
      });
    }
  } finally {
    await disconnectDb();
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : 'Unexpected error');
  process.exit(1);
});
