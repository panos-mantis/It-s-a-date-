import { describe, expect, it } from 'vitest';
import { tagCreateSchema, tagUpdateSchema } from './tags.js';

describe('tag schemas', () => {
  it('accepts a valid tag and trims the name', () => {
    expect(tagCreateSchema.parse({ name: ' Self date ', icon: 'heart' })).toEqual({
      name: 'Self date',
      icon: 'heart',
    });
  });
  it('rejects short names and empty icons', () => {
    expect(tagCreateSchema.safeParse({ name: 'a', icon: 'heart' }).success).toBe(false);
    expect(tagCreateSchema.safeParse({ name: 'Fine', icon: '' }).success).toBe(false);
  });
  it('allows partial updates', () => {
    expect(tagUpdateSchema.parse({ icon: 'star' })).toEqual({ icon: 'star' });
  });
});
