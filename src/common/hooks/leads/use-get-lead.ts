import { useQuery } from '@tanstack/react-query';
import { getLeadAction } from '@/src/common/actions/leads/get-lead';
import type { LeadDetailResponse } from '@/src/common/@types/@lead';

interface UseGetLeadParams {
  id: string;
  enabled?: boolean;
}

export function useGetLead({ id, enabled = true }: UseGetLeadParams) {
  return useQuery<LeadDetailResponse>({
    queryKey: ['leads', 'detail', id],
    queryFn: () => getLeadAction(id),
    enabled: enabled && !!id,
    staleTime: 60000,
  });
}
