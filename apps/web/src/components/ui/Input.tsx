import { CircleAlert } from 'lucide-react';
import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '../../lib/cn';

export function Input({
  label,
  hint,
  error,
  action,
  afterError,
  className,
  id,
  ref,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Helper text. It gives way to the error while one shows. */
  hint?: string;
  error?: string;
  /** A control inside the right edge of the field (the password Show / Hide button). */
  action?: ReactNode;
  /** Shown under the error message (for example a "Log in instead" link). */
  afterError?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const showHint = Boolean(hint) && !error;
  const describedBy = error ? errorId : showHint ? hintId : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-fg">
        {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'min-h-12 w-full rounded-sm border bg-surface px-3.5 py-3 text-base text-fg placeholder:text-muted',
            error ? 'border-danger' : 'border-muted',
            action ? 'pr-[76px]' : null,
            'motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus-ring focus-visible:border-accent-ink',
            'group-aria-busy:bg-surface-sunk',
            className,
          )}
        />
        {action && <div className="absolute inset-y-0.5 right-0.5 flex">{action}</div>}
      </div>
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-xs text-danger">
          <CircleAlert
            aria-hidden="true"
            size={14}
            strokeWidth={1.75}
            className="mt-0.5 shrink-0"
          />
          {error}
        </p>
      )}
      {error && afterError}
      {showHint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
