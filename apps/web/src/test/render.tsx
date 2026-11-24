import { QueryClient } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '../app/providers';
import { routes } from '../app/routes';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  opts: { queryClient?: QueryClient } = {},
): RenderResult & { user: UserEvent; queryClient: QueryClient } {
  const queryClient = opts.queryClient ?? createTestQueryClient();
  const result = render(<AppProviders queryClient={queryClient}>{ui}</AppProviders>);
  return { ...result, user: userEvent.setup(), queryClient };
}

export function renderApp(
  path: string,
  opts: { queryClient?: QueryClient } = {},
): RenderResult & {
  user: UserEvent;
  queryClient: QueryClient;
  router: ReturnType<typeof createMemoryRouter>;
} {
  const queryClient = opts.queryClient ?? createTestQueryClient();
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const result = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...result, user: userEvent.setup(), queryClient, router };
}
