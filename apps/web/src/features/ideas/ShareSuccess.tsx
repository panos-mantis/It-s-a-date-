import type { IdeaDTO } from '@itsadate/shared';
import { ArrowRight, CircleCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { paths } from '../../app/paths';
import { Button, buttonClasses, Card, Chip } from '../../components/ui';
import { ideaMeta } from '../../lib/labels';
import { tagIcon } from '../../lib/tag-icons';

/** Replaces the form after the idea is sent. Focus lands on the heading (F3). */
export function ShareSuccess({ idea, onAnother }: { idea: IdeaDTO; onAnother: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-start gap-4 pb-16 pt-2">
      <h1 className="sr-only">Share an idea</h1>
      <CircleCheck aria-hidden="true" size={40} strokeWidth={1.75} className="text-success" />
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl leading-tight tracking-display text-fg outline-none sm:text-3xl [&_em]:font-normal [&_em]:italic"
      >
        Thanks! Your idea is <em>waiting for review.</em>
      </h2>
      <p className="max-w-[52ch] text-muted">
        An admin checks every idea before it goes live. Until then it shows as Pending review on
        your profile, and only you can see it.
      </p>
      <div className="w-full max-w-[320px]">
        <Card
          title={idea.title}
          image={idea.image ? { src: idea.image.url, alt: `Photo for ${idea.title}` } : null}
          meta={ideaMeta(idea)}
          status={{ tone: 'pending', line: 'Waiting for review' }}
          chip={
            <div className="flex flex-wrap gap-2">
              {idea.tags.map((t) => (
                <Chip key={t.id} icon={tagIcon(t.icon)}>
                  {t.name}
                </Chip>
              ))}
            </div>
          }
        />
      </div>
      <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link to={`${paths.profile}#ideas`} className={buttonClasses()}>
          See it on your profile
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.75} />
        </Link>
        <Button variant="secondary" onClick={onAnother}>
          Share another
        </Button>
      </div>
    </div>
  );
}
