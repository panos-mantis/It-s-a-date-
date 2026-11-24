import { render, screen } from '@testing-library/react';
import { Heart } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders its text', () => {
    render(<Chip icon={Heart}>Cosy</Chip>);
    expect(screen.getByText('Cosy')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Chip icon={Heart}>Cosy</Chip>
        <Chip variant="quiet">Quiet</Chip>
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});
