import { useQuery } from "@tanstack/react-query";
import { getCollectionLeadsAction } from "@/src/presentation/actions/leads/get-collection-leads";
import type { LeadListResponse } from "@/src/shared/domain/types/@lead";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

interface UseGetCollectionLeadsParams {
  collectionId: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useGetCollectionLeads({
  collectionId,
  page = 1,
  limit = 30,
  enabled = true,
}: UseGetCollectionLeadsParams) {
  const tenantId = useSelectedTenantId();

  return useQuery<LeadListResponse>({
    queryKey: [
      "lead-collections",
      "leads",
      tenantId,
      collectionId,
      page,
      limit,
    ],
    queryFn: () => getCollectionLeadsAction(collectionId, { page, limit }),
    enabled: enabled && !!tenantId && !!collectionId,
    staleTime: 30000,
  });
}
