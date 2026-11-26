import { ideaQuerySchema, type Duration, type IdeaSort } from '@itsadate/shared';

export interface IdeaSearch {
  q: string;
  tag: string;
  budget: '' | '1' | '2' | '3';
  duration: '' | Duration;
  sort: IdeaSort;
}

const shape = ideaQuerySchema.shape;
const BUDGET_PARAM = { 1: '1', 2: '2', 3: '3' } as const;

/** Reads the URL into a search; each field is validated on its own and junk is dropped. */
export function parseIdeaSearch(params: URLSearchParams): IdeaSearch {
  const q = shape.q.safeParse(params.get('q'));
  const tag = shape.tag.safeParse(params.get('tag'));
  const budget = shape.budget.safeParse(params.get('budget'));
  const duration = shape.duration.safeParse(params.get('duration'));
  const sort = shape.sort.safeParse(params.get('sort'));
  return {
    q: (q.success && q.data) || '',
    tag: (tag.success && tag.data) || '',
    budget: budget.success && budget.data !== undefined ? BUDGET_PARAM[budget.data] : '',
    duration: (duration.success && duration.data) || '',
    sort: sort.success ? sort.data : 'new',
  };
}

/** Serializes a search, leaving out empty values and the default sort. */
export function toSearchParams(s: IdeaSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (s.q) params.set('q', s.q);
  if (s.tag) params.set('tag', s.tag);
  if (s.budget) params.set('budget', s.budget);
  if (s.duration) params.set('duration', s.duration);
  if (s.sort !== 'new') params.set('sort', s.sort);
  return params;
}

/** The Filters badge counts only duration; q, tag, budget and sort have their own controls. */
export function activeFilterCount(s: IdeaSearch): number {
  return s.duration ? 1 : 0;
}
