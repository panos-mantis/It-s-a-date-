import { describe, expect, it } from 'vitest';
import { ratingSchema } from './ratings.js';

describe('ratingSchema', () => {
  it('accepts integers 1..5 only', () => {
    expect(ratingSchema.safeParse({ value: 0 }).success).toBe(false);
    expect(ratingSchema.safeParse({ value: 3.5 }).success).toBe(false);
    expect(ratingSchema.parse({ value: 5 })).toEqual({ value: 5 });
  });
});
