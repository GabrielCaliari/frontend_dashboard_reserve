import { useQuery } from "@tanstack/react-query";
import { listAllCollectionLeadsAction } from "@/src/presentation/actions/leads/list-all-collection-leads";
import type { LeadListResponse } from "@/src/shared/domain/types/@lead";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

interface UseListAllCollectionLeadsParams {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useListAllCollectionLeads(
  params: UseListAllCollectionLeadsParams = {},
) {
  const { page = 1, limit = 30, enabled = true } = params;
  const tenantId = useSelectedTenantId();

  return useQuery<LeadListResponse>({
    queryKey: ["lead-collections", "all-leads", tenantId, page, limit],
    queryFn: () => listAllCollectionLeadsAction({ page, limit }),
    enabled: enabled && !!tenantId,
    staleTime: 30000,
  });
}
