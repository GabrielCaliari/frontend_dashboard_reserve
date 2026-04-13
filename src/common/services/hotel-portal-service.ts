import api from "@/src/infraestructure/axios/api";
import type {
  HotelClient,
  HotelDashboardResponse,
  HotelCampaignsResponse,
  HotelSiteMetricsResponse,
  MonthlyReport,
  OtaMonthlyData,
  CreateHotelClientDto,
  UpdateHotelClientDto,
  InsertOtaDataDto,
  PublishReportDto,
  CreateReportDto,
} from "@/src/shared/domain/types/@hotel-portal";

export const hotelPortalService = {
  // ── Admin: Clients ─────────────────────────────────────────────────────

  async listClients(): Promise<HotelClient[]> {
    const res = await api.get<HotelClient[]>("/admin/hotel-portal/clients", {
      headers: { "x-skip-tenant": "true" },
    } as never);
    return res.data;
  },

  async getClient(id: string): Promise<HotelClient> {
    const res = await api.get<HotelClient>(
      `/admin/hotel-portal/clients/${id}`,
      {
        headers: { "x-skip-tenant": "true" },
      } as never,
    );
    return res.data;
  },

  async createClient(data: CreateHotelClientDto): Promise<HotelClient> {
    const res = await api.post<HotelClient>(
      "/admin/hotel-portal/clients",
      data,
      {
        headers: { "x-skip-tenant": "true" },
      } as never,
    );
    return res.data;
  },

  async updateClient(
    id: string,
    data: UpdateHotelClientDto,
  ): Promise<HotelClient> {
    const res = await api.patch<HotelClient>(
      `/admin/hotel-portal/clients/${id}`,
      data,
      {
        headers: { "x-skip-tenant": "true" },
      } as never,
    );
    return res.data;
  },

  // ── Admin: OTA Data ────────────────────────────────────────────────────

  async insertOtaData(
    clientId: string,
    data: InsertOtaDataDto,
  ): Promise<OtaMonthlyData> {
    const res = await api.post<OtaMonthlyData>(
      `/admin/hotel-portal/clients/${clientId}/ota-data`,
      data,
      { headers: { "x-skip-tenant": "true" } } as never,
    );
    return res.data;
  },

  async listOtaData(clientId: string): Promise<OtaMonthlyData[]> {
    const res = await api.get<OtaMonthlyData[]>(
      `/admin/hotel-portal/clients/${clientId}/ota-data`,
      { headers: { "x-skip-tenant": "true" } } as never,
    );
    return res.data;
  },

  // ── Admin: Reports ─────────────────────────────────────────────────────

  async listReports(clientId: string): Promise<MonthlyReport[]> {
    const res = await api.get<MonthlyReport[]>(
      `/admin/hotel-portal/clients/${clientId}/reports`,
      { headers: { "x-skip-tenant": "true" } } as never,
    );
    return res.data;
  },

  async createReport(
    clientId: string,
    data: CreateReportDto,
  ): Promise<MonthlyReport> {
    const res = await api.post<MonthlyReport>(
      `/admin/hotel-portal/clients/${clientId}/reports`,
      data,
      { headers: { "x-skip-tenant": "true" } } as never,
    );
    return res.data;
  },

  async updateReport(
    reportId: string,
    data: Partial<PublishReportDto>,
  ): Promise<MonthlyReport> {
    const res = await api.patch<MonthlyReport>(
      `/admin/hotel-portal/reports/${reportId}`,
      data,
      { headers: { "x-skip-tenant": "true" } } as never,
    );
    return res.data;
  },

  async publishReport(
    reportId: string,
    data: PublishReportDto,
  ): Promise<MonthlyReport> {
    const res = await api.patch<MonthlyReport>(
      `/admin/hotel-portal/reports/${reportId}/publish`,
      data,
      { headers: { "x-skip-tenant": "true" } } as never,
    );
    return res.data;
  },

  // ── Portal: Dashboard ──────────────────────────────────────────────────

  async getDashboard(
    clientId: string,
    params?: { from?: string; to?: string },
  ): Promise<HotelDashboardResponse> {
    const res = await api.get<HotelDashboardResponse>(
      `/hotel-portal/${clientId}/dashboard`,
      { params, headers: { "x-skip-tenant": "true" } } as never,
    );
    return res.data;
  },

  // ── Portal: Campaigns ──────────────────────────────────────────────────

  async getCampaigns(
    clientId: string,
    params?: { from?: string; to?: string },
  ): Promise<HotelCampaignsResponse> {
    const res = await api.get<HotelCampaignsResponse>(
      `/hotel-portal/${clientId}/campaigns`,
      { params, headers: { "x-skip-tenant": "true" } } as never,
    );
    return res.data;
  },

  // ── Portal: Site Metrics ───────────────────────────────────────────────

  async getSiteMetrics(
    clientId: string,
    params?: { from?: string; to?: string },
  ): Promise<HotelSiteMetricsResponse> {
    const res = await api.get<HotelSiteMetricsResponse>(
      `/hotel-portal/${clientId}/site-metrics`,
      { params, headers: { "x-skip-tenant": "true" } } as never,
    );
    return res.data;
  },
};
