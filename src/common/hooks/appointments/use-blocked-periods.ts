import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listBlockedPeriodsService,
  createBlockedPeriodService,
  updateBlockedPeriodService,
  deleteBlockedPeriodService,
  type ListBlockedPeriodsParams,
} from "@/src/common/services/appointments/blocked-periods-service";
import type { BlockedPeriod } from "@/src/shared/domain/types/@appointment";

export function useListBlockedPeriods(params: ListBlockedPeriodsParams = {}) {
  return useQuery({
    queryKey: ["appointments", "blocked-periods", params],
    queryFn: () => listBlockedPeriodsService(params),
  });
}

export function useCreateBlockedPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      period: Omit<BlockedPeriod, "id" | "tenantId" | "createdAt">,
    ) => createBlockedPeriodService(period),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments", "blocked-periods"],
      });
    },
  });
}

export function useUpdateBlockedPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      period,
    }: {
      id: string;
      period: Omit<BlockedPeriod, "id" | "tenantId" | "createdAt">;
    }) => updateBlockedPeriodService(id, period),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments", "blocked-periods"],
      });
    },
  });
}

export function useDeleteBlockedPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBlockedPeriodService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments", "blocked-periods"],
      });
    },
  });
}
