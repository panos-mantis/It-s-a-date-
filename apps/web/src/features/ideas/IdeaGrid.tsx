import type { IdeaDTO } from '@itsadate/shared';
import { useState } from 'react';
import { Card, CardSkeleton, Chip } from '../../components/ui';
import { paths } from '../../app/paths';
import { cn } from '../../lib/cn';
import { ideaMeta } from '../../lib/labels';
import { tagIcon } from '../../lib/tag-icons';

const NEW_FOR_MS = 2 * 24 * 60 * 60 * 1000;

/** Created within the last 2 days (HANDOFF §3 "New" badge). */
export function isNewIdea(createdAt: string, now: number): boolean {
  const age = now - Date.parse(createdAt);
  return age >= 0 && age < NEW_FOR_MS;
}

const grid = 'grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

export function IdeaGrid({
  ideas,
  now,
}: {
  ideas: IdeaDTO[];
  /** For the "New" badge. Defaults to when the grid mounted. */
  now?: number;
}) {
  const [mountedAt] = useState(Date.now);
  const at = now ?? mountedAt;
  return (
    <div className={grid}>
      {ideas.map((idea) => {
        const tag = idea.tags[0];
        return (
          <Card
            key={idea.id}
            href={paths.idea(idea.id)}
            title={idea.title}
            // The photo repeats the title next to it, so it is decorative (empty alt).
            image={idea.image ? { src: idea.image.url, alt: '' } : null}
            rating={{ value: idea.ratingAvg, count: idea.ratingCount }}
            meta={ideaMeta(idea)}
            chip={tag ? <Chip icon={tagIcon(tag.icon)}>{tag.name}</Chip> : undefined}
            badge={isNewIdea(idea.createdAt, at) ? 'New' : undefined}
          />
        );
      })}
    </div>
  );
}

/** 8 card skeletons in the grid's shape; 3 on phones, enough to fill the screen. */
export function IdeaGridSkeleton() {
  return (
    <div className={grid}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className={cn(i >= 3 && 'hidden md:block')}>
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
}
