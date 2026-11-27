import type { ResolverOptions } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, NETWORK_MESSAGE } from './api';
import { applyServerErrors, fieldResolver } from './form-errors';

function validation(issues: { path: string; message: string; location?: string }[]) {
  return new ApiError(422, 'VALIDATION', 'Check the highlighted fields', {
    issues: issues.map((i) => ({ location: 'body', ...i })),
  });
}

describe('applyServerErrors', () => {
  it('puts a 422 issue on its field and focuses the first one', () => {
    const setError = vi.fn();
    applyServerErrors(validation([{ path: 'title', message: 'Too short' }]), setError, [
      'title',
      'description',
    ]);
    expect(setError).toHaveBeenCalledWith(
      'title',
      { type: 'server', message: 'Too short' },
      { shouldFocus: true },
    );
  });

  it('matches nested paths by their first segment', () => {
    const setError = vi.fn();
    applyServerErrors(
      validation([
        { path: 'image.url', message: 'Use an https link' },
        { path: 'tagIds.0', message: 'Unknown tag' },
      ]),
      setError,
      ['image', 'tagIds'],
    );
    expect(setError).toHaveBeenNthCalledWith(
      1,
      'image',
      { type: 'server', message: 'Use an https link' },
      { shouldFocus: true },
    );
    expect(setError).toHaveBeenNthCalledWith(
      2,
      'tagIds',
      { type: 'server', message: 'Unknown tag' },
      { shouldFocus: false },
    );
  });

  it('ignores non-body issues and unknown fields, falling back to the form error', () => {
    const setError = vi.fn();
    applyServerErrors(
      validation([
        { path: 'id', message: 'Bad id', location: 'params' },
        { path: 'nope', message: 'Who?' },
      ]),
      setError,
      ['title'],
    );
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith('root.server', {
      type: 'server',
      message: 'Check the highlighted fields',
    });
  });

  it('uses the network message for anything that is not an ApiError', () => {
    const setError = vi.fn();
    applyServerErrors(new Error('boom'), setError, ['title']);
    expect(setError).toHaveBeenCalledWith('root.server', {
      type: 'server',
      message: NETWORK_MESSAGE,
    });
  });
});

const options = {
  fields: {},
  names: [],
  shouldUseNativeValidation: false,
  criteriaMode: 'firstError',
} as unknown as ResolverOptions<never>;

const schema = z.object({
  title: z.string().min(3),
  size: z.union([z.literal(1), z.literal(2)]),
  ids: z
    .array(z.string().regex(/^[a-f\d]{24}$/))
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, { message: 'Duplicate' }),
});

describe('fieldResolver', () => {
  const seen: string[] = [];
  const resolver = fieldResolver(schema, (issue) => {
    seen.push(`${issue.code}@${issue.path.join('.')}`);
    if (issue.path[0] === 'size') return issue.code === 'invalid_union' ? 'Pick a size.' : 'Odd';
    if (issue.path[0] === 'ids') {
      if (issue.code === 'custom') return 'Pick each one once.';
      return issue.path.length > 1 ? 'Pick from the list.' : 'Pick at least one.';
    }
    return undefined;
  });
  // Form values are whatever the user typed, so the tests feed in shapes the schema rejects.
  const resolve = (values: unknown, _context?: unknown, opts = options) =>
    resolver(values as never, undefined, opts as never);

  it('gives a union its outer issue, not one of its branches', async () => {
    seen.length = 0;
    const { errors } = await resolve(
      { title: 'Long enough', size: 5, ids: ['a'.repeat(24)] },
      undefined,
      options,
    );
    expect(errors.size?.message).toBe('Pick a size.');
    // Only top-level issues reach the message function: no path-less branch issues.
    expect(seen).toEqual(['invalid_union@size']);
  });

  it('keeps the schema message when the function has no copy for it', async () => {
    const { errors } = await resolve(
      { title: 'ab', size: 1, ids: ['a'.repeat(24)] },
      undefined,
      options,
    );
    expect(errors.title?.message).toMatch(/3/);
  });

  it('reports an array element error on its field', async () => {
    const { errors } = await resolve(
      { title: 'Long enough', size: 1, ids: ['nope'] },
      undefined,
      options,
    );
    expect(errors.ids?.message).toBe('Pick from the list.');
  });

  it('gives a refine on the array its own copy', async () => {
    const id = 'a'.repeat(24);
    const { errors } = await resolve(
      { title: 'Long enough', size: 1, ids: [id, id] },
      undefined,
      options,
    );
    expect(errors.ids?.message).toBe('Pick each one once.');
  });

  it('returns the parsed values when valid', async () => {
    const id = 'a'.repeat(24);
    const result = await resolve({ title: 'Long enough', size: 2, ids: [id] }, undefined, options);
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ title: 'Long enough', size: 2, ids: [id] });
  });
});
