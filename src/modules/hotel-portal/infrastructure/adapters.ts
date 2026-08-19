/**
 * Hotel Portal — Infrastructure Adapters
 *
 * Ports the former `common/services/hotel-portal-service.ts` into this module,
 * preserving the exported `hotelPortalService` object's shape (method names and
 * signatures) unchanged so consuming hooks (now under
 * `src/shared/hooks/hotel-portal/`) only need their import path updated.
 *
 * WIP NOTE (rescued from the pre-Fase4 working tree, hotel-portal v2 redesign):
 * this file was expanded well beyond the original Fase4 port (clients, OTA data,
 * reports, reputation/KPI/booking-window/rate-parity/budget metrics, reservations,
 * guest CRM, WhatsApp templates/messages/links, and the portal-facing dashboard/
 * snapshots/campaigns/site-metrics/overview endpoints). All methods below are
 * ported verbatim from the working tree at rescue time — behavior is unverified
 * against the current `backend_reserve` contract beyond what Fase4 already
 * confirmed for the original 6 methods (see git history for the pre-expansion
 * version). Every admin-scoped call still explicitly sends
 * `headers: { "x-skip-tenant": "true" }`; portal-scoped calls (My Clients,
 * Dashboard, Snapshots, Campaigns, Site Metrics, Overview) intentionally do not,
 * since they run tenant-scoped from the logged-in hotel client's own session.
 */

import api from '@/src/infraestructure/axios/api';
import type { HotelOverviewResponse } from '@/src/shared/domain/types/@hotel-portal-v1';
import type {
  HotelClient,
  HotelDashboardResponse,
  HotelCampaignsResponse,
  HotelSiteMetricsResponse,
  MonthlyReport,
  OtaMonthlyData,
  PortalSnapshot,
  CreateHotelClientDto,
  UpdateHotelClientDto,
  InsertOtaDataDto,
  PublishReportDto,
  CreateReportDto,
  SubmitReviewDto,
  ReputationEntry,
  ReputationSummary,
  KpiEntry,
  KpiSummary,
  BookingWindowEntry,
  RateParityEntry,
  RateParityViolation,
  BudgetEntry,
  BudgetComparison,
  Reservation,
  ReservationStats,
  Guest,
  GuestWithHistory,
  GuestStay,
  WhatsAppTemplate,
  WhatsAppMessage,
  WhatsAppLink,
  WhatsAppLinkStats,
  InsertReputationDto,
  InsertKpiDto,
  InsertBookingWindowDto,
  InsertRateParityDto,
  InsertBudgetDto,
  CreateReservationDto,
  CreateGuestDto,
  AddGuestStayDto,
  CreateWhatsAppTemplateDto,
  SendWhatsAppDto,
  CreateWhatsAppLinkDto,
  UpdateWhatsAppLinkDto,
} from '@/src/shared/domain/types/@hotel-portal';
import type {
  ActivityLogPage,
  BotChannelsResponse,
  BotConfigProposal,
  ContentPost,
  ConversationDetailResponse,
  ConversationFilters,
  ConversationListItem,
  ConversationListResponse,
  CreateBotConfigProposalDto,
  FunnelBoardColumn,
  FunnelMetricsResponse,
  FunnelStageChangeDto,
  HotelHomeResponse,
  InstagramOverviewResponse,
  LeadsOverviewResponse,
  Milestone,
  RoiResponse,
  SemesterPlan,
} from '@/src/shared/domain/types/@hotel-painel';

const adminConfig = { headers: { 'x-skip-tenant': 'true' } };
const adminHeaders = adminConfig as never;

function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray((raw as any)?.data)) return (raw as any).data as T[];
  return [];
}

function normalizeWhatsAppLink(raw: any): WhatsAppLink {
  const code = raw.code ?? raw.short_code ?? raw.slug ?? '';
  // Backend builds redirect_url against its own origin (e.g. backend-reserve-mkt.vercel.app/wa/<code>).
  // Prefer it; only fall back to the API origin (never window.location.origin, which is the dashboard).
  const apiOrigin = (
    process.env.NEXT_PUBLIC_RESERVE_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ''
  ).replace(/\/api\/?$/i, '');
  const short_url =
    raw.redirect_url ??
    raw.short_url ??
    raw.url ??
    raw.link ??
    (code && apiOrigin ? `${apiOrigin}/wa/${code}` : '');
  return { ...raw, code, short_url };
}

