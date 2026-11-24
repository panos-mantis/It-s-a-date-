import { randomUUID } from 'node:crypto';
import type { Types } from 'mongoose';
import { IdeaModel, type IIdea, type IdeaDoc } from '../models/idea.js';
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

/** Creates an approved idea (budget 1, short, park) unless overridden. */
export function createTestIdea(
  overrides: Partial<IIdea> & { creator: Types.ObjectId },
): Promise<IdeaDoc> {
  return IdeaModel.create({
    title: `Idea ${randomUUID().slice(0, 8)}`,
    description: 'A lovely idea for a date that is long enough to be valid.',
    status: 'approved',
    budget: 1,
    duration: 'short',
    placeType: 'park',
    ...overrides,
  });
}
