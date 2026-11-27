import { LoaderCircle } from 'lucide-react';
import type { ButtonHTMLAttributes, Ref } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';
type Tone = 'default' | 'plain' | 'success' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-on border-transparent hover:bg-accent-hover',
  secondary: 'bg-surface text-fg border-fg hover:bg-surface-sunk',
  ghost: 'bg-transparent border-transparent hover:underline',
  // Confirm dialogs only.
  danger: 'bg-danger text-on-danger border-transparent hover:opacity-90',
};

// Text-button tones for ghost buttons (Admin approve / reject); they underline on hover.
const tones: Record<Tone, string> = {
  default: 'text-accent-ink',
  // Admin Edit: a quiet text action next to Approve and Reject.
  plain: 'text-fg',
  success: 'text-success',
  danger: 'text-danger',
};

const sizes: Record<Size, string> = {
  md: 'px-6 py-3 text-base',
  sm: 'px-3 py-2 text-sm sm:px-4',
};

export function buttonClasses(
  opts: {
    variant?: Variant;
    size?: Size;
    tone?: Tone;
    busy?: boolean;
    className?: string;
  } = {},
): string {
  const { variant = 'primary', size = 'md', tone = 'default', busy = false, className } = opts;
  return cn(
    'inline-flex min-h-11 items-center whitespace-nowrap justify-center gap-2 rounded-md border-[1.5px] font-body font-semibold tracking-[0.02em]',
    'cursor-pointer motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
    'disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    variant === 'ghost' && tones[tone],
    busy && 'cursor-progress',
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  tone,
  loading = false,
  busy = false,
  className,
  type = 'button',
  disabled,
  onClick,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  tone?: Tone;
  /** Disables and shows a spinner (the label stays). */
  loading?: boolean;
  /** Spinner plus aria-disabled, so it stays focusable and keeps the label. Clicks are ignored. */
  busy?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-disabled={busy ? true : undefined}
      aria-busy={loading || busy ? true : undefined}
      onClick={(e) => {
        if (busy) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      className={buttonClasses({ variant, size, tone, busy, className })}
    >
      {(loading || busy) && (
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
