import { useQuery } from "@tanstack/react-query";
import { getLeadAction } from "@/src/presentation/actions/leads/get-lead";
import type { LeadDetailResponse } from "@/src/shared/domain/types/@lead";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

interface UseGetLeadParams {
  id: string;
  enabled?: boolean;
}

export function useGetLead({ id, enabled = true }: UseGetLeadParams) {
  const tenantId = useSelectedTenantId();

  return useQuery<LeadDetailResponse>({
    queryKey: ["leads", "detail", tenantId, id],
    queryFn: () => getLeadAction(id),
    enabled: enabled && !!tenantId && !!id,
    staleTime: 60000,
  });
}
