import { useQuery } from '@tanstack/react-query';
import { listCollectionsAction } from '@/src/common/actions/leads/list-collections';
import type { CollectionListResponse } from '@/src/common/@types/@lead';

interface UseListCollectionsParams {
  page?: number;
  limit?: number;
  active?: boolean;
  enabled?: boolean;
}

export function useListCollections(params: UseListCollectionsParams = {}) {
  const { page = 1, limit = 10, active, enabled = true } = params;

  return useQuery<CollectionListResponse>({
    queryKey: ['lead-collections', 'list', page, limit, active],
    queryFn: () => listCollectionsAction({ page, limit, active }),
    enabled,
    staleTime: 30000,
  });
}
