import { createElement } from 'react';
import { tagIcon } from '../../lib/tag-icons';

/** A tag's Lucide icon by name (the fallback for unknown names), decorative, stroke 1.75. */
export function TagIcon({ name, size = 18 }: { name: string; size?: number }) {
  return createElement(tagIcon(name), { 'aria-hidden': true, size, strokeWidth: 1.75 });
}
