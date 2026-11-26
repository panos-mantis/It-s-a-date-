import { Link } from 'react-router';
import { buttonClasses, EmptyState } from '../../components/ui';
import { paths } from '../paths';

export function NotFoundPage() {
  return (
    <>
      <title>{"Page not found · It's a Date"}</title>
      <EmptyState
        headingLevel={1}
        eyebrow="Page not found"
        title={
          <>
            This page <em>wandered off</em>.
          </>
        }
        body="The link may be old, or the idea was removed."
        action={
          <Link to={paths.home} className={buttonClasses()}>
            Back to all ideas
          </Link>
        }
      />
    </>
  );
}
