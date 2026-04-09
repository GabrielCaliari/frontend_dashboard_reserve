import { apiClient } from "@/src/common/config/api";
import type {
  ScheduleConfig,
  LegacyScheduleConfig,
} from "@/src/common/@types/@appointment";

export interface GetScheduleConfigResponse {
  data: ScheduleConfig | LegacyScheduleConfig;
  status: number;
}

export interface SaveScheduleConfigResponse {
  data: ScheduleConfig;
  status: number;
}

export async function getScheduleConfigService(): Promise<GetScheduleConfigResponse> {
  const response = await apiClient.get(
    "/leads/admin/appointments/schedule-config",
  );
  return response.data;
}

export async function saveScheduleConfigService(
  config: ScheduleConfig,
): Promise<SaveScheduleConfigResponse> {
  // Convert new format to legacy format for API compatibility
  const enabledDays = Object.entries(config.days).filter(
    ([_, day]) => day.enabled,
  );

  if (enabledDays.length === 0) {
    throw new Error("At least one working day must be enabled");
  }

  // Find the most common schedule among enabled days
  const schedules = enabledDays.map(([_, day]) => ({
    workStartTime: day.workStartTime,
    workEndTime: day.workEndTime,
    lunchStartTime: day.lunchStartTime || "",
    lunchEndTime: day.lunchEndTime || "",
  }));

  // Use the first schedule as the representative one
  // In a more sophisticated approach, you could find the most common one
  const representativeSchedule = schedules[0];

  const legacyConfig: LegacyScheduleConfig = {
    workingDays: enabledDays.map(([dayNum]) => parseInt(dayNum)),
    workStartTime: representativeSchedule.workStartTime,
    workEndTime: representativeSchedule.workEndTime,
    slotIntervalMinutes: config.slotIntervalMinutes,
    capacityPerSlot: config.capacityPerSlot,
  };

  // Add lunch times if they exist
  if (representativeSchedule.lunchStartTime) {
    legacyConfig.lunchStartTime = representativeSchedule.lunchStartTime;
  }
  if (representativeSchedule.lunchEndTime) {
    legacyConfig.lunchEndTime = representativeSchedule.lunchEndTime;
  }

  const response = await apiClient.put(
    "/leads/admin/appointments/schedule-config",
    legacyConfig,
  );
  return response.data;
}
