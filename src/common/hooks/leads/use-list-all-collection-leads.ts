import { useQuery } from '@tanstack/react-query';
import { listAllCollectionLeadsAction } from '@/src/common/actions/leads/list-all-collection-leads';
import type { LeadListResponse } from '@/src/common/@types/@lead';

interface UseListAllCollectionLeadsParams {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useListAllCollectionLeads(params: UseListAllCollectionLeadsParams = {}) {
  const { page = 1, limit = 30, enabled = true } = params;

  return useQuery<LeadListResponse>({
    queryKey: ['lead-collections', 'all-leads', page, limit],
    queryFn: () => listAllCollectionLeadsAction({ page, limit }),
    enabled,
    staleTime: 30000,
  });
}
