import type { IdeaDTO } from '@itsadate/shared';
import { Lightbulb, Plus, WifiOff } from 'lucide-react';
import { Fragment, useId } from 'react';
import { Link } from 'react-router';
import { paths } from '../../app/paths';
import {
  Button,
  buttonClasses,
  Card,
  CardSkeleton,
  Chip,
  EmptyState,
  useToast,
} from '../../components/ui';
import { ideaMeta } from '../../lib/labels';
import { tagIcon } from '../../lib/tag-icons';
import { useMe } from '../auth/api';
import { useMyIdeas } from '../ideas/api';

const grid = 'grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

/** Break before the "@" and before each "." in the name part; the domain stays whole. */
function EmailText({ email }: { email: string }) {
  const at = email.lastIndexOf('@');
  if (at < 0) return <>{email}</>;
  const parts = email.slice(0, at).split('.');
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <>
              <wbr />.
            </>
          )}
          {part}
        </Fragment>
      ))}
      <wbr />
      <span className="whitespace-nowrap">{email.slice(at)}</span>
    </>
  );
}

function statusLine(idea: IdeaDTO): string {
  if (idea.status === 'pending') return 'Waiting for review';
  if (idea.status === 'rejected') return 'Not approved this time';
  return `Live · ${idea.saveCount} ${idea.saveCount === 1 ? 'save' : 'saves'}`;
}

function MyIdeaCard({ idea }: { idea: IdeaDTO }) {
  const titleId = useId();
  return (
    <Card
      // Only approved ideas are public, so only they link.
      href={idea.status === 'approved' ? paths.idea(idea.id) : undefined}
      title={idea.title}
      titleId={titleId}
      // The photo repeats the title next to it, so it is decorative (empty alt).
      image={idea.image ? { src: idea.image.url, alt: '' } : null}
      meta={ideaMeta(idea)}
      status={{ tone: idea.status, line: statusLine(idea) }}
      statusAction={
        idea.status === 'rejected' ? (
          <Link
            to={paths.share}
            aria-describedby={titleId}
            className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-accent-ink hover:underline"
          >
            Share it again with changes
          </Link>
        ) : undefined
      }
      chip={
        idea.tags.length > 0 ? (
          <>
            {idea.tags.map((tag) => (
              <Chip key={tag.id} icon={tagIcon(tag.icon)}>
                {tag.name}
              </Chip>
            ))}
          </>
        ) : undefined
      }
    />
  );
}

export function ProfilePage() {
  const me = useMe();
  const ideas = useMyIdeas();
  const toast = useToast();

  async function showMore() {
    const result = await ideas.fetchNextPage();
    if (result.isFetchNextPageError) {
      toast.show("We couldn't load more ideas. Check your connection and try again.", {
        tone: 'error',
      });
    }
  }
  const user = me.data;
  const items = ideas.data?.pages.flatMap((p) => p.items) ?? [];
  const total = ideas.data?.pages[0]?.total ?? 0;

  let body;
  if (ideas.isPending) {
    body = (
      <div aria-busy="true">
        <p role="status" className="mb-4 text-sm text-muted">
          Loading your ideas…
        </p>
        <div className={grid}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={i >= 2 ? 'hidden lg:block' : undefined}>
              <CardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  } else if (ideas.isError && items.length === 0) {
    body = (
      <div role="alert">
        <EmptyState
          icon={WifiOff}
          title="We couldn't load your ideas."
          body="Check your connection and try again. Nothing you shared is lost."
          action={
            <Button busy={ideas.isFetching} onClick={() => void ideas.refetch()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <EmptyState
        icon={Lightbulb}
        title="You haven't shared an idea yet."
        body="Got a date you'd happily go on again? Share it, and once an admin approves it, everyone can find it on Home."
        action={
          <Link to={paths.share} className={buttonClasses()}>
            Share an idea
          </Link>
        }
      />
    );
  } else {
    body = (
      <>
        <div className={grid}>
          {items.map((idea) => (
            <MyIdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
        {ideas.hasNextPage && (
          <div className="mt-12 flex justify-center">
            <Button
              variant="secondary"
              busy={ideas.isFetchingNextPage}
              onClick={() => void showMore()}
            >
              Show more
            </Button>
          </div>
        )}
      </>
    );
  }

  const showBar = ideas.isSuccess && items.length > 0;

  return (
    <>
      <title>{"Your ideas · It's a Date"}</title>
      <section
        aria-labelledby="profile-name"
        className="flex items-start gap-4 pb-6 pt-6 sm:items-center sm:gap-6 sm:pb-8 sm:pt-12"
      >
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-pill bg-accent-soft font-display text-[26px] font-medium leading-none text-accent-ink sm:size-22 sm:text-[38px]"
        >
          {user?.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1
            id="profile-name"
            className="text-balance text-[30px] font-medium leading-[1.08] tracking-[-0.025em] text-fg [overflow-wrap:anywhere] sm:text-[38px]"
          >
            {user?.name}
          </h1>
          <p className="text-sm text-muted [overflow-wrap:anywhere] sm:text-base">
            {user && <EmailText email={user.email} />}
          </p>
        </div>
      </section>

      <section aria-labelledby="ideas-title" className="border-t border-border pb-16 pt-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2
              id="ideas-title"
              className="flex items-center gap-2 text-lg font-semibold leading-[1.2] tracking-[-0.01em] text-fg"
            >
              Your ideas
              {ideas.isSuccess && (
                <span className="inline-grid h-[22px] min-w-6 place-items-center rounded-pill bg-surface-sunk px-[7px] font-body text-xs [font-variation-settings:normal] font-semibold tabular-nums text-fg">
                  {total}
                </span>
              )}
            </h2>
            {showBar && (
              <p className="text-sm text-muted">
                Only you can see ideas that are pending review or not approved.
              </p>
            )}
          </div>
          {showBar && (
            <Link to={paths.share} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
              Share an idea
            </Link>
          )}
        </div>
        {body}
      </section>
    </>
  );
}
