import { Check, CircleCheck, CircleX, Clock, type LucideIcon, Shield, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Status = 'pending' | 'approved' | 'rejected';
type Role = 'admin' | 'user';

const STATUS: Record<Status, { label: string; icon: LucideIcon; tone: string }> = {
  pending: { label: 'Pending review', icon: Clock, tone: 'bg-overlay shadow-raised text-warn' },
  approved: { label: 'Approved', icon: CircleCheck, tone: 'bg-overlay shadow-raised text-success' },
  rejected: { label: 'Not approved', icon: CircleX, tone: 'bg-overlay shadow-raised text-danger' },
};

const ROLE: Record<Role, { label: string; icon: LucideIcon; tone: string }> = {
  admin: { label: 'Admin', icon: Shield, tone: 'bg-accent-soft text-accent-ink' },
  user: { label: 'User', icon: User, tone: 'bg-surface-sunk text-fg' },
};

const BASE = 'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold';

type ChipProps =
  | { variant?: 'accent' | 'quiet'; children: ReactNode; icon?: LucideIcon }
  | { variant: 'status'; status: Status; flat?: boolean; children?: never; icon?: never }
  | { variant: 'role'; userRole: Role; children?: never; icon?: never };

export function Chip(props: ChipProps) {
  let Icon: LucideIcon | undefined;
  let tone: string;
  let content: ReactNode;
  if (props.variant === 'status') {
    const s = STATUS[props.status];
    Icon = s.icon;
    // In a table the chip is flat; on a photo it floats on an overlay with a raised shadow.
    tone = props.flat
      ? s.tone.replace('bg-overlay shadow-raised', 'border border-border bg-surface')
      : s.tone;
    content = s.label;
  } else if (props.variant === 'role') {
    const r = ROLE[props.userRole];
    ({ icon: Icon, tone } = r);
    content = r.label;
  } else {
    Icon = props.icon;
    tone = props.variant === 'quiet' ? 'bg-surface-sunk text-fg' : 'bg-accent-soft text-accent-ink';
    content = props.children;
  }
  return (
    <span className={cn(BASE, tone)}>
      {Icon && <Icon aria-hidden="true" size={14} strokeWidth={1.75} />}
      {content}
    </span>
  );
}

/** A pick-up-to-N choice. Picked shows a check in place of the icon. Disabled uses aria-disabled so it stays focusable. */
export function SelectableChip({
  selected,
  disabled = false,
  icon: Icon,
  onToggle,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  onToggle: () => void;
  children: ReactNode;
}) {
  const ShownIcon = selected ? Check : Icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onToggle();
      }}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-pill border-[1.5px] px-4 py-2 text-sm font-semibold',
        'motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
        selected
          ? 'border-accent-ink bg-accent-soft text-accent-ink'
          : 'border-border bg-surface text-fg hover:bg-surface-sunk',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      )}
    >
      {ShownIcon && <ShownIcon aria-hidden="true" size={16} strokeWidth={1.75} />}
      {children}
    </button>
  );
}
