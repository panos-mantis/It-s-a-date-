import { afterEach, describe, expect, it } from 'vitest';
import { formatDate } from './dates';

const originalTz = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTz;
});

describe('formatDate', () => {
  it('reads like "Mar 9, 2024"', () => {
    expect(formatDate('2024-03-09T12:00:00.000Z')).toBe('Mar 9, 2024');
  });

  it("uses the reader's own time zone, so every page agrees on the day", () => {
    process.env.TZ = 'Pacific/Auckland';
    expect(formatDate('2026-11-24T23:30:00.000Z')).toBe('Nov 25, 2026');
    process.env.TZ = 'America/Los_Angeles';
    expect(formatDate('2026-11-24T03:30:00.000Z')).toBe('Nov 23, 2026');
  });
});
