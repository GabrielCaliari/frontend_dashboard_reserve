import { useQuery } from "@tanstack/react-query";
import { getLeadAction } from "@/src/common/actions/leads/get-lead";
import type { LeadDetailResponse } from "@/src/common/@types/@lead";
import { useSelectedTenantId } from "@/src/common/stores/tenant-store";

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
