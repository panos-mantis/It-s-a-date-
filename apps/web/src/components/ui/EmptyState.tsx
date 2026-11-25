import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  title,
  body,
  action,
  icon: Icon,
  headingLevel = 2,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      {Icon && <Icon aria-hidden="true" size={40} strokeWidth={1.75} className="text-muted" />}
      <Heading className="font-display text-xl text-fg">{title}</Heading>
      {body && <p className="text-base text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
