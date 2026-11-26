import { describe, expect, it } from 'vitest';
import { loginHint, safeNext } from './safe-next';

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

describe('loginHint', () => {
  it.each([
    ['/share', null, 'Log in to share your idea'],
    ['/profile', null, 'Log in to see your ideas and saved ideas'],
    ['/profile#ideas', null, 'Log in to see your ideas and saved ideas'],
    ['/ideas/5', 'save', 'Log in to save ideas you like.'],
    ['/ideas/5', 'rate', 'Log in to rate this idea.'],
    ['/share', 'rate', 'Log in to rate this idea.'],
  ])('loginHint(%j, %j) → %j', (next, reason, out) => expect(loginHint(next, reason)).toBe(out));

  it.each([
    [null, null],
    ['/ideas/5', null],
    ['/shared-things', null],
    ['/ideas/5', 'other'],
    ['/admin', null],
  ])('loginHint(%j, %j) → null', (next, reason) => expect(loginHint(next, reason)).toBeNull());
});
