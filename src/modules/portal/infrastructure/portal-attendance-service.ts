import api from "@/src/infraestructure/axios/api";
import type {
  AttendanceMetrics,
  ChannelStatus,
  Conversation,
  ConversationDetail,
  ConversationFilters,
  FunnelStageCount,
  MoveFunnelStagePayload,
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

  async getFunnel(): Promise<FunnelStageCount[]> {
    const response = await api.get<FunnelStageCount[]>("/portal/attendance/funnel");
    return response.data;
  },

  async moveFunnelStage(payload: MoveFunnelStagePayload): Promise<void> {
    await api.post("/portal/attendance/funnel-events", payload);
  },

  async getMetrics(): Promise<AttendanceMetrics> {
    const response = await api.get<AttendanceMetrics>("/portal/attendance/metrics");
    return response.data;
  },
};
