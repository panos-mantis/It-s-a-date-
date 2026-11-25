import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Chip({
  children,
  icon: Icon,
  variant = 'accent',
}: {
  children: ReactNode;
  icon?: LucideIcon;
  variant?: 'accent' | 'quiet';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold',
        variant === 'accent' ? 'bg-accent-soft text-accent-ink' : 'bg-surface-sunk text-fg',
      )}
    >
      {Icon && <Icon aria-hidden="true" size={14} strokeWidth={1.75} />}
      {children}
    </span>
  );
}
