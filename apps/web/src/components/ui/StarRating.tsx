import { Star } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '../../lib/cn';

export function StarRating({
  value,
  count,
  format = 'card',
  className,
}: {
  value: number;
  count: number;
  format?: 'card' | 'detail';
  className?: string;
}) {
  if (count === 0) {
    if (format === 'card') return null;
    return <p className={cn('text-sm text-muted', className)}>No ratings yet. Be the first.</p>;
  }
  const average = value.toFixed(1);
  const noun = count === 1 ? 'rating' : 'ratings';
  const spoken = `Rated ${average} out of 5 from ${count} ${noun}`;
  if (format === 'detail') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-sm text-fg', className)}>
        <Star aria-hidden="true" size={16} strokeWidth={1.75} className="fill-fg text-fg" />
        <span aria-hidden="true">
          {average} · {count} {noun}
        </span>
        <span className="sr-only">{spoken}</span>
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
      <Star aria-hidden="true" size={13} strokeWidth={1.75} className="fill-fg text-fg" />
      <span aria-hidden="true">
        <span className="font-semibold text-fg">{average}</span>{' '}
        <span className="text-muted">({count})</span>
      </span>
      <span className="sr-only">{spoken}</span>
    </span>
  );
}

type Rating = 1 | 2 | 3 | 4 | 5;
const STARS: Rating[] = [1, 2, 3, 4, 5];

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  label = 'Your rating',
}: {
  value: number | null;
  onChange: (value: Rating) => void;
  disabled?: boolean;
  label?: string;
}) {
  const name = useId();
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" disabled={disabled}>
      <legend className="mb-1 p-0 text-sm font-semibold text-fg">{label}</legend>
      <div className="flex gap-1" onMouseLeave={() => setHover(null)}>
        {STARS.map((n) => (
          <label
            key={n}
            className={cn(
              'relative block',
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            )}
            onMouseEnter={() => !disabled && setHover(n)}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
              aria-label={n === 1 ? '1 star' : `${n} stars`}
            />
            <Star
              aria-hidden="true"
              size={24}
              strokeWidth={1.75}
              className={cn(
                'rounded-sm peer-focus-visible:ring-[3px] peer-focus-visible:ring-accent/30 motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
                n <= shown ? 'fill-fg text-fg' : 'text-border',
              )}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
