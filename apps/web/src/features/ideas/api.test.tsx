import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../app/providers';
import { ApiError } from '../../lib/api';
import { ideaFixtures } from '../../test/fixtures/ideas';
import { tagFixtures } from '../../test/fixtures/tags';
import { authStore } from '../../test/msw/handlers';
import { ideaStore, uploadedImage, uploadStore } from '../../test/msw/ideas-handlers';
import { server } from '../../test/msw/server';
import { createTestQueryClient } from '../../test/render';
import { useTags } from '../tags/api';
import { ideaKeys, useCreateIdea, useIdea, useIdeas, useMyIdeas, useUploadImage } from './api';
import type { IdeaSearch } from './search';

const empty: IdeaSearch = { q: '', tag: '', budget: '', duration: '', sort: 'new' };

function setup() {
  const queryClient: QueryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppProviders queryClient={queryClient}>{children}</AppProviders>
  );
  return { queryClient, wrapper };
}

function ideaId(title: string): string {
  const found = ideaFixtures.find((i) => i.title === title);
  if (!found) throw new Error('No fixture titled ' + title);
  return found.id;
}

function loginAsMaya() {
  authStore.addUser({ name: 'Maya Chen', email: 'maya.chen@example.com', password: 'secret123' });
  authStore.loginAs('maya.chen@example.com');
}

describe('useIdeas', () => {
  it('passes filters to the API', async () => {
    let search = '';
    server.use(
      http.get('*/api/v1/ideas', ({ request }) => {
        search = new URL(request.url).search;
        return HttpResponse.json({ items: [], page: 1, pageSize: 24, total: 0 });
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useIdeas({ q: 'dumpling', tag: 'food', budget: '2', duration: 'short', sort: 'top' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Object.fromEntries(new URLSearchParams(search))).toMatchObject({
      q: 'dumpling',
      tag: 'food',
      budget: '2',
      duration: 'short',
      sort: 'top',
      page: '1',
      pageSize: '24',
    });
  });

  it('lists every approved fixture on one page', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useIdeas(empty), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.items).toHaveLength(12);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('fetches page 2 on fetchNextPage', async () => {
    const base = ideaFixtures[2]!;
    ideaStore.set(
      Array.from({ length: 30 }, (_, i) => ({ ...base, id: `bulk-${i}`, title: `Bulk ${i}` })),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useIdeas(empty), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
    await act(() => result.current.fetchNextPage());
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.data?.pages[1]?.items).toHaveLength(6);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('filters by tag and budget', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useIdeas({ ...empty, tag: 'food', budget: '3', sort: 'top' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.items.map((i) => i.title)).toEqual([
      'Sushi counter night',
    ]);
  });

  it('sorts by rating and searches text', async () => {
    const { wrapper } = setup();
    const top = renderHook(() => useIdeas({ ...empty, sort: 'top' }), { wrapper });
    await waitFor(() => expect(top.result.current.isSuccess).toBe(true));
    expect(top.result.current.data?.pages[0]?.items[0]?.title).toBe(
      'Bookshop and coffee afternoon',
    );

    const text = renderHook(() => useIdeas({ ...empty, q: 'DUMPLING' }), { wrapper });
    await waitFor(() => expect(text.result.current.isSuccess).toBe(true));
    expect(text.result.current.data?.pages[0]?.items.map((i) => i.title)).toEqual([
      'Dumpling crawl',
    ]);
  });

  it('never lists pending or rejected ideas', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useIdeas(empty), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const statuses = result.current.data?.pages.flatMap((p) => p.items.map((i) => i.status));
    expect(new Set(statuses)).toEqual(new Set(['approved']));
  });
});

describe('useIdea', () => {
  it('returns an approved idea', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useIdea(ideaId('Dumpling crawl')), { wrapper });
    await waitFor(() => expect(result.current.data?.title).toBe('Dumpling crawl'));
  });

  it('is a 404 for a pending idea when logged out', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useIdea(ideaId('Sunday pastry walk')), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.status).toBe(404);
  });
});

describe('useIdea visibility and params', () => {
  it('shows a pending idea to its creator', async () => {
    loginAsMaya();
    const { wrapper } = setup();
    const { result } = renderHook(() => useIdea(ideaId('Sunday pastry walk')), { wrapper });
    await waitFor(() => expect(result.current.data?.status).toBe('pending'));
  });

  it('hides a pending idea from another user but shows it to an admin', async () => {
    authStore.addUser({ name: 'Sam', email: 'sam@x.com', password: 'secret123' });
    authStore.loginAs('sam@x.com');
    const other = renderHook(() => useIdea(ideaId('Sunday pastry walk')), {
      wrapper: setup().wrapper,
    });
    await waitFor(() => expect(other.result.current.error?.status).toBe(404));

    authStore.addUser({
      name: 'Panos',
      email: 'panos@example.com',
      password: 'secret123',
      role: 'admin',
    });
    authStore.loginAs('panos@example.com');
    const admin = renderHook(() => useIdea(ideaId('Sunday pastry walk')), {
      wrapper: setup().wrapper,
    });
    await waitFor(() => expect(admin.result.current.data?.status).toBe('pending'));
  });

  it('is a 422 on params for an id that is not an ObjectId', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useIdea('dumpling-crawl'), { wrapper });
    await waitFor(() => expect(result.current.error?.status).toBe(422));
    expect(result.current.error?.issues).toContainEqual(
      expect.objectContaining({ location: 'params', path: 'id' }),
    );
  });

  it('gives the session user the same id as the ideas they created', async () => {
    loginAsMaya();
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyIdeas(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(authStore.sessionUser()?.id).toBe(ideaFixtures[2]?.creator.id);
  });
});

