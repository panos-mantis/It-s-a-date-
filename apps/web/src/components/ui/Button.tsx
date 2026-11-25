import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-on border-transparent hover:bg-accent-hover',
  secondary: 'bg-surface text-fg border-fg hover:bg-surface-sunk',
  ghost: 'bg-transparent text-accent-ink border-transparent hover:underline',
};

const sizes: Record<Size, string> = {
  md: 'px-6 py-3 text-base',
  sm: 'px-3 py-2 text-sm sm:px-4',
};

export function buttonClasses(
  opts: { variant?: Variant; size?: Size; className?: string } = {},
): string {
  const { variant = 'primary', size = 'md', className } = opts;
  return cn(
    'inline-flex items-center whitespace-nowrap justify-center gap-2 rounded-md border-[1.5px] font-body font-semibold tracking-[0.02em]',
    'cursor-pointer motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
    'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30',
    'disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  loading = false,
  className,
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? true : undefined}
      className={buttonClasses({ variant, size, className })}
    >
      {loading && (
        <LoaderCircle
          aria-hidden="true"
          size={18}
          strokeWidth={1.75}
          className="motion-safe:animate-spin"
        />
      )}
      {children}
    </button>
  );
}
