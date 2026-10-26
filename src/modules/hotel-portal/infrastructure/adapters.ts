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
import { isAxiosError } from 'axios';
import adminbotintegrationconfigService from '@/src/infraestructure/server/services/adminbotintegrationconfig';
import adminhotelclientService from '@/src/infraestructure/server/services/adminhotelclient';
import type { HotelOverviewResponse } from '@/src/shared/domain/types/@hotel-portal-v1';
import { toHotelDashboard, type BackendDashboardResponse } from './dashboard-mapper';
import { toHotelCampaigns } from './campaigns-mapper';
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
  BotIntegrationConfig,
  BotIntegrationConfigWithKey,
  BotIssueDetail,
  BotIssueFilters,
  BotIssueItem,
  BotIssueListResponse,
  BotIssueStatus,
  BotIssueSummary,
  ConversationDetailParams,
  FeedbackFilters,
  FeedbackListResponse,
  FeedbackSummary,
  BotConfigProposal,
  ContentPost,
  ConversationDetailResponse,
  ConversationFilters,
  ConversationListItem,
  ConversationListResponse,
  CreateBotConfigProposalDto,
  FunnelBoardColumn,
  FunnelMetricsResponse,
  FunnelStage,
  FunnelStageChangeDto,
  PanelActionResult,
  ApproveBotConfigProposalResult,
  HotelHomeResponse,
  InstagramOverviewResponse,
  LeadsOverviewResponse,
  Milestone,
  RoiResponse,
  SemesterPlan,
} from '@/src/shared/domain/types/@hotel-painel';

// So a listagem/criacao cross-tenant de clientes (super admin sem tenant
// selecionado) dispensa o x-tenant-id. Todas as outras rotas /admin/hotel-portal
// passam pelo TenantGuard do backend e devolvem 400 sem o header — nao usar
// adminHeaders nelas.
const adminConfig = { headers: { 'x-skip-tenant': 'true' } };
const adminHeaders = adminConfig as never;

/**
 * Normaliza a resposta das acoes humanas repassadas ao bot. 2xx com `ok: false`
 * = acao registrada, bot nao avisado (o backend reenvia). Resposta sem `ok`
 * (backend anterior ao contrato) conta como entregue.
 */
