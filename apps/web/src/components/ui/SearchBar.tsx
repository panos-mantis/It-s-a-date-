import { BUDGET_LABELS, BUDGETS } from '@itsadate/shared';
import { Search } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

export type SearchValues = { q: string; tag: string; budget: '' | '1' | '2' | '3' };

const segment =
  'flex flex-1 flex-col gap-0.5 border-b border-border px-5 py-2 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:first:pl-6';
const labelClass = 'text-xs font-semibold text-fg';
const fieldClass =
  'w-full rounded-sm bg-transparent text-sm text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30';

export function SearchBar({
  initial,
  vibes,
  onSubmit,
}: {
  initial: SearchValues;
  vibes: { value: string; label: string }[];
  onSubmit: (values: SearchValues) => void;
}) {
  const id = useId();
  const [values, setValues] = useState(initial);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ ...values, q: values.q.trim() });
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex w-full flex-col rounded-lg border border-border bg-surface py-2 shadow-search sm:flex-row sm:items-center sm:rounded-pill sm:pr-2"
    >
      <div className={segment}>
        <label htmlFor={`${id}-q`} className={labelClass}>
          What
        </label>
        <input
          id={`${id}-q`}
          type="text"
          value={values.q}
          placeholder="Search date ideas"
          onChange={(e) => setValues({ ...values, q: e.target.value })}
          className={fieldClass}
        />
      </div>
      <div className={segment}>
        <label htmlFor={`${id}-tag`} className={labelClass}>
          Vibe
        </label>
        <select
          id={`${id}-tag`}
          value={values.tag}
          onChange={(e) => setValues({ ...values, tag: e.target.value })}
          className={fieldClass}
        >
          <option value="">Any vibe</option>
          {vibes.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      <div className={segment}>
        <label htmlFor={`${id}-budget`} className={labelClass}>
          Budget
        </label>
        <select
          id={`${id}-budget`}
          value={values.budget}
          onChange={(e) =>
            setValues({ ...values, budget: e.target.value as SearchValues['budget'] })
          }
          className={fieldClass}
        >
          <option value="">Any budget</option>
          {BUDGETS.map((b) => (
            <option key={b} value={String(b)}>
              {BUDGET_LABELS[b]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        aria-label="Search"
        className="mx-5 mt-2 inline-flex size-11 shrink-0 items-center justify-center self-end rounded-pill bg-accent text-accent-on hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 sm:m-0 sm:ml-2 sm:self-auto motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly"
      >
        <Search aria-hidden="true" size={20} strokeWidth={1.75} />
      </button>
    </form>
  );
}
