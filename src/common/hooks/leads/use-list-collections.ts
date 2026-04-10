import { useQuery } from "@tanstack/react-query";
import { listCollectionsAction } from "@/src/common/actions/leads/list-collections";
import type { CollectionListResponse } from "@/src/shared/domain/types/@lead";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

interface UseListCollectionsParams {
  page?: number;
  limit?: number;
  active?: boolean;
  enabled?: boolean;
}

export function useListCollections(params: UseListCollectionsParams = {}) {
  const { page = 1, limit = 10, active, enabled = true } = params;
  const tenantId = useSelectedTenantId();

  return useQuery<CollectionListResponse>({
    queryKey: ["lead-collections", "list", tenantId, page, limit, active],
    queryFn: () => listCollectionsAction({ page, limit, active }),
    enabled: enabled && !!tenantId,
    staleTime: 30000,
  });
}
