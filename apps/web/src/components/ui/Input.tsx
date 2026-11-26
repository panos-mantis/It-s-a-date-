import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '../../lib/cn';
import { describedBy, fieldClasses, FieldMessages } from './Field';

export function Input({
  label,
  hint,
  error,
  counter,
  counterFull,
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
  /** A character count ("18/80") at the right of the message row. */
  counter?: string;
  /** The count is at its limit. */
  counterFull?: boolean;
  /** A control inside the right edge of the field (the password Show / Hide button). */
  action?: ReactNode;
  /** Shown under the error message (for example a "Log in instead" link). */
  afterError?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;

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
          aria-describedby={describedBy(inputId, { error, hint, counter })}
          className={cn(fieldClasses(error, action ? 'pr-[76px]' : undefined), className)}
        />
        {action && <div className="absolute inset-y-0.5 right-0.5 flex">{action}</div>}
      </div>
      <FieldMessages
        id={inputId}
        error={error}
        hint={hint}
        counter={counter}
        counterFull={counterFull}
        afterError={afterError}
      />
    </div>
  );
}
