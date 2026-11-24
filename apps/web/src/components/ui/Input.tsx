import { useId, type InputHTMLAttributes, type Ref } from 'react';
import { cn } from '../../lib/cn';

export function Input({
  label,
  hint,
  error,
  className,
  id,
  ref,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-fg">
        {label}
      </label>
      <input
        {...rest}
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'w-full rounded-sm border bg-surface px-3.5 py-3 text-base text-fg',
          error ? 'border-danger' : 'border-muted',
          'motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 focus-visible:border-accent-ink',
          className,
        )}
      />
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
