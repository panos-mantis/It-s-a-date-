import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import {
  PAGE_SIZE_DEFAULT,
  type IdeaDTO,
  type IdeaStatus,
  type IdeaUpdateInput,
  type Paginated,
  type Role,
  type TagCreateInput,
  type TagDTO,
  type TagUpdateInput,
  type UserDTO,
} from '@itsadate/shared';
import { api, ApiError } from '../../lib/api';
import { authKeys } from '../auth/api';
import { ideaKeys } from '../ideas/api';

export const adminKeys = {
  all: ['admin'] as const,
  ideas: (status: IdeaStatus, q?: string) => ['admin', 'ideas', status, q] as const,
  users: (q?: string) => ['admin', 'users', q] as const,
};

type IdeaPage = Paginated<IdeaDTO>;

/** The admin ideas list for one status: the pending queue is oldest first, the rest newest first. */
export function useAdminIdeas(status: IdeaStatus, q?: string) {
  const search = q?.trim() || undefined;
  return useInfiniteQuery<
    IdeaPage,
    ApiError,
    InfiniteData<IdeaPage, number>,
    readonly unknown[],
    number
  >({
    queryKey: adminKeys.ideas(status, search),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.get<IdeaPage>('/admin/ideas', {
        query: { status, q: search, page: pageParam, pageSize: PAGE_SIZE_DEFAULT },
        signal,
      }),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    // A new search or filter keeps the rows on screen until the answer arrives.
    placeholderData: keepPreviousData,
  });
}

// Everything an idea change touches: the queue and All ideas, Home and detail, the author's list.
// Resolves once the lists on screen have refetched, so a row leaves (or comes back) with the answer.
function refreshIdeas(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'ideas'] }),
    queryClient.invalidateQueries({ queryKey: ['ideas'] }),
    queryClient.invalidateQueries({ queryKey: ideaKeys.mine }),
  ]);
}

export interface IdeaUpdate {
  id: string;
  input: IdeaUpdateInput;
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();
  return useMutation<IdeaDTO, ApiError, IdeaUpdate>({
    mutationKey: ['admin', 'ideas', 'update'],
    mutationFn: ({ id, input }) =>
      api.patch<IdeaDTO>(`/admin/ideas/${encodeURIComponent(id)}`, input),
    onSuccess: () => refreshIdeas(queryClient),
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationKey: ['admin', 'ideas', 'delete'],
    mutationFn: (id) => api.delete<void>(`/admin/ideas/${encodeURIComponent(id)}`),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ideaKeys.detail(id) });
      return refreshIdeas(queryClient);
    },
  });
}

// Tags feed the category row on Home and the chips on every idea, so a change refreshes both.
// Resolves once the lists on screen have refetched.
function refreshTags(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['tags'] }),
    queryClient.invalidateQueries({ queryKey: ['ideas'] }),
  ]);
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation<TagDTO, ApiError, TagCreateInput>({
    mutationKey: ['admin', 'tags', 'create'],
    mutationFn: (input) => api.post<TagDTO>('/admin/tags', input),
    onSuccess: () => refreshTags(queryClient),
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation<TagDTO, ApiError, { id: string; input: TagUpdateInput }>({
    mutationKey: ['admin', 'tags', 'update'],
    mutationFn: ({ id, input }) =>
      api.patch<TagDTO>(`/admin/tags/${encodeURIComponent(id)}`, input),
    onSuccess: () => refreshTags(queryClient),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationKey: ['admin', 'tags', 'delete'],
    mutationFn: (id) => api.delete<void>(`/admin/tags/${encodeURIComponent(id)}`),
    onSuccess: () => refreshTags(queryClient),
  });
}

type UserPage = Paginated<UserDTO>;

/** People by name or email, newest first. */
export function useAdminUsers(q?: string) {
  const search = q?.trim() || undefined;
  return useInfiniteQuery<
    UserPage,
    ApiError,
    InfiniteData<UserPage, number>,
    readonly unknown[],
    number
  >({
    queryKey: adminKeys.users(search),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.get<UserPage>('/admin/users', {
        query: { q: search, page: pageParam, pageSize: PAGE_SIZE_DEFAULT },
        signal,
      }),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });
}

export function useSetRole() {
  const queryClient = useQueryClient();
  return useMutation<UserDTO, ApiError, { id: string; role: Role }>({
    mutationKey: ['admin', 'users', 'role'],
    mutationFn: ({ id, role }) =>
      api.post<UserDTO>(`/admin/users/${encodeURIComponent(id)}/role`, { role }),
    onSuccess: (_user, { id }) => {
      const me = queryClient.getQueryData<UserDTO | null>(authKeys.me);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
        // Changing your own role changes what you may see: the guard re-reads who you are.
        me?.id === id ? queryClient.invalidateQueries({ queryKey: authKeys.me }) : undefined,
      ]);
    },
  });
}
