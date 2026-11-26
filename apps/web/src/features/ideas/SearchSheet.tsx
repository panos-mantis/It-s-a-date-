import { BUDGET_LABELS, BUDGETS, DURATION_LABELS, DURATIONS, type Budget } from '@itsadate/shared';
import { Search, X } from 'lucide-react';
import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  Button,
  Dialog,
  Input,
  SelectableChip,
  type SearchValues,
  type SearchVibe,
} from '../../components/ui';
import { cn } from '../../lib/cn';

const EMPTY: SearchValues = { q: '', tag: '', budget: '', duration: '' };

/** "picnic · Food · $ · Full day", or "Any vibe · Any budget · Any length". */
function summary(values: SearchValues, vibes: SearchVibe[]): string {
  const vibe = vibes.find((v) => v.value === values.tag)?.label;
  return [
    values.q || null,
    vibe ?? 'Any vibe',
    values.budget ? BUDGET_LABELS[Number(values.budget) as Budget] : 'Any budget',
    values.duration ? DURATION_LABELS[values.duration] : 'Any length',
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

function Section({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2.5">{children}</div>;
}

const sectionLabel = 'text-sm font-semibold text-fg';

/**
 * Phone search (below 768px): the "Find a date idea" pill opens a full-screen sheet with What,
 * Vibe, Budget and Duration. Nothing applies until "Show ideas".
 */
export function SearchSheet({
  initial,
  vibes,
  onSubmit,
}: {
  initial: SearchValues;
  vibes: SearchVibe[];
  onSubmit: (values: SearchValues) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initial);
  const whatRef = useRef<HTMLInputElement>(null);

  function openSheet() {
    setDraft(initial);
    setOpen(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ ...draft, q: draft.q.trim() });
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openSheet}
        className="flex min-h-15 w-full cursor-pointer items-center gap-3.5 rounded-pill border border-border bg-surface px-5 py-2 text-left text-fg shadow-search"
      >
        <Search aria-hidden="true" size={20} strokeWidth={1.75} className="shrink-0" />
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold leading-[1.4]">Find a date idea</span>
          <span className="truncate text-xs leading-[1.4] text-muted">
            {summary(initial, vibes)}
          </span>
        </span>
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={`${id}-title`}
        variant="sheet"
        initialFocus={whatRef}
      >
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <div className="grid grid-cols-[44px_1fr_44px] items-center border-b border-border px-3 py-2">
            <button
              type="button"
              aria-label="Close search"
              onClick={() => setOpen(false)}
              className="grid size-11 cursor-pointer place-items-center rounded-pill hover:bg-surface-sunk"
            >
              <X aria-hidden="true" size={20} strokeWidth={1.75} />
            </button>
            <h2
              id={`${id}-title`}
              className="text-center font-body text-base font-semibold [font-variation-settings:normal]"
            >
              Find a date idea
            </h2>
            <span aria-hidden="true" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 divide-y divide-border overflow-y-auto px-4 py-5 [&>*+*]:pt-6">
            <Section>
              <Input
                ref={whatRef}
                label="What"
                type="text"
                placeholder="Search date ideas"
                autoComplete="off"
                value={draft.q}
                onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              />
            </Section>

            <Section>
              <p id={`${id}-vibe`} className={sectionLabel}>
                Vibe
              </p>
              <div role="group" aria-labelledby={`${id}-vibe`} className="flex flex-wrap gap-2">
                {vibes.map((v) => (
                  <SelectableChip
                    key={v.value}
                    icon={v.icon}
                    selected={draft.tag === v.value}
                    onToggle={() =>
                      setDraft({ ...draft, tag: draft.tag === v.value ? '' : v.value })
                    }
                  >
                    {v.label}
                  </SelectableChip>
                ))}
              </div>
            </Section>

            <Section>
              <p id={`${id}-budget`} className={sectionLabel}>
                Budget
              </p>
              <div
                role="group"
                aria-labelledby={`${id}-budget`}
                aria-describedby={`${id}-budget-hint`}
                className="flex gap-0.5 rounded-pill border border-border bg-surface p-1"
              >
                {BUDGETS.map((b) => {
                  const value = String(b) as SearchValues['budget'];
                  const pressed = draft.budget === value;
                  return (
                    <button
                      key={b}
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => setDraft({ ...draft, budget: pressed ? '' : value })}
                      className={cn(
                        'min-h-11 flex-1 cursor-pointer whitespace-nowrap rounded-pill px-4 text-sm motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
                        pressed
                          ? 'bg-surface-sunk font-semibold text-fg'
                          : 'font-medium text-muted hover:text-fg',
                      )}
                    >
                      {BUDGET_LABELS[b]}
                    </button>
                  );
                })}
              </div>
              <p id={`${id}-budget-hint`} className="text-xs text-muted">
                Tap again to clear.
              </p>
            </Section>

            <Section>
              <p id={`${id}-duration`} className={sectionLabel}>
                Duration
              </p>
              <div role="group" aria-labelledby={`${id}-duration`} className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <SelectableChip
                    key={d}
                    selected={draft.duration === d}
                    onToggle={() => setDraft({ ...draft, duration: draft.duration === d ? '' : d })}
                  >
                    {DURATION_LABELS[d]}
                  </SelectableChip>
                ))}
              </div>
            </Section>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => setDraft(EMPTY)}>
              Clear all
            </Button>
            <Button type="submit">Show ideas</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
