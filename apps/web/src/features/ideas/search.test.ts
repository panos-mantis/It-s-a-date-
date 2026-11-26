import { describe, expect, it } from 'vitest';
import { activeFilterCount, parseIdeaSearch, toSearchParams, type IdeaSearch } from './search';

const empty: IdeaSearch = { q: '', tag: '', budget: '', duration: '', sort: 'new' };

describe('idea search params', () => {
  it('round-trips a full query', () => {
    const raw = 'q=picnic&tag=food&budget=2&duration=half-day&sort=top';
    const parsed = parseIdeaSearch(new URLSearchParams(raw));
    expect(parsed).toEqual({
      q: 'picnic',
      tag: 'food',
      budget: '2',
      duration: 'half-day',
      sort: 'top',
    });
    expect(toSearchParams(parsed).toString()).toBe(raw);
  });

  it('drops junk values field by field', () => {
    const parsed = parseIdeaSearch(
      new URLSearchParams('budget=7&sort=hot&tag=Bad%20Tag&duration=week'),
    );
    expect(parsed).toEqual(empty);
  });

  it('keeps valid fields when others are junk', () => {
    expect(parseIdeaSearch(new URLSearchParams('q=tea&budget=9'))).toEqual({ ...empty, q: 'tea' });
  });

  it('omits empty values and the default sort', () => {
    expect(toSearchParams(empty).toString()).toBe('');
    expect(toSearchParams({ ...empty, sort: 'top' }).toString()).toBe('sort=top');
  });

  it('counts only duration as an active filter', () => {
    expect(activeFilterCount(empty)).toBe(0);
    expect(activeFilterCount({ ...empty, q: 'a', tag: 'food', budget: '1', sort: 'top' })).toBe(0);
    expect(activeFilterCount({ ...empty, duration: 'short' })).toBe(1);
  });
});
