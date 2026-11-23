import { describe, expect, it } from 'vitest';
import { ideaCreateSchema, ideaQuerySchema, ideaUpdateSchema } from './ideas.js';

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
