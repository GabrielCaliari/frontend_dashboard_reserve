import api from "@/src/infraestructure/axios/api";
import type { TimelineResponse } from "@/src/modules/portal/domain/portal-timeline";

export const portalTimelineService = {
  async getTimeline(): Promise<TimelineResponse> {
    const response = await api.get<TimelineResponse>("/portal/timeline");
    return response.data;
  },
};
