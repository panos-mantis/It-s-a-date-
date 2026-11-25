import { describe, expect, it } from 'vitest';
import { safeNext } from './safe-next';

describe('safeNext', () => {
  it.each([
    [null, '/'],
    ['/share', '/share'],
    ['/ideas/1?x=2', '/ideas/1?x=2'],
    ['//evil.com', '/'],
    ['https://evil.com', '/'],
    ['/\\evil.com', '/'],
    ['javascript:alert(1)', '/'],
    ['/a\nb', '/'],
    ['', '/'],
  ])('safeNext(%j) → %j', (input, out) => expect(safeNext(input)).toBe(out));
});
