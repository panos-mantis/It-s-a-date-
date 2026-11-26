// Field copy for the Share form (HANDOFF frame 1). Passed to zodResolver as the Zod error map;
// `reportInput: true` supplies `input`.
interface MapIssue {
  code: string;
  path?: PropertyKey[];
  input?: unknown;
}

export const shareResolverOptions = {
  error: (iss: MapIssue): string | undefined => {
    // The budget schema is a union; the resolver reports its inner issues, which carry no path.
    if (!iss.path?.length) return 'Pick a budget.';
    switch (iss.path?.[0]) {
      case 'image':
        return 'Add a photo.';
      case 'title':
        return iss.code === 'too_big'
          ? 'Use 80 characters or fewer.'
          : 'Use at least 3 characters.';
      case 'description': {
        if (iss.code === 'too_big') return 'Use 2000 characters or fewer.';
        const have = typeof iss.input === 'string' ? iss.input.trim().length : 0;
        return `Write at least 20 characters. You have ${have} so far.`;
      }
      case 'tagIds':
        return iss.code === 'too_big' ? 'Pick up to 3 tags.' : 'Pick at least 1 tag.';
      case 'placeType':
        return 'Choose a place type.';
      case 'budget':
        return 'Pick a budget.';
      case 'duration':
        return 'Pick how long it takes.';
      default:
        return undefined;
    }
  },
  reportInput: true,
} as const;

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
