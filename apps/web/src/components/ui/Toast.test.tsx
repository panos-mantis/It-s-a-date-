import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { ToastProvider, useToast } from './Toast';

type Tone = 'info' | 'success' | 'error';

type Action = { label: string; onAction: () => void };

function Trigger({ messages, tone, action }: { messages: string[]; tone?: Tone; action?: Action }) {
  const { show } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        messages.forEach((m) => show(m, tone || action ? { tone, action } : undefined))
      }
    >
      Fire
    </button>
  );
}

function setup(messages: string[], tone?: Tone, action?: Action) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const utils = render(
    <ToastProvider>
      <Trigger messages={messages} tone={tone} action={action} />
    </ToastProvider>,
  );
  return { user, ...utils };
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a success toast in a status region', async () => {
    const { user } = setup(["You're in."], 'success');
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    expect(screen.getByRole('status')).toHaveTextContent("You're in.");
  });

  it('shows an error toast in an alert region', async () => {
    const { user } = setup(['Something broke.'], 'error');
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Something broke.');
  });

  it('plain toast gone at 4 s', async () => {
    const { user } = setup(['Saved.']);
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    act(() => {
      vi.advanceTimersByTime(3900);
    });
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
  });

  it('action toast lasts 8 s', async () => {
    const { user } = setup(['Removed.'], undefined, { label: 'Undo', onAction: () => {} });
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    act(() => {
      vi.advanceTimersByTime(7900);
    });
    expect(screen.getByText('Removed.')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByText('Removed.')).not.toBeInTheDocument();
  });

  it('hover pauses and resumes the remaining time', async () => {
    const { user } = setup(['Saved.']);
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    const card = screen.getByText('Saved.').parentElement!;
    fireEvent.mouseEnter(card);
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    fireEvent.mouseLeave(card);
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
  });

  it('action button calls onAction and closes', async () => {
    const onAction = vi.fn();
    const { user } = setup(['Removed.'], undefined, { label: 'Undo', onAction });
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(screen.queryByText('Removed.')).not.toBeInTheDocument();
  });

  it('Escape closes the toast and returns focus', async () => {
    const { user } = setup(['Saved.']);
    const fire = screen.getByRole('button', { name: 'Fire' });
    await user.click(fire);
    screen.getByRole('button', { name: 'Dismiss' }).focus();
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
    expect(fire).toHaveFocus();
  });

  it('Escape still closes an older toast after the newest is gone', async () => {
    const { user } = setup(['older']);
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    expect(screen.getAllByText('older')).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: 'Dismiss' })[1]!);
    expect(screen.getAllByText('older')).toHaveLength(1);
    await user.keyboard('{Escape}');
    expect(screen.queryByText('older')).not.toBeInTheDocument();
  });

  it('dismisses on click', async () => {
    const { user } = setup(['Saved.']);
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
  });

  it('keeps at most three', async () => {
    const { user } = setup(['one', 'two', 'three', 'four']);
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    expect(screen.queryByText('one')).not.toBeInTheDocument();
    for (const m of ['two', 'three', 'four']) expect(screen.getByText(m)).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { user, container } = setup(['Saved.']);
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    await expectNoAxeViolations(container);
  });

  it('throws outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Trigger messages={[]} />)).toThrow(
      'useToast must be used inside ToastProvider',
    );
    spy.mockRestore();
  });
});
