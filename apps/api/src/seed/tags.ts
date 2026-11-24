import { slugify } from '../lib/slug.js';
import { LEGACY_TAG_DEFAULTS } from '../migrate/legacy-tags.js';

export interface SeedTag {
  name: string;
  slug: string;
  icon: string;
}

const NAMES = [
  'Food',
  'Adventure',
  'Home',
  'Self-date',
  'Board games',
  'Dancing',
  'Self-care',
  'Learning',
] as const;

// The legacy slug for board games is "board-game", so it is spelled out instead of slugified.
const SLUG_OVERRIDES: Record<string, string> = { 'Board games': 'board-game' };

/** The 8 starter tags; slugs and icons come from the legacy defaults so the seed matches a migrated DB. */
export const SEED_TAGS: SeedTag[] = NAMES.map((name) => {
  const slug = SLUG_OVERRIDES[name] ?? slugify(name);
  const defaults = LEGACY_TAG_DEFAULTS[slug];
  if (!defaults) throw new Error(`No legacy tag defaults for slug ${slug}`);
  return { name, slug, icon: defaults.icon };
});
