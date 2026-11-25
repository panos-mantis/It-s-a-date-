import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginInput, RegisterInput, UserDTO } from '@itsadate/shared';
import { api, ApiError } from '../../lib/api';

export const authKeys = { me: ['auth', 'me'] as const };

export function useMe() {
  return useQuery<UserDTO | null, ApiError>({
    queryKey: authKeys.me,
    queryFn: async () => {
      try {
        return await api.get<UserDTO>('/auth/me');
      } catch (err) {
        // Logged out is data, not an error.
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<UserDTO, ApiError, LoginInput>({
    mutationKey: ['auth', 'login'],
    gcTime: 0, // don't keep the plaintext password around
    mutationFn: (input) => api.post<UserDTO>('/auth/login', input),
    onSuccess: (user) => {
      // Per-user data from a previous session must not reach the new user.
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation<UserDTO, ApiError, RegisterInput>({
    mutationKey: ['auth', 'register'],
    gcTime: 0, // don't keep the plaintext password around
    mutationFn: (input) => api.post<UserDTO>('/auth/register', input),
    onSuccess: (user) => {
      // Per-user data from a previous session must not reach the new user.
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

export function useLogout(opts: { beforeClear?: () => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationKey: ['auth', 'logout'],
    mutationFn: () => api.post<void>('/auth/logout'),
    onSuccess: () => {
      // Lets the caller leave a guarded page before the session clears and the guard redirects.
      opts.beforeClear?.();
      queryClient.setQueryData(authKeys.me, null);
      // Per-user data (myRating, saved) must not leak to the next person on this device.
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
    },
  });
}
