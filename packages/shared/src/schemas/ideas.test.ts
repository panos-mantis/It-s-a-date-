import { describe, expect, it } from 'vitest';
import { ideaCreateSchema, ideaQuerySchema, ideaUpdateSchema, imageSchema } from './ideas.js';

const id = '64d74918b329db37043bef9e';
const validIdea = {
  title: 'Sunset picnic',
  description: 'Bring a blanket and snacks to the hill and watch the sunset.',
  image: { url: 'https://res.cloudinary.com/x/image/upload/a.jpg', publicId: 'a' },
  tagIds: [id],
  placeType: 'park',
  budget: '1',
  duration: 'half-day',
};

describe('ideaQuerySchema', () => {
  it('parses query strings as the web sends them', () => {
    expect(
      ideaQuerySchema.parse(Object.fromEntries(new URLSearchParams('budget=2&page=3'))),
    ).toEqual({
      budget: 2,
      page: 3,
      pageSize: 24,
      sort: 'new',
    });
  });
  it('rejects bad budget and sort', () => {
    expect(ideaQuerySchema.safeParse({ budget: '4' }).success).toBe(false);
    expect(ideaQuerySchema.safeParse({ sort: 'old' }).success).toBe(false);
  });
  it('validates tag slugs', () => {
    expect(ideaQuerySchema.safeParse({ tag: 'self-date' }).success).toBe(true);
    expect(ideaQuerySchema.safeParse({ tag: 'Self Date' }).success).toBe(false);
  });
});

describe('ideaCreateSchema', () => {
  it('accepts a valid idea and coerces budget', () => {
    expect(ideaCreateSchema.parse(validIdea).budget).toBe(1);
  });
  it('rejects bad tagIds and short descriptions', () => {
    expect(ideaCreateSchema.safeParse({ ...validIdea, tagIds: [] }).success).toBe(false);
    expect(ideaCreateSchema.safeParse({ ...validIdea, tagIds: [id, id, id, id] }).success).toBe(
      false,
    );
    expect(ideaCreateSchema.safeParse({ ...validIdea, description: 'too short' }).success).toBe(
      false,
    );
  });
});

describe('ideaUpdateSchema', () => {
  it('is partial and accepts status', () => {
    expect(ideaUpdateSchema.parse({ status: 'approved' })).toEqual({ status: 'approved' });
    expect(ideaUpdateSchema.safeParse({ status: 'nope' }).success).toBe(false);
  });
});

describe('ideaQuerySchema empty and strict values', () => {
  it('treats empty form-submit params as absent', () => {
    const parsed = ideaQuerySchema.parse(
      Object.fromEntries(new URLSearchParams('q=&tag=&budget=&duration=&sort=&page=')),
    );
    expect(parsed).toEqual({ page: 1, pageSize: 24, sort: 'new' });
  });
  it('treats whitespace-only q as absent', () => {
    expect(ideaQuerySchema.parse({ q: '   ' }).q).toBeUndefined();
  });
  it('rejects non-decimal integers', () => {
    for (const page of ['0x10', '1e1', ['2']]) {
      expect(ideaQuerySchema.safeParse({ page }).success).toBe(false);
    }
    expect(ideaQuerySchema.safeParse({ budget: true }).success).toBe(false);
  });
  it('still accepts decimal strings and numbers', () => {
    expect(ideaQuerySchema.parse({ page: '2' }).page).toBe(2);
    expect(ideaQuerySchema.parse({ page: 2 }).page).toBe(2);
  });
});

describe('imageSchema', () => {
  it('accepts https only', () => {
    const base = { publicId: 'a' };
    expect(
      imageSchema.safeParse({ ...base, url: 'https://res.cloudinary.com/x/a.jpg' }).success,
    ).toBe(true);
    expect(
      imageSchema.safeParse({ ...base, url: 'http://res.cloudinary.com/x/a.jpg' }).success,
    ).toBe(false);
    expect(imageSchema.safeParse({ ...base, url: 'javascript:alert(1)' }).success).toBe(false);
  });
});

describe('ideaCreateSchema tagIds', () => {
  const other = '64d74918b329db37043bef9f';
  it('rejects 4 distinct ids (max 3)', () => {
    const ids = [
      id,
      other,
      '64d74918b329db37043bef a0'.replace(' ', ''),
      '64d74918b329db37043bef a1'.replace(' ', ''),
    ];
    expect(new Set(ids).size).toBe(4);
    expect(ideaCreateSchema.safeParse({ ...validIdea, tagIds: ids }).success).toBe(false);
  });
  it('rejects duplicates and accepts distinct ids', () => {
    expect(ideaCreateSchema.safeParse({ ...validIdea, tagIds: [id, id] }).success).toBe(false);
    expect(ideaCreateSchema.safeParse({ ...validIdea, tagIds: [id, other] }).success).toBe(true);
  });
  it('accepts numeric and string budget', () => {
    expect(ideaCreateSchema.parse({ ...validIdea, budget: 2 }).budget).toBe(2);
    expect(ideaCreateSchema.parse({ ...validIdea, budget: '2' }).budget).toBe(2);
  });
});

describe('ideaUpdateSchema defaults', () => {
  it('coerces budget and injects no defaults', () => {
    expect(ideaUpdateSchema.parse({ budget: '2' })).toEqual({ budget: 2 });
    expect(ideaUpdateSchema.parse({})).toEqual({});
  });
});
