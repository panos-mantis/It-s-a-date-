import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Button, buttonClasses, EmptyState } from '../../components/ui';
import { paths } from '../paths';
import { NotFoundPage } from './NotFoundPage';

export function ErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  return (
    <>
      <title>{"Something went wrong · It's a Date"}</title>
      <EmptyState
        headingLevel={1}
        title="Something went wrong."
        body="Try again, or head back home."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Try again</Button>
            <Link to={paths.home} className={buttonClasses({ variant: 'secondary' })}>
              Back to home
            </Link>
          </div>
        }
      />
    </>
  );
}
