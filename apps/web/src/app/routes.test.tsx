import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { authStore } from '../test/msw/handlers';
import { createTestQueryClient, renderApp } from '../test/render';
import { AppProviders } from './providers';
import { RootLayout } from './layout/RootLayout';
import { routes } from './routes';

function login(role: 'user' | 'admin' = 'user') {
  authStore.addUser({ name: 'Ana', email: 'ana@x.com', password: 'secret123', role });
  authStore.loginAs('ana@x.com');
}

describe('routes', () => {
  it('renders the home page', async () => {
    renderApp('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Plans worth saying yes to.' }),
    ).toBeInTheDocument();
  });

  it('renders 404 for unknown paths', async () => {
    renderApp('/nope');
    expect(await screen.findByText("We couldn't find that page.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });

  it('guard redirects with next', async () => {
    const { router } = renderApp('/share?x=1');
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('?next=%2Fshare%3Fx%3D1');
  });

  it('lets a logged-in user in', async () => {
    login();
    renderApp('/share');
    expect(await screen.findByRole('heading', { name: 'Share an idea' })).toBeInTheDocument();
  });

  it('keeps non-admins out of admin', async () => {
    login('user');
    renderApp('/admin');
    expect(await screen.findByText('This page is for admins.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
  });

  it('lets an admin into admin', async () => {
    login('admin');
    renderApp('/admin');
    expect(await screen.findByRole('heading', { name: 'Admin' })).toBeInTheDocument();
  });

  it('sends logged-in users away from /login', async () => {
    login();
    const { router } = renderApp('/login');
    expect(
      await screen.findByRole('heading', { level: 1, name: /Plans worth/ }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('has a skip link to main', async () => {
    renderApp('/');
    expect(await screen.findByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main',
    );
  });
});

describe('error element', () => {
  function Boom(): never {
    throw new Error('kaboom');
  }

  function renderThrowing() {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <RootLayout />,
          errorElement: routes[0]?.errorElement,
          children: [{ index: true, element: <Boom /> }],
        },
      ],
      { initialEntries: ['/'] },
    );
    render(
      <AppProviders queryClient={createTestQueryClient()}>
        <RouterProvider router={router} />
      </AppProviders>,
    );
  }

  it('shows a generic error with a way out for non-404 errors', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderThrowing();
    expect(await screen.findByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('Try again, or head back home.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
    expect(screen.queryByText("We couldn't find that page.")).not.toBeInTheDocument();
    spy.mockRestore();
  });
});
