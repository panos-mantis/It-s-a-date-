import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { ToastProvider, useToast } from './Toast';

type Tone = 'info' | 'success' | 'error';

function Trigger({ messages, tone }: { messages: string[]; tone?: Tone }) {
  const { show } = useToast();
  return (
    <button
      type="button"
      onClick={() => messages.forEach((m) => show(m, tone ? { tone } : undefined))}
    >
      Fire
    </button>
  );
}

function setup(messages: string[], tone?: Tone) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const utils = render(
    <ToastProvider>
      <Trigger messages={messages} tone={tone} />
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

  it('dismisses after 5 seconds', async () => {
    const { user } = setup(['Saved.']);
    await user.click(screen.getByRole('button', { name: 'Fire' }));
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
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