function toPanelActionResult(raw: unknown): PanelActionResult {
  const r = (raw ?? {}) as { ok?: unknown; state?: unknown };
  return { ok: r.ok !== false, state: typeof r.state === "string" ? r.state : null };
}

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
    const res = await api.get<HotelClient>(`/admin/hotel-portal/clients/${id}`);
    return res.data;
  },

  async createClient(data: CreateHotelClientDto): Promise<HotelClient> {
    const res = await api.post<HotelClient>('/admin/hotel-portal/clients', data, adminHeaders);
    return res.data;
  },

  async updateClient(id: string, data: UpdateHotelClientDto): Promise<HotelClient> {
    const res = await api.patch<HotelClient>(`/admin/hotel-portal/clients/${id}`, data);
    return res.data;
  },

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/admin/hotel-portal/clients/${id}`);
  },

  // ── Admin: OTA Data ────────────────────────────────────────────────────

  async insertOtaData(clientId: string, data: InsertOtaDataDto): Promise<OtaMonthlyData> {
    const res = await api.post<OtaMonthlyData>(
      `/admin/hotel-portal/clients/${clientId}/ota-data`,
      data,
    );
    return res.data;
  },

  async listOtaData(clientId: string): Promise<OtaMonthlyData[]> {
    const res = await api.get<any>(`/admin/hotel-portal/clients/${clientId}/ota-data`);
    return toArray<OtaMonthlyData>(res.data);
  },

  // ── Admin: Reports ─────────────────────────────────────────────────────

  async listReports(clientId: string): Promise<MonthlyReport[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/reports/client/${clientId}`,
    );
    return toArray<MonthlyReport>(res.data);
  },

  async getReport(reportId: string): Promise<MonthlyReport> {
    const res = await api.get<MonthlyReport>(`/admin/hotel-portal/reports/${reportId}`);
    return res.data;
  },

  async createReport(data: CreateReportDto): Promise<MonthlyReport> {
    const res = await api.post<MonthlyReport>('/admin/hotel-portal/reports', data);
    return res.data;
  },

  async submitReportForReview(reportId: string, data: SubmitReviewDto): Promise<MonthlyReport> {
    const res = await api.patch<MonthlyReport>(
      `/admin/hotel-portal/reports/${reportId}/submit-review`,
      data,
    );
    return res.data;
  },

  async updateReport(reportId: string, data: Partial<PublishReportDto>): Promise<MonthlyReport> {
    const res = await api.patch<MonthlyReport>(
      `/admin/hotel-portal/reports/${reportId}/submit-review`,
      data,
    );
    return res.data;
  },

  async publishReport(reportId: string, data: PublishReportDto): Promise<MonthlyReport> {
    const res = await api.patch<MonthlyReport>(
      `/admin/hotel-portal/reports/${reportId}/publish`,
      data,
    );
    return res.data;
  },

  // ── Admin: Metrics — Reputation ────────────────────────────────────────

  async insertReputation(clientId: string, data: InsertReputationDto): Promise<ReputationEntry> {
    const res = await api.post<ReputationEntry>(
      `/admin/hotel-portal/metrics/${clientId}/reputation`,
      data,
    );
    return res.data;
  },

  async listReputation(clientId: string): Promise<ReputationEntry[]> {
    const res = await api.get<any>(`/admin/hotel-portal/metrics/${clientId}/reputation`);
    return toArray<ReputationEntry>(res.data);
  },

  async getReputationSummary(clientId: string): Promise<ReputationSummary> {
    const res = await api.get<ReputationSummary>(
      `/admin/hotel-portal/metrics/${clientId}/reputation/summary`,
    );
    return res.data;
  },

  // ── Admin: Metrics — KPI ───────────────────────────────────────────────

  async insertKpi(clientId: string, data: InsertKpiDto): Promise<KpiEntry> {
    const res = await api.post<KpiEntry>(
      `/admin/hotel-portal/metrics/${clientId}/kpi`,
      data,
    );
    return res.data;
  },

  async listKpi(clientId: string): Promise<KpiEntry[]> {
    const res = await api.get<any>(`/admin/hotel-portal/metrics/${clientId}/kpi`);
    return toArray<KpiEntry>(res.data);
  },

  async getKpiSummary(clientId: string): Promise<KpiSummary> {
    const res = await api.get<KpiSummary>(
      `/admin/hotel-portal/metrics/${clientId}/kpi/summary`,
    );
    return res.data;
  },

  // ── Admin: Metrics — Booking Window ───────────────────────────────────

  async insertBookingWindow(clientId: string, data: InsertBookingWindowDto): Promise<BookingWindowEntry> {
    const res = await api.post<BookingWindowEntry>(
      `/admin/hotel-portal/metrics/${clientId}/booking-window`,
      data,
    );
    return res.data;
  },

  async listBookingWindow(clientId: string): Promise<BookingWindowEntry[]> {
    const res = await api.get<any>(`/admin/hotel-portal/metrics/${clientId}/booking-window`);
    return toArray<BookingWindowEntry>(res.data);
  },

  // ── Admin: Metrics — Rate Parity ──────────────────────────────────────

  async insertRateParity(clientId: string, data: InsertRateParityDto): Promise<RateParityEntry> {
    const res = await api.post<RateParityEntry>(
      `/admin/hotel-portal/metrics/${clientId}/rate-parity`,
      data,
    );
    return res.data;
  },

  async listRateParity(clientId: string): Promise<RateParityEntry[]> {
    const res = await api.get<any>(`/admin/hotel-portal/metrics/${clientId}/rate-parity`);
    return toArray<RateParityEntry>(res.data);
  },

  async getRateParityViolations(clientId: string): Promise<RateParityViolation[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/metrics/${clientId}/rate-parity/violations`,
    );
    return toArray<RateParityViolation>(res.data);
  },

  // ── Admin: Metrics — Budget ────────────────────────────────────────────

  async insertBudget(clientId: string, data: InsertBudgetDto): Promise<BudgetEntry> {
    const res = await api.post<BudgetEntry>(
      `/admin/hotel-portal/metrics/${clientId}/budget`,
      data,
    );
    return res.data;
  },

  async listBudget(clientId: string): Promise<BudgetEntry[]> {
    const res = await api.get<any>(`/admin/hotel-portal/metrics/${clientId}/budget`);
    return toArray<BudgetEntry>(res.data);
  },

  async getBudgetComparison(clientId: string): Promise<BudgetComparison[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/metrics/${clientId}/budget/comparison`,
    );
    return toArray<BudgetComparison>(res.data);
  },

  // ── Admin: Reservations ────────────────────────────────────────────────

  async createReservation(tenantId: string, data: CreateReservationDto): Promise<Reservation> {
    const res = await api.post<Reservation>(
      `/admin/hotel-portal/reservations/${tenantId}`,
      data,
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
    );
    return res.data;
  },

  async addGuestStay(guestId: string, data: AddGuestStayDto): Promise<GuestStay> {
    const res = await api.post<GuestStay>(
      `/admin/hotel-portal/guests/guest/${guestId}/stays`,
      data,
    );
    return res.data;
  },

  // ── Admin: WhatsApp ────────────────────────────────────────────────────

  async createWhatsAppTemplate(clientId: string, data: CreateWhatsAppTemplateDto): Promise<WhatsAppTemplate> {
    const res = await api.post<WhatsAppTemplate>(
      `/admin/hotel-portal/whatsapp/${clientId}/templates`,
      data,
    );
    return res.data;
  },

  async listWhatsAppTemplates(clientId: string): Promise<WhatsAppTemplate[]> {
    const res = await api.get<any>(
      `/admin/hotel-portal/whatsapp/${clientId}/templates`,
    );
    return toArray<WhatsAppTemplate>(res.data);
  },

  /** Texto livre responde 502 quando o bot esta inalcancavel (axios rejeita; nao e reenviado). */
  async sendWhatsApp(clientId: string, data: SendWhatsAppDto): Promise<WhatsAppMessage> {
    const res = await api.post<WhatsAppMessage>(
      `/admin/hotel-portal/whatsapp/${clientId}/send`,
      data,
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
    );
    const list = toArray<any>(res.data);
    return list.map(normalizeWhatsAppLink);
  },

  async createWhatsAppLink(clientId: string, data: CreateWhatsAppLinkDto): Promise<WhatsAppLink> {
    const res = await api.post<any>(
      `/admin/hotel-portal/whatsapp-links/${clientId}`,
      data,
    );
    return normalizeWhatsAppLink(res.data);
  },

  async getWhatsAppLinkStats(clientId: string, id: string): Promise<WhatsAppLinkStats> {
    const res = await api.get<any>(
      `/admin/hotel-portal/whatsapp-links/${clientId}/${id}/stats`,
    );
    return normalizeWhatsAppLinkStats(res.data);
  },

  async updateWhatsAppLink(clientId: string, id: string, data: UpdateWhatsAppLinkDto): Promise<WhatsAppLink> {
    const res = await api.put<any>(
      `/admin/hotel-portal/whatsapp-links/${clientId}/${id}`,
      data,
    );
    return normalizeWhatsAppLink(res.data);
  },

  async deleteWhatsAppLink(clientId: string, id: string): Promise<void> {
    await api.delete(`/admin/hotel-portal/whatsapp-links/${clientId}/${id}`);
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
    const res = await api.get<BackendDashboardResponse>(`/hotel-portal/${clientId}/dashboard`, {
      params,
    });
    return toHotelDashboard(res.data);
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
    const res = await api.get<Parameters<typeof toHotelCampaigns>[0]>(`/hotel-portal/${clientId}/campaigns`, {
      params,
    });
    return toHotelCampaigns(res.data);
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

  /** Aprovar publica a chave no bot (Canal B, apply_config). */
  async approveBotConfigProposal(
    tenantId: string,
    id: string,
  ): Promise<BotConfigProposal & ApproveBotConfigProposalResult> {
    const res = await api.patch(
      `/admin/hotel-portal/${tenantId}/bot-config-proposals/${id}/approve`,
      {},
    );
    const data = res.data?.data ?? res.data;
    return { ...data, ...toPanelActionResult(data), pendente_no_bot: data?.pendente_no_bot === true };
  },

  async rejectBotConfigProposal(
    tenantId: string,
    id: string,
    dto: { justificativa: string },
  ): Promise<BotConfigProposal> {
    const res = await api.patch(
      `/admin/hotel-portal/${tenantId}/bot-config-proposals/${id}/reject`,
      dto,
    );
    return res.data?.data ?? res.data;
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
    params?: ConversationDetailParams,
  ): Promise<ConversationDetailResponse> {
    const res = await api.get<ConversationDetailResponse>(
      `/hotel-portal/${clientId}/whatsapp/conversations/${encodeURIComponent(numeroContato)}`,
      { params },
    );
    return {
      ...res.data,
      hasMore: res.data?.hasMore ?? false,
      nextCursor: res.data?.nextCursor ?? null,
    };
  },

  async listBotIssues(clientId: string, params: BotIssueFilters = {}): Promise<BotIssueListResponse> {
    const res = await api.get<BotIssueListResponse>(`/hotel-portal/${clientId}/bot-issues`, { params });
    return { items: res.data?.items ?? [], total: res.data?.total ?? 0 };
  },

  async getBotIssuesSummary(
    clientId: string,
    period: { from: string; to: string },
  ): Promise<BotIssueSummary> {
    const res = await api.get<BotIssueSummary>(`/hotel-portal/${clientId}/bot-issues/resumo`, {
      params: period,
    });
    return { total: res.data?.total ?? 0, porCodigo: res.data?.porCodigo ?? [] };
  },

  async getBotIssue(clientId: string, id: string): Promise<BotIssueDetail> {
    const res = await api.get<BotIssueDetail>(
      `/hotel-portal/${clientId}/bot-issues/${encodeURIComponent(id)}`,
    );
    return res.data;
  },

  async updateBotIssueStatus(
    tenantId: string,
    id: string,
    status: BotIssueStatus,
  ): Promise<BotIssueItem> {
    const res = await api.patch<BotIssueItem>(
      `/admin/hotel-portal/${tenantId}/bot-issues/${encodeURIComponent(id)}/status`,
      { status },
    );
    return res.data;
  },

  async listFeedbacks(clientId: string, params: FeedbackFilters = {}): Promise<FeedbackListResponse> {
    const res = await api.get<FeedbackListResponse>(`/hotel-portal/${clientId}/feedbacks`, { params });
    return { items: res.data?.items ?? [], total: res.data?.total ?? 0 };
  },

  async getFeedbacksSummary(
    clientId: string,
    period: { from: string; to: string },
  ): Promise<FeedbackSummary> {
    const res = await api.get<FeedbackSummary>(`/hotel-portal/${clientId}/feedbacks/resumo`, {
      params: period,
    });
    const d = res.data;
    return {
      total: d?.total ?? 0,
      porSentimento: d?.porSentimento ?? { positivo: 0, neutro: 0, negativo: 0 },
      notaMedia: d?.notaMedia ?? null,
      melhores: d?.melhores ?? [],
      piores: d?.piores ?? [],
    };
  },

  async getFunnelBoard(
    clientId: string,
    params?: { from?: string; to?: string; limit?: number },
  ): Promise<FunnelBoardColumn[]> {
    const res = await api.get<FunnelBoardColumn[]>(
      `/hotel-portal/${clientId}/whatsapp/funnel`,
      { params },
    );
    return toArray<FunnelBoardColumn>(res.data);
  },

  async moveFunnelStage(
    tenantId: string,
    numeroContato: string,
    dto: FunnelStageChangeDto,
  ): Promise<PanelActionResult> {
    const res = await api.patch(
      `/admin/hotel-portal/${tenantId}/whatsapp/funnel/${encodeURIComponent(numeroContato)}/stage`,
      dto,
    );
    return toPanelActionResult(res.data);
  },

  /** Retomada humana: despausa o bot e (opcionalmente) devolve o lead a um estagio. */
  async resumeConversation(
    tenantId: string,
    numeroContato: string,
    dto: { estagio?: FunnelStage },
  ): Promise<PanelActionResult> {
    const res = await api.post(
      `/admin/hotel-portal/${tenantId}/whatsapp/funnel/${encodeURIComponent(numeroContato)}/resume`,
      dto,
    );
    return toPanelActionResult(res.data);
  },

  /** "Assumir conversa": pausa o bot para o contato (Canal B, pause_bot). */
  async pauseConversation(
    tenantId: string,
    numeroContato: string,
    dto: { motivo?: string },
  ): Promise<PanelActionResult> {
    const res = await api.post<PanelActionResult>(
      `/admin/hotel-portal/${tenantId}/whatsapp/funnel/${encodeURIComponent(numeroContato)}/pause`,
      dto,
    );
    return toPanelActionResult(res.data);
  },

  /** Soma minutos ao prazo do hold que esta aguardando pagamento (Canal B, extend_hold). */
  async extendHold(
    tenantId: string,
    numeroContato: string,
    dto: { minutos?: number; codigo?: string },
  ): Promise<PanelActionResult> {
    const res = await api.post<PanelActionResult>(
      `/admin/hotel-portal/${tenantId}/whatsapp/funnel/${encodeURIComponent(numeroContato)}/extend-hold`,
      dto,
    );
    return toPanelActionResult(res.data);
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

  // ── Integracao do bot (superadmin) ────────────────────────────────────────

  /** 404 = tenant ainda sem integracao configurada. */
  async getBotIntegrationConfig(tenantId: string): Promise<BotIntegrationConfig | null> {
    try {
      return await adminbotintegrationconfigService.findOne(tenantId);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  async createBotIntegrationConfig(
    tenantId: string,
    data: { bot_tenant_ref?: string; n8n_panel_webhook_url?: string; n8n_motor_webhook_url?: string },
  ): Promise<BotIntegrationConfigWithKey> {
    return adminbotintegrationconfigService.create(tenantId, data);
  },

  async updateBotIntegrationConfig(
    tenantId: string,
    data: { bot_tenant_ref?: string; n8n_panel_webhook_url?: string; n8n_motor_webhook_url?: string },
  ): Promise<BotIntegrationConfig> {
    return adminbotintegrationconfigService.update(tenantId, data);
  },

  /** A chave nova so aparece nesta resposta. */
  async regenerateBotTenantKey(tenantId: string): Promise<BotIntegrationConfigWithKey> {
    return adminbotintegrationconfigService.regenerateKey(tenantId);
  },

  /** O segredo novo so aparece nesta resposta. */
  async regenerateBotPanelSecret(tenantId: string): Promise<{ panel_webhook_secret: string }> {
    return adminbotintegrationconfigService.regeneratePanelSecret(tenantId);
  },

  async setBotIntegrationActive(tenantId: string, active: boolean): Promise<BotIntegrationConfig> {
    return active
      ? adminbotintegrationconfigService.reactivate(tenantId)
      : adminbotintegrationconfigService.deactivate(tenantId);
  },

  /** Segredo do webhook do canal C do cliente; so aparece nesta resposta. */
  async regenerateClientWebhookSecret(clientId: string): Promise<{ webhook_secret: string }> {
    return adminhotelclientService.regenerateWebhookSecret(clientId);
  },
};
