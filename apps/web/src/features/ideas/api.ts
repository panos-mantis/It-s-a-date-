import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  PAGE_SIZE_DEFAULT,
  type IdeaCreateInput,
  type IdeaDTO,
  type Paginated,
} from '@itsadate/shared';
import { API_BASE, api, ApiError, NETWORK_MESSAGE, toApiError } from '../../lib/api';
import type { IdeaSearch } from './search';

export const ideaKeys = {
  list: (s: IdeaSearch) => ['ideas', 'list', s] as const,
  detail: (id: string) => ['ideas', 'detail', id] as const,
  // Per-user data: cleared on login and logout (keys not starting with 'auth').
  mine: ['me', 'ideas'] as const,
};

type IdeaPage = Paginated<IdeaDTO>;

function nextPage(last: IdeaPage): number | undefined {
  return last.page * last.pageSize < last.total ? last.page + 1 : undefined;
}

export function useIdeas(s: IdeaSearch) {
  return useInfiniteQuery<
    IdeaPage,
    ApiError,
    InfiniteData<IdeaPage, number>,
    readonly unknown[],
    number
  >({
    queryKey: ideaKeys.list(s),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.get<IdeaPage>('/ideas', {
        query: { ...s, page: pageParam, pageSize: PAGE_SIZE_DEFAULT },
        signal,
      }),
    getNextPageParam: nextPage,
  });
}

export function useIdea(id: string) {
  return useQuery<IdeaDTO, ApiError>({
    queryKey: ideaKeys.detail(id),
    queryFn: ({ signal }) => api.get<IdeaDTO>(`/ideas/${encodeURIComponent(id)}`, { signal }),
  });
}

export function useMyIdeas() {
  return useInfiniteQuery<
    IdeaPage,
    ApiError,
    InfiniteData<IdeaPage, number>,
    readonly unknown[],
    number
  >({
    queryKey: ideaKeys.mine,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.get<IdeaPage>('/me/ideas', {
        query: { page: pageParam, pageSize: PAGE_SIZE_DEFAULT },
        signal,
      }),
    getNextPageParam: nextPage,
  });
}

export function useCreateIdea() {
  const queryClient = useQueryClient();
  return useMutation<IdeaDTO, ApiError, IdeaCreateInput>({
    mutationKey: ['me', 'ideas', 'create'],
    mutationFn: (input) => api.post<IdeaDTO>('/ideas', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ideaKeys.mine }),
  });
}

export interface UploadedImage {
  url: string;
  publicId: string;
}

interface UploadInput {
  file: File;
  /** Whole percent, 0 to 100. */
  onProgress?: (pct: number) => void;
}

// XMLHttpRequest because fetch cannot report upload progress.
function uploadWithProgress({ file, onProgress }: UploadInput): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('image', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/uploads/image`);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new ApiError(0, 'NETWORK', NETWORK_MESSAGE));
    xhr.onload = () => {
      let json: unknown;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        json = undefined;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(json as UploadedImage);
      else reject(toApiError(xhr.status, json));
    };
    xhr.send(form);
  });
}

export function useUploadImage() {
  return useMutation<UploadedImage, ApiError, UploadInput>({
    mutationKey: ['me', 'uploads', 'image'],
    mutationFn: uploadWithProgress,
  });
}
