import api from "@/src/infraestructure/axios/api";
import type { SemesterPlan } from "@/src/modules/portal/domain/portal-plan";

export const portalPlanService = {
  async getCurrent(): Promise<SemesterPlan> {
    const response = await api.get<SemesterPlan>("/portal/plan/current");
    return response.data;
  },
};
