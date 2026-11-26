import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
].join(',');

/** Laid out on the page. jsdom has no layout, so it falls back to computed styles there. */
function isRendered(el: HTMLElement): boolean {
  if (el.getClientRects().length > 0) return true;
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (getComputedStyle(node).display === 'none') return false;
  }
  return getComputedStyle(el).visibility !== 'hidden';
}

/** The elements Tab can reach, in order. */
function tabStops(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0 && !el.closest('[hidden], [inert]') && isRendered(el),
  );
}

/**
 * While `active`, keeps Tab and Shift+Tab inside `containerRef`. Focus starts on `initialFocus`
 * (else the first tab stop, else the container) and goes back to whatever had it before when the
 * trap ends.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  { active, initialFocus }: { active: boolean; initialFocus?: RefObject<HTMLElement | null> },
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    (initialFocus?.current ?? tabStops(container)[0] ?? container).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const stops = tabStops(container);
      const first = stops[0];
      const last = stops[stops.length - 1];
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
      // After every cleanup in this commit, so stacked dialogs closing together have all
      // un-inerted the page first. Skipped if something else has already taken focus.
      queueMicrotask(() => {
        const now = document.activeElement;
        const lost = !now || now === document.body || container.contains(now);
        if (lost && opener?.isConnected) opener.focus();
      });
    };
  }, [active, containerRef, initialFocus]);
}
