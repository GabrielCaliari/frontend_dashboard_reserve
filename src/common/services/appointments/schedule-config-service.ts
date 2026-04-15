import { apiClient } from "@/src/common/config/api";
import type { ScheduleConfig, LegacyScheduleConfig } from "@/src/common/@types/@appointment";

export interface GetScheduleConfigResponse {
  data: ScheduleConfig | LegacyScheduleConfig;
  status: number;
}

export interface SaveScheduleConfigResponse {
  data: ScheduleConfig;
  status: number;
}

export async function getScheduleConfigService(): Promise<GetScheduleConfigResponse> {
  const response = await apiClient.get("/leads/admin/appointments/schedule-config");
  return response.data;
}

export async function saveScheduleConfigService(
  config: ScheduleConfig
): Promise<SaveScheduleConfigResponse> {
  const response = await apiClient.put("/leads/admin/appointments/schedule-config", config);
  return response.data;
}
