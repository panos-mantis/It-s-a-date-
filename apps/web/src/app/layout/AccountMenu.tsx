import type { UserDTO } from '@itsadate/shared';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useToast } from '../../components/ui';
import { useLogout } from '../../features/auth/api';
import { paths } from '../paths';

const itemClasses =
  'block w-full rounded-sm px-3 py-2 text-left text-sm font-medium text-fg cursor-pointer hover:bg-surface-sunk ' +
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 disabled:opacity-60';

export function AccountMenu({ user }: { user: UserDTO }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const navigate = useNavigate();
  const toast = useToast();
  const logout = useLogout({ beforeClear: () => void navigate(paths.home) });
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const initial = (firstName[0] ?? '?').toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    try {
      // mutateAsync settles even if this component unmounts when the session clears.
      await logout.mutateAsync();
    } catch {
      toast.show("We couldn't log you out. Try again.", { tone: 'error' });
      return;
    }
    toast.show("You're logged out. See you soon.", { tone: 'success' });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border bg-surface py-1 pl-1 pr-2 text-sm font-medium text-fg motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly hover:bg-surface-sunk focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 sm:pr-3"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-pill bg-accent-soft text-sm font-semibold text-accent-ink"
        >
          {initial}
        </span>
        <span aria-hidden="true" className="hidden sm:inline">
          {firstName}
        </span>
        <ChevronDown aria-hidden="true" size={16} strokeWidth={1.75} className="text-muted" />
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-20 mt-2 flex w-48 flex-col gap-1 rounded-md border border-border bg-surface p-2 shadow-raised"
        >
          <Link to={paths.profile} className={itemClasses} onClick={() => setOpen(false)}>
            Profile
          </Link>
          {user.role === 'admin' && (
            <Link to={paths.admin} className={itemClasses} onClick={() => setOpen(false)}>
              Admin
            </Link>
          )}
          <button type="button" className={itemClasses} onClick={() => void handleLogout()}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
