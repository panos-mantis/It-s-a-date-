import { ideaQuerySchema } from '@itsadate/shared';
import { describe, expect, it } from 'vitest';
import { slugify } from './slug.js';

describe('slugify', () => {
  it('lowercases, strips diacritics and trims dashes', () => {
    expect(slugify('Board game')).toBe('board-game');
    expect(slugify('  Self-Date! ')).toBe('self-date');
    expect(slugify('Café night')).toBe('cafe-night');
    expect(slugify('a  --  b')).toBe('a-b');
  });

  it('produces slugs accepted by the idea query schema', () => {
    const slug = slugify('Piña colada & friends');
    expect(ideaQuerySchema.parse({ tag: slug }).tag).toBe(slug);
  });
});
