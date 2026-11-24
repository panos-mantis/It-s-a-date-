import { describe, expect, it } from 'vitest';
import { idParamsSchema, objectIdSchema, paginationSchema } from './common.js';

describe('common schemas', () => {
  it('validates object ids', () => {
    expect(objectIdSchema.safeParse('64D74918B329DB37043BEF9E').success).toBe(true);
    expect(objectIdSchema.safeParse('64d74918b329db37043bef9').success).toBe(false);
  });
  it('validates id route params', () => {
    expect(idParamsSchema.parse({ id: '64d74918b329db37043bef9e' })).toEqual({
      id: '64d74918b329db37043bef9e',
    });
    expect(idParamsSchema.safeParse({ id: 'not-an-id' }).success).toBe(false);
    expect(idParamsSchema.safeParse({}).success).toBe(false);
  });
  it('paginates with defaults and a max page size', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 24 });
    expect(paginationSchema.safeParse({ pageSize: '49' }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: '0' }).success).toBe(false);
  });
});
