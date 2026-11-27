import type { IdeaDTO } from '@itsadate/shared';
import { ArrowUp, Check, CircleCheck, Pencil, WifiOff, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button, Chip, EmptyState, useToast } from '../../components/ui';
import { cn } from '../../lib/cn';
import { tagIcon } from '../../lib/tag-icons';
import { useShowMore } from '../../lib/use-show-more';
import { useAdminIdeas, useUpdateIdea } from './api';
import { ConfirmDialog } from './ConfirmDialog';
import { EditIdeaPanel } from './EditIdeaPanel';
import { relativeSubmitted } from './relative-date';
import {
  actionsTdClass,
  CardLabel,
  IdeaMetaLine,
  IdeaThumb,
  rowActionClass,
  RowSkeletons,
  rowTitleClass,
  tableClass,
  tableWrap,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from './table';

const SUB =
  'Oldest first. Approved ideas go live on Home; not approved ones stay visible to their author only.';

/** Where focus goes once a row has left (or come back): a row's Approve, or "See all ideas". */
type FocusTarget = { kind: 'row'; id: string } | { kind: 'empty' } | null;
interface After {
  focus: FocusTarget;
  /** Shown once focus has moved, so Escape on the toast returns there. */
  then?: () => void;
}

function PanelBar({ id, title }: { id: string; title: string }) {
  return (
    <div className="mb-4 flex min-w-0 flex-col gap-0.5">
      <h2 id={id} className="font-body text-base font-semibold leading-body text-fg">
        {title}
      </h2>
      <p className="text-sm text-muted">{SUB}</p>
    </div>
  );
}

export function PendingTab({ onSeeAll }: { onSeeAll: () => void }) {
  const ideas = useAdminIdeas('pending');
  const update = useUpdateIdea();
  const toast = useToast();
  const showMore = useShowMore(ideas, 'ideas');
  const headingId = useId();
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set());
  const [rejecting, setRejecting] = useState<IdeaDTO | null>(null);
  const [editing, setEditing] = useState<IdeaDTO | null>(null);
  const seeAllRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const afterRef = useRef<After | null>(null);
  const [afterTick, setAfterTick] = useState(0);
  // "Submitted" reads relative to when the tab opened.
  const [now] = useState(() => new Date());

  const items = useMemo(() => ideas.data?.pages.flatMap((p) => p.items) ?? [], [ideas.data]);
  const total = ideas.data?.pages[0]?.total ?? 0;
  const fetching = ideas.isFetching;

  // Moves focus once the rows reflect the change, then shows the follow-up toast.
  useEffect(() => {
    const after = afterRef.current;
    if (!after) return;
    const approveOf = (id: string) =>
      bodyRef.current?.querySelector<HTMLElement>(`[data-approve="${CSS.escape(id)}"]`) ?? null;
    let target: HTMLElement | null = null;
    if (after.focus?.kind === 'row') target = approveOf(after.focus.id);
    if (after.focus?.kind === 'empty' && items.length === 0) target = seeAllRef.current;
    // Still waiting for the rows to catch up.
    if (after.focus && !target && fetching) return;
    // The target never arrived: fall back to the first row, or the empty state.
    if (after.focus && !target) {
      target = bodyRef.current?.querySelector<HTMLElement>('[data-approve]') ?? seeAllRef.current;
    }
    afterRef.current = null;
    target?.focus();
    after.then?.();
  }, [afterTick, items, fetching]);

  const queueAfter = (after: After) => {
    afterRef.current = after;
    setAfterTick((n) => n + 1);
  };

  /** The row after this one, else the one before, else the empty state. */
  const nextFocus = (id: string): FocusTarget => {
    const at = items.findIndex((i) => i.id === id);
    const next = items[at + 1] ?? items[at - 1];
    return next ? { kind: 'row', id: next.id } : { kind: 'empty' };
  };

  const markBusy = (id: string, on: boolean) =>
    setBusy((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const undo = async (idea: IdeaDTO) => {
    try {
      await update.mutateAsync({ id: idea.id, input: { status: 'pending' } });
      queueAfter({
        focus: { kind: 'row', id: idea.id },
        then: () => toast.show('Back in the queue.'),
      });
    } catch {
      toast.show("We couldn't undo that. Try again.", { tone: 'error' });
    }
  };

  /** Sends the status; once the queue has refetched, focus moves on and the Undo toast shows. */
  const leave = async (idea: IdeaDTO, status: 'approved' | 'rejected') => {
    const focus = nextFocus(idea.id);
    await update.mutateAsync({ id: idea.id, input: { status } });
    queueAfter({
      focus,
      then: () =>
        toast.show(status === 'approved' ? 'Idea approved' : 'Idea marked as not approved.', {
          tone: 'success',
          action: { label: 'Undo', onAction: () => void undo(idea) },
        }),
    });
  };

  const approve = async (idea: IdeaDTO) => {
    markBusy(idea.id, true);
    try {
      await leave(idea, 'approved');
    } catch {
      toast.show("We couldn't approve that. Try again.", { tone: 'error' });
    } finally {
      markBusy(idea.id, false);
    }
  };

  const onSaved = (before: IdeaDTO, saved: IdeaDTO) => {
    if (saved.status !== 'pending') {
      queueAfter({
        focus: nextFocus(before.id),
        then: () =>
          toast.show(
            saved.status === 'approved' ? 'Changes saved. Idea approved' : 'Changes saved',
            { tone: 'success' },
          ),
      });
    } else {
      toast.show('Changes saved', { tone: 'success' });
    }
    setEditing(null);
  };

  const onDeleted = (idea: IdeaDTO) => {
    queueAfter({
      focus: nextFocus(idea.id),
      then: () => toast.show('Idea deleted', { tone: 'success' }),
    });
    setEditing(null);
  };

  let body;
  if (ideas.isPending) {
    body = (
      <section aria-labelledby={headingId} aria-busy="true">
        <PanelBar id={headingId} title="Ideas waiting for review" />
        <p role="status" className="mb-4 text-sm text-muted">
          Loading ideas waiting for review…
        </p>
        <RowSkeletons />
      </section>
    );
  } else if (ideas.isError && items.length === 0) {
    body = (
      <div role="alert" className="rounded-lg border border-border bg-surface">
        <EmptyState
          icon={WifiOff}
          title="We couldn't load the queue."
          body="Check your connection and try again."
          action={
            <Button busy={ideas.isFetching} onClick={() => void ideas.refetch()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <div className="mx-auto max-w-[448px] rounded-lg border border-border bg-surface">
        <EmptyState
          icon={CircleCheck}
          iconClassName="text-success"
          title="Nothing to review. Nice work."
          body="New ideas show up here as soon as someone shares one."
          action={
            <Button ref={seeAllRef} variant="secondary" onClick={onSeeAll}>
              See all ideas
            </Button>
          }
        />
      </div>
    );
  } else {
    body = (
      <section aria-labelledby={headingId}>
        <PanelBar
          id={headingId}
          title={`${total} ${total === 1 ? 'idea' : 'ideas'} waiting for review`}
        />
        <div className={tableWrap}>
          <table className={tableClass} aria-label="Ideas waiting for review, oldest first">
            <thead className={theadClass}>
              <tr>
                <th scope="col" className={thClass}>
                  Idea
                </th>
                <th scope="col" className={thClass}>
                  Creator
                </th>
                <th scope="col" className={thClass}>
                  Tags
                </th>
                <th scope="col" className={thClass}>
                  <span className="inline-flex items-center gap-1 text-fg">
                    Submitted
                    <ArrowUp aria-hidden="true" size={14} strokeWidth={1.75} />
                  </span>
                </th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody ref={bodyRef} className={tbodyClass}>
              {items.map((idea) => (
                <QueueRow
                  key={idea.id}
                  idea={idea}
                  now={now}
                  busy={busy.has(idea.id)}
                  onApprove={() => void approve(idea)}
                  onEdit={() => setEditing(idea)}
                  onReject={() => setRejecting(idea)}
                />
              ))}
            </tbody>
          </table>
        </div>
        {ideas.hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="secondary"
              busy={ideas.isFetchingNextPage}
              onClick={() => void showMore()}
            >
              Show more
            </Button>
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      {body}
      <ConfirmDialog
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title={`Reject "${rejecting?.title ?? ''}"?`}
        body="The author will see it as not approved. It stays off Home, and you can still change it from All ideas."
        confirmLabel="Reject idea"
        onConfirm={() => (rejecting ? leave(rejecting, 'rejected') : undefined)}
      />
      <EditIdeaPanel
        idea={editing}
        onClose={() => setEditing(null)}
        onSaved={onSaved}
        onDeleted={onDeleted}
      />
    </>
  );
}

function QueueRow({
  idea,
  now,
  busy,
  onApprove,
  onEdit,
  onReject,
}: {
  idea: IdeaDTO;
  now: Date;
  busy: boolean;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
}) {
  const titleId = useId();
  return (
    <tr className={cn(trClass, '@max-[719px]:flex-col @max-[719px]:gap-2')}>
      <td className={cn(tdClass, 'min-w-[260px] @min-[720px]:min-w-[320px] @max-[719px]:min-w-0')}>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 @max-[719px]:items-start">
          <IdeaThumb idea={idea} className="row-span-3 @max-[719px]:row-span-2" />
          <button
            id={titleId}
            type="button"
            aria-haspopup="dialog"
            onClick={onEdit}
            className={cn(rowTitleClass, 'col-start-2 self-end')}
          >
            {idea.title}
          </button>
          <span className="col-start-2 self-start">
            <IdeaMetaLine idea={idea} />
          </span>
          <p className="col-start-2 mt-0.5 line-clamp-2 max-w-[52ch] text-[13px] leading-[1.45] text-muted @max-[719px]:col-span-2 @max-[719px]:col-start-1 @max-[719px]:mt-2 @max-[719px]:max-w-none">
            {idea.description}
          </p>
        </div>
      </td>
      <td
        className={cn(
          tdClass,
          'min-w-[150px] max-w-[220px] [overflow-wrap:anywhere] @max-[719px]:min-w-0 @max-[719px]:max-w-none @max-[719px]:font-medium',
        )}
      >
        <CardLabel>By</CardLabel>
        {idea.creator.name}
      </td>
      <td className={cn(tdClass, 'min-w-[150px] @max-[719px]:min-w-0')}>
        <span className="flex flex-wrap gap-1.5">
          {idea.tags.map((t) => (
            <Chip key={t.id} icon={tagIcon(t.icon)}>
              {t.name}
            </Chip>
          ))}
        </span>
      </td>
      <td className={cn(tdClass, 'whitespace-nowrap text-muted')}>
        <CardLabel>Submitted</CardLabel>
        <time dateTime={idea.createdAt}>{relativeSubmitted(idea.createdAt, now)}</time>
      </td>
      {/* On the card: Approve, Edit and Reject share one row under a hairline. */}
      <td
        className={cn(
          actionsTdClass,
          '@max-[719px]:mt-1 @max-[719px]:border-t @max-[719px]:border-border @max-[719px]:pt-2',
        )}
      >
        <div className="flex items-center justify-end gap-1 @max-[719px]:justify-between">
          <Button
            variant="ghost"
            tone="success"
            size="sm"
            busy={busy}
            data-approve={idea.id}
            aria-describedby={titleId}
            onClick={onApprove}
            className={rowActionClass}
          >
            {!busy && <Check aria-hidden="true" size={16} strokeWidth={1.75} />}
            Approve
          </Button>
          <Button
            variant="ghost"
            tone="plain"
            size="sm"
            aria-haspopup="dialog"
            aria-describedby={titleId}
            onClick={onEdit}
            className={rowActionClass}
          >
            <Pencil aria-hidden="true" size={16} strokeWidth={1.75} />
            Edit
          </Button>
          <Button
            variant="ghost"
            tone="danger"
            size="sm"
            aria-haspopup="dialog"
            aria-describedby={titleId}
            onClick={onReject}
            className={rowActionClass}
          >
            <X aria-hidden="true" size={16} strokeWidth={1.75} />
            Reject
          </Button>
        </div>
      </td>
    </tr>
  );
}
