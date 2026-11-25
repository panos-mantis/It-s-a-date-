import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Compass, Utensils } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { CategoryRow } from './CategoryRow';

const items = [
  { value: 'food', label: 'Food', icon: Utensils },
  { value: 'adventure', label: 'Adventure', icon: Compass },
];

describe('CategoryRow', () => {
  it('marks the active item pressed', () => {
    render(<CategoryRow items={items} active="food" onSelect={() => {}} />);
    expect(screen.getByRole('navigation', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Food' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Adventure' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onSelect', async () => {
    const onSelect = vi.fn();
    render(<CategoryRow items={items} active="food" onSelect={onSelect} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Adventure' }));
    expect(onSelect).toHaveBeenCalledWith('adventure');
  });

  it('has no axe violations', async () => {
    const { container } = render(<CategoryRow items={items} active="food" onSelect={() => {}} />);
    await expectNoAxeViolations(container);
  });
});
