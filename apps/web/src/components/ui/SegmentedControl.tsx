import { Check } from 'lucide-react';
import { useId } from 'react';
import { cn } from '../../lib/cn';
import { FieldMessages, fieldIds } from './Field';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Spoken name when the visible label is not enough ("$, low budget"). */
  ariaLabel?: string;
}

/** Radios styled as segments. The picked one looks like a picked tag: coral-soft, check icon. */
export function SegmentedControl<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  disabledValues = [],
  disabled = false,
  columns,
  variant = 'track',
  fullWidth = false,
  error,
  hint,
}: {
  legend: string;
  name: string;
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  disabledValues?: T[];
  /** Disables every segment (the form is sending). */
  disabled?: boolean;
  /** With 2, the segments become a 2×2 grid under 480px. */
  columns?: 2;
  /** 'pills' renders separate 44px pills (filters) instead of one track. */
  variant?: 'track' | 'pills';
  /** Lets the track fill its parent instead of stopping at 420px. */
  fullWidth?: boolean;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  const ids = fieldIds(id);
  const pills = variant === 'pills';
  // A 3-option track stays on one row on phones, so its segments tighten and drop the check.
  const compact = !pills && options.length === 3 && columns !== 2;
  return (
    <fieldset
      role="radiogroup"
      className="flex min-w-0 flex-col gap-1.5"
      aria-describedby={error ? ids.error : hint ? ids.hint : undefined}
    >
      <legend className="mb-1.5 text-sm font-semibold text-fg">{legend}</legend>
      <div
        className={cn(
          pills
            ? 'flex flex-wrap gap-2'
            : [
                'w-full gap-1 border bg-surface p-1',
                !fullWidth && 'max-w-[420px]',
                error ? 'border-danger' : 'border-muted',
                columns === 2
                  ? 'grid grid-cols-2 rounded-lg min-[480px]:flex min-[480px]:rounded-pill'
                  : 'flex rounded-pill',
              ]
                .filter(Boolean)
                .join(' '),
        )}
      >
        {options.map((o) => (
          <label key={o.value} className={cn('relative min-w-0', !pills && 'flex-1')}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={disabled || disabledValues.includes(o.value)}
              aria-label={o.ariaLabel}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-pill border px-2 text-sm font-medium whitespace-nowrap',
                'motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
                pills
                  ? 'border-muted px-4 hover:bg-surface-sunk'
                  : 'border-transparent hover:bg-surface-sunk',
                compact && 'max-[479px]:px-1 max-[479px]:text-[13px]',
                'peer-checked:border-accent-ink peer-checked:bg-accent-soft peer-checked:font-semibold peer-checked:text-accent-ink',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ink',
                'peer-disabled:cursor-default peer-disabled:opacity-60',
                columns === 2 && 'max-[479px]:rounded-md',
                '[&>svg]:hidden peer-checked:[&>svg]:block',
                compact && 'max-[479px]:peer-checked:[&>svg]:hidden',
              )}
            >
              <Check aria-hidden="true" size={14} strokeWidth={1.75} />
              {o.label}
            </span>
          </label>
        ))}
      </div>
      <FieldMessages id={id} error={error} hint={hint} />
    </fieldset>
  );
}
