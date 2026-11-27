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

  it('renders an h2 by default and an h1 on request', () => {
    const { rerender } = render(<EmptyState title="Nothing yet" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Nothing yet' })).toBeInTheDocument();
    rerender(<EmptyState title="Nothing yet" headingLevel={1} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Nothing yet' })).toBeInTheDocument();
  });

  it('renders an eyebrow and a rich title', () => {
    render(
      <EmptyState
        headingLevel={1}
        eyebrow="Page not found"
        title={
          <>
            This page <em>wandered off</em>.
          </>
        }
      />,
    );
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'This page wandered off.' }),
    ).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<EmptyState icon={Heart} title="Nothing yet" body="Body" />);
    await expectNoAxeViolations(container);
  });
});
