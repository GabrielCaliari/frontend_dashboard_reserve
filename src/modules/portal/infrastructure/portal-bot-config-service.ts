import api from "@/src/infraestructure/axios/api";
import type { BotConfigField, BotConfigProposal } from "@/src/modules/portal/domain/portal-bot-config";

export const portalBotConfigService = {
  async getFields(): Promise<BotConfigField[]> {
    const response = await api.get<BotConfigField[]>("/portal/bot-config/fields");
    return response.data;
  },
  async getProposals(): Promise<BotConfigProposal[]> {
    const response = await api.get<BotConfigProposal[]>("/portal/bot-config/proposals");
    return response.data;
  },
  async createProposal(fieldId: string, valorProposto: string): Promise<BotConfigProposal> {
    const response = await api.post<BotConfigProposal>("/portal/bot-config/proposals", {
      field_id: fieldId,
      valor_proposto: valorProposto,
    });
    return response.data;
  },
};
