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
} from '@itsadate/shared';
import { api, ApiError } from '../../lib/api';
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
