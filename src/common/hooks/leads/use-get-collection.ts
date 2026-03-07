import { useQuery } from '@tanstack/react-query';
import { getCollectionAction } from '@/src/common/actions/leads/get-collection';
import type { CollectionDetailResponse } from '@/src/common/@types/@lead';

interface UseGetCollectionParams {
  id: number;
  enabled?: boolean;
}

export function useGetCollection({ id, enabled = true }: UseGetCollectionParams) {
  return useQuery<CollectionDetailResponse>({
    queryKey: ['lead-collections', 'detail', id],
    queryFn: () => getCollectionAction(id),
    enabled: enabled && !!id,
    staleTime: 60000,
  });
}
