import { BUDGET_LABELS, DURATION_LABELS, type Budget, type IdeaSort } from '@itsadate/shared';
import { LayoutGrid, Lightbulb, SearchX, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  Button,
  buttonClasses,
  CategoryRow,
  EmptyState,
  SearchBar,
  useToast,
  type SearchValues,
} from '../../components/ui';
import { paths } from '../../app/paths';
import { cn } from '../../lib/cn';
import { tagIcon } from '../../lib/tag-icons';
import { useTags } from '../tags/api';
import { useIdeas } from './api';
import { FiltersPopover } from './FiltersPopover';
import { IdeaGrid, IdeaGridSkeleton } from './IdeaGrid';
import { SearchSheet } from './SearchSheet';
import { activeFilterCount, parseIdeaSearch, toSearchParams, type IdeaSearch } from './search';

const SORT_OPTIONS: { value: IdeaSort; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'top', label: 'Top rated' },
];

const NO_FILTERS = { q: '', tag: '', budget: '', duration: '' } as const;

function searchHref(s: IdeaSearch): string {
  const query = toSearchParams(s).toString();
  return query ? `?${query}` : '';
}

/** 'Nothing for "rooftop" in Dancing at $$. Try another vibe or budget.' */
function noMatchBody(s: IdeaSearch, tagLabel: string): string {
  const parts = [
    s.q && `for "${s.q}"`,
    s.tag && `in ${tagLabel}`,
    s.budget && `at ${BUDGET_LABELS[Number(s.budget) as Budget]}`,
    s.duration && `for ${DURATION_LABELS[s.duration].toLowerCase()}`,
  ].filter(Boolean);
  const tail = 'Try another vibe or budget.';
  return parts.length ? `Nothing ${parts.join(' ')}. ${tail}` : tail;
}

/** The sticky band gets a hairline once it is stuck under the header. */
function useStuck<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const top = parseFloat(getComputedStyle(el).top) || 0;
      setStuck(window.scrollY > 0 && el.getBoundingClientRect().top <= top + 0.5);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return [ref, stuck] as const;
}

export function HomePage() {
  const [params, setParams] = useSearchParams();
  const search = useMemo(() => parseIdeaSearch(params), [params]);
  const { sort, ...values } = search;
  const tags = useTags();
  const ideas = useIdeas(search);
  const toast = useToast();
  const [bandRef, stuck] = useStuck<HTMLElement>();

  const vibes = useMemo(
    () => (tags.data ?? []).map((t) => ({ value: t.slug, label: t.name, icon: tagIcon(t.icon) })),
    [tags.data],
  );
  const categories = useMemo(
    () => [{ value: '', label: 'All', icon: LayoutGrid }, ...vibes],
    [vibes],
  );

  // Filters keep the scroll position; each change is a new history entry, so Back undoes it.
  function apply(next: IdeaSearch) {
    setParams(toSearchParams(next), { preventScrollReset: true });
  }
  const applyValues = (next: SearchValues) => apply({ ...next, sort });

  async function showMore() {
    const result = await ideas.fetchNextPage();
    if (result.isFetchNextPageError) {
      toast.show("We couldn't load ideas. Check your connection and try again.", {
        tone: 'error',
      });
    }
  }

  const items = ideas.data?.pages.flatMap((p) => p.items) ?? [];
  const filtered = Boolean(search.q || search.budget || search.duration);
  const tagLabel = vibes.find((v) => v.value === search.tag)?.label ?? search.tag;

  let results;
  if (ideas.isPending) {
    results = (
      <div aria-busy="true">
        <p role="status" className="mb-4 text-sm text-muted">
          Loading ideas…
        </p>
        <IdeaGridSkeleton />
      </div>
    );
  } else if (ideas.isError && items.length === 0) {
    results = (
      <div role="alert">
        <EmptyState
          icon={WifiOff}
          title="We couldn't load ideas."
          body="Check your connection and try again."
          action={
            <Button busy={ideas.isFetching} onClick={() => void ideas.refetch()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  } else if (items.length === 0 && filtered) {
    results = (
      <EmptyState
        icon={SearchX}
        title="No ideas match those filters."
        body={noMatchBody(search, tagLabel)}
        action={
          <Link
            to={{ search: searchHref({ ...NO_FILTERS, sort }) }}
            preventScrollReset
            className={buttonClasses()}
          >
            Clear filters
          </Link>
        }
      />
    );
  } else if (items.length === 0) {
    results = (
      <EmptyState
        icon={Lightbulb}
        title="No ideas here yet."
        body="Be the first to share one."
        action={
          <Link to={paths.share} className={buttonClasses()}>
            Share an idea
          </Link>
        }
      />
    );
  } else {
    results = <IdeaGrid ideas={items} />;
  }

  return (
    <>
      <title>{"It's a Date"}</title>
      <section className="pt-8 text-center md:pt-12">
        <h1 className="text-balance text-2xl font-medium leading-tight tracking-display text-fg md:text-4xl [&_em]:font-normal [&_em]:italic">
          Plans worth <em>saying yes</em> to.
        </h1>
      </section>

      <section
        ref={bandRef}
        aria-label="Search and filters"
        className={cn(
          'sticky top-16 z-[5] border-b bg-bg py-5 md:py-6',
          'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-friendly',
          stuck ? 'border-border' : 'border-transparent',
        )}
      >
        <SearchBar
          initial={values}
          vibes={vibes}
          onSubmit={applyValues}
          filters={({ duration, setDuration }) => (
            <FiltersPopover
              value={duration}
              count={activeFilterCount(search)}
              onChange={setDuration}
            />
          )}
          phone={<SearchSheet initial={values} vibes={vibes} onSubmit={applyValues} />}
        />
      </section>

      <div className="mt-4">
        <CategoryRow
          label="Vibes"
          items={categories}
          active={search.tag}
          onSelect={(tag) => apply({ ...search, tag })}
        />
      </div>

      <section aria-labelledby="ideas-title" className="pb-16">
        <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 md:mb-6 md:mt-6 md:pt-6">
          <h2
            id="ideas-title"
            className="text-lg font-semibold leading-[1.2] tracking-[-0.01em] text-fg"
          >
            Date ideas
          </h2>
          <div
            role="group"
            aria-label="Sort ideas"
            className="inline-flex gap-0.5 rounded-pill border border-border bg-surface p-1"
          >
            {SORT_OPTIONS.map((option) => {
              const pressed = sort === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => {
                    if (!pressed) apply({ ...search, sort: option.value });
                  }}
                  className={cn(
                    'min-h-11 cursor-pointer whitespace-nowrap rounded-pill px-4 text-sm motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
                    pressed
                      ? 'bg-surface-sunk font-semibold text-fg'
                      : 'font-medium text-muted hover:text-fg',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {results}

        {ideas.hasNextPage && items.length > 0 && (
          <div className="mt-12 flex justify-center">
            <Button
              variant="secondary"
              busy={ideas.isFetchingNextPage}
              onClick={() => void showMore()}
            >
              Show more
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
