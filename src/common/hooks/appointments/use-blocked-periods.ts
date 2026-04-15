import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listBlockedPeriodsService,
  createBlockedPeriodService,
  deleteBlockedPeriodService,
  type ListBlockedPeriodsParams,
} from "@/src/common/services/appointments/blocked-periods-service";
import type { BlockedPeriod } from "@/src/common/@types/@appointment";

export function useListBlockedPeriods(params: ListBlockedPeriodsParams = {}) {
  return useQuery({
    queryKey: ["appointments", "blocked-periods", params],
    queryFn: () => listBlockedPeriodsService(params),
  });
}

export function useCreateBlockedPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (period: Omit<BlockedPeriod, "id" | "tenantId" | "createdAt">) =>
      createBlockedPeriodService(period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "blocked-periods"] });
    },
  });
}

export function useDeleteBlockedPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBlockedPeriodService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "blocked-periods"] });
    },
  });
}