describe('useMyIdeas and useCreateIdea', () => {
  it('lists Maya ideas of every status', async () => {
    loginAsMaya();
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyIdeas(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const items = result.current.data?.pages.flatMap((p) => p.items) ?? [];
    expect(items.map((i) => i.status).sort()).toEqual([
      'approved',
      'approved',
      'approved',
      'pending',
      'rejected',
    ]);
  });

  it('is unauthorised when logged out', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useMyIdeas(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.status).toBe(401);
  });

  it('creates a pending idea and refreshes my ideas', async () => {
    loginAsMaya();
    const { wrapper, queryClient } = setup();
    // One tree for both hooks, so the refetch re-renders the list inside the same act scope.
    const { result } = renderHook(() => ({ mine: useMyIdeas(), create: useCreateIdea() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.mine.isSuccess).toBe(true));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    await act(() =>
      result.current.create.mutateAsync({
        title: 'Rooftop stargazing',
        description: 'Take a blanket and a flask up to a rooftop and name the stars.',
        image: uploadedImage(),
        tagIds: [tagFixtures[0]!.id],
        placeType: 'none',
        budget: 1,
        duration: 'short',
      }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ideaKeys.mine });
    await waitFor(() =>
      expect(result.current.mine.data?.pages.flatMap((p) => p.items).map((i) => i.title)).toContain(
        'Rooftop stargazing',
      ),
    );
  });

  it('rejects an image that was not uploaded through the app', async () => {
    loginAsMaya();
    const { wrapper } = setup();
    const create = renderHook(() => useCreateIdea(), { wrapper });
    await act(async () => {
      await create.result.current
        .mutateAsync({
          title: 'Rooftop stargazing',
          description: 'Take a blanket and a flask up to a rooftop and name the stars.',
          image: { url: 'https://example.com/a.jpg', publicId: 'a' },
          tagIds: [tagFixtures[0]!.id],
          placeType: 'none',
          budget: 1,
          duration: 'short',
        })
        .catch(() => undefined);
    });
    await waitFor(() => expect(create.result.current.error?.status).toBe(422));
    expect(create.result.current.error?.issues).toContainEqual(
      expect.objectContaining({ location: 'body', path: 'image' }),
    );
  });

  it('returns 422 issues in the API shape', async () => {
    loginAsMaya();
    const { wrapper } = setup();
    const create = renderHook(() => useCreateIdea(), { wrapper });
    await act(async () => {
      await create.result.current.mutateAsync({ title: 'x' } as never).catch(() => undefined);
    });
    await waitFor(() => expect(create.result.current.error?.status).toBe(422));
    expect(create.result.current.error?.issues).toContainEqual(
      expect.objectContaining({ location: 'body', path: 'title' }),
    );
  });
});

describe('useUploadImage', () => {
  const file = new File(['x'], 'a.png', { type: 'image/png' });

  it('uploads and returns the image', async () => {
    loginAsMaya();
    const { wrapper } = setup();
    const onProgress = vi.fn();
    const { result } = renderHook(() => useUploadImage(), { wrapper });
    let image: unknown;
    await act(async () => {
      image = await result.current.mutateAsync({ file, onProgress });
    });
    expect(image).toMatchObject({
      url: expect.stringMatching(/^https:/) as string,
      publicId: expect.stringContaining('itsadate') as string,
    });
  });

  it('surfaces a rejection as an ApiError', async () => {
    loginAsMaya();
    uploadStore.mode('reject');
    const { wrapper } = setup();
    const { result } = renderHook(() => useUploadImage(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ file }).catch(() => undefined);
    });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.error?.status).toBe(422);
  });

  it('surfaces a network failure', async () => {
    loginAsMaya();
    uploadStore.mode('network');
    const { wrapper } = setup();
    const { result } = renderHook(() => useUploadImage(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ file }).catch(() => undefined);
    });
    await waitFor(() => expect(result.current.error?.code).toBe('NETWORK'));
  });
});

describe('useTags', () => {
  it('lists the tags', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useTags(), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(8));
  });
});
