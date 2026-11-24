import type { PlaceType } from '@itsadate/shared';

export interface LegacyTagDefault {
  icon: string;
  placeType: PlaceType;
}

/** Icon (Lucide name) and default idea placeType for the 8 live legacy tags, keyed by slug. */
export const LEGACY_TAG_DEFAULTS: Record<string, LegacyTagDefault> = {
  food: { icon: 'utensils', placeType: 'restaurant' },
  adventure: { icon: 'mountain', placeType: 'park' },
  home: { icon: 'house', placeType: 'none' },
  'self-date': { icon: 'heart', placeType: 'none' },
  'board-game': { icon: 'dice-5', placeType: 'none' },
  dancing: { icon: 'music', placeType: 'none' },
  'self-care': { icon: 'flower-2', placeType: 'spa' },
  learning: { icon: 'book-open', placeType: 'museum' },
};

export const FALLBACK_TAG_DEFAULT: LegacyTagDefault = { icon: 'sparkles', placeType: 'none' };

export function tagDefaultFor(slug: string): LegacyTagDefault {
  return Object.hasOwn(LEGACY_TAG_DEFAULTS, slug)
    ? (LEGACY_TAG_DEFAULTS[slug] as LegacyTagDefault)
    : FALLBACK_TAG_DEFAULT;
}
