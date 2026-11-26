import { render, screen } from '@testing-library/react';
import { Heart } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Chip, SelectableChip } from './Chip';

describe('Chip', () => {
  it('renders its text', () => {
    render(<Chip icon={Heart}>Cosy</Chip>);
    expect(screen.getByText('Cosy')).toBeInTheDocument();
  });

  it('status pending renders "Pending review" with an icon', () => {
    const { container } = render(<Chip variant="status" status="pending" />);
    expect(screen.getByText('Pending review')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('status labels', () => {
    render(
      <div>
        <Chip variant="status" status="approved" />
        <Chip variant="status" status="rejected" />
      </div>,
    );
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Not approved')).toBeInTheDocument();
  });

  it('role labels', () => {
    render(
      <div>
        <Chip variant="role" userRole="admin" />
        <Chip variant="role" userRole="user" />
      </div>,
    );
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Chip icon={Heart}>Cosy</Chip>
        <Chip variant="quiet">Quiet</Chip>
        <Chip variant="status" status="pending" />
        <Chip variant="role" userRole="admin" />
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});

function Harness({ disabled = false }: { disabled?: boolean }) {
  const [on, setOn] = useState(false);
  return (
    <SelectableChip selected={on} disabled={disabled} icon={Heart} onToggle={() => setOn(!on)}>
      Cosy
    </SelectableChip>
  );
}

describe('SelectableChip', () => {
  it('toggles aria-pressed', async () => {
    render(<Harness />);
    const chip = screen.getByRole('button', { name: 'Cosy' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('disabled uses aria-disabled and ignores clicks', async () => {
    render(<Harness disabled />);
    const chip = screen.getByRole('button', { name: 'Cosy' });
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness />);
    await expectNoAxeViolations(container);
  });
});

describe('SelectableChip disabled', () => {
  it('does not call onToggle', async () => {
    const onToggle = vi.fn();
    render(
      <SelectableChip selected={false} disabled onToggle={onToggle}>
        Cosy
      </SelectableChip>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cosy' }));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
