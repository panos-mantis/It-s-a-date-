import { describe, expect, it } from 'vitest';
import { formatDate } from '../../lib/dates';
import { relativeSubmitted } from './relative-date';

const now = new Date('2026-11-25T15:00:00.000Z');

describe('relativeSubmitted', () => {
  it('same day reads "today"', () => {
    expect(relativeSubmitted('2026-11-25T12:00:00.000Z', now)).toBe('today');
  });

  it('a day ago reads "1 day ago"', () => {
    expect(relativeSubmitted('2026-11-24T12:00:00.000Z', now)).toBe('1 day ago');
  });

  it('3 days ago reads "3 days ago"', () => {
    expect(relativeSubmitted('2026-11-22T12:00:00.000Z', now)).toBe('3 days ago');
  });

  it('up to 6 days is relative', () => {
    expect(relativeSubmitted('2026-11-19T12:00:00.000Z', now)).toBe('6 days ago');
  });

  it('9 days ago is an absolute date', () => {
    expect(relativeSubmitted('2026-11-16T12:00:00.000Z', now)).toBe('Nov 16, 2026');
  });

  it('older years read like "Mar 9, 2024"', () => {
    expect(relativeSubmitted('2024-03-09T12:00:00.000Z', now)).toBe('Mar 9, 2024');
  });
});

describe('formatDate', () => {
  it('is always absolute', () => {
    expect(formatDate('2026-11-25T12:00:00.000Z')).toBe('Nov 25, 2026');
  });
});
