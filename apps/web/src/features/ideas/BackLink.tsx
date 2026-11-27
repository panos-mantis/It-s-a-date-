import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '../../app/paths';
import { buttonClasses } from '../../components/ui';
import { cn } from '../../lib/cn';

/** The flush ghost "All ideas" link above Idea detail and Share: its arrow lines up with the content edge. */
export function BackLink() {
  return (
    <div className="pt-4">
      <Link
        to={paths.home}
        className={cn(buttonClasses({ variant: 'ghost', size: 'sm' }), '!px-0')}
      >
        <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.75} />
        All ideas
      </Link>
    </div>
  );
}
