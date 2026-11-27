import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** The ids a field's message row uses, so the control can point `aria-describedby` at them. */
export function fieldIds(id: string) {
  return { error: `${id}-error`, hint: `${id}-hint`, counter: `${id}-count` };
}

/** Space-separated ids of the messages that currently show. */
export function describedBy(
  id: string,
  { error, hint, counter }: { error?: string; hint?: ReactNode; counter?: string },
): string | undefined {
  const ids = fieldIds(id);
  const parts = [error ? ids.error : hint ? ids.hint : null, counter ? ids.counter : null].filter(
    Boolean,
  );
  return parts.length ? parts.join(' ') : undefined;
}

/** Text-field chrome shared by Input, Textarea and Select. */
export function fieldClasses(error: string | undefined, extra?: string): string {
  return cn(
    'min-h-12 w-full rounded-sm border bg-surface px-3.5 py-3 text-base text-fg placeholder:text-muted',
    error ? 'border-danger' : 'border-muted',
    'motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
    'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus-ring focus-visible:border-accent-ink',
    'group-aria-busy:bg-surface-sunk',
    extra,
  );
}

/** The row under a control: the error (or hint) on the left, an optional counter on the right. */
export function FieldMessages({
  id,
  error,
  hint,
  counter,
  afterError,
  counterFull = false,
}: {
  id: string;
  error?: string;
  hint?: ReactNode;
  counter?: string;
  afterError?: ReactNode;
  /** The counter is at its limit: darker and heavier. */
  counterFull?: boolean;
}) {
  const ids = fieldIds(id);
  const showHint = Boolean(hint) && !error;
  return (
    <>
      {(error || showHint || counter) && (
        <div className="flex items-baseline justify-between gap-3">
          {error ? (
            <p id={ids.error} className="flex min-w-0 items-start gap-1.5 text-xs text-danger">
              <CircleAlert
                aria-hidden="true"
                size={14}
                strokeWidth={1.75}
                className="mt-0.5 shrink-0"
              />
              {error}
            </p>
          ) : showHint ? (
            <p id={ids.hint} className="text-xs text-muted">
              {hint}
            </p>
          ) : (
            <span />
          )}
          {counter && (
            <span
              id={ids.counter}
              className={cn(
                'ml-auto shrink-0 text-xs tabular-nums',
                counterFull ? 'font-semibold text-fg' : 'text-muted',
              )}
            >
              {counter}
            </span>
          )}
        </div>
      )}
      {error && afterError}
    </>
  );
}
