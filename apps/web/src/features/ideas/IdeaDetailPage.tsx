import type { IdeaDTO } from '@itsadate/shared';
import { ArrowLeft, Compass, ImageOff, WifiOff } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { paths } from '../../app/paths';
import {
  Button,
  buttonClasses,
  Chip,
  Container,
  EmptyState,
  Skeleton,
  StarRating,
} from '../../components/ui';
import type { ApiError } from '../../lib/api';
import { ideaMeta } from '../../lib/labels';
import { tagIcon } from '../../lib/tag-icons';
import { useIdea } from './api';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** A wrong, removed, pending or rejected idea (404), or an id the API cannot parse. */
function isNotFound(error: ApiError): boolean {
  if (error.status === 404) return true;
  const { issues } = error;
  return error.status === 422 && issues.length > 0 && issues.every((i) => i.location === 'params');
}

const layout =
  'grid gap-6 pb-12 pt-2 min-[900px]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] min-[900px]:gap-12';

function BackLink() {
  return (
    <Container className="pt-4">
      <Link to={paths.home} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
        <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.75} />
        All ideas
      </Link>
    </Container>
  );
}

function DetailSkeleton() {
  return (
    <>
      <BackLink />
      <Container className={layout}>
        <div role="status" aria-busy="true">
          <span className="sr-only">Loading idea…</span>
          <Skeleton className="aspect-[3/2] w-full rounded-lg sm:aspect-[4/3]" />
        </div>
        <div aria-hidden="true" className="flex flex-col gap-4">
          <Skeleton className="h-6 w-24 rounded-pill" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Container>
    </>
  );
}

function Detail({ idea }: { idea: IdeaDTO }) {
  const meta = ideaMeta(idea);
  const paragraphs = idea.description.split(/\n+/).filter((p) => p.trim() !== '');
  return (
    <>
      <title>{`${idea.title} · It's a Date`}</title>
      <BackLink />
      <Container>
        <article aria-labelledby="idea-title" className={`${layout} min-[900px]:items-start`}>
          <div className="min-[900px]:sticky min-[900px]:top-[88px]">
            <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-surface-sunk sm:aspect-[4/3]">
              {idea.image ? (
                <img
                  src={idea.image.url}
                  alt={idea.title}
                  width={800}
                  height={600}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <ImageOff
                    aria-hidden="true"
                    size={40}
                    strokeWidth={1.75}
                    className="text-muted"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            {idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag) => (
                  <Chip key={tag.id} icon={tagIcon(tag.icon)}>
                    {tag.name}
                  </Chip>
                ))}
              </div>
            )}
            <h1
              id="idea-title"
              className="text-balance text-[30px] font-medium leading-[1.08] tracking-[-0.025em] text-fg [overflow-wrap:anywhere] sm:text-[38px]"
            >
              {idea.title}
            </h1>
            <div className="flex flex-col gap-2">
              {meta && <p className="text-sm text-muted">{meta}</p>}
              <StarRating value={idea.ratingAvg} count={idea.ratingCount} format="detail" />
            </div>
            <div className="flex min-w-0 items-center gap-2.5 text-sm">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-pill bg-accent-soft text-sm font-semibold text-accent-ink"
              >
                {Array.from(idea.creator.name.trim())[0]?.toUpperCase()}
              </span>
              <p className="min-w-0 [overflow-wrap:anywhere]">
                Shared by <span className="font-semibold">{idea.creator.name}</span>{' '}
                <span className="text-muted">· {dateFormat.format(new Date(idea.createdAt))}</span>
              </p>
            </div>

            <hr className="my-2 w-full border-0 border-t border-border" />

            <section
              aria-labelledby="about-title"
              className="flex max-w-[65ch] flex-col gap-4 [overflow-wrap:anywhere]"
            >
              <h2
                id="about-title"
                className="text-2xl font-medium leading-tight tracking-[-0.01em]"
              >
                About this date
              </h2>
              {paragraphs.map((text, i) => (
                <p key={i} className="leading-[1.55]">
                  {text}
                </p>
              ))}
            </section>
          </div>
        </article>
      </Container>
    </>
  );
}

export function IdeaDetailPage() {
  const { id = '' } = useParams();
  const query = useIdea(id);

  if (query.isPending) return <DetailSkeleton />;

  if (query.isError) {
    if (isNotFound(query.error)) {
      return (
        <>
          <title>{"Idea not found · It's a Date"}</title>
          <EmptyState
            headingLevel={1}
            icon={Compass}
            title="We couldn't find that idea."
            body="It may have been removed, or it isn't public yet."
            action={
              <Link to={paths.home} className={buttonClasses()}>
                Back to all ideas
              </Link>
            }
          />
        </>
      );
    }
    return (
      <>
        <title>{"Something went wrong · It's a Date"}</title>
        <div role="alert">
          <EmptyState
            headingLevel={1}
            icon={WifiOff}
            title="We couldn't load this idea."
            body="Check your connection and try again."
            action={
              <Button busy={query.isFetching} onClick={() => void query.refetch()}>
                Try again
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return <Detail idea={query.data} />;
}
