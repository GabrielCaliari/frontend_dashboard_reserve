import api from "@/src/infraestructure/axios/api";
import type {
  ChannelStatus,
  Conversation,
  ConversationFilters,
} from "@/src/modules/portal/domain/portal-attendance";

export const portalAttendanceService = {
  async getChannels(): Promise<ChannelStatus[]> {
    const response = await api.get<ChannelStatus[]>("/portal/attendance/channels");
    return response.data;
  },

  async getConversations(filters: ConversationFilters): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>("/portal/attendance/conversations", { params: filters });
    return response.data;
  },
};
