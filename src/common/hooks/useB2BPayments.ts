import { useQuery } from "@tanstack/react-query";
import { b2bPaymentsService } from "@/src/common/services/b2b-payments-service";
import type { PurchaseStatus } from "@/src/shared/domain/types/@b2b-payments";
import { useHasSelectedTenant } from "@/src/shared/stores/tenant-store";

export function useListB2BProducts() {
  const hasTenant = useHasSelectedTenant();

  return useQuery({
    queryKey: ["b2b-products"],
    queryFn: () => b2bPaymentsService.listProducts(),
    enabled: hasTenant,
    staleTime: 5 * 60 * 1000,
  });
}

export function useListB2BPurchases(params?: {
  status?: PurchaseStatus | "all";
  limit?: number;
  offset?: number;
}) {
  const hasTenant = useHasSelectedTenant();

  return useQuery({
    queryKey: ["b2b-purchases", params],
    queryFn: () => b2bPaymentsService.listPurchases(params),
    enabled: hasTenant,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGetB2BPurchase(id: string) {
  const hasTenant = useHasSelectedTenant();

  return useQuery({
    queryKey: ["b2b-purchase", id],
    queryFn: () => b2bPaymentsService.getPurchase(id),
    enabled: hasTenant && !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useB2BMetrics() {
  const hasTenant = useHasSelectedTenant();

  return useQuery({
    queryKey: ["b2b-metrics"],
    queryFn: () => b2bPaymentsService.getMetrics(),
    enabled: hasTenant,
    staleTime: 5 * 60 * 1000,
  });
}
