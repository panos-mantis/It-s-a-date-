import { DURATION_LABELS, DURATIONS, type Duration } from '@itsadate/shared';
import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { SelectableChip } from '../../components/ui';

/** The "Filters" pill beside the search bar. Its popover holds Duration; a pick applies at once. */
export function FiltersPopover({
  value,
  count,
  onChange,
}: {
  value: '' | Duration;
  /** The active filter badge (`activeFilterCount`). */
  count: number;
  onChange: (duration: '' | Duration) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Closes on a click outside, like the account menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof Node && !wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Marked handled so the same Escape doesn't also close a toast.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape' || !open || e.defaultPrevented) return;
    e.preventDefault();
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Escape bubbling up from the pill or a chip
    <div ref={wrapRef} className="relative shrink-0" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-pop`}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-12 cursor-pointer items-center gap-2 whitespace-nowrap rounded-pill border border-border bg-surface px-5 text-sm font-medium text-fg hover:bg-surface-sunk motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly"
      >
        <SlidersHorizontal aria-hidden="true" size={20} strokeWidth={1.75} />
        Filters
        {count > 0 && (
          <span className="inline-grid h-5 min-w-5 place-items-center rounded-pill bg-fg px-1.5 text-xs font-semibold text-surface">
            <span aria-hidden="true">{count}</span>
            <span className="sr-only">
              , {count} {count === 1 ? 'filter' : 'filters'} on
            </span>
          </span>
        )}
      </button>
      {open && (
        <div
          id={`${id}-pop`}
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[360px] max-w-[calc(100vw-32px)] rounded-md border border-border bg-surface p-5 shadow-raised"
        >
          <p id={`${id}-label`} className="mb-3 text-sm font-semibold text-fg">
            Duration
          </p>
          <div role="group" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <SelectableChip
                key={d}
                selected={value === d}
                onToggle={() => onChange(value === d ? '' : d)}
              >
                {DURATION_LABELS[d]}
              </SelectableChip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
