import { useToast } from '../components/ui';

interface PagedQuery {
  fetchNextPage: () => Promise<{ isFetchNextPageError: boolean }>;
}

/**
 * The "Show more" handler every paged list shares. When the next page fails, the rows already on
 * screen stay and an error toast says so; `what` names the rows ("ideas", "people").
 */
export function useShowMore(query: PagedQuery, what: 'ideas' | 'people'): () => Promise<void> {
  const toast = useToast();
  return async () => {
    const result = await query.fetchNextPage();
    if (result.isFetchNextPageError) {
      toast.show(`We couldn't load more ${what}. Check your connection and try again.`, {
        tone: 'error',
      });
    }
  };
}
