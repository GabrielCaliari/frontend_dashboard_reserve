import api from "@/src/infraestructure/axios/api";
import type { MetricGoal } from "@/src/modules/portal/domain/portal-goals";

export const portalGoalsService = {
  async getGoals(): Promise<MetricGoal[]> {
    const response = await api.get<MetricGoal[]>("/portal/goals");
    return response.data;
  },
};
