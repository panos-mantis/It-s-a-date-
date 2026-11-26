import { Heart, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { buttonClasses, Skeleton } from '../../components/ui';
import { useMe } from '../../features/auth/api';
import { cn } from '../../lib/cn';
import { paths } from '../paths';
import { AccountMenu } from './AccountMenu';

// The current header link: a 2px text-colour underline 6px below the text.
const current =
  'aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:decoration-fg aria-[current=page]:underline-offset-[6px]';

const navButton = (variant: 'ghost' | 'secondary', extra?: string) =>
  buttonClasses({ variant, size: 'sm', className: cn('max-sm:px-2.5', current, extra) });

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
      <nav
        aria-label="Main"
        className="mx-auto flex min-h-16 w-full max-w-page flex-wrap items-center justify-between gap-1 px-4 py-2 sm:px-7 lg:px-10"
      >
        <Link
          to={paths.home}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-sm whitespace-nowrap font-display text-[18px] font-medium italic font-soft text-fg sm:text-xl"
        >
          <Heart
            aria-hidden="true"
            size={16}
            strokeWidth={1.75}
            className="fill-accent text-accent"
          />
          It&apos;s a Date
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-2">
          {me.data && (
            <NavLink to={paths.profile} end className={navButton('ghost', 'max-sm:hidden')}>
              Your ideas
            </NavLink>
          )}
          <NavLink
            to={paths.share}
            end
            aria-label="Share an idea"
            className={navButton(
              'ghost',
              'max-sm:gap-0.5 max-sm:rounded-pill max-sm:border max-sm:border-border max-sm:pl-2 max-sm:pr-2.5 max-sm:aria-[current=page]:border-fg max-sm:aria-[current=page]:no-underline',
            )}
          >
            <Plus aria-hidden="true" size={16} strokeWidth={1.75} className="sm:hidden" />
            <span aria-hidden="true" className="sm:hidden">
              Share
            </span>
            <span aria-hidden="true" className="max-sm:hidden">
              Share an idea
            </span>
          </NavLink>
          {me.data ? (
            <AccountMenu user={me.data} />
          ) : me.isPending ? (
            <Skeleton className="h-10 w-24 rounded-pill" />
          ) : (
            <>
              <NavLink to={paths.login} end className={navButton('ghost', 'max-[399px]:px-1.5')}>
                Log in
              </NavLink>
              <NavLink to={paths.signup} end className={navButton('secondary')}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
