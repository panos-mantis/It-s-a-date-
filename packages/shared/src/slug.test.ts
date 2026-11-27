import { describe, expect, it } from 'vitest';
import { slugify } from './slug.js';

describe('slugify', () => {
  it('lowercases, strips diacritics and collapses runs', () => {
    expect(slugify('Self care')).toBe('self-care');
    expect(slugify('Café night')).toBe('cafe-night');
    expect(slugify('  a  --  b ')).toBe('a-b');
  });
  it('is empty for a name with no letter or number', () => {
    expect(slugify('!!')).toBe('');
  });
});
