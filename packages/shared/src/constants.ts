export const ROLES = ['user', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const IDEA_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const BUDGETS = [1, 2, 3] as const;
export type Budget = (typeof BUDGETS)[number];
export const BUDGET_LABELS: Record<Budget, string> = { 1: '$', 2: '$$', 3: '$$$' };

export const DURATIONS = ['short', 'half-day', 'full-day'] as const;
export type Duration = (typeof DURATIONS)[number];
export const DURATION_LABELS: Record<Duration, string> = {
  short: '1–2 hours',
  'half-day': 'Half day',
  'full-day': 'Full day',
};

export const PLACE_TYPES = [
  'none',
  'restaurant',
  'sushi',
  'cafe',
  'bar',
  'park',
  'viewpoint',
  'museum',
  'cinema',
  'theatre',
  'climbing_gym',
  'bowling',
  'escape_room',
  'spa',
  'beach',
] as const;
export type PlaceType = (typeof PLACE_TYPES)[number];

export const SORTS = ['new', 'top'] as const;
export type IdeaSort = (typeof SORTS)[number];

export const PAGE_SIZE_DEFAULT = 24;
export const PAGE_SIZE_MAX = 48;

export const PLACES_RADIUS_DEFAULT_M = 3000;
export const PLACES_RADIUS_MAX_M = 10000;
export const PLACES_RESULTS_MAX = 20;
