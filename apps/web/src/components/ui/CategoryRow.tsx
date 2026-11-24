import type { LucideIcon } from 'lucide-react';
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
  return (
    <nav aria-label={label ?? 'Categories'} className="overflow-x-auto">
      <ul className="m-0 flex w-max list-none gap-12 p-0 md:mx-auto">
        {items.map(({ value, label: text, icon: Icon }) => {
          const isActive = value === active;
          return (
            <li key={value} className="shrink-0">
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelect(value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-sm border-b-2 px-1 pb-2 pt-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-friendly',
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
