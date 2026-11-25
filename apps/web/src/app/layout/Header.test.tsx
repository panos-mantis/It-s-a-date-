import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { authStore } from '../../test/msw/handlers';
import { server } from '../../test/msw/server';
import { renderApp } from '../../test/render';

function login(role: 'user' | 'admin' = 'user') {
  authStore.addUser({ name: 'Ana Lopez', email: 'ana@x.com', password: 'secret123', role });
  authStore.loginAs('ana@x.com');
}

const menuButton = () => screen.findByRole('button', { name: 'Account menu for Ana Lopez' });

describe('Header', () => {
  it('shows Log in and Sign up when logged out', async () => {
    renderApp('/');
    const header = await screen.findByRole('banner');
    expect(await within(header).findByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(within(header).getByRole('link', { name: 'Sign up' })).toHaveAttribute(
      'href',
      '/signup',
    );
    expect(within(header).getByRole('link', { name: /Share an idea/ })).toBeInTheDocument();
  });

  it('shows the account menu when logged in', async () => {
    login();
    renderApp('/');
    expect(await menuButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('menu lists Admin only for admins', async () => {
    login('user');
    const first = renderApp('/');
    await first.user.click(await menuButton());
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
    first.unmount();

    authStore.reset();
    login('admin');
    const second = renderApp('/');
    await second.user.click(await menuButton());
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });

  it('menu closes on Escape', async () => {
    login();
    const { user } = renderApp('/');
    const button = await menuButton();
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('menu closes on outside click', async () => {
    login();
    const { user } = renderApp('/');
    const button = await menuButton();
    await user.click(button);
    await user.click(screen.getByRole('heading', { level: 1 }));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('logs out', async () => {
    login();
    const { user, router } = renderApp('/');
    await user.click(await menuButton());
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(await screen.findByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(await screen.findByText("You're logged out. See you soon.")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('logging out from a guarded page lands on home, not the login redirect', async () => {
    login();
    const { user, router } = renderApp('/profile');
    await user.click(await menuButton());
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(await screen.findByText("You're logged out. See you soon.")).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(router.state.location.search).toBe('');
  });

  it('does not show Log in to a logged-in user when /me fails', async () => {
    server.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({ error: { code: 'INTERNAL', message: 'Boom' } }, { status: 500 }),
      ),
    );
    renderApp('/');
    await screen.findByRole('heading', { level: 1 });
    await new Promise((r) => setTimeout(r, 50));
    const header = screen.getByRole('banner');
    expect(within(header).queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(within(header).queryByRole('link', { name: 'Sign up' })).not.toBeInTheDocument();
  });

  it('login page shows the retry state, not the form, when /me fails', async () => {
    server.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({ error: { code: 'INTERNAL', message: 'Boom' } }, { status: 500 }),
      ),
    );
    renderApp('/login');
    expect(await screen.findByText("We couldn't check your account.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('stays logged in when logout fails', async () => {
    login();
    server.use(
      http.post('*/api/v1/auth/logout', () =>
        HttpResponse.json({ error: { code: 'INTERNAL', message: 'Boom' } }, { status: 500 }),
      ),
    );
    const { user } = renderApp('/');
    await user.click(await menuButton());
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(await screen.findByText("We couldn't log you out. Try again.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /Account menu/ })).toBeVisible());
  });

  it('has no axe violations logged out', async () => {
    const { container } = renderApp('/');
    await screen.findByRole('link', { name: 'Log in' });
    await expectNoAxeViolations(container);
  });

  it('has no axe violations logged in with the menu open', async () => {
    login('admin');
    const { container, user } = renderApp('/');
    await user.click(await menuButton());
    await expectNoAxeViolations(container);
  });
});
