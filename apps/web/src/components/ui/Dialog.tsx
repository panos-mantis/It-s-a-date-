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

/** Marks the page behind a dialog inert; nested dialogs also make the dialogs under them inert. */
function makeBackgroundInert(own: HTMLElement): () => void {
  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('header, main, [data-dialog-root]'),
  ).filter((el) => el !== own && !own.contains(el) && !el.contains(own));
  const before = targets.map((el) => el.hasAttribute('inert'));
  targets.forEach((el) => el.setAttribute('inert', ''));
  const overflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => {
    targets.forEach((el, i) => {
      if (!before[i]) el.removeAttribute('inert');
    });
    document.body.style.overflow = overflow;
  };
}

/**
 * A modal dialog portalled to `body`. Focus is trapped inside, starts on `initialFocus` (else the
 * first focusable element) and returns to the opener on close. Escape closes it, and the header
 * and `<main>` are inert while it is open.
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

  // Declared before the focus trap so the page is un-inerted before focus goes back to the opener.
  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    return makeBackgroundInert(root);
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
      <div aria-hidden="true" className="absolute inset-0 bg-scrim" />
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
