// Creates an admin, or promotes an existing user. Usage:
//   npm run create-admin -w @itsadate/api -- --email <email> --name <name> [--db <dbname>]
import { AppError } from '../lib/errors.js';
import { connectDb, disconnectDb } from '../db/connect.js';
import { createAdmin, passwordIssues } from '../features/users/create-admin.js';
import { usersRepository } from '../features/users/users.repository.js';
import { parseArgs, type ParsedArgs } from './lib/args.js';
import { askHidden } from './lib/prompt.js';
import { confirmTarget, loadScriptEnv, resolveTarget } from './lib/target.js';

const USAGE =
  'Usage: npm run create-admin -w @itsadate/api -- --email <email> --name <name> [--db <dbname>]';

const MAX_PASSWORD_TRIES = 3;

async function askNewPassword(): Promise<string> {
  for (let attempt = 1; attempt <= MAX_PASSWORD_TRIES; attempt++) {
    const password = await askHidden('New admin password (min 8 chars): ');
    const again = await askHidden('Repeat password: ');
    if (password !== again) {
      console.error('Passwords do not match');
      continue;
    }
    const issues = passwordIssues(password);
    if (issues.length === 0) return password;
    for (const issue of issues) console.error(`Password: ${issue}`);
  }
  console.error('Too many failed attempts, nothing written');
  process.exit(1);
}

function describeError(e: unknown): string {
  if (e instanceof AppError && e.code === 'VALIDATION') {
    const issues = (e.details as { issues?: { path: string; message: string }[] } | undefined)
      ?.issues;
    if (issues?.length) return issues.map((i) => `${i.path}: ${i.message}`).join('\n');
  }
  return e instanceof Error ? e.message : 'Unexpected error';
}

async function main(): Promise<void> {
  // Parse args first: a usage error must not load env or connect.
  let args: ParsedArgs;
  try {
    args = parseArgs(process.argv.slice(2), { email: 'string', name: 'string', db: 'string' });
  } catch (e) {
    console.error(`${(e as Error).message}\n${USAGE}`);
    process.exit(1);
  }
  const email = String(args.email ?? '')
    .trim()
    .toLowerCase();
  const name = String(args.name ?? '').trim();
  if (!email || !name) {
    console.error(USAGE);
    process.exit(1);
  }

  const { uri, dnsServers } = loadScriptEnv();
  const target = resolveTarget({ uri, dbFlag: args.db as string | undefined });
  await confirmTarget(target);

  await connectDb(uri, { dbName: target.dbName, dnsServers });
  try {
    let password: string | undefined;
    if (!(await usersRepository.findByEmail(email))) {
      password = await askNewPassword();
    }
    const { action, user } = await createAdmin({ email, name, password });
    console.log(`Admin ${action}: ${user.email}`);
  } finally {
    await disconnectDb();
  }
}

main().catch((e: unknown) => {
  console.error(describeError(e));
  process.exit(1);
});
