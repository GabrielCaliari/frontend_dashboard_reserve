// Hotel Portal — aligned with backend reserve-client-portal module

export type EPlatform = 'GA4' | 'META_ADS' | 'GOOGLE_ADS';
export type EIntegrationStatus = 'PENDING' | 'ACTIVE' | 'ERROR' | 'DISCONNECTED';
export type EReportStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED';
export type ECampaignChannel = 'META_ADS' | 'GOOGLE_ADS' | 'GOOGLE_HOTEL_ADS' | 'REMARKETING';
export type EReservationStatus = 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out' | 'no_show';
export type EWhatsAppMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type EWhatsAppTemplateStatus = 'active' | 'pending' | 'rejected';

export interface ApiCredentialStatus {
  platform: EPlatform;
  sync_status: EIntegrationStatus;
  last_sync_at?: string;
  token_expires_at?: string;
  error_message?: string;
}

export interface HotelClient {
  id: string;
  user_id: string;
  hotel_name: string;
  logo_url?: string;
  country: string;
  booking_engine?: string;
  target_occupancy: number;
  target_direct_pct: number;
  contract_start: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: { id: string; email: string; name?: string };
  credentials?: ApiCredentialStatus[];
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardKPI {
  direct_bookings: number;
  ota_bookings: number;
  direct_revenue: number;
  ota_revenue: number;
  commission_recovered_month: number;
  commission_recovered_total: number;
  commission_projected_annual: number;
  occupancy_rate: number;
  target_occupancy: number;
  target_direct_pct: number;
  site_visitors: number;
  site_conversion_rate: number;
}

export interface DashboardTimeseries {
  month: string; // YYYY-MM
  direct_bookings: number;
  ota_bookings: number;
  direct_revenue: number;
  ota_revenue: number;
  commission_paid: number;
}

export interface HotelDashboardResponse {
  kpi: DashboardKPI;
  timeseries: DashboardTimeseries[];
  contract_start: string;
  ota_data_missing: boolean;
}

// ── Snapshots (tenant portal) ──────────────────────────────────────────────

export interface PortalSnapshot {
  id: string;
  client_id: string;
  reference_month: string;
  data: HotelDashboardResponse;
  created_at: string;
}

// ── Campaigns ──────────────────────────────────────────────────────────────

export interface CampaignSummary {
  channel: ECampaignChannel;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  avg_roas?: number;
  cost_per_booking?: number;
}

export interface CampaignMetricItem {
  id: string;
  channel: ECampaignChannel;
  campaign_name: string;
  metric_date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue_attributed: number;
  cost_per_booking?: number;
  roas?: number;
}

export interface HotelCampaignsResponse {
  summary: CampaignSummary[];
  metrics: CampaignMetricItem[];
}

// ── Site Analytics ─────────────────────────────────────────────────────────

export interface SiteMetricItem {
  metric_date: string;
  organic_visitors: number;
  paid_visitors: number;
  direct_visitors: number;
  social_visitors: number;
  package_page_views: number;
  checkout_starts: number;
  checkout_completes: number;
  avg_time_on_package: number;
  bounce_rate: number;
}

export interface SiteMetricsTotals {
  organic_visitors: number;
  paid_visitors: number;
  direct_visitors: number;
  social_visitors: number;
  total_visitors: number;
  package_page_views: number;
  checkout_starts: number;
  checkout_completes: number;
  conversion_rate: number;
  avg_bounce_rate: number;
}

export interface HotelSiteMetricsResponse {
  metrics: SiteMetricItem[];
  totals: SiteMetricsTotals;
}

// ── Monthly Report ─────────────────────────────────────────────────────────

export interface MonthlyReport {
  id: string;
  client_id: string;
  reference_month: string;
  status: EReportStatus;
  executive_summary?: string;
  highlights?: string[];
  next_steps?: string[];
  admin_comment?: string;
  published_at?: string;
  notification_sent: boolean;
  created_at: string;
  updated_at: string;
}

// ── OTA Monthly Data ───────────────────────────────────────────────────────

export interface OtaMonthlyData {
  id: string;
  client_id: string;
  reference_month: string;
  ota_bookings: number;
  ota_revenue: number;
  commission_rate: number;
  commission_paid: number;
  platform_breakdown?: { booking?: number; getyourguide?: number; viator?: number };
  created_at: string;
  updated_at: string;
}

// ── Metrics: Reputation ────────────────────────────────────────────────────

export interface ReputationEntry {
  id: string;
  client_id: string;
  reference_month: string;
  score: number;
  platform: string;
  review_count?: number;
  notes?: string;
  created_at: string;
}

export interface ReputationSummary {
  avg_score: number;
  total_reviews: number;
  trend: number;
  by_platform: { platform: string; avg_score: number; count: number }[];
}

// ── Metrics: KPI (RevPAR / ADR / Occupancy) ───────────────────────────────

export interface KpiEntry {
  id: string;
  client_id: string;
  reference_month: string;
  revpar: number;
  adr: number;
  occupancy_rate: number;
  rooms_available?: number;
  rooms_sold?: number;
  created_at: string;
}

export interface KpiSummary {
  avg_revpar: number;
  avg_adr: number;
  avg_occupancy: number;
  trend_revpar: number;
  trend_adr: number;
  trend_occupancy: number;
  history: KpiEntry[];
}

// ── Metrics: Booking Window ────────────────────────────────────────────────

export interface BookingWindowEntry {
  id: string;
  client_id: string;
  reference_month: string;
  avg_days_advance: number;
  segment?: string;
  channel?: string;
  created_at: string;
}

// ── Metrics: Rate Parity ───────────────────────────────────────────────────

export interface RateParityEntry {
  id: string;
  client_id: string;
  check_date: string;
  room_type: string;
  our_rate: number;
  ota_platform: string;
  ota_rate: number;
  has_violation: boolean;
  created_at: string;
}

export interface RateParityViolation {
  id: string;
  check_date: string;
  room_type: string;
  our_rate: number;
  ota_platform: string;
  ota_rate: number;
  difference: number;
  difference_pct: number;
}

// ── Metrics: Budget ────────────────────────────────────────────────────────

export interface BudgetEntry {
  id: string;
  client_id: string;
  reference_month: string;
  channel: string;
  planned_amount: number;
  actual_amount?: number;
  created_at: string;
}

export interface BudgetComparison {
  reference_month: string;
  total_planned: number;
  total_actual: number;
  variance: number;
  variance_pct: number;
  by_channel: { channel: string; planned: number; actual: number; variance: number }[];
}

// ── Reservations ───────────────────────────────────────────────────────────

export interface Reservation {
  id: string;
  tenant_id: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  room_type?: string;
  total_amount: number;
  channel: string;
  status: EReservationStatus;
  notes?: string;
  created_at: string;
}

export interface ReservationStats {
  total: number;
  confirmed: number;
  cancelled: number;
  total_revenue: number;
  avg_stay_duration: number;
  by_channel: { channel: string; count: number; revenue: number }[];
}

// ── Guest CRM ──────────────────────────────────────────────────────────────

export interface Guest {
  id: string;
  client_id: string;
  name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  birthday?: string;
  total_stays: number;
  total_spent: number;
  last_stay_at?: string;
  tags?: string[];
  created_at: string;
}

export interface GuestStay {
  id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  room_type?: string;
  amount_paid: number;
  channel?: string;
  notes?: string;
  created_at: string;
}

export interface GuestWithHistory extends Guest {
  stays: GuestStay[];
}

// ── WhatsApp ───────────────────────────────────────────────────────────────

export interface WhatsAppTemplate {
  id: string;
  client_id: string;
  name: string;
  body: string;
  variables?: string[];
  category: string;
  status: EWhatsAppTemplateStatus;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  client_id: string;
  template_id?: string;
  to_phone: string;
  to_name?: string;
  body: string;
  status: EWhatsAppMessageStatus;
  sent_at: string;
  created_at: string;
}

// ── DTOs ───────────────────────────────────────────────────────────────────

export interface CreateHotelClientDto {
  tenant_id?: string;
  email: string;
  password?: string;
  hotel_name: string;
  logo_url?: string;
  country: string;
  booking_engine?: string;
  target_occupancy?: number;
  target_direct_pct?: number;
  contract_start: string;
}

export interface UpdateHotelClientDto {
  hotel_name?: string;
  logo_url?: string;
  country?: string;
  booking_engine?: string;
  target_occupancy?: number;
  target_direct_pct?: number;
  is_active?: boolean;
}

export interface InsertOtaDataDto {
  reference_month: string;
  ota_bookings: number;
  ota_revenue: number;
  commission_rate: number;
  platform_breakdown?: { booking?: number; getyourguide?: number; viator?: number };
}

export interface PublishReportDto {
  executive_summary: string;
  highlights: string[];
  next_steps: string[];
  admin_comment: string;
}

export interface CreateReportDto {
  reference_month: string;
  client_id: string;
  executive_summary?: string;
  highlights?: string[];
  next_steps?: string[];
  admin_comment?: string;
}

export interface SubmitReviewDto {
  executive_summary?: string;
  highlights?: string[];
  next_steps?: string[];
  admin_comment?: string;
}

export interface InsertReputationDto {
  reference_month: string;
  score: number;
  platform: string;
  review_count?: number;
  notes?: string;
}

export interface InsertKpiDto {
  reference_month: string;
  revpar: number;
  adr: number;
  occupancy_rate: number;
  rooms_available?: number;
  rooms_sold?: number;
}

export interface InsertBookingWindowDto {
  reference_month: string;
  avg_days_advance: number;
  segment?: string;
  channel?: string;
}

export interface InsertRateParityDto {
  check_date: string;
  room_type: string;
  our_rate: number;
  ota_platform: string;
  ota_rate: number;
}

export interface InsertBudgetDto {
  reference_month: string;
  channel: string;
  planned_amount: number;
  actual_amount?: number;
}

export interface CreateReservationDto {
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  room_type?: string;
  total_amount: number;
  channel: string;
  notes?: string;
}

export interface CreateGuestDto {
  name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  birthday?: string;
  tags?: string[];
}

export interface AddGuestStayDto {
  check_in: string;
  check_out: string;
  room_type?: string;
  amount_paid: number;
  channel?: string;
  notes?: string;
}

export interface CreateWhatsAppTemplateDto {
  name: string;
  body: string;
  variables?: string[];
  category: string;
}

export interface SendWhatsAppDto {
  template_id?: string;
  to_phone: string;
  to_name?: string;
  body?: string;
  variables?: Record<string, string>;
}

// ── WhatsApp Links ─────────────────────────────────────────────────────────

export interface WhatsAppLink {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  phone_number: string;
  message?: string;
  code: string;
  /** Normalized client-side from backend `redirect_url` (e.g. https://backend.../wa/<code>). */
  short_url: string;
  redirect_url?: string;
  total_clicks: number;
  is_active: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppLinkClickByDay {
  date: string;
  count: number;
}

export interface WhatsAppLinkClick {
  id: string;
  clicked_at: string;
  country?: string;
  city?: string;
  region?: string;
  device_type?: string;
  referer?: string;
}

export interface WhatsAppLinkStats {
  total_clicks: number;
  clicks_by_day: WhatsAppLinkClickByDay[];
  by_device: { device: string; count: number }[];
  by_country: { country: string; count: number }[];
  by_region: { region: string; count: number }[];
  by_city: { city: string; count: number }[];
  recent_clicks: WhatsAppLinkClick[];
}

export interface CreateWhatsAppLinkDto {
  name: string;
  description?: string;
  phone_number: string;
  message?: string;
  /** Slug final do link (/wa/<custom_code>). Vazio = backend gera a partir do name. */
  custom_code?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface UpdateWhatsAppLinkDto {
  name?: string;
  description?: string;
  message?: string;
  is_active?: boolean;
  custom_code?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}
