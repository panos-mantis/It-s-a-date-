import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';

export function CategoryRow({
  items,
  active,
  onSelect,
  label,
}: {
  items: { value: string; label: string; icon: LucideIcon }[];
  active: string;
  onSelect: (value: string) => void;
  label?: string;
}) {
  const stripRef = useRef<HTMLElement>(null);
  const activeIndex = items.findIndex((item) => item.value === active);

  // The chosen item scrolls into view inside the strip; the page itself never scrolls.
  useEffect(() => {
    const strip = stripRef.current;
    const button = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!strip || !button || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollLeft = button.offsetLeft - strip.clientWidth / 2 + button.offsetWidth / 2;
  }, [activeIndex, items.length]);

  return (
    <nav
      ref={stripRef}
      aria-label={label ?? 'Categories'}
      className="-mx-4 overflow-x-auto [scrollbar-width:none] sm:-mx-7 md:mx-0 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="m-0 flex w-max list-none gap-7 px-4 py-1 sm:px-7 md:mx-auto md:gap-12 md:px-1">
        {items.map(({ value, label: text, icon: Icon }) => {
          const isActive = value === active;
          return (
            <li key={value} className="shrink-0">
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelect(value)}
                className={cn(
                  'flex min-w-12 cursor-pointer flex-col items-center gap-2 whitespace-nowrap rounded-t-sm border-b-2 px-1 pb-2.5 pt-1.5 text-xs font-medium motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-friendly',
                  isActive ? 'border-fg text-fg' : 'border-transparent text-muted hover:text-fg',
                )}
              >
                <Icon aria-hidden="true" size={26} strokeWidth={1.75} />
                {text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
