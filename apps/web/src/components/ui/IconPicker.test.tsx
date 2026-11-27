import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { TAG_ICON_NAMES } from '../../lib/tag-icons';
import { IconPicker } from './IconPicker';

function Harness({ start = 'sparkles' }: { start?: string }) {
  const [icon, setIcon] = useState(start);
  return (
    <main>
      <IconPicker name="icon" value={icon} onChange={setIcon} />
    </main>
  );
}

describe('IconPicker', () => {
  it('16 options, each named for its icon, with the helper and a preview', () => {
    render(<Harness />);
    const group = screen.getByRole('group', { name: 'Icon' });
    expect(group).toHaveAccessibleDescription('Pick the icon people will see on the chip.');
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(16);
    expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual([...TAG_ICON_NAMES]);
    for (const name of TAG_ICON_NAMES) {
      expect(screen.getByRole('radio', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('radio', { name: 'sparkles' })).toBeChecked();
    expect(screen.getByText('sparkles', { selector: 'code' })).toBeInTheDocument();
  });

  it('keyboard selection: arrows move the pick, the preview follows', async () => {
    const user = userEvent.setup();
    render(<Harness start="camera" />);
    screen.getByRole('radio', { name: 'camera' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'sparkles' })).toBeChecked();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'wine' })).toBeChecked();
    expect(screen.getByText('wine', { selector: 'code' })).toBeInTheDocument();
  });

  it('click picks an icon', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('radio', { name: 'film' }));
    expect(screen.getByRole('radio', { name: 'film' })).toBeChecked();
  });

  it('has no axe violations', async () => {
    render(<Harness />);
    await expectNoAxeViolations(document.body);
  });
});
