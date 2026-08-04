// Hotel Portal — Contrato v1 (docs/02_CONTRATO_API_HOTEL_PORTAL.md)
// Fonte única de verdade back↔front. Dinheiro SEMPRE em centavos (inteiro).
// Todo KPI agregado carrega `source` para o selo de origem (🔌/🎯/✍️).

// ── Tipos reutilizados (contrato §0) ────────────────────────────────────────

export type Money = { amount: number; currency: 'BRL' }; // amount em centavos
export type Source = 'auto' | 'server' | 'manual';

/** Métrica agregada com comparação de período. */
export type Metric = {
  value: number;
  previous: number | null;
  delta: number | null;
  source: Source;
};

/** Métrica monetária com comparação. */
export type MoneyMetric = {
  value: number; // centavos
  currency: 'BRL';
  previous?: number | null;
  delta?: number | null;
  source: Source;
};

export type Period = { from: string; to: string }; // ISO date (inclusive)

/** Modo de renderização da dashboard (Plano §2.5). */
export type RenderMode = 'conversion' | 'activity';

// ── Integrações (contrato §2) ───────────────────────────────────────────────

export type IntegrationProvider =
  | 'meta_ads'
  | 'google_ads'
  | 'ga4'
  | 'booking_engine';

export type IntegrationStatus =
  | 'connected'
  | 'manual'
  | 'webhook'
  | 'needs_reauth'
  | 'error'
  | 'not_configured';

export interface IntegrationState {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  lastSyncAt: string | null;
}

export type BookingEngine =
  | 'stays'
  | 'omnibees'
  | 'hits'
  | 'foco'
  | 'totvs'
  | 'webhook'
  | 'none';

// ── Client detail (contrato §2 — GET /clients/:id) ──────────────────────────

export interface HotelClientDetail {
  id: string;
  name: string;
  country: string;
  logoUrl?: string;
  bookingEngine: BookingEngine;
  targets: { occupancy: number; directPct: number };
  integrations: IntegrationState[];
}

export interface HotelClientSummary {
  id: string;
  name: string;
  country: string;
  bookingEngine: BookingEngine;
  logoUrl?: string;
  targets: { occupancy: number; directPct: number };
  integrationsSummary: Partial<Record<IntegrationProvider, IntegrationStatus>>;
}

// ── Overview consolidado (contrato §3 — GET /overview) ──────────────────────

export interface OverviewChannelMedia {
  channel: string;
  spend: number; // centavos
  attributedRevenue: number; // centavos
  roas: number;
  source: Source;
}

export interface OverviewTimeseriesPoint {
  date: string; // ISO date
  directRevenue: number; // centavos
  otaRevenue: number; // centavos
  spend: number; // centavos
}

/**
 * O JSON do overview (contrato §3) usa `{ value, currency }` para dinheiro
 * (não o `Money = { amount }` canônico do §0). Tipamos pelo JSON real.
 */
export type OverviewMoney = { value: number; currency: 'BRL' };
export type OverviewMoneySourced = OverviewMoney & { source: Source };

export interface HotelOverviewResponse {
  period: Period;
  comparedTo: Period;

  directVsOta: {
    directRevenue: OverviewMoney;
    otaRevenue: OverviewMoney;
    directPct: Metric;
    commissionRecovered: OverviewMoneySourced;
  };

  media: {
    spend: OverviewMoney;
    roas: Metric;
    costPerBooking: OverviewMoneySourced;
    byChannel: OverviewChannelMedia[];
  };

  /** null no MVP / modo ATIVIDADE quando ausente. */
  hotelKpis: {
    revpar: OverviewMoneySourced | null;
    adr: OverviewMoneySourced | null;
    occupancy: Metric | null;
  } | null;

  whatsapp: { clicks: Metric };

  timeseries: OverviewTimeseriesPoint[];
}

// ── OTA vs Direto (contrato §4 — GET /clients/:id/ota-data) ─────────────────

export interface OtaChannelBreakdown {
  channel: string;
  revenue: number; // centavos
  commissionPct: number;
  commission: number; // centavos
  bookings: number;
}

export interface OtaDataResponse {
  period: Period;
  breakdown: OtaChannelBreakdown[];
  totals: {
    otaRevenue: number; // centavos
    otaCommission: number; // centavos
    directRevenue: number; // centavos
  };
  source: Source;
}

export interface InsertOtaDataV1Dto {
  month: string; // YYYY-MM
  breakdown: Array<{
    channel: string;
    revenue: number; // centavos
    commissionPct: number;
    bookings: number;
  }>;
  directRevenue: number; // centavos
}
