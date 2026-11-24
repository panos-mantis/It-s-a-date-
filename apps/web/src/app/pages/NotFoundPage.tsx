import { Link } from 'react-router';
import { buttonClasses, EmptyState } from '../../components/ui';
import { paths } from '../paths';

export function NotFoundPage() {
  return (
    <>
      <title>{"Page not found · It's a Date"}</title>
      <EmptyState
        title="We couldn't find that page."
        body="It may have moved, or the link has a typo."
        action={
          <Link to={paths.home} className={buttonClasses({ variant: 'secondary' })}>
            Back to home
          </Link>
        }
      />
    </>
  );
}
