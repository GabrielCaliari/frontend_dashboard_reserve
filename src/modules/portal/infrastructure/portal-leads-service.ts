import api from "@/src/infraestructure/axios/api";
import type {
  LeadsCamada1Query,
  LeadsCamada1Response,
  LinkConversionRow,
} from "@/src/modules/portal/domain/portal-leads";

export const portalLeadsService = {
  async getCamada1(query: LeadsCamada1Query): Promise<LeadsCamada1Response> {
    const response = await api.get<LeadsCamada1Response>("/portal/leads/camada-1", { params: query });
    return response.data;
  },

  async getLinkConversionRates(query: LeadsCamada1Query): Promise<LinkConversionRow[]> {
    const response = await api.get<LinkConversionRow[]>("/portal/leads/link-conversion-rate", { params: query });
    return response.data;
  },
};
