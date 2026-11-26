import { BUDGET_LABELS, BUDGETS, type Duration } from '@itsadate/shared';
import { ChevronDown, type LucideIcon, Search } from 'lucide-react';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Home's search: everything in `IdeaSearch` except `sort`. */
export type SearchValues = {
  q: string;
  tag: string;
  budget: '' | '1' | '2' | '3';
  duration: '' | Duration;
};

export type SearchVibe = { value: string; label: string; icon?: LucideIcon };

function sameValues(a: SearchValues, b: SearchValues): boolean {
  return a.q === b.q && a.tag === b.tag && a.budget === b.budget && a.duration === b.duration;
}

const segment = 'relative flex min-w-0 flex-col gap-0.5 py-0.5';
const divided = 'border-r border-border';
const labelClass = 'text-xs font-semibold leading-[1.4] text-fg';
const fieldClass =
  'w-full rounded-sm bg-transparent text-sm leading-normal placeholder:text-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus-ring';
const selectClass = cn(fieldClass, 'cursor-pointer appearance-none pr-5');
const chevron = 'pointer-events-none absolute bottom-1.5 right-[18px] text-muted';

/**
 * The What / Vibe / Budget pill with its coral search button. `filters` renders beside it (the
 * Filters pill); a duration picked there submits the current values with that duration. `phone`
 * replaces the whole bar below 768px (the "Find a date idea" pill and sheet).
 */
export function SearchBar({
  initial,
  vibes,
  onSubmit,
  filters,
  phone,
}: {
  initial: SearchValues;
  vibes: SearchVibe[];
  onSubmit: (values: SearchValues) => void;
  filters?: (ctx: {
    duration: SearchValues['duration'];
    setDuration: (duration: SearchValues['duration']) => void;
  }) => ReactNode;
  phone?: ReactNode;
}) {
  const id = useId();
  const [values, setValues] = useState(initial);
  // Follow the URL when it changes underneath (Back, a category pick), without remounting.
  const [synced, setSynced] = useState(initial);
  if (!sameValues(synced, initial)) {
    setSynced(initial);
    setValues(initial);
  }

  function submit(next: SearchValues) {
    onSubmit({ ...next, q: next.q.trim() });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit(values);
  }

  return (
    <div>
      <div className={cn('items-center justify-center gap-3', phone ? 'hidden md:flex' : 'flex')}>
        <form
          role="search"
          onSubmit={handleSubmit}
          className="flex w-full min-w-0 flex-[0_1_720px] items-center rounded-pill border border-border bg-surface py-2 pr-2 shadow-search md:min-w-[520px]"
        >
          <div className={cn(segment, divided, 'flex-[1.5_1_0%] pl-7 pr-5')}>
            <label htmlFor={`${id}-q`} className={labelClass}>
              What
            </label>
            <input
              id={`${id}-q`}
              type="text"
              value={values.q}
              placeholder="Search date ideas"
              autoComplete="off"
              maxLength={100}
              onChange={(e) => setValues({ ...values, q: e.target.value })}
              className={cn(fieldClass, 'text-fg')}
            />
          </div>
          <div className={cn(segment, divided, 'flex-1 px-5')}>
            <label htmlFor={`${id}-tag`} className={labelClass}>
              Vibe
            </label>
            <select
              id={`${id}-tag`}
              value={values.tag}
              onChange={(e) => setValues({ ...values, tag: e.target.value })}
              className={cn(selectClass, values.tag ? 'text-fg' : 'text-muted')}
            >
              <option value="">Any vibe</option>
              {vibes.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" size={16} strokeWidth={1.75} className={chevron} />
          </div>
          <div className={cn(segment, 'flex-1 px-5')}>
            <label htmlFor={`${id}-budget`} className={labelClass}>
              Budget
            </label>
            <select
              id={`${id}-budget`}
              value={values.budget}
              onChange={(e) =>
                setValues({ ...values, budget: e.target.value as SearchValues['budget'] })
              }
              className={cn(selectClass, values.budget ? 'text-fg' : 'text-muted')}
            >
              <option value="">Any budget</option>
              {BUDGETS.map((b) => (
                <option key={b} value={String(b)}>
                  {BUDGET_LABELS[b]}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" size={16} strokeWidth={1.75} className={chevron} />
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="ml-1 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill bg-accent text-accent-on hover:bg-accent-hover motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly"
          >
            <Search aria-hidden="true" size={20} strokeWidth={1.75} />
          </button>
        </form>
        {filters?.({
          duration: values.duration,
          setDuration: (duration) => submit({ ...values, duration }),
        })}
      </div>
      {phone && <div className="md:hidden">{phone}</div>}
    </div>
  );
}
