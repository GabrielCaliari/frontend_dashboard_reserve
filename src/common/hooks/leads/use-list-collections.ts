import { useQuery } from '@tanstack/react-query';
import { listCollectionsAction } from '@/src/common/actions/leads/list-collections';
import type { CollectionListResponse, CollectionAccessMode } from '@/src/common/@types/@lead';

interface UseListCollectionsParams {
  page?: number;
  limit?: number;
  access_mode?: CollectionAccessMode;
  active?: boolean;
  enabled?: boolean;
}

export function useListCollections(params: UseListCollectionsParams = {}) {
  const { page = 1, limit = 10, access_mode, active, enabled = true } = params;

  return useQuery<CollectionListResponse>({
    queryKey: ['lead-collections', 'list', page, limit, access_mode, active],
    queryFn: () => listCollectionsAction({ page, limit, access_mode, active }),
    enabled,
    staleTime: 30000, // 30 seconds
  });
}
