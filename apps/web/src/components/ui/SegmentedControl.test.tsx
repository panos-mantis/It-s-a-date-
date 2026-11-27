import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 'short', label: '1–2 hours' },
  { value: 'half-day', label: 'Half day' },
  { value: 'full-day', label: 'Full day' },
];

function Harness({ initial = null, error }: { initial?: string | null; error?: string }) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <SegmentedControl
      legend="Duration"
      name="duration"
      options={OPTIONS}
      value={value}
      onChange={setValue}
      error={error}
    />
  );
}

describe('SegmentedControl', () => {
  it('is a radio group named by its legend', () => {
    render(<Harness />);
    expect(screen.getByRole('radiogroup', { name: 'Duration' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument();
  });

  it('arrow keys move the selection', async () => {
    const user = userEvent.setup();
    render(<Harness initial="short" />);
    screen.getByRole('radio', { name: '1–2 hours' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Half day' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Half day' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Half day' })).toBeChecked();
  });

  it('clicking a segment picks it', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText('Full day'));
    expect(screen.getByRole('radio', { name: 'Full day' })).toBeChecked();
  });

  it('shows its error and links it to the group', async () => {
    const { container } = render(<Harness error="Pick how long it takes." />);
    expect(screen.getByRole('radiogroup', { name: 'Duration' })).toHaveAccessibleDescription(
      'Pick how long it takes.',
    );
    expect(screen.getByText('Pick how long it takes.')).toBeVisible();
    await expectNoAxeViolations(container);
  });

  it('disables listed values', () => {
    render(
      <SegmentedControl
        legend="Duration"
        name="d"
        options={OPTIONS}
        value="short"
        onChange={() => undefined}
        disabledValues={['full-day']}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Full day' })).toBeDisabled();
  });

  it('draws the check with the kit stroke (1.75)', () => {
    render(<Harness initial="short" />);
    const icon = screen
      .getByRole('radio', { name: '1–2 hours' })
      .parentElement?.querySelector('svg');
    expect(icon).toHaveAttribute('stroke-width', '1.75');
  });
});
