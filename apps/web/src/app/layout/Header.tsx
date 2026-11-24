import { Heart, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { buttonClasses, Skeleton } from '../../components/ui';
import { useMe } from '../../features/auth/api';
import { cn } from '../../lib/cn';
import { paths } from '../paths';
import { AccountMenu } from './AccountMenu';

export function Header() {
  const me = useMe();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-10 border-b bg-surface motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-friendly',
        scrolled ? 'border-border' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-2 px-4 sm:px-7 lg:px-10">
        <Link
          to={paths.home}
          className="inline-flex items-center gap-1.5 rounded-sm font-display text-[20px] font-medium italic text-fg [font-variation-settings:'SOFT'_100,'WONK'_0] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30"
        >
          <Heart
            aria-hidden="true"
            size={16}
            strokeWidth={1.75}
            className="fill-accent text-accent"
          />
          It&apos;s a Date
        </Link>
        <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
          <Link
            to={paths.share}
            aria-label="Share an idea"
            className={buttonClasses({ variant: 'ghost', size: 'sm' })}
          >
            <Plus aria-hidden="true" size={18} strokeWidth={1.75} className="sm:hidden" />
            <span aria-hidden="true" className="hidden sm:inline">
              Share an idea
            </span>
          </Link>
          {me.isPending ? (
            <Skeleton className="h-10 w-24 rounded-pill" />
          ) : me.data ? (
            <AccountMenu user={me.data} />
          ) : (
            <>
              <Link to={paths.login} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                Log in
              </Link>
              <Link
                to={paths.signup}
                className={buttonClasses({ variant: 'secondary', size: 'sm' })}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
