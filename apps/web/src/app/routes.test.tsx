import { render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { createQueryClient } from '../lib/query-client';
import { authStore } from '../test/msw/handlers';
import { server } from '../test/msw/server';
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
    expect(
      screen.getByRole('heading', { level: 1, name: "We couldn't find that page." }),
    ).toBeInTheDocument();
  });

  it('guard redirects with next', async () => {
    const { router } = renderApp('/share?x=1');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
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

  it('keeps the page and account menu when a background /me refetch fails', async () => {
    login();
    const { queryClient } = renderApp('/share');
    expect(await screen.findByRole('heading', { name: 'Share an idea' })).toBeInTheDocument();
    server.use(
      http.get('*/api/v1/auth/me', () => new HttpResponse('Bad gateway', { status: 502 })),
    );
    await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
    await waitFor(() => expect(queryClient.getQueryState(['auth', 'me'])?.status).toBe('error'));
    expect(screen.getByRole('heading', { name: 'Share an idea' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account menu for Ana' })).toBeInTheDocument();
  });

  it('shows log in and sign up links when /me errors with no data', async () => {
    server.use(
      http.get('*/api/v1/auth/me', () => new HttpResponse('Bad gateway', { status: 502 })),
    );
    renderApp('/');
    const header = await screen.findByRole('banner');
    expect(await within(header).findByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(within(header).getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('sends a session that expires mid-visit to login with next', async () => {
    login();
    const { queryClient, router } = renderApp('/share', { queryClient: createQueryClient() });
    expect(await screen.findByRole('heading', { name: 'Share an idea' })).toBeInTheDocument();
    server.use(
      http.get('*/api/v1/ideas', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
          { status: 401 },
        ),
      ),
    );
    await queryClient
      .fetchQuery({ queryKey: ['ideas'], queryFn: () => api.get('/ideas') })
      .catch(() => undefined);
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toBe('?next=%2Fshare');
    const header = screen.getByRole('banner');
    expect(await within(header).findByRole('link', { name: 'Log in' })).toBeInTheDocument();
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
