import { useId, type Ref, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { describedBy, fieldClasses, FieldMessages } from './Field';

export function Textarea({
  label,
  hint,
  error,
  counter,
  counterFull,
  className,
  id,
  ref,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
  counter?: string;
  counterFull?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={textareaId} className="text-sm font-semibold text-fg">
        {label}
      </label>
      <textarea
        {...rest}
        ref={ref}
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, { error, hint, counter })}
        className={cn(fieldClasses(error, 'min-h-[168px] resize-y leading-[1.55]'), className)}
      />
      <FieldMessages
        id={textareaId}
        error={error}
        hint={hint}
        counter={counter}
        counterFull={counterFull}
      />
    </div>
  );
}
