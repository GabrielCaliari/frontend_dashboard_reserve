import { useQuery } from '@tanstack/react-query';
import { getCollectionLeadsAction } from '@/src/common/actions/leads/get-collection-leads';
import type { LeadListResponse } from '@/src/common/@types/@lead';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

interface UseGetCollectionLeadsParams {
  collectionId: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useGetCollectionLeads({ collectionId, page = 1, limit = 30, enabled = true }: UseGetCollectionLeadsParams) {
  const tenantId = useSelectedTenantId();

  return useQuery<LeadListResponse>({
    queryKey: ['lead-collections', 'leads', tenantId, collectionId, page, limit],
    queryFn: () => getCollectionLeadsAction(collectionId, { page, limit }),
    enabled: enabled && !!tenantId && !!collectionId,
    staleTime: 30000,
  });
}
