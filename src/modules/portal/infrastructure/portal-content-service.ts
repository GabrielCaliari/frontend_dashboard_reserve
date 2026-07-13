import api from "@/src/infraestructure/axios/api";
import type { ContentPost } from "@/src/modules/portal/domain/portal-content";

export const portalContentService = {
  async getCalendar(month: string /* YYYY-MM */): Promise<ContentPost[]> {
    const response = await api.get<ContentPost[]>("/portal/content/calendar", { params: { month } });
    return response.data;
  },
};
