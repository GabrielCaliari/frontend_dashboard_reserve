import { useQuery } from "@tanstack/react-query";
import { paymentMovementsService } from "@/src/modules/payments/infrastructure/adapters";
import type { ListMovementsParams } from "@/src/shared/domain/types/@payment-movements";
import {
  useHasSelectedTenant,
  useSelectedTenantId,
} from "@/src/shared/stores/tenant-store";

export function usePaymentMovements(params?: ListMovementsParams) {
  const hasTenant = useHasSelectedTenant();
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ["payment-movements", tenantId, params],
    queryFn: () => paymentMovementsService.listMovements(params),
    enabled: hasTenant,
    staleTime: 2 * 60 * 1000,
  });
}
