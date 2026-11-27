import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function EmptyState({
  title,
  body,
  action,
  icon: Icon,
  eyebrow,
  headingLevel = 2,
  hero = false,
  iconClassName = 'text-muted',
}: {
  /** A string, or a short phrase with one italic word (`<em>`). */
  title: ReactNode;
  body?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  eyebrow?: string;
  headingLevel?: 1 | 2;
  /** The not-found page's large display heading; other states keep the EmptyState size. */
  hero?: boolean;
  /** Tone for the icon; a good-news empty state uses `text-success`. */
  iconClassName?: string;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const page = headingLevel === 1;
  const big = page && hero;
  return (
    <div
      className={cn(
        'mx-auto flex flex-col items-center gap-3 px-4 py-16 text-center',
        page && 'max-w-[560px] gap-4 pt-[72px] sm:py-24',
        !page && 'max-w-md',
        big && 'sm:min-h-[calc(100dvh-4.5rem)] sm:justify-center sm:pb-24 sm:pt-12',
      )}
    >
      {Icon && <Icon aria-hidden="true" size={40} strokeWidth={1.75} className={iconClassName} />}
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{eyebrow}</p>
      )}
      <Heading
        className={cn(
          'font-medium text-fg [overflow-wrap:anywhere] [&_em]:font-normal [&_em]:italic',
          big
            ? 'text-balance text-[38px] leading-tight tracking-display sm:text-4xl'
            : 'text-xl leading-[1.2] tracking-[-0.01em]',
        )}
      >
        {title}
      </Heading>
      {body && (
        <p
          className={cn(
            'text-muted [overflow-wrap:anywhere]',
            big ? 'max-w-[40ch] text-base sm:text-lg' : 'text-base',
          )}
        >
          {body}
        </p>
      )}
      {action && <div className={page ? 'mt-4' : 'mt-2'}>{action}</div>}
    </div>
  );
}
