import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { authKeys } from '../features/auth/api';
import { ApiError } from './api';

export function createQueryClient(): QueryClient {
  // A 401 from anything except the auth calls themselves means the session has ended.
  const onUnauthorized = (error: unknown, key: readonly unknown[] | undefined) => {
    if (error instanceof ApiError && error.status === 401 && key?.[0] !== 'auth') {
      queryClient.setQueryData(authKeys.me, null);
    }
  };
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => onUnauthorized(error, query.queryKey),
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) =>
        onUnauthorized(error, mutation.options.mutationKey),
    }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500 && error.status !== 0) &&
          failureCount < 2,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
  return queryClient;
}
