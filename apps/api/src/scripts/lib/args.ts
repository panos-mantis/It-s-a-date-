export type ArgSpec = Record<string, 'string' | 'boolean'>;
export type ParsedArgs = Record<string, string | boolean | undefined>;

/**
 * Minimal `--flag value` / `--flag` parser. Throws on unknown flags, stray positionals, and a
 * string flag whose value is missing or looks like another flag (so `--db --email x` fails loudly
 * instead of swallowing `--email` as the db name).
 */
export function parseArgs(argv: string[], spec: ArgSpec): ParsedArgs {
  const out: ParsedArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] as string;
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const name = token.slice(2);
    const kind = Object.hasOwn(spec, name) ? spec[name] : undefined;
    if (!kind) throw new Error(`Unknown flag: ${token}`);
    if (kind === 'boolean') {
      out[name] = true;
      continue;
    }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Flag ${token} needs a value`);
    }
    out[name] = value;
    i++;
  }
  return out;
}
