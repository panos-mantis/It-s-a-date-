import type { IdeaDTO, IdeaStatus } from '@itsadate/shared';
import { ArrowDown, ArrowUp, Pencil, Search, WifiOff } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { paths } from '../../app/paths';
import {
  Button,
  Chip,
  EmptyState,
  Input,
  SegmentedControl,
  StarRating,
  useToast,
} from '../../components/ui';
import { cn } from '../../lib/cn';
import { useAdminIdeas } from './api';
import { EditIdeaPanel } from './EditIdeaPanel';
import { formatDate } from './relative-date';
import { useDebounced } from './use-debounced';
import {
  actionsTdClass,
  CardLabel,
  IdeaMetaLine,
  IdeaThumb,
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

// One status per request (R32): there is no "all" filter, the tab is still "All ideas".
const STATUS_OPTIONS: { value: IdeaStatus; label: string }[] = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending review' },
  { value: 'rejected', label: 'Not approved' },
];
const STATUS_WORD: Record<IdeaStatus, string> = {
  approved: 'approved',
  pending: 'pending',
  rejected: 'not approved',
};
const SEARCH_DELAY_MS = 300;

/** Hidden on mid-width tables, shown again on the stacked cards. */
const midHidden = '@min-[720px]:@max-[959px]:hidden';

