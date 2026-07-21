import api from "@/src/infraestructure/axios/api";
import type { PortalReport, PortalReportSummary } from "@/src/modules/portal/domain/portal-reports";

export const portalReportsService = {
  async list(): Promise<PortalReportSummary[]> {
    const response = await api.get<PortalReportSummary[]>("/portal/reports");
    return response.data;
  },
  async getById(id: string): Promise<PortalReport> {
    const response = await api.get<PortalReport>(`/portal/reports/${id}`);
    return response.data;
  },
};
