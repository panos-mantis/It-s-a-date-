import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { useFocusTrap } from '../../lib/use-focus-trap';

type Variant = 'sheet' | 'panel' | 'alert';

const layout: Record<Variant, string> = {
  sheet: 'items-stretch justify-stretch',
  panel: 'items-stretch justify-end',
  alert: 'items-center justify-center p-4',
};

const surface: Record<Variant, string> = {
  // Full screen (the phone search sheet).
  sheet: 'flex h-dvh w-full flex-col overflow-hidden',
  // 560px on the right, full screen under 640px (Admin Edit).
  panel:
    'flex h-dvh w-full flex-col overflow-y-auto sm:w-[560px] sm:border-l sm:border-border sm:shadow-raised',
  // A centred card (confirm dialogs).
  alert: 'w-full max-w-md rounded-lg border border-border p-6 shadow-raised',
};

/**
 * Open dialogs, bottom to top. Only the top one is live: every other child of `body` (the app,
 * the skip link, lower dialogs) is inert. The page's own state is saved when the first dialog
 * opens and restored when the last one closes, in whatever order they close.
 */
const stack: HTMLElement[] = [];
let saved: { inert: Set<Element>; overflow: string } | null = null;

function syncStack(): void {
  const top = stack[stack.length - 1];
  if (!top) {
    if (saved) {
      for (const el of Array.from(document.body.children)) {
        if (!saved.inert.has(el)) el.removeAttribute('inert');
      }
      document.body.style.overflow = saved.overflow;
      saved = null;
    }
    return;
  }
  saved ??= {
    inert: new Set(Array.from(document.body.children).filter((el) => el.hasAttribute('inert'))),
    overflow: document.body.style.overflow,
  };
  for (const el of Array.from(document.body.children)) {
    if (el === top) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }
  document.body.style.overflow = 'hidden';
}

function pushDialog(root: HTMLElement): () => void {
  stack.push(root);
  syncStack();
  return () => {
    const at = stack.indexOf(root);
    if (at !== -1) stack.splice(at, 1);
    syncStack();
  };
}

/**
 * A modal dialog portalled to `body`. Focus is trapped inside, starts on `initialFocus` (else the
 * first focusable element) and returns to the opener on close. Escape closes it, and everything
 * else on the page is inert while it is open.
 */
export function Dialog({
  open,
  onClose,
  labelledBy,
  variant,
  initialFocus,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  variant: Variant;
  initialFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    return pushDialog(root);
  }, [open]);

  useFocusTrap(dialogRef, { active: open, initialFocus });

  if (!open) return null;

  // Handled on the dialog itself, before the toast's document listener, and marked handled so one
  // Escape closes only this dialog (not a toast, nor a dialog underneath).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    onClose();
  };

  return createPortal(
    <div
      ref={rootRef}
      data-dialog-root=""
      className={cn('fixed inset-0 z-40 flex', layout[variant])}
    >
      {/* A click on the scrim must not move focus to body, where Escape and Tab can't reach the dialog. */}
      <div
        aria-hidden="true"
        data-dialog-scrim=""
        onMouseDown={(e) => e.preventDefault()}
        className="absolute inset-0 bg-scrim"
      />
      <div
        ref={dialogRef}
        role={variant === 'alert' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn('relative bg-surface text-fg focus:outline-none', surface[variant])}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
