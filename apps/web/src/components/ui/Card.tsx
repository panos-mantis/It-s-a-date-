import { ImageOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Chip } from './Chip';
import { StarRating } from './StarRating';

export function Card({
  href,
  title,
  image,
  rating,
  meta,
  chip,
  badge,
  status,
  action,
  titleId,
  statusAction,
}: {
  href?: string;
  title: string;
  image: { src: string; alt: string } | null;
  rating?: { value: number; count: number };
  meta?: string | null;
  chip?: ReactNode;
  badge?: string;
  status?: { tone: 'pending' | 'approved' | 'rejected'; line: string };
  action?: ReactNode;
  /** Id for the title, so a link in the card can describe itself by it. */
  titleId?: string;
  /** A link under the status line, above the card's own link layer. */
  statusAction?: ReactNode;
}) {
  return (
    <article className="group relative isolate flex flex-col gap-3">
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
        {(status || badge) && (
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {status && <Chip variant="status" status={status.tone} />}
            {badge && (
              <span className="rounded-pill bg-overlay px-3 py-1 text-xs font-semibold text-fg shadow-raised">
                {badge}
              </span>
            )}
          </div>
        )}
      </div>
      {action && <div className="absolute right-3 top-3 z-10">{action}</div>}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h3
            id={titleId}
            className="line-clamp-2 font-display text-xl font-semibold leading-[1.2] tracking-[-0.01em] text-fg"
          >
            {href ? (
              <Link to={href} className="rounded-sm after:absolute after:inset-0">
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>
          {rating && rating.count > 0 && (
            <StarRating
              value={rating.value}
              count={rating.count}
              format="card"
              className="shrink-0 pt-1"
            />
          )}
        </div>
        {meta && <p className="text-sm text-muted">{meta}</p>}
        {status && (
          <p
            className={
              status.tone === 'approved'
                ? 'text-sm text-success'
                : status.tone === 'rejected'
                  ? 'text-sm text-danger'
                  : 'text-sm text-warn'
            }
          >
            {status.line}
          </p>
        )}
        {statusAction && <div className="relative z-10 flex">{statusAction}</div>}
        {chip && <div className="mt-1 flex flex-wrap gap-2">{chip}</div>}
      </div>
    </article>
  );
}
