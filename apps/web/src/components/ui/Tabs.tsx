import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { cn } from '../../lib/cn';

export interface TabItem {
  /** Also the URL hash that selects the tab (`#pending`). */
  id: string;
  label: ReactNode;
  panel: ReactNode;
}

/** The DOM id of a tab's button, for focusing it from outside. Panels use `${id}-panel`. */
export const tabDomId = (id: string) => `${id}-tab`;
const panelDomId = (id: string) => `${id}-panel`;

/**
 * A real tablist: roving tabindex, Left / Right / Home / End (selection follows focus). The URL
 * hash picks the tab, so a link can open one; picking a tab replaces the hash rather than adding
 * a history entry. On phones the list scrolls inside itself. Only the selected panel renders its
 * content; the others stay in the DOM, hidden, so `aria-controls` always resolves.
 */
export function Tabs({ label, tabs }: { label: string; tabs: TabItem[] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const fromHash = decodeURIComponent(location.hash.slice(1));
  const current = tabs.find((t) => t.id === fromHash)?.id ?? tabs[0]?.id;

  const select = (id: string) => {
    if (id === current) return;
    // Panel ids differ from the hash, so ScrollRestoration has no element to jump to.
    void navigate(
      { pathname: location.pathname, search: location.search, hash: id },
      { replace: true, preventScrollReset: true },
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const next =
      e.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : e.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    select(tab.id);
    buttons.current.get(tab.id)?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-5 overflow-x-auto border-b border-border [scrollbar-width:none] sm:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t, i) => {
          const selected = t.id === current;
          return (
            <button
              key={t.id}
              ref={(el) => {
                if (el) buttons.current.set(t.id, el);
                else buttons.current.delete(t.id);
              }}
              id={tabDomId(t.id)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelDomId(t.id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                '-mb-px inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-0.5 text-[15px] sm:text-base',
                'rounded-t-sm focus-visible:outline-offset-[-2px]',
                'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-friendly',
                selected
                  ? 'border-fg font-semibold text-fg'
                  : 'border-transparent font-medium text-muted hover:text-fg',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => {
        const selected = t.id === current;
        return (
          <div
            key={t.id}
            id={panelDomId(t.id)}
            role="tabpanel"
            aria-labelledby={tabDomId(t.id)}
            tabIndex={0}
            hidden={!selected}
            className="scroll-mt-24 rounded-sm pb-16 pt-6 focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-accent-ink"
          >
            {selected ? t.panel : null}
          </div>
        );
      })}
    </div>
  );
}
