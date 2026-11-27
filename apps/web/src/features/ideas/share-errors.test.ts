import type { FieldValues, ResolverOptions } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { shareResolver } from './share-errors';

const options = {
  fields: {},
  names: [],
  shouldUseNativeValidation: false,
  criteriaMode: 'firstError',
} as unknown as ResolverOptions<FieldValues>;

const valid = {
  title: 'Sunday pastry walk',
  description: 'Pick three bakeries within walking distance.',
  image: {
    url: 'https://res.cloudinary.com/demo/image/upload/v1/itsadate/dev/a.jpg',
    publicId: 'itsadate/dev/a',
  },
  tagIds: ['64a000000000000000000001'],
  placeType: 'cafe',
  budget: 1,
  duration: 'short',
};

async function errorsFor(values: Record<string, unknown>) {
  return (await shareResolver(values as never, undefined, options as never)).errors;
}

describe('share copy', () => {
  it('a missing budget reads "Pick a budget."', async () => {
    const errors = await errorsFor({ ...valid, budget: undefined });
    expect(errors.budget?.message).toBe('Pick a budget.');
  });

  it('a budget outside the choices reads "Pick a budget."', async () => {
    const errors = await errorsFor({ ...valid, budget: 7 });
    expect(errors.budget?.message).toBe('Pick a budget.');
  });

  it('a duplicate tag gets its own copy', async () => {
    const id = valid.tagIds[0];
    const errors = await errorsFor({ ...valid, tagIds: [id, id] });
    expect(errors.tagIds?.message).toBe('Pick each tag only once.');
  });

  it('a malformed tag id is reported on the tags field', async () => {
    const errors = await errorsFor({ ...valid, tagIds: ['not-a-tag'] });
    expect(errors.tagIds?.message).toBe('Pick tags from the list.');
  });

  it('no tags and too many tags', async () => {
    expect((await errorsFor({ ...valid, tagIds: [] })).tagIds?.message).toBe(
      'Pick at least 1 tag.',
    );
    const four = ['1', '2', '3', '4'].map((n) => `64a00000000000000000000${n}`);
    expect((await errorsFor({ ...valid, tagIds: four })).tagIds?.message).toBe(
      'Pick up to 3 tags.',
    );
  });

  it('only budget errors say "Pick a budget."', async () => {
    const errors = await errorsFor({ ...valid, title: 'ab', duration: undefined });
    expect(errors.title?.message).toBe('Use at least 3 characters.');
    expect(errors.duration?.message).toBe('Pick how long it takes.');
    expect(errors.budget).toBeUndefined();
  });
});
