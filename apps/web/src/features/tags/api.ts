import { useQuery } from '@tanstack/react-query';
import type { TagDTO } from '@itsadate/shared';
import { api, ApiError } from '../../lib/api';

export function useTags() {
  return useQuery<TagDTO[], ApiError>({
    queryKey: ['tags'],
    queryFn: ({ signal }) => api.get<TagDTO[]>('/tags', { signal }),
    staleTime: 5 * 60_000,
  });
}
