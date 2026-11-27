import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { Tabs } from './Tabs';

function setup(path = '/admin') {
  const router = createMemoryRouter(
    [
      {
        path: '/admin',
        element: (
          <main>
            <Tabs
              label="Admin sections"
              tabs={[
                { id: 'pending', label: 'Pending', panel: <p>Queue panel</p> },
                { id: 'all', label: 'All ideas', panel: <p>All panel</p> },
                { id: 'tags', label: 'Tags', panel: <p>Tags panel</p> },
              ]}
            />
          </main>
        ),
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return { router, user: userEvent.setup() };
}

describe('Tabs', () => {
  it('is a tablist with linked panels, the first selected by default', () => {
    setup();
    expect(screen.getByRole('tablist', { name: 'Admin sections' })).toBeInTheDocument();
    const pending = screen.getByRole('tab', { name: 'Pending' });
    expect(pending).toHaveAttribute('aria-selected', 'true');
    expect(pending).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'All ideas' })).toHaveAttribute('tabindex', '-1');
    const panel = screen.getByRole('tabpanel', { name: 'Pending' });
    expect(pending).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveTextContent('Queue panel');
    expect(screen.queryByText('All panel')).not.toBeInTheDocument();
  });

  it('arrow keys and hash', async () => {
    const { router, user } = setup('/admin#all');
    // The hash picks the tab on load, without moving focus.
    const all = screen.getByRole('tab', { name: 'All ideas' });
    expect(all).toHaveAttribute('aria-selected', 'true');
    expect(all).not.toHaveFocus();
    expect(screen.getByText('All panel')).toBeInTheDocument();

    all.focus();
    await user.keyboard('{ArrowRight}');
    const tags = screen.getByRole('tab', { name: 'Tags' });
    expect(tags).toHaveFocus();
    expect(tags).toHaveAttribute('aria-selected', 'true');
    expect(router.state.location.hash).toBe('#tags');
    // The hash is replaced, not pushed.
    expect(router.state.historyAction).toBe('REPLACE');

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Pending' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(tags).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Pending' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(tags).toHaveFocus();
    expect(router.state.location.hash).toBe('#tags');
    expect(router.state.location.pathname).toBe('/admin');

    await user.click(screen.getByRole('tab', { name: 'Pending' }));
    expect(router.state.location.hash).toBe('#pending');
    expect(screen.getByText('Queue panel')).toBeInTheDocument();
  });

  it('an unknown hash falls back to the first tab', () => {
    setup('/admin#nope');
    expect(screen.getByRole('tab', { name: 'Pending' })).toHaveAttribute('aria-selected', 'true');
  });

  it('has no axe violations', async () => {
    setup();
    await expectNoAxeViolations(document.body);
  });
});
