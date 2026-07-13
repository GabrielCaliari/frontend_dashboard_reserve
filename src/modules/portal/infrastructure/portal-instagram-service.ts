import api from "@/src/infraestructure/axios/api";
import type { InstagramOverview, InstagramQuery } from "@/src/modules/portal/domain/portal-instagram";

export const portalInstagramService = {
  async getOverview(query: InstagramQuery): Promise<InstagramOverview> {
    const response = await api.get<InstagramOverview>("/portal/instagram/overview", { params: query });
    return response.data;
  },
};
