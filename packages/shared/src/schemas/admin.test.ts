import { describe, expect, it } from 'vitest';
import { adminIdeaQuerySchema, adminUserQuerySchema, roleUpdateSchema } from './admin.js';

describe('admin schemas', () => {
  it('defaults the idea queue to pending', () => {
    expect(adminIdeaQuerySchema.parse({})).toEqual({ page: 1, pageSize: 24, status: 'pending' });
    expect(adminIdeaQuerySchema.parse({ status: '' }).status).toBe('pending');
    expect(adminIdeaQuerySchema.parse({ status: 'rejected' }).status).toBe('rejected');
    expect(adminIdeaQuerySchema.safeParse({ status: 'live' }).success).toBe(false);
  });

  it('parses the idea search query', () => {
    expect(adminIdeaQuerySchema.parse({ q: '  pottery ' }).q).toBe('pottery');
    expect(adminIdeaQuerySchema.parse({ q: '' }).q).toBeUndefined();
    expect(adminIdeaQuerySchema.safeParse({ q: 'x'.repeat(101) }).success).toBe(false);
  });

  it('parses the user query', () => {
    expect(adminUserQuerySchema.parse({ q: ' ana ' }).q).toBe('ana');
    expect(adminUserQuerySchema.parse({ q: '' }).q).toBeUndefined();
    expect(adminUserQuerySchema.safeParse({ q: 'x'.repeat(101) }).success).toBe(false);
  });

  it('accepts only known roles', () => {
    expect(roleUpdateSchema.parse({ role: 'admin' })).toEqual({ role: 'admin' });
    expect(roleUpdateSchema.safeParse({ role: 'owner' }).success).toBe(false);
    expect(roleUpdateSchema.safeParse({}).success).toBe(false);
  });
});
