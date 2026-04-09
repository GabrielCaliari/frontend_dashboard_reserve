import { useQuery } from "@tanstack/react-query";
import { paymentMovementsService } from "@/src/common/services/payments/payment-movements-service";
import type { ListMovementsParams } from "@/src/common/@types/@payment-movements";
import {
  useHasSelectedTenant,
  useTenantStore,
} from "@/src/common/stores/tenant-store";

export function usePaymentMovements(params?: ListMovementsParams) {
  const hasTenant = useHasSelectedTenant();
  const dashboardScope = useTenantStore((state) => state.dashboardScope);

  // Permite rodar tanto com tenant selecionado quanto no escopo global
  const isEnabled = hasTenant || dashboardScope === "global";

  return useQuery({
    queryKey: ["payment-movements", params],
    queryFn: () => paymentMovementsService.listMovements(params),
    enabled: isEnabled,
    staleTime: 2 * 60 * 1000,
  });
}
