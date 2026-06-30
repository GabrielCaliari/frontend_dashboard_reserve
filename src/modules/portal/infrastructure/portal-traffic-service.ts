import api from "@/src/infraestructure/axios/api";
import type { TrafficQuery, TrafficResponse } from "@/src/modules/portal/domain/portal-traffic";

export const portalTrafficService = {
  async getTraffic(query: TrafficQuery): Promise<TrafficResponse> {
    const response = await api.get<TrafficResponse>("/portal/traffic", { params: query });
    return response.data;
  },
};
