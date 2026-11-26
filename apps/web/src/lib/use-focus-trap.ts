import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest('[hidden], [inert]'),
  );
}

/**
 * While `active`, keeps Tab and Shift+Tab inside `containerRef`. Focus starts on `initialFocus`
 * (else the first focusable element, else the container) and goes back to whatever had it before
 * when the trap ends.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  { active, initialFocus }: { active: boolean; initialFocus?: RefObject<HTMLElement | null> },
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    (initialFocus?.current ?? focusables(container)[0] ?? container).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables(container);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        e.preventDefault();
        container.focus();
        return;
      }
      const current = document.activeElement;
      const outside = !(current instanceof Node) || !container.contains(current);
      if (e.shiftKey && (current === first || current === container || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      if (opener?.isConnected) opener.focus();
    };
  }, [active, containerRef, initialFocus]);
}
