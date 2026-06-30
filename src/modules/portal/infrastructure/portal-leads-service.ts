import api from "@/src/infraestructure/axios/api";
import type { LeadsCamada1Query, LeadsCamada1Response } from "@/src/modules/portal/domain/portal-leads";

export const portalLeadsService = {
  async getCamada1(query: LeadsCamada1Query): Promise<LeadsCamada1Response> {
    const response = await api.get<LeadsCamada1Response>("/portal/leads/camada-1", { params: query });
    return response.data;
  },
};
