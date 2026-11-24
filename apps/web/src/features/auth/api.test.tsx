import { useQuery, type QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { api } from '../../lib/api';
import { createQueryClient } from '../../lib/query-client';
import { authStore } from '../../test/msw/handlers';
import { server } from '../../test/msw/server';
import { authKeys, useLogin, useLogout, useMe, useRegister } from './api';

function setup() {
  const queryClient: QueryClient = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppProviders queryClient={queryClient}>{children}</AppProviders>
  );
  return { queryClient, wrapper };
}

describe('auth hooks', () => {
  it('useMe is null when logged out', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useMe(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeNull());
    expect(result.current.isError).toBe(false);
  });

  it('useMe returns the user when logged in', async () => {
    authStore.addUser({ name: 'Ana', email: 'ana@x.com', password: 'secret123' });
    authStore.loginAs('ana@x.com');
    const { wrapper } = setup();
    const { result } = renderHook(() => useMe(), { wrapper });
    await waitFor(() => expect(result.current.data?.email).toBe('ana@x.com'));
  });

  it('login stores the user as me', async () => {
    const user = authStore.addUser({ name: 'Ana', email: 'ana@x.com', password: 'secret123' });
    const { wrapper, queryClient } = setup();
    const { result } = renderHook(() => useLogin(), { wrapper });
    await result.current.mutateAsync({ email: 'ana@x.com', password: 'secret123' });
    expect(queryClient.getQueryData(authKeys.me)).toEqual(user);
  });

  it('login with a wrong password rejects with 401', async () => {
    authStore.addUser({ name: 'Ana', email: 'ana@x.com', password: 'secret123' });
    const { wrapper, queryClient } = setup();
    queryClient.setQueryData(authKeys.me, null);
    const { result } = renderHook(() => useLogin(), { wrapper });
    await expect(
      result.current.mutateAsync({ email: 'ana@x.com', password: 'nope-nope' }),
    ).rejects.toMatchObject({ status: 401, message: 'Email or password is wrong' });
    expect(queryClient.getQueryData(authKeys.me)).toBeNull();
  });

  it('register stores the user as me', async () => {
    const { wrapper, queryClient } = setup();
    const { result } = renderHook(() => useRegister(), { wrapper });
    const user = await result.current.mutateAsync({
      name: 'Bo',
      email: 'bo@x.com',
      password: 'secret123',
    });
    expect(user.email).toBe('bo@x.com');
    expect(queryClient.getQueryData(authKeys.me)).toEqual(user);
  });

  it('register rejects a taken email with 409', async () => {
    authStore.addUser({ name: 'Ana', email: 'ana@x.com', password: 'secret123' });
    const { wrapper } = setup();
    const { result } = renderHook(() => useRegister(), { wrapper });
    await expect(
      result.current.mutateAsync({ name: 'Ana', email: 'ana@x.com', password: 'secret123' }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' });
  });

  it('logout clears me and other cached data', async () => {
    const user = authStore.addUser({ name: 'Ana', email: 'ana@x.com', password: 'secret123' });
    authStore.loginAs('ana@x.com');
    const { wrapper, queryClient } = setup();
    queryClient.setQueryData(authKeys.me, user);
    queryClient.setQueryData(['ideas', 'x'], {});
    const { result } = renderHook(() => useLogout(), { wrapper });
    await result.current.mutateAsync();
    expect(queryClient.getQueryData(authKeys.me)).toBeNull();
    expect(queryClient.getQueryData(['ideas', 'x'])).toBeUndefined();
  });

  it('a 401 on any query logs the user out', async () => {
    const user = authStore.addUser({ name: 'Ana', email: 'ana@x.com', password: 'secret123' });
    const { wrapper, queryClient } = setup();
    queryClient.setQueryData(authKeys.me, user);
    server.use(
      http.get('*/api/v1/ideas', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
          { status: 401 },
        ),
      ),
    );
    renderHook(() => useQuery({ queryKey: ['ideas'], queryFn: () => api.get('/ideas') }), {
      wrapper,
    });
    await waitFor(() => expect(queryClient.getQueryData(authKeys.me)).toBeNull());
  });
});
