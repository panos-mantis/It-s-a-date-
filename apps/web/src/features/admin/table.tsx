import type { IdeaDTO } from '@itsadate/shared';
import { ImageOff, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Skeleton } from '../../components/ui';
import { cn } from '../../lib/cn';
import { ideaMeta, PLACE_TYPE_LABELS } from '../../lib/labels';

// Admin tables (HANDOFF Admin, DESIGN.md "Admin panels and tables"): a surface panel with a 20px
// radius and 1px border, rows split by hairlines. A container query turns each row into a stacked
// card when the table is under 720px wide, so nothing scrolls sideways at 360px.

export const tableWrap = '@container overflow-hidden rounded-lg border border-border bg-surface';
export const tableClass = 'w-full border-collapse text-sm @max-[719px]:block';
export const theadClass = '@max-[719px]:hidden';
export const thClass =
  'whitespace-nowrap border-b border-border px-4 py-3 text-left text-xs font-semibold text-muted';
export const tbodyClass = '@max-[719px]:block';
/** Each table adds its card layout (direction, gaps) on top. */
export const trClass = 'border-b border-border last:border-b-0 @max-[719px]:flex @max-[719px]:p-4';
export const tdClass = 'px-4 py-3 align-middle @max-[719px]:block @max-[719px]:p-0';
/** The actions cell: as narrow as its buttons on the table. */
export const actionsTdClass = cn(tdClass, 'w-px @max-[719px]:w-auto');

/** A cell's label that only shows on the stacked card ("By", "Submitted"). */
export function CardLabel({ children }: { children: ReactNode }) {
  return <span className="hidden text-muted @max-[719px]:inline">{children} </span>;
}

/** The 4:3 thumbnail. The title sits next to it, so the photo is decorative. */
export function IdeaThumb({ idea, className }: { idea: IdeaDTO; className?: string }) {
  const base = cn(
    'grid aspect-[4/3] w-[72px] shrink-0 place-items-center overflow-hidden rounded-sm bg-surface-sunk text-muted @max-[719px]:w-[88px]',
    className,
  );
  if (!idea.image) {
    return (
      <span role="img" aria-label="No photo yet" className={base}>
        <ImageOff aria-hidden="true" size={20} strokeWidth={1.75} />
      </span>
    );
  }
  return (
    <span className={base}>
      <img
        src={idea.image.url}
        alt=""
        width={800}
        height={600}
        loading="lazy"
        className="size-full object-cover"
      />
    </span>
  );
}

/** "Cafe · $ · 1–2 hours"; a migrated idea with neither shows a warning instead. */
export function IdeaMetaLine({ idea }: { idea: IdeaDTO }) {
  const meta = ideaMeta(idea);
  return (
    <span className="text-[13px] text-muted">
      {PLACE_TYPE_LABELS[idea.placeType]} ·{' '}
      {meta ?? (
        <span className="inline-flex items-center gap-1 font-medium text-warn">
          <TriangleAlert aria-hidden="true" size={14} strokeWidth={1.75} />
          No budget or duration yet
        </span>
      )}
    </span>
  );
}

export const rowTitleClass =
  'block cursor-pointer rounded-[4px] text-left font-display font-soft text-[17px] font-semibold leading-[1.25] tracking-[-0.01em] text-fg [overflow-wrap:anywhere] hover:underline hover:decoration-1 hover:underline-offset-[3px]';

/** A 44px text button for row actions. Approve is success, Reject danger, Edit plain. */
export const rowActionClass = 'min-h-11 @max-[719px]:flex-1';

/** Three skeleton rows in the row's shape: thumb, two lines, actions (dropped on phones). */
export function RowSkeletons({ actions = 3 }: { actions?: number }) {
  return (
    <div className={tableWrap} aria-hidden="true">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border p-4 last:border-b-0">
          <Skeleton className="aspect-[4/3] w-[72px] shrink-0 rounded-sm" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/5 rounded-sm" />
            <Skeleton className="h-3 w-2/5 rounded-sm" />
          </div>
          <div className="hidden gap-2 sm:flex">
            {Array.from({ length: actions }, (_, j) => (
              <Skeleton key={j} className="h-8 w-22 rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
