import { useQuery } from "@tanstack/react-query";
import { listLeadsAction } from "@/src/presentation/actions/leads/list-leads";
import type { LeadListResponse } from "@/src/shared/domain/types/@lead";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

interface UseListLeadsParams {
  page?: number;
  limit?: number;
  status?: number;
  origin?: number;
  enabled?: boolean;
}

export function useListLeads(params: UseListLeadsParams = {}) {
  const { page = 1, limit = 30, status, origin, enabled = true } = params;
  const tenantId = useSelectedTenantId();

  return useQuery<LeadListResponse>({
    queryKey: ["leads", "list", tenantId, page, limit, status, origin],
    queryFn: () => listLeadsAction({ page, limit, status, origin }),
    enabled: enabled && !!tenantId,
    staleTime: 30000,
  });
}
