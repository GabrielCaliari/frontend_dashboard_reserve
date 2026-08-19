"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motorService } from "@/src/modules/motor/infrastructure/adapters";
import type { BulkMotorDailyInventoryDto } from "@/src/shared/domain/types/@motor";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function useMotorGrade(tenantId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["motor", "grade", tenantId, from, to],
    queryFn: () => motorService.getGrade(tenantId!, from, to),
    enabled: !!tenantId && ISO.test(from) && ISO.test(to),
  });
}

export function useBulkDailyInventory(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkMotorDailyInventoryDto) => motorService.bulkDailyInventory(tenantId, dto),
    onSuccess: (_data, dto) => {
      if (dto.dry_run) return;
      queryClient.invalidateQueries({ queryKey: ["motor", "grade", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["motor", "daily-inventory", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["motor", "calendar-range", tenantId] });
    },
  });
}
