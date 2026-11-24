import { QueryClient } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { AppProviders } from '../app/providers';

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
