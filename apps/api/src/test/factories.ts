import { randomUUID } from 'node:crypto';
import { TagModel, type ITag, type TagDoc } from '../models/tag.js';

/** Creates a tag with a unique name and slug unless overridden. */
export function createTestTag(overrides: Partial<ITag> = {}): Promise<TagDoc> {
  const unique = randomUUID().slice(0, 8);
  return TagModel.create({
    name: `Tag ${unique}`,
    slug: `tag-${unique}`,
    icon: 'tag',
    ...overrides,
  });
}
