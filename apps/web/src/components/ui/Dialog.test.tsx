import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { Dialog } from './Dialog';
import { ToastProvider, useToast } from './Toast';

function Harness({
  variant = 'panel',
  withInitialFocus = false,
}: {
  variant?: 'sheet' | 'panel' | 'alert';
  withInitialFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const toast = useToast();
  return (
    <>
      <header>
        <a href="/">Site</a>
      </header>
      <main>
        <button type="button" onClick={() => setOpen(true)}>
          Edit idea
        </button>
        <button type="button" onClick={() => toast.show('Saved.')}>
          Make toast
        </button>
      </main>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="dialog-title"
        variant={variant}
        initialFocus={withInitialFocus ? headingRef : undefined}
      >
        <h2 id="dialog-title" ref={headingRef} tabIndex={-1}>
          Edit idea
        </h2>
        <label htmlFor="dialog-name">Title</label>
        <input id="dialog-name" />
        <button type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </Dialog>
    </>
  );
}

function setup(props: Parameters<typeof Harness>[0] = {}) {
  const user = userEvent.setup();
  const result = render(
    <ToastProvider>
      <Harness {...props} />
    </ToastProvider>,
  );
  return { user, ...result };
}

describe('Dialog', () => {
  it('traps focus, Escape closes and returns focus to the opener', async () => {
    const { user } = setup();
    const opener = screen.getByRole('button', { name: 'Edit idea' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Edit idea' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Starts on the first focusable element.
    expect(screen.getByLabelText('Title')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    // Tab from the last element wraps to the first, never leaving the dialog.
    await user.tab();
    expect(screen.getByLabelText('Title')).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('starts on initialFocus when given', async () => {
    const { user } = setup({ withInitialFocus: true });
    await user.click(screen.getByRole('button', { name: 'Edit idea' }));
    expect(screen.getByRole('heading', { name: 'Edit idea' })).toHaveFocus();
  });

  it('portals to body and makes the header and main inert while open', async () => {
    const { user, container } = setup();
    const header = container.querySelector('header');
    const main = container.querySelector('main');
    await user.click(screen.getByRole('button', { name: 'Edit idea' }));

    const dialog = screen.getByRole('dialog');
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
    expect(header).toHaveAttribute('inert');
    expect(main).toHaveAttribute('inert');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(header).not.toHaveAttribute('inert');
    expect(main).not.toHaveAttribute('inert');
  });

  it('one Escape closes only the dialog, not a toast as well', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Make toast' }));
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit idea' }));

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Saved.')).toBeInTheDocument();

    // With no dialog open, Escape goes to the toast again.
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Saved.')).not.toBeInTheDocument());
  });

  it('uses alertdialog for the alert variant', async () => {
    const { user } = setup({ variant: 'alert' });
    await user.click(screen.getByRole('button', { name: 'Edit idea' }));
    expect(screen.getByRole('alertdialog', { name: 'Edit idea' })).toHaveAttribute(
      'aria-modal',
      'true',
    );
  });

  it('has no axe violations while open', async () => {
    const { user } = setup({ variant: 'sheet' });
    await user.click(screen.getByRole('button', { name: 'Edit idea' }));
    await expectNoAxeViolations(document.body);
  });
});
