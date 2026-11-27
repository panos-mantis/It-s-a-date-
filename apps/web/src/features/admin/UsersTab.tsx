import type { UserDTO } from '@itsadate/shared';
import { CircleAlert, Search, ShieldOff, UserPlus, Users, WifiOff } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import { Button, Chip, EmptyState, Input, useToast } from '../../components/ui';
import { ApiError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { useMe } from '../auth/api';
import { useAdminUsers, useSetRole } from './api';
import { ConfirmDialog } from './ConfirmDialog';
import {
  actionsTdClass,
  CardLabel,
  ListSkeleton,
  tableClass,
  tableWrap,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from './table';
import { useDebounced } from './use-debounced';

const SEARCH_DELAY_MS = 300;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** What the confirm dialog says: you, someone else, or making an admin. */
function confirmCopy(user: UserDTO, you: boolean) {
  if (user.role === 'admin') {
    return {
      title: you ? 'Remove your own admin access?' : `Remove admin from ${user.name}?`,
      body: you
        ? 'You’ll lose this page as soon as it’s done, and only another admin can give it back.'
        : `${user.name} keeps their account and ideas but loses this page.`,
      confirmLabel: 'Remove admin',
    };
  }
  return {
    title: `Make ${user.name} an admin?`,
    body: 'Admins can review ideas and manage tags and users.',
    confirmLabel: 'Make admin',
  };
}

/** Admin Users (HANDOFF §1): search, role chip, Make admin / Remove admin (asks first). */
export function UsersTab() {
  const me = useMe();
  const toast = useToast();
  const setRole = useSetRole();
  const [text, setText] = useState('');
  const q = useDebounced(text, SEARCH_DELAY_MS).trim();
  const users = useAdminUsers(q || undefined);
  const searchRef = useRef<HTMLInputElement>(null);
  const [asking, setAsking] = useState<UserDTO | null>(null);
  const [lastAdmin, setLastAdmin] = useState(false);

  const items = useMemo(() => users.data?.pages.flatMap((p) => p.items) ?? [], [users.data]);
  const total = users.data?.pages[0]?.total ?? 0;
  const myId = me.data?.id;
  const admins = items.filter((u) => u.role === 'admin').length;

  const confirm = async (user: UserDTO) => {
    setLastAdmin(false);
    const next = user.role === 'admin' ? 'user' : 'admin';
    const you = user.id === myId;
    try {
      await setRole.mutateAsync({ id: user.id, role: next });
    } catch (err) {
      // The API keeps one admin. Say so above the table; the role stays, focus returns to the button.
      if (err instanceof ApiError && err.status === 409) {
        setLastAdmin(true);
        return;
      }
      throw err;
    }
    toast.show(
      next === 'admin'
        ? `${user.name} is now an admin.`
        : you
          ? 'You’re no longer an admin.'
          : `Admin removed from ${user.name}.`,
      { tone: 'success' },
    );
  };

  const clear = () => {
    setText('');
    setLastAdmin(false);
    searchRef.current?.focus();
  };

  let body;
  if (users.isPending) {
    body = (
      <div aria-busy="true">
        <p role="status" className="mb-4 text-sm text-muted">
          Loading people…
        </p>
        <ListSkeleton actions={1} />
      </div>
    );
  } else if (users.isError && items.length === 0) {
    body = (
      <div role="alert" className="rounded-lg border border-border bg-surface">
        <EmptyState
          icon={WifiOff}
          title="We couldn't load the people."
          body="Check your connection and try again."
          action={
            <Button busy={users.isFetching} onClick={() => void users.refetch()}>
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
          icon={q ? Search : Users}
          title={q ? `No people match "${q}".` : 'No people yet.'}
          body={q ? 'Check the spelling, or clear the search to see everyone.' : undefined}
          action={
            q ? (
              <Button variant="secondary" onClick={clear}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  } else {
    body = (
      <>
        <div className={tableWrap}>
          <table className={tableClass} aria-label="Users, newest first">
            <thead className={theadClass}>
              <tr>
                <th scope="col" className={thClass}>
                  Name
                </th>
                <th scope="col" className={thClass}>
                  Email
                </th>
                <th scope="col" className={thClass}>
                  Role
                </th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {items.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  you={user.id === myId}
                  busy={setRole.isPending && setRole.variables?.id === user.id}
                  onAsk={() => setAsking(user)}
                />
              ))}
            </tbody>
          </table>
        </div>
        {users.hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="secondary"
              busy={users.isFetchingNextPage}
              onClick={() => void users.fetchNextPage()}
            >
              Show more
            </Button>
          </div>
        )}
      </>
    );
  }

  let summary: string | null = null;
  if (users.isSuccess && items.length > 0) {
    if (q) summary = `${plural(total, 'user matches', 'users match')} "${q}"`;
    else if (users.hasNextPage) summary = `Showing ${items.length} of ${total} users.`;
    else
      summary = `${plural(total, 'user', 'users')}, ${plural(admins, 'admin', 'admins')}. Admins can review ideas and manage tags and users.`;
  }

  const copy = asking ? confirmCopy(asking, asking.id === myId) : null;
  return (
    <>
      <div className="mb-4 w-full max-w-[360px]">
        <Input
          ref={searchRef}
          label="Search by name or email"
          type="search"
          icon={Search}
          placeholder="Maya"
          autoComplete="off"
          maxLength={100}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setLastAdmin(false);
          }}
        />
      </div>
      {/* Always mounted, so the message is announced when it appears. */}
      <div role="alert" className={cn(lastAdmin && 'mb-4')}>
        {lastAdmin && (
          <p className="flex items-start gap-2.5 rounded-sm border border-danger bg-surface px-3.5 py-3 text-sm text-danger">
            <CircleAlert
              aria-hidden="true"
              size={18}
              strokeWidth={1.75}
              className="mt-px shrink-0"
            />
            <span>
              <strong className="font-semibold">You can&apos;t remove the last admin.</strong> Make
              someone else an admin first, then try again.
            </span>
          </p>
        )}
      </div>
      {body}
      {/* Always mounted, so the count is announced as the search changes. */}
      <p role="status" className="mt-3 text-sm text-muted">
        {summary}
      </p>
      <ConfirmDialog
        open={asking !== null}
        onClose={() => setAsking(null)}
        title={copy?.title ?? ''}
        body={copy?.body ?? ''}
        confirmLabel={copy?.confirmLabel ?? ''}
        onConfirm={() => (asking ? confirm(asking) : undefined)}
      />
    </>
  );
}

function UserRow({
  user,
  you,
  busy,
  onAsk,
}: {
  user: UserDTO;
  you: boolean;
  busy: boolean;
  onAsk: () => void;
}) {
  const nameId = useId();
  const admin = user.role === 'admin';
  const Icon = admin ? ShieldOff : UserPlus;
  return (
    <tr
      className={cn(
        trClass,
        '@max-[719px]:flex-wrap @max-[719px]:items-center @max-[719px]:gap-x-3 @max-[719px]:gap-y-1',
      )}
    >
      <td className={cn(tdClass, '@max-[719px]:basis-full')}>
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-pill bg-accent-soft text-sm font-semibold text-accent-ink"
          >
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span id={nameId} className="font-semibold text-fg [overflow-wrap:anywhere]">
            <span>{user.name}</span>
            {you && <span className="ml-1 font-normal text-muted">(you)</span>}
          </span>
        </span>
      </td>
      <td className={cn(tdClass, 'text-muted [overflow-wrap:anywhere] @max-[719px]:basis-full')}>
        <CardLabel>Email</CardLabel>
        {user.email}
      </td>
      <td className={cn(tdClass, '@max-[719px]:flex-1')}>
        <Chip variant="role" userRole={user.role} />
      </td>
      <td className={cn(actionsTdClass, '@max-[719px]:ml-auto')}>
        <div className="flex justify-end">
          <Button
            variant="ghost"
            tone={admin ? 'danger' : 'plain'}
            size="sm"
            busy={busy}
            aria-haspopup="dialog"
            aria-describedby={nameId}
            onClick={onAsk}
          >
            <Icon aria-hidden="true" size={16} strokeWidth={1.75} />
            {admin ? 'Remove admin' : 'Make admin'}
          </Button>
        </div>
      </td>
    </tr>
  );
}
