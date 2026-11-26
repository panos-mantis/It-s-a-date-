import { ChevronDown } from 'lucide-react';
import { useId, type Ref, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { describedBy, fieldClasses, FieldMessages } from './Field';

/** A native select with a drawn chevron. Pass `<option>`s as children. */
export function Select({
  label,
  hint,
  error,
  className,
  id,
  ref,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  ref?: Ref<HTMLSelectElement>;
}) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-semibold text-fg">
        {label}
      </label>
      <div className="relative">
        <select
          {...rest}
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, { error, hint })}
          className={cn(fieldClasses(error, 'cursor-pointer appearance-none pr-11'), className)}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          size={18}
          strokeWidth={1.75}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
      <FieldMessages id={selectId} error={error} hint={hint} />
    </div>
  );
}
