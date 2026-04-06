// Hotel Portal — aligned with backend reserve-client-portal module

export type EPlatform = 'GA4' | 'META_ADS' | 'GOOGLE_ADS';
export type EIntegrationStatus = 'PENDING' | 'ACTIVE' | 'ERROR' | 'DISCONNECTED';
export type EReportStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED';
export type ECampaignChannel = 'META_ADS' | 'GOOGLE_ADS' | 'GOOGLE_HOTEL_ADS' | 'REMARKETING';

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

// ── DTOs ───────────────────────────────────────────────────────────────────

export interface CreateHotelClientDto {
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
  executive_summary?: string;
  highlights?: string[];
  next_steps?: string[];
  admin_comment?: string;
}
