import { ImageOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { StarRating } from './StarRating';

export function Card({
  href,
  title,
  image,
  rating,
  meta,
  chip,
  badge,
  action,
}: {
  href: string;
  title: string;
  image: { src: string; alt: string } | null;
  rating?: { value: number; count: number };
  meta?: string;
  chip?: ReactNode;
  badge?: string;
  action?: ReactNode;
}) {
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
        {image ? (
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            className="size-full object-cover motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-friendly motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-surface-sunk">
            <ImageOff aria-hidden="true" size={32} strokeWidth={1.75} className="text-muted" />
          </div>
        )}
        {badge && (
          <span className="absolute left-3 top-3 rounded-pill bg-overlay px-3 py-1 text-xs font-semibold text-fg shadow-raised">
            {badge}
          </span>
        )}
      </div>
      {action && <div className="absolute right-3 top-3 z-10">{action}</div>}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold leading-[1.2] tracking-[-0.01em] text-fg">
            <Link
              to={href}
              className="rounded-sm after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30"
            >
              {title}
            </Link>
          </h3>
          {rating && (
            <StarRating value={rating.value} count={rating.count} className="shrink-0 pt-1" />
          )}
        </div>
        {meta && <p className="text-sm text-muted">{meta}</p>}
        {chip && <div className="mt-1 flex">{chip}</div>}
      </div>
    </article>
  );
}
