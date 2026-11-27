import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { useFocusTrap } from './use-focus-trap';

function Trap() {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, { active: true });
  return (
    <>
      <button type="button">Outside</button>
      <div ref={ref} tabIndex={-1}>
        <button type="button" tabIndex={-1}>
          Not in the tab order
        </button>
        <button type="button">First</button>
        <button type="button">Last</button>
        {/* Rendered but never reachable: they must not count as the first or last stop. */}
        <button type="button" tabIndex={-1}>
          Also not in the tab order
        </button>
        <button type="button" style={{ display: 'none' }}>
          Display none
        </button>
        <div hidden>
          <button type="button">Inside hidden</button>
        </div>
      </div>
    </>
  );
}

describe('useFocusTrap', () => {
  it('starts on the first reachable element and wraps between reachable ones only', async () => {
    const user = userEvent.setup();
    render(<Trap />);
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });
    expect(first).toHaveFocus();

    await user.tab();
    expect(last).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });
});
