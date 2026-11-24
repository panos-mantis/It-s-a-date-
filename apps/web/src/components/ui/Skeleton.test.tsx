import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { CardSkeleton, Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive tech', () => {
    const { container } = render(<Skeleton className="h-4" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = render(<CardSkeleton />);
    await expectNoAxeViolations(container);
  });
});
