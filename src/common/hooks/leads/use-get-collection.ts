import { useQuery } from "@tanstack/react-query";
import { getCollectionAction } from "@/src/common/actions/leads/get-collection";
import type { CollectionDetailResponse } from "@/src/shared/domain/types/@lead";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

interface UseGetCollectionParams {
  id: string;
  enabled?: boolean;
}

export function useGetCollection({
  id,
  enabled = true,
}: UseGetCollectionParams) {
  const tenantId = useSelectedTenantId();

  return useQuery<CollectionDetailResponse>({
    queryKey: ["lead-collections", "detail", tenantId, id],
    queryFn: () => getCollectionAction(id),
    enabled: enabled && !!tenantId && !!id,
    staleTime: 60000,
  });
}
