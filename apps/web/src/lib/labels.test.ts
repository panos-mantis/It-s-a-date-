import { describe, expect, it } from 'vitest';
import { PLACE_TYPES } from '@itsadate/shared';
import { PLACE_TYPE_LABELS, ideaMeta } from './labels';

describe('labels', () => {
  it('ideaMeta joins budget and duration', () =>
    expect(ideaMeta({ budget: 2, duration: 'half-day' })).toBe('$$ · Half day'));
  it('ideaMeta with one part', () => {
    expect(ideaMeta({ budget: 2, duration: null })).toBe('$$');
    expect(ideaMeta({ budget: null, duration: 'half-day' })).toBe('Half day');
  });
  it('ideaMeta is null when both are null', () =>
    expect(ideaMeta({ budget: null, duration: null })).toBeNull());
  it('labels every place type', () => {
    for (const p of PLACE_TYPES) expect(PLACE_TYPE_LABELS[p]).toBeTruthy();
    expect(PLACE_TYPE_LABELS.climbing_gym).toBe('Climbing gym');
    expect(PLACE_TYPE_LABELS.none).toBe('No place needed');
  });
});
