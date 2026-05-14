/**
 * Hotel Portal — Infrastructure Adapters
 *
 * Ports the former `common/services/hotel-portal-service.ts` into this module,
 * preserving the exported `hotelPortalService` object's shape (method names and
 * signatures) unchanged so consuming hooks (now under
 * `src/shared/hooks/hotel-portal/`) only need their import path updated.
 *
 * Backend module: `reserve-client-portal`. Its 9 controllers have no `@ApiTags`
 * decorator, so NestJS Swagger auto-tags each by class name, producing one
 * generated service directory per controller under
 * `src/infraestructure/server/services/`: `adminhotelclient`, `adminhotelmetrics`,
 * `adminreservations`, `clientportal`, `guestcrm`, `report`, `whatsapp`,
 * `whatsappredirect`, `whatsapptracking`.
 *
 * Of these, only `adminhotelclient`, `clientportal`, and `report` overlap with
 * what this hand-written service actually calls today (`adminhotelmetrics`,
 * `adminreservations`, `guestcrm`, `whatsapp*` back features not yet wired up
 * on the frontend). Even for the overlapping ones, this adapter keeps the
 * original `api`-based implementations verbatim rather than delegating,
 * because of real behavioral mismatches found on inspection:
 *
 *   - Every method here explicitly sends `headers: { "x-skip-tenant": "true" }`
 *     so admin/portal hotel-portal calls bypass tenant-scoping. None of the
 *     generated services (`adminhotelclient`, `clientportal`, `report`) set
 *     this header — delegating would silently reintroduce tenant-header
 *     injection and likely break these cross-tenant admin/portal calls.
 *   - All generated response types are `unknown` and DTOs are
 *     `Record<string, unknown>` (see `adminhotelclient/types.ts`), so there is
 *     no structural-typing benefit to delegating.
 *   - `report`'s generated `create(body)` posts to `/api/admin/hotel-portal/reports`
 *     with the client id expected inside the body, while `createReport` here
 *     posts to `/admin/hotel-portal/clients/{clientId}/reports`; `findByClientId`
 *     hits `/admin/hotel-portal/reports/client/{clientId}` instead of
 *     `/admin/hotel-portal/clients/{clientId}/reports`. Different URL shapes,
 *     not a drop-in swap.
 *   - The generated `report` service has no generic "update" operation at all
 *     (only `submitForReview` and `publish`), so `updateReport`
 *     (`PATCH /admin/hotel-portal/reports/{reportId}`) has no generated
 *     counterpart to delegate to.
 *
 * Forcing delegation here would change behavior with no typing gain, so all
 * methods below are ported verbatim. All URL paths and header logic match the
 * pre-migration service exactly.
 */

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
