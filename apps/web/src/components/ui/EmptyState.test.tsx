import { render, screen } from '@testing-library/react';
import { Heart } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title, body and action', () => {
    render(
      <EmptyState title="Nothing yet" body="Save a few ideas." action={<Button>Browse</Button>} />,
    );
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
    expect(screen.getByText('Save a few ideas.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<EmptyState icon={Heart} title="Nothing yet" body="Body" />);
    await expectNoAxeViolations(container);
  });
});
