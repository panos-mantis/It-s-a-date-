import { useId } from 'react';
import { cn } from '../../lib/cn';
import { TAG_ICON_NAMES } from '../../lib/tag-icons';
import { TagIcon } from './TagIcon';

/**
 * Picks a tag's icon from the curated set (R38): a radio group of 44px round buttons, each named
 * for its icon, with a preview of the pick. Native radios, so the arrow keys move the pick and
 * Tab leaves the group. `name` groups the radios, so two pickers on a page stay separate.
 */
export function IconPicker({
  name,
  value,
  onChange,
  label = 'Icon',
}: {
  name: string;
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}) {
  const helpId = useId();
  return (
    <fieldset aria-describedby={helpId} className="flex min-w-0 flex-col gap-2">
      <legend className="mb-1.5 text-sm font-semibold text-fg">{label}</legend>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p id={helpId} className="text-xs text-muted">
          Pick the icon people will see on the chip.
        </p>
        <span aria-hidden="true" className="flex items-center gap-2 text-xs text-muted">
          <span className="grid size-9 place-items-center rounded-pill bg-accent-soft text-accent-ink">
            <TagIcon name={value} />
          </span>
          <code>{value}</code>
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1">
        {TAG_ICON_NAMES.map((icon) => {
          return (
            <label key={icon} className="relative block">
              <input
                type="radio"
                name={name}
                value={icon}
                checked={value === icon}
                onChange={() => onChange(icon)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'grid h-11 w-full cursor-pointer place-items-center rounded-pill border-2',
                  'motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
                  'peer-focus-visible:ring-[3px] peer-focus-visible:ring-focus-ring',
                  value === icon
                    ? 'border-accent-ink bg-accent-soft text-accent-ink'
                    : 'border-border bg-surface text-fg hover:bg-surface-sunk',
                )}
              >
                <TagIcon name={icon} size={20} />
              </span>
              <span className="sr-only">{icon}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
