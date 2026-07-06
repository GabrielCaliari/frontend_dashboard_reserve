import api from "@/src/infraestructure/axios/api";
import type { ChannelStatus } from "@/src/modules/portal/domain/portal-attendance";

export const portalAttendanceService = {
  async getChannels(): Promise<ChannelStatus[]> {
    const response = await api.get<ChannelStatus[]>("/portal/attendance/channels");
    return response.data;
  },
};
