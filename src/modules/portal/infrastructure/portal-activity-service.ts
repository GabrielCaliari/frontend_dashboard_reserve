import api from "@/src/infraestructure/axios/api";
import type { ActivityLogEntry } from "@/src/modules/portal/domain/portal-content";

export const portalActivityService = {
  async getFeed(limit?: number): Promise<ActivityLogEntry[]> {
    const response = await api.get<ActivityLogEntry[]>("/portal/activity", { params: limit ? { limit } : undefined });
    return response.data;
  },
};
