import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { applyKeys, readVisibleLine } from './prompt.js';

describe('readVisibleLine', () => {
  it('returns the first line', async () => {
    await expect(readVisibleLine(Readable.from(['abc\nrest\n']))).resolves.toBe('abc');
  });

  it('resolves an empty string on EOF instead of hanging', async () => {
    await expect(readVisibleLine(Readable.from([]))).resolves.toBe('');
  });
});

describe('applyKeys', () => {
  it('appends printable characters', () => {
    expect(applyKeys('ab', 'cd')).toEqual({ buf: 'abcd', done: false });
  });

  it('ignores arrow and Home/End escape sequences', () => {
    expect(applyKeys('ab', '\u001b[Dc').buf).toBe('abc');
    expect(applyKeys('', '\u001bOHx\u001b[1;5Cy\u001b[3~z').buf).toBe('xyz');
  });

  it('handles backspace', () => {
    expect(applyKeys('abc', '\u007f').buf).toBe('ab');
    expect(applyKeys('abc', '\b\b').buf).toBe('a');
  });

  it('finishes on enter and keeps what was typed before it', () => {
    expect(applyKeys('ab', 'c\r')).toEqual({ buf: 'abc', done: true });
  });
});
