import type { Role } from '@itsadate/shared';
import { useMutationState } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router';
import { Button, buttonClasses, EmptyState, Skeleton } from '../components/ui';
import { useMe } from '../features/auth/api';
import { safeNext } from '../features/auth/safe-next';
import { paths } from './paths';

function GuardSkeleton() {
  return (
    <div className="flex justify-center py-16" role="status" aria-label="Loading">
      <Skeleton className="h-10 w-48" />
    </div>
  );
}

function GuardError({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      headingLevel={1}
      title="We couldn't check your account."
      body="Check your connection and try again."
      action={<Button onClick={onRetry}>Try again</Button>}
    />
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const me = useMe();
  const { pathname, search } = useLocation();
  // A logout that ran while this guard was mounted is sending the user home; don't bounce to /login.
  const [mountedAt] = useState(() => Date.now());
  const logoutStates = useMutationState({
    filters: { mutationKey: ['auth', 'logout'] },
    select: (m) => ({
      pending: m.state.status === 'pending',
      done: m.state.status === 'success' && m.state.submittedAt >= mountedAt,
    }),
  });
  const loggingOut = {
    pending: logoutStates.some((s) => s.pending),
    done: logoutStates.some((s) => s.done),
  };

  // A failed background refetch keeps the last good data; only judge the error when there is none.
  if (me.data === undefined) {
    if (me.isPending) return <GuardSkeleton />;
    if (me.isError) return <GuardError onRetry={() => void me.refetch()} />;
  }
  if (!me.data && loggingOut.pending) return <GuardSkeleton />;
  // Logout finished: send the user home even if the caller didn't navigate.
  if (!me.data && loggingOut.done) return <Navigate to={paths.home} replace />;
  if (!me.data) {
    return <Navigate to={`${paths.login}?next=${encodeURIComponent(pathname + search)}`} replace />;
  }
  return <>{children}</>;
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const me = useMe();
  return (
    <RequireAuth>
      {me.data && me.data.role !== role ? (
        <EmptyState
          headingLevel={1}
          title="This page is for admins."
          action={
            <Link to={paths.home} className={buttonClasses({ variant: 'secondary' })}>
              Go home
            </Link>
          }
        />
      ) : (
        children
      )}
    </RequireAuth>
  );
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const [params] = useSearchParams();
  const me = useMe();
  if (me.data === undefined) {
    if (me.isPending) return <GuardSkeleton />;
    if (me.isError) return <GuardError onRetry={() => void me.refetch()} />;
  }
  if (me.data) return <Navigate to={safeNext(params.get('next'))} replace />;
  return <>{children}</>;
}
