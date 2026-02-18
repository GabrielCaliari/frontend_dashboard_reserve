import { useQuery } from '@tanstack/react-query';
import { listLeadsAction } from '@/src/common/actions/leads/list-leads';
import type { LeadListResponse } from '@/src/common/@types/@lead';

interface UseListLeadsParams {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useListLeads(params: UseListLeadsParams = {}) {
  const { page = 1, limit = 30, enabled = true } = params;

  return useQuery<LeadListResponse>({
    queryKey: ['leads', 'list', page, limit],
    queryFn: () => listLeadsAction({ page, limit }),
    enabled,
    staleTime: 30000, // 30 seconds
  });
}