export function AllIdeasTab() {
  const [status, setStatus] = useState<IdeaStatus>('approved');
  const [text, setText] = useState('');
  const q = useDebounced(text, SEARCH_DELAY_MS).trim();
  const ideas = useAdminIdeas(status, q || undefined);
  const toast = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<IdeaDTO | null>(null);
  const [focusSearch, setFocusSearch] = useState(0);

  // A saved status change or a delete takes the row (and the button that opened Edit) out of
  // this list, so focus goes to the search box.
  useEffect(() => {
    if (focusSearch > 0) searchRef.current?.focus();
  }, [focusSearch]);

  const items = ideas.data?.pages.flatMap((p) => p.items) ?? [];
  const total = ideas.data?.pages[0]?.total ?? 0;
  const shownQ = q;
  const word = STATUS_WORD[status];
  const noun = (n: number) => `${word} ${n === 1 ? 'idea' : 'ideas'}`;

  const clear = () => {
    setText('');
    searchRef.current?.focus();
  };

  let body;
  if (ideas.isPending) {
    body = (
      <div aria-busy="true">
        <p role="status" className="mb-4 text-sm text-muted">
          Loading ideas…
        </p>
        <RowSkeletons actions={1} />
      </div>
    );
  } else if (ideas.isError && items.length === 0) {
    body = (
      <div role="alert" className="rounded-lg border border-border bg-surface">
        <EmptyState
          icon={WifiOff}
          title="We couldn't load the ideas."
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
      <div className="rounded-lg border border-border bg-surface">
        <EmptyState
          icon={Search}
          title={shownQ ? `No ideas match "${shownQ}".` : `No ${noun(0)}.`}
          body={
            shownQ
              ? 'Check the spelling, or clear the search to see every idea with this status.'
              : undefined
          }
          action={
            shownQ ? (
              <Button variant="secondary" onClick={clear}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  } else {
    const SortIcon = status === 'pending' ? ArrowUp : ArrowDown;
    body = (
      <>
        <div className={tableWrap}>
          <table className={tableClass} aria-label="Ideas by status">
            <thead className={theadClass}>
              <tr>
                <th scope="col" className={thClass}>
                  Idea
                </th>
                <th scope="col" className={thClass}>
                  Creator
                </th>
                <th scope="col" className={thClass}>
                  Status
                </th>
                <th scope="col" className={cn(thClass, 'text-right')}>
                  Rating
                </th>
                <th scope="col" className={cn(thClass, 'text-right', midHidden)}>
                  Saves
                </th>
                <th scope="col" className={cn(thClass, midHidden)}>
                  {/* The queue is oldest first; the other statuses newest first. */}
                  <span className="inline-flex items-center gap-1 text-fg">
                    {status === 'pending' ? 'Submitted' : 'Created'}
                    <SortIcon aria-hidden="true" size={14} strokeWidth={1.75} />
                  </span>
                </th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {items.map((idea) => (
                <AllRow key={idea.id} idea={idea} onEdit={() => setEditing(idea)} />
              ))}
            </tbody>
          </table>
        </div>
        {ideas.hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="secondary"
              busy={ideas.isFetchingNextPage}
              onClick={() => void ideas.fetchNextPage()}
            >
              Show more
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="w-full max-w-[360px]">
          <Input
            ref={searchRef}
            label="Search titles"
            type="search"
            icon={Search}
            placeholder="Pottery for two"
            autoComplete="off"
            maxLength={100}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <SegmentedControl
          legend="Status"
          name="all-status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />
      </div>
      {body}
      {/* Always mounted, so the count is announced as the filter or search changes. */}
      <p role="status" className="mt-3 text-sm text-muted">
        {ideas.isSuccess && items.length > 0
          ? `Showing ${items.length} of ${total} ${noun(total)}${shownQ ? ` matching "${shownQ}"` : ''}`
          : null}
      </p>
      <EditIdeaPanel
        idea={editing}
        onClose={() => setEditing(null)}
        onSaved={(before, saved) => {
          setEditing(null);
          toast.show('Changes saved', { tone: 'success' });
          if (saved.status !== before.status) setFocusSearch((n) => n + 1);
        }}
        onDeleted={() => {
          setEditing(null);
          toast.show('Idea deleted', { tone: 'success' });
          setFocusSearch((n) => n + 1);
        }}
      />
    </>
  );
}

function AllRow({ idea, onEdit }: { idea: IdeaDTO; onEdit: () => void }) {
  const titleId = useId();
  const approved = idea.status === 'approved';
  return (
    <tr
      className={cn(
        trClass,
        // Card: idea / by + status / rating · saves · created + Edit. The ::before is the line break.
        '@max-[719px]:flex-row @max-[719px]:flex-wrap @max-[719px]:items-center @max-[719px]:gap-y-2',
        "@max-[719px]:before:order-3 @max-[719px]:before:h-0 @max-[719px]:before:basis-full @max-[719px]:before:content-['']",
      )}
    >
      <td
        className={cn(
          tdClass,
          'min-w-[260px] @max-[959px]:min-w-[220px] @max-[719px]:order-0 @max-[719px]:basis-full',
        )}
      >
        <div className="flex items-center gap-3">
          <IdeaThumb idea={idea} />
          <span className="flex min-w-0 flex-col gap-0.5">
            {approved ? (
              <Link id={titleId} to={paths.idea(idea.id)} className={rowTitleClass}>
                {idea.title}
              </Link>
            ) : (
              <button
                id={titleId}
                type="button"
                aria-haspopup="dialog"
                onClick={onEdit}
                className={rowTitleClass}
              >
                {idea.title}
              </button>
            )}
            <IdeaMetaLine idea={idea} />
          </span>
        </div>
      </td>
      <td
        className={cn(
          tdClass,
          'min-w-[150px] max-w-[220px] [overflow-wrap:anywhere] @max-[719px]:min-w-0 @max-[719px]:max-w-none @max-[719px]:order-1 @max-[719px]:flex-1 @max-[719px]:pr-2 @max-[719px]:font-medium',
        )}
      >
        <CardLabel>By</CardLabel>
        {idea.creator.name}
      </td>
      <td className={cn(tdClass, '@max-[719px]:order-2 @max-[719px]:flex-none')}>
        <Chip variant="status" status={idea.status} />
      </td>
      <td
        className={cn(
          tdClass,
          'whitespace-nowrap text-right tabular-nums @max-[719px]:order-4 @max-[719px]:text-left @max-[719px]:text-[13px]',
        )}
      >
        {!approved ? (
          <span className="text-muted">Not public</span>
        ) : idea.ratingCount > 0 ? (
          <StarRating value={idea.ratingAvg} count={idea.ratingCount} />
        ) : (
          <span className="text-muted">No ratings yet</span>
        )}
      </td>
      <td
        className={cn(
          tdClass,
          midHidden,
          'whitespace-nowrap text-right tabular-nums @max-[719px]:order-5 @max-[719px]:text-left @max-[719px]:text-[13px] @max-[719px]:text-muted',
        )}
      >
        <span aria-hidden="true" className="hidden @max-[719px]:inline">
          {' · '}
        </span>
        {idea.saveCount}
        <span className="hidden @max-[719px]:inline"> saves</span>
      </td>
      <td
        className={cn(
          tdClass,
          midHidden,
          'whitespace-nowrap text-muted @max-[719px]:order-6 @max-[719px]:text-[13px]',
        )}
      >
        <span aria-hidden="true" className="hidden @max-[719px]:inline">
          {' · '}
        </span>
        <time dateTime={idea.createdAt}>{formatDate(idea.createdAt)}</time>
      </td>
      <td className={cn(actionsTdClass, '@max-[719px]:order-7 @max-[719px]:ml-auto')}>
        <div className="flex justify-end">
          <Button
            variant="ghost"
            tone="plain"
            size="sm"
            aria-haspopup="dialog"
            aria-describedby={titleId}
            onClick={onEdit}
            className="min-h-11"
          >
            <Pencil aria-hidden="true" size={16} strokeWidth={1.75} />
            Edit
          </Button>
        </div>
      </td>
    </tr>
  );
}
