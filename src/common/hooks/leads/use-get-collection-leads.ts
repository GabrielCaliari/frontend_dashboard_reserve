import { useQuery } from '@tanstack/react-query';
import { getCollectionLeadsAction } from '@/src/common/actions/leads/get-collection-leads';
import type { LeadListResponse } from '@/src/common/@types/@lead';

interface UseGetCollectionLeadsParams {
  collectionId: number;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useGetCollectionLeads({ collectionId, page = 1, limit = 30, enabled = true }: UseGetCollectionLeadsParams) {
  return useQuery<LeadListResponse>({
    queryKey: ['lead-collections', 'leads', collectionId, page, limit],
    queryFn: () => getCollectionLeadsAction(collectionId, { page, limit }),
    enabled: enabled && !!collectionId,
    staleTime: 30000,
  });
}
