import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { couponsService } from "@/src/common/services/coupons-service";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";
import type {
  CreateCouponPayload,
  UpdateCouponPayload,
} from "@/src/shared/domain/types/@coupons";

const QUERY_KEY = "coupons";

export function useListCoupons(params?: { page?: number; limit?: number }) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => couponsService.list(params),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGetCoupon(id: string) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => couponsService.getById(id),
    enabled: !!tenantId && !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCouponPayload) => couponsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateCoupon(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCouponPayload) => couponsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeactivateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => couponsService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useGetCouponLink() {
  return useMutation({
    mutationFn: ({ id, baseUrl }: { id: string; baseUrl?: string }) =>
      couponsService.getLink(id, baseUrl),
  });
}
