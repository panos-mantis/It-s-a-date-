import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { readVisibleLine } from './prompt.js';

describe('readVisibleLine', () => {
  it('returns the first line', async () => {
    await expect(readVisibleLine(Readable.from(['abc\nrest\n']))).resolves.toBe('abc');
  });

  it('resolves an empty string on EOF instead of hanging', async () => {
    await expect(readVisibleLine(Readable.from([]))).resolves.toBe('');
  });
});
