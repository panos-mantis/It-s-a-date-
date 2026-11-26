import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { Dialog } from './Dialog';
import { ToastProvider, useToast } from './Toast';

function isInert(el: Element | null): boolean {
  return el?.closest('[inert]') != null;
}

function scrim(): HTMLElement {
  const el = document.querySelector<HTMLElement>('[data-dialog-scrim]');
  if (!el) throw new Error('No scrim');
  return el;
}

function Harness({
  variant = 'panel',
  withInitialFocus = false,
}: {
  variant?: 'sheet' | 'panel' | 'alert';
  withInitialFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const toast = useToast();
  return (
    <>
      <a href="#main">Skip to content</a>
      <header>
        <a href="/">Site</a>
      </header>
      <main id="main">
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
        <button type="button" onClick={() => setConfirming(true)}>
          Delete idea
        </button>
        <Dialog
          open={confirming}
          onClose={() => setConfirming(false)}
          labelledBy="confirm-title"
          variant="alert"
        >
          <h2 id="confirm-title">Delete this idea?</h2>
          <button type="button" onClick={() => setConfirming(false)}>
            Keep it
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setOpen(false);
            }}
          >
            Delete
          </button>
        </Dialog>
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
    // Starts on the first focusable element (the heading has tabindex -1, so it is skipped).
    expect(screen.getByLabelText('Title')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Delete idea' })).toHaveFocus();
    // Tab from the last element wraps to the first, never leaving the dialog.
    await user.tab();
    expect(screen.getByLabelText('Title')).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Delete idea' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('starts on initialFocus when given', async () => {
    const { user } = setup({ withInitialFocus: true });
    await user.click(screen.getByRole('button', { name: 'Edit idea' }));
    expect(screen.getByRole('heading', { name: 'Edit idea' })).toHaveFocus();
  });

  it('portals to body and makes the whole page behind it inert while open', async () => {
    const { user, container } = setup();
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    const header = container.querySelector('header');
    const main = container.querySelector('main');
    await user.click(screen.getByRole('button', { name: 'Edit idea' }));

    const dialog = screen.getByRole('dialog');
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
    expect(isInert(dialog)).toBe(false);
    expect(isInert(skip)).toBe(true);
    expect(isInert(header)).toBe(true);
    expect(isInert(main)).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(isInert(skip)).toBe(false);
    expect(isInert(header)).toBe(false);
    expect(isInert(main)).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('a click on the scrim keeps focus in the dialog, so Escape still closes it', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Make toast' }));
    await user.click(screen.getByRole('button', { name: 'Edit idea' }));
    const dialog = screen.getByRole('dialog');

    await user.click(scrim());
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // The toast is untouched: the Escape went to the dialog.
    expect(screen.getByText('Saved.')).toBeInTheDocument();
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

  it('a dialog on top of another: closing the top one keeps the lower one live and the page inert', async () => {
    const { user, container } = setup();
    const main = container.querySelector('main');
    await user.click(screen.getByRole('button', { name: 'Edit idea' }));
    const lower = screen.getByRole('dialog', { name: 'Edit idea' });
    const deleteIdea = screen.getByRole('button', { name: 'Delete idea' });
    await user.click(deleteIdea);

    const upper = screen.getByRole('alertdialog', { name: 'Delete this idea?' });
    expect(isInert(upper)).toBe(false);
    expect(isInert(lower)).toBe(true);
    expect(isInert(main)).toBe(true);

    // Escape closes only the top dialog.
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Edit idea' })).toBeInTheDocument();
    expect(isInert(lower)).toBe(false);
    expect(isInert(main)).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(deleteIdea).toHaveFocus();

    await user.click(deleteIdea);
    await user.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(isInert(lower)).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(isInert(main)).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(screen.getByRole('button', { name: 'Edit idea' })).toHaveFocus();
  });

  it('closing both stacked dialogs at once restores the page and the first opener', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Edit idea' }));
    await user.click(screen.getByRole('button', { name: 'Delete idea' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(document.querySelector('[inert]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit idea' })).toHaveFocus());
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
