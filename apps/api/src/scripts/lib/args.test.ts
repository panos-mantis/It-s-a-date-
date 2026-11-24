import { describe, expect, it } from 'vitest';
import { parseArgs } from './args.js';

describe('parseArgs', () => {
  it('parses string and boolean flags', () => {
    expect(
      parseArgs(['--email', 'a@b.c', '--dry-run'], { email: 'string', 'dry-run': 'boolean' }),
    ).toEqual({ email: 'a@b.c', 'dry-run': true });
  });

  it('leaves absent flags undefined', () => {
    expect(parseArgs([], { db: 'string' }).db).toBeUndefined();
  });

  it('rejects a string flag whose value is missing or another flag', () => {
    expect(() => parseArgs(['--db', '--email', 'x'], { db: 'string', email: 'string' })).toThrow(
      /--db/,
    );
    expect(() => parseArgs(['--db'], { db: 'string' })).toThrow(/--db/);
  });

  it('rejects unknown flags and stray positionals', () => {
    expect(() => parseArgs(['--nope'], { db: 'string' })).toThrow(/--nope/);
    expect(() => parseArgs(['stray'], { db: 'string' })).toThrow(/stray/);
  });
});
