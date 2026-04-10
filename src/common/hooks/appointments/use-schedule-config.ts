import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getScheduleConfigService,
  saveScheduleConfigService,
} from "@/src/common/services/appointments/schedule-config-service";
import type {
  ScheduleConfig,
  LegacyScheduleConfig,
} from "@/src/shared/domain/types/@appointment";

export function useScheduleConfig() {
  return useQuery({
    queryKey: ["appointments", "schedule-config"],
    queryFn: getScheduleConfigService,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (not configured yet)
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function useSaveScheduleConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: ScheduleConfig) => saveScheduleConfigService(config),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointments", "schedule-config"],
      });
    },
  });
}
