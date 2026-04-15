import { useQuery } from "@tanstack/react-query";
import { getBillingConfigAction } from "@/src/presentation/actions/payments/get-billing-config";
import type { TenantBillingConfig } from "@/src/shared/domain/types/@payments";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

export function useBillingConfig() {
  const tenantId = useSelectedTenantId();

  return useQuery<TenantBillingConfig | null>({
    queryKey: ["billing-config", tenantId],
    queryFn: () => getBillingConfigAction(),
    enabled: !!tenantId,
    staleTime: 30000,
  });
}
