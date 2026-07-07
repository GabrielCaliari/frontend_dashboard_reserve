import api from "@/src/infraestructure/axios/api";
import type {
  ChannelStatus,
  Conversation,
  ConversationDetail,
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

  async getConversationDetail(id: string): Promise<ConversationDetail> {
    const response = await api.get<ConversationDetail>(`/portal/attendance/conversations/${id}`);
    return response.data;
  },
};