function normalizeWhatsAppLinkStats(raw: any): WhatsAppLinkStats {
  const stats = raw?.stats ?? raw ?? {};
  const byDay = stats.by_day ?? stats.clicks_by_day ?? [];
  return {
    total_clicks: stats.total ?? stats.total_clicks ?? raw?.link?.total_clicks ?? 0,
    clicks_by_day: byDay.map((d: any) => ({ date: d.day ?? d.date ?? '', count: d.count ?? 0 })),
    by_device: stats.by_device ?? [],
    by_country: stats.by_country ?? [],
    by_region: stats.by_region ?? [],
    by_city: stats.by_city ?? [],
    recent_clicks: raw?.recent_clicks ?? [],
  };
}

export const hotelPortalService = {
  // ── Admin: Clients ─────────────────────────────────────────────────────

  async getClientByUserId(userId: string): Promise<HotelClient | null> {
    try {
      const res = await api.get<any>(`/admin/hotel-portal/clients/by-user/${userId}`, adminHeaders);
      const raw = res.data;
      if (raw?.id) return raw as HotelClient;
      if (raw?.data?.id) return raw.data as HotelClient;
      return null;
    } catch {
      return null;
    }
  },

  async getClientForCurrentTenant(): Promise<HotelClient | null> {
    try {
      const res = await api.get<any>('/admin/hotel-portal/clients');
      const list = toArray<HotelClient>(res.data);
      return list[0] ?? null;
    } catch {
      return null;
    }
  },

  async listClients(): Promise<HotelClient[]> {
    const res = await api.get<any>('/admin/hotel-portal/clients', adminHeaders);
    return toArray<HotelClient>(res.data);
  },

  async getClient(id: string): Promise<HotelClient> {
    const res = await api.get<HotelClient>(`/admin/hotel-portal/clients/${id}`, adminHeaders);
    return res.data;
  },

  async createClient(data: CreateHotelClientDto): Promise<HotelClient> {
    const res = await api.post<HotelClient>('/admin/hotel-portal/clients', data, adminHeaders);
    return res.data;
  },

  async updateClient(id: string, data: UpdateHotelClientDto): Promise<HotelClient> {
    const res = await api.patch<HotelClient>(`/admin/hotel-portal/clients/${id}`, data, adminHeaders);
    return res.data;
  },

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/admin/hotel-portal/clients/${id}`, adminHeaders);
  },

  // ── Admin: OTA Data ────────────────────────────────────────────────────

  async insertOtaData(clientId: string, data: InsertOtaDataDto): Promise<OtaMonthlyData> {
    const res = await api.post<OtaMonthlyData>(
      `/admin/hotel-portal/clients/${clientId}/ota-data`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async listOtaData(clientId: string): Promise<OtaMonthlyData[]> {
    const res = await api.get<any>(`/admin/hotel-portal/clients/${clientId}/ota-data`, adminHeaders);
    return toArray<OtaMonthlyData>(res.data);
  },

  // ── Admin: Reports ─────────────────────────────────────────────────────

  async listReports(clientId: string): Promise<MonthlyReport[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/reports/client/${clientId}`,
      adminHeaders,
    );
    return toArray<MonthlyReport>(res.data);
  },

  async getReport(reportId: string): Promise<MonthlyReport> {
    const res = await api.get<MonthlyReport>(`/admin/hotel-portal/reports/${reportId}`, adminHeaders);
    return res.data;
  },

  async createReport(data: CreateReportDto): Promise<MonthlyReport> {
    const res = await api.post<MonthlyReport>('/admin/hotel-portal/reports', data, adminHeaders);
    return res.data;
  },

  async submitReportForReview(reportId: string, data: SubmitReviewDto): Promise<MonthlyReport> {
    const res = await api.patch<MonthlyReport>(
      `/admin/hotel-portal/reports/${reportId}/submit-review`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async updateReport(reportId: string, data: Partial<PublishReportDto>): Promise<MonthlyReport> {
    const res = await api.patch<MonthlyReport>(
      `/admin/hotel-portal/reports/${reportId}/submit-review`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async publishReport(reportId: string, data: PublishReportDto): Promise<MonthlyReport> {
    const res = await api.patch<MonthlyReport>(
      `/admin/hotel-portal/reports/${reportId}/publish`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  // ── Admin: Metrics — Reputation ────────────────────────────────────────

  async insertReputation(clientId: string, data: InsertReputationDto): Promise<ReputationEntry> {
    const res = await api.post<ReputationEntry>(
      `/admin/hotel-portal/metrics/${clientId}/reputation`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async listReputation(clientId: string): Promise<ReputationEntry[]> {
    const res = await api.get<any>(`/admin/hotel-portal/metrics/${clientId}/reputation`, adminHeaders);
    return toArray<ReputationEntry>(res.data);
  },

  async getReputationSummary(clientId: string): Promise<ReputationSummary> {
    const res = await api.get<ReputationSummary>(
      `/admin/hotel-portal/metrics/${clientId}/reputation/summary`,
      adminHeaders,
    );
    return res.data;
  },

  // ── Admin: Metrics — KPI ───────────────────────────────────────────────

  async insertKpi(clientId: string, data: InsertKpiDto): Promise<KpiEntry> {
    const res = await api.post<KpiEntry>(
      `/admin/hotel-portal/metrics/${clientId}/kpi`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async listKpi(clientId: string): Promise<KpiEntry[]> {
    const res = await api.get<any>(`/admin/hotel-portal/metrics/${clientId}/kpi`, adminHeaders);
    return toArray<KpiEntry>(res.data);
  },

  async getKpiSummary(clientId: string): Promise<KpiSummary> {
    const res = await api.get<KpiSummary>(
      `/admin/hotel-portal/metrics/${clientId}/kpi/summary`,
      adminHeaders,
    );
    return res.data;
  },

  // ── Admin: Metrics — Booking Window ───────────────────────────────────

  async insertBookingWindow(clientId: string, data: InsertBookingWindowDto): Promise<BookingWindowEntry> {
    const res = await api.post<BookingWindowEntry>(
      `/admin/hotel-portal/metrics/${clientId}/booking-window`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async listBookingWindow(clientId: string): Promise<BookingWindowEntry[]> {
    const res = await api.get<any>(`/admin/hotel-portal/metrics/${clientId}/booking-window`, adminHeaders);
    return toArray<BookingWindowEntry>(res.data);
  },

  // ── Admin: Metrics — Rate Parity ──────────────────────────────────────

  async insertRateParity(clientId: string, data: InsertRateParityDto): Promise<RateParityEntry> {
    const res = await api.post<RateParityEntry>(
      `/admin/hotel-portal/metrics/${clientId}/rate-parity`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async listRateParity(clientId: string): Promise<RateParityEntry[]> {
    const res = await api.get<any>(`/admin/hotel-portal/metrics/${clientId}/rate-parity`, adminHeaders);
    return toArray<RateParityEntry>(res.data);
  },

  async getRateParityViolations(clientId: string): Promise<RateParityViolation[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/metrics/${clientId}/rate-parity/violations`,
      adminHeaders,
    );
    return toArray<RateParityViolation>(res.data);
  },

  // ── Admin: Metrics — Budget ────────────────────────────────────────────

  async insertBudget(clientId: string, data: InsertBudgetDto): Promise<BudgetEntry> {
    const res = await api.post<BudgetEntry>(
      `/admin/hotel-portal/metrics/${clientId}/budget`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async listBudget(clientId: string): Promise<BudgetEntry[]> {
    const res = await api.get<any>(`/admin/hotel-portal/metrics/${clientId}/budget`, adminHeaders);
    return toArray<BudgetEntry>(res.data);
  },

  async getBudgetComparison(clientId: string): Promise<BudgetComparison[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/metrics/${clientId}/budget/comparison`,
      adminHeaders,
    );
    return toArray<BudgetComparison>(res.data);
  },

  // ── Admin: Reservations ────────────────────────────────────────────────

  async createReservation(tenantId: string, data: CreateReservationDto): Promise<Reservation> {
    const res = await api.post<Reservation>(
      `/admin/hotel-portal/reservations/${tenantId}`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async listReservations(tenantId: string, params?: { from?: string; to?: string; status?: string }): Promise<Reservation[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/reservations/${tenantId}`,
      { ...adminConfig, params } as never,
    );
    return toArray<Reservation>(res.data);
  },

  async getReservationStats(tenantId: string, params?: { from?: string; to?: string }): Promise<ReservationStats> {
    const res = await api.get<ReservationStats>(
      `/admin/hotel-portal/reservations/${tenantId}/stats`,
      { ...adminConfig, params } as never,
    );
    return res.data;
  },

  // ── Admin: Guest CRM ───────────────────────────────────────────────────

  async createGuest(clientId: string, data: CreateGuestDto): Promise<Guest> {
    const res = await api.post<Guest>(
      `/admin/hotel-portal/guests/${clientId}`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async listGuests(clientId: string, params?: { search?: string; tag?: string }): Promise<Guest[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/guests/${clientId}`,
      { ...adminConfig, params } as never,
    );
    return toArray<Guest>(res.data);
  },

  async getReactivationList(clientId: string, params?: { days?: number }): Promise<Guest[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/guests/${clientId}/reactivation`,
      { ...adminConfig, params } as never,
    );
    return toArray<Guest>(res.data);
  },

  async getGuest(guestId: string): Promise<GuestWithHistory> {
    const res = await api.get<GuestWithHistory>(
      `/admin/hotel-portal/guests/guest/${guestId}`,
      adminHeaders,
    );
    return res.data;
  },

  async addGuestStay(guestId: string, data: AddGuestStayDto): Promise<GuestStay> {
    const res = await api.post<GuestStay>(
      `/admin/hotel-portal/guests/guest/${guestId}/stays`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  // ── Admin: WhatsApp ────────────────────────────────────────────────────

  async createWhatsAppTemplate(clientId: string, data: CreateWhatsAppTemplateDto): Promise<WhatsAppTemplate> {
    const res = await api.post<WhatsAppTemplate>(
      `/admin/hotel-portal/whatsapp/${clientId}/templates`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async listWhatsAppTemplates(clientId: string): Promise<WhatsAppTemplate[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/whatsapp/${clientId}/templates`,
      adminHeaders,
    );
    return toArray<WhatsAppTemplate>(res.data);
  },

  async sendWhatsApp(clientId: string, data: SendWhatsAppDto): Promise<WhatsAppMessage> {
    const res = await api.post<WhatsAppMessage>(
      `/admin/hotel-portal/whatsapp/${clientId}/send`,
      data,
      adminHeaders,
    );
    return res.data;
  },

  async listWhatsAppMessages(clientId: string, params?: { from?: string; to?: string }): Promise<WhatsAppMessage[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/whatsapp/${clientId}/messages`,
      { ...adminConfig, params } as never,
    );
    return toArray<WhatsAppMessage>(res.data);
  },

  // ── Admin: WhatsApp Links ──────────────────────────────────────────────

  async listWhatsAppLinks(clientId: string): Promise<WhatsAppLink[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/whatsapp-links/${clientId}`,
      adminHeaders,
    );
    const list = toArray<any>(res.data);
    return list.map(normalizeWhatsAppLink);
  },

  async createWhatsAppLink(clientId: string, data: CreateWhatsAppLinkDto): Promise<WhatsAppLink> {
    const res = await api.post<any>(
      `/admin/hotel-portal/whatsapp-links/${clientId}`,
      data,
      adminHeaders,
    );
    return normalizeWhatsAppLink(res.data);
  },

  async getWhatsAppLinkStats(clientId: string, id: string): Promise<WhatsAppLinkStats> {
    const res = await api.get<any>(
      `/admin/hotel-portal/whatsapp-links/${clientId}/${id}/stats`,
      adminHeaders,
    );
    return normalizeWhatsAppLinkStats(res.data);
  },

  async updateWhatsAppLink(clientId: string, id: string, data: UpdateWhatsAppLinkDto): Promise<WhatsAppLink> {
    const res = await api.put<any>(
      `/admin/hotel-portal/whatsapp-links/${clientId}/${id}`,
      data,
      adminHeaders,
    );
    return normalizeWhatsAppLink(res.data);
  },

  async deleteWhatsAppLink(clientId: string, id: string): Promise<void> {
    await api.delete(`/admin/hotel-portal/whatsapp-links/${clientId}/${id}`, adminHeaders);
  },

  // ── Portal: My Clients (tenant logado) ────────────────────────────────

  async getMyClients(): Promise<HotelClient[]> {
    const res = await api.get<any>('/hotel-portal/my-clients');
    return toArray<HotelClient>(res.data);
  },

  // ── Portal: Dashboard ──────────────────────────────────────────────────

  async getDashboard(
    clientId: string,
    params?: { from?: string; to?: string },
  ): Promise<HotelDashboardResponse> {
    const res = await api.get<HotelDashboardResponse>(`/hotel-portal/${clientId}/dashboard`, {
      params,
    });
    return res.data;
  },

  // ── Portal: Snapshots ──────────────────────────────────────────────────

  async getSnapshots(clientId: string, params?: { from?: string; to?: string }): Promise<PortalSnapshot[]> {
    const res = await api.get<any>(`/hotel-portal/${clientId}/snapshots`, { params });
    return toArray<PortalSnapshot>(res.data);
  },

  // ── Portal: Campaigns ──────────────────────────────────────────────────

  async getCampaigns(
    clientId: string,
    params?: { from?: string; to?: string },
  ): Promise<HotelCampaignsResponse> {
    const res = await api.get<HotelCampaignsResponse>(`/hotel-portal/${clientId}/campaigns`, {
      params,
    });
    return res.data;
  },

  // ── Portal: Site Metrics ───────────────────────────────────────────────

  async getSiteMetrics(
    clientId: string,
    params?: { from?: string; to?: string },
  ): Promise<HotelSiteMetricsResponse> {
    const res = await api.get<HotelSiteMetricsResponse>(`/hotel-portal/${clientId}/site-metrics`, {
      params,
    });
    return res.data;
  },

  // ── Portal: Overview consolidado (contrato §3 — KPI calculado) ──────────

  async getOverview(
    clientId: string,
    params: { from: string; to: string },
  ): Promise<HotelOverviewResponse> {
    const res = await api.get<HotelOverviewResponse>(
      `/hotel-portal/${clientId}/overview`,
      { params },
    );
    return res.data;
  },

  // ── Painel Reserve: blocos do cliente (ClientPortalController) ──────────
  //
  // Todas escopadas por `:clientId` e protegidas pelo AdminJwtGuard, ou seja:
  // usam a MESMA sessao do dashboard (cookie `token`). Nao existe sessao
  // separada de portal.

  /** §3.3 Camada 1 — cliques nos links rastreaveis ate leads gerados. */
  async getLeadsOverview(
    clientId: string,
    params: { from: string; to: string },
  ): Promise<LeadsOverviewResponse> {
    const res = await api.get<LeadsOverviewResponse>(
      `/hotel-portal/${clientId}/leads-overview`,
      { params },
    );
    return res.data;
  },

  /** §3.9 Analise de ROI. `nivel2`/`nivel3` podem vir ausentes — ver tipo. */
  async getRoi(
    clientId: string,
    params: { from: string; to: string },
  ): Promise<RoiResponse> {
    const res = await api.get<RoiResponse>(`/hotel-portal/${clientId}/roi`, {
      params,
    });
    return res.data;
  },

  /**
   * O backend devolve TODOS os planos do tenant ordenados por semestre desc
   * (`findByTenantId`), nao um so. O plano corrente e o primeiro.
   */
  async getSemesterPlans(clientId: string): Promise<SemesterPlan[]> {
    const res = await api.get<any>(`/hotel-portal/${clientId}/semester-plan`);
    return toArray<SemesterPlan>(res.data);
  },

  async listBotConfigProposals(clientId: string): Promise<BotConfigProposal[]> {
    const res = await api.get<any>(
      `/hotel-portal/${clientId}/bot-config-proposals`,
    );
    return toArray<BotConfigProposal>(res.data);
  },

  async createBotConfigProposal(
    clientId: string,
    data: CreateBotConfigProposalDto,
  ): Promise<BotConfigProposal> {
    const res = await api.post<any>(
      `/hotel-portal/${clientId}/bot-config-proposals`,
      data,
    );
    return (res.data?.data ?? res.data) as BotConfigProposal;
  },

  async getBotChannels(clientId: string): Promise<BotChannelsResponse> {
    const res = await api.get<BotChannelsResponse>(
      `/hotel-portal/${clientId}/whatsapp/channels`,
    );
    return res.data;
  },

  async listConversations(
    clientId: string,
    params?: ConversationFilters,
  ): Promise<ConversationListItem[]> {
    const res = await api.get<ConversationListResponse>(
      `/hotel-portal/${clientId}/whatsapp/conversations`,
      { params },
    );
    return res.data?.conversations ?? [];
  },

  async getConversationDetail(
    clientId: string,
    numeroContato: string,
  ): Promise<ConversationDetailResponse> {
    const res = await api.get<ConversationDetailResponse>(
      `/hotel-portal/${clientId}/whatsapp/conversations/${encodeURIComponent(numeroContato)}`,
    );
    return res.data;
  },

  async getFunnelBoard(clientId: string): Promise<FunnelBoardColumn[]> {
    const res = await api.get<FunnelBoardColumn[]>(
      `/hotel-portal/${clientId}/whatsapp/funnel`,
    );
    return toArray<FunnelBoardColumn>(res.data);
  },

  async moveFunnelStage(
    tenantId: string,
    numeroContato: string,
    dto: FunnelStageChangeDto,
  ): Promise<void> {
    await api.patch(
      `/admin/hotel-portal/${tenantId}/whatsapp/funnel/${encodeURIComponent(numeroContato)}/stage`,
      dto,
      adminHeaders,
    );
  },

  async getFunnelMetrics(
    clientId: string,
    params: { from: string; to: string },
  ): Promise<FunnelMetricsResponse> {
    const res = await api.get<FunnelMetricsResponse>(
      `/hotel-portal/${clientId}/whatsapp/funnel/metrics`,
      { params },
    );
    return res.data;
  },

  async getInstagramOverview(
    clientId: string,
    params: { from: string; to: string },
  ): Promise<InstagramOverviewResponse> {
    const res = await api.get<InstagramOverviewResponse>(
      `/hotel-portal/${clientId}/instagram`,
      { params },
    );
    return res.data;
  },

  async getContentPosts(clientId: string, month: string): Promise<ContentPost[]> {
    const res = await api.get<any>(`/hotel-portal/${clientId}/content-posts`, {
      params: { month },
    });
    return toArray<ContentPost>(res.data);
  },

  async getActivities(
    clientId: string,
    params?: { page?: number; limit?: number },
  ): Promise<ActivityLogPage> {
    const res = await api.get<ActivityLogPage>(
      `/hotel-portal/${clientId}/activities`,
      { params },
    );
    return res.data;
  },

  /**
   * §3.8 — PDF gerado no backend (Puppeteer). Hoje o backend so suporta a
   * secao `overview` (`SUPPORTED_SECTIONS` no PdfExportController), entao nao
   * ofereca exportacao nas outras telas: passar outra secao devolve 400.
   */
  async exportReportPdf(
    clientId: string,
    params: { from: string; to: string },
  ): Promise<Blob> {
    const res = await api.get(`/hotel-portal/${clientId}/export/report`, {
      params: { ...params, section: 'overview' },
      responseType: 'blob',
    });
    return res.data as Blob;
  },

  /**
   * Marcos da linha do tempo. Unica rota do Painel escopada por `tenantId`
   * (nao por `clientId`) — o controller e o admin-milestone, nao o
   * ClientPortalController.
   */
  async listMilestones(tenantId: string): Promise<Milestone[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/${tenantId}/milestones`,
    );
    return toArray<Milestone>(res.data);
  },

  /** Home consolidada: funil do bot + metricas do motor de reservas. */
  async getHome(
    clientId: string,
    period: { from: string; to: string },
  ): Promise<HotelHomeResponse> {
    const res = await api.get<HotelHomeResponse>(`/hotel-portal/${clientId}/home`, {
      params: { from: period.from, to: period.to },
    });
    return res.data;
  },
};
