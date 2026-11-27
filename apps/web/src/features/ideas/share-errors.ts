import { ideaCreateSchema } from '@itsadate/shared';
import { fieldResolver, type FieldIssue } from '../../lib/form-errors';

/**
 * Field copy for an idea's fields (Share frame 1, reused by Admin Edit). It gets each field's
 * first top-level issue: the budget's outer `invalid_union`, a `tagIds.0` element issue, or the
 * duplicate-tags refine. Undefined keeps Zod's own message.
 */
export function ideaFieldMessage(issue: FieldIssue): string | undefined {
  switch (issue.path[0]) {
    case 'image':
      return 'Add a photo.';
    case 'title':
      return issue.code === 'too_big'
        ? 'Use 80 characters or fewer.'
        : 'Use at least 3 characters.';
    case 'description': {
      if (issue.code === 'too_big') return 'Use 2000 characters or fewer.';
      const have = typeof issue.input === 'string' ? issue.input.trim().length : 0;
      return `Write at least 20 characters. You have ${have} so far.`;
    }
    case 'tagIds':
      // An element issue: an id that isn't one of ours.
      if (issue.path.length > 1) return 'Pick tags from the list.';
      if (issue.code === 'custom') return 'Pick each tag only once.';
      return issue.code === 'too_big' ? 'Pick up to 3 tags.' : 'Pick at least 1 tag.';
    case 'placeType':
      return 'Choose a place type.';
    case 'budget':
      return 'Pick a budget.';
    case 'duration':
      return 'Pick how long it takes.';
    default:
      return undefined;
  }
}

export const shareResolver = fieldResolver(ideaCreateSchema, ideaFieldMessage);

export const SHARE_FIELDS = [
  { name: 'image', label: 'Photo' },
  { name: 'title', label: 'Title' },
  { name: 'description', label: 'Description' },
  { name: 'tagIds', label: 'Tags' },
  { name: 'placeType', label: 'Place type' },
  { name: 'budget', label: 'Budget' },
  { name: 'duration', label: 'Duration' },
] as const;

export type ShareFieldName = (typeof SHARE_FIELDS)[number]['name'];
