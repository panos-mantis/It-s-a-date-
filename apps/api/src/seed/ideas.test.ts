import { BUDGETS, DURATIONS, ideaCreateSchema } from '@itsadate/shared';
import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { LEGACY_TAG_DEFAULTS } from '../migrate/legacy-tags.js';
import { SEED_IDEAS } from './ideas.js';
import { SEED_TAGS } from './tags.js';

// The 19 titles on the live API, lowercased: seed ideas must not repeat them.
const LEGACY_TITLES = [
  'Restaurant hop.',
  'Play tourist in your hometown',
  'Make a fun new recipe',
  'Go on a picnic',
  'Take a hike',
  'Hit the beach',
  'Play a board game',
  'Throw a casino night',
  'Build a campfire',
  'Have a spa night',
  'Take a dance class',
  'Explore a museum',
  'Try rock-climbing',
  'Stay in a bed and breakfast',
  'Stargaze together',
  'Plan a Dream Vacation',
  'Go to the Theatre',
  'Take Yourself Out to a Nice Dinner',
  'Taste some cheese.',
].map((t) => t.toLowerCase());

describe('SEED_TAGS', () => {
  it('has the same slugs and icons as the legacy defaults', () => {
    expect(SEED_TAGS.map((t) => t.slug).sort()).toEqual(Object.keys(LEGACY_TAG_DEFAULTS).sort());
    for (const t of SEED_TAGS) expect(t.icon).toBe(LEGACY_TAG_DEFAULTS[t.slug]?.icon);
  });
});

describe('SEED_IDEAS', () => {
  it('has 30 to 34 ideas with unique keys and titles', () => {
    expect(SEED_IDEAS.length).toBeGreaterThanOrEqual(30);
    expect(SEED_IDEAS.length).toBeLessThanOrEqual(34);
    expect(new Set(SEED_IDEAS.map((i) => i.seedKey)).size).toBe(SEED_IDEAS.length);
    expect(new Set(SEED_IDEAS.map((i) => i.title.toLowerCase())).size).toBe(SEED_IDEAS.length);
  });

  it('uses every tag as the first tag of at least 3 ideas', () => {
    for (const t of SEED_TAGS) {
      expect(SEED_IDEAS.filter((i) => i.tags[0] === t.slug).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('passes the real create schema (except the image) and avoids legacy titles', () => {
    const schema = ideaCreateSchema.omit({ image: true });
    for (const i of SEED_IDEAS) {
      const parsed = schema.safeParse({
        ...i,
        tagIds: i.tags.map(() => new Types.ObjectId().toString()),
      });
      expect(parsed.success, i.seedKey).toBe(true);
      expect(i.tags.every((s) => SEED_TAGS.some((t) => t.slug === s))).toBe(true);
      expect(LEGACY_TITLES).not.toContain(i.title.toLowerCase());
    }
  });

  it('covers every budget and duration at least 5 times and 6+ place types', () => {
    for (const b of BUDGETS) {
      expect(SEED_IDEAS.filter((i) => i.budget === b).length).toBeGreaterThanOrEqual(5);
    }
    for (const d of DURATIONS) {
      expect(SEED_IDEAS.filter((i) => i.duration === d).length).toBeGreaterThanOrEqual(5);
    }
    const places = new Set(SEED_IDEAS.map((i) => i.placeType).filter((p) => p !== 'none'));
    expect(places.size).toBeGreaterThanOrEqual(6);
  });
});
