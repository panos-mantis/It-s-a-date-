import { CircleHelp, Utensils } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { TAG_ICON_NAMES, tagIcon } from './tag-icons';

describe('tag icons', () => {
  it('lists the 16 curated names', () => expect(TAG_ICON_NAMES).toHaveLength(16));
  it('maps a known name to its icon', () => expect(tagIcon('utensils')).toBe(Utensils));
  it('falls back to CircleHelp for unknown names', () => expect(tagIcon('nope')).toBe(CircleHelp));
  it('resolves every curated name to a real icon', () => {
    for (const name of TAG_ICON_NAMES) expect(tagIcon(name)).not.toBe(CircleHelp);
  });
});
