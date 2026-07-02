/**
 * §3.3 Camada 1 — "cliques nos links rastreáveis até leads gerados".
 *
 * BLOCKED (backend): the plan this task was written from (Assumption 4)
 * claimed these shapes mirror a `WhatsAppLinkStats` type living in
 * `@hotel-portal.ts` — that type does not exist anywhere in this frontend
 * repo (confirmed by reading the file's full export list). What *does*
 * exist, read directly from `backend_reserve`'s `reserve-client-portal`
 * module, is `LeadsOverviewService.getOverview(clientId, from, to)`
 * (application/services/leads-overview.service.ts), which already
 * aggregates every `WhatsAppTrackingLink`'s clicks for a client:
 *
 *   { clicks: Metric, byDay: {date,count}[], byDevice: {device,count}[], byCity: {city,count}[] }
 *
 * It is wired only into the admin's `GET /hotel-portal/:clientId/leads-overview`
 * (AdminJwtGuard-gated, client.controller.ts). No client-scoped
 * `GET /portal/leads/camada-1` exists yet. Two adjustments made against
 * the plan's original shapes based on that real service:
 *   - `LeadsByDevice.device` includes `"unknown"` — the real
 *     `detectDevice()` falls back to it and `groupByDevice` COALESCEs to it.
 *   - `LeadsByDayPoint` carries a single `count`, not per-day
 *     cliques/conversas/leads — the backend only tracks one number (a
 *     bot-filtered WhatsApp link click, which is already "conversa
 *     iniciada" per this repo's own glossary entry for that key), and no
 *     per-day breakdown is rendered on this task's page anyway.
 *   - `totals.leads` (a downstream CRM-qualified conversion, distinct from
 *     a click) has no backend source at all yet — it renders as whatever
 *     the eventual endpoint sends, defaulting to 0 via the page's `?? []`
 *     guards until that tracking exists.
 */
export interface LeadsCamada1Query {
  from: string;
  to: string;
}

export interface LeadsByDayPoint {
  date: string;
  count: number;
}

export interface LeadsByDevice {
  device: "mobile" | "desktop" | "tablet" | "unknown";
  count: number;
}

export interface LeadsByCity {
  city: string;
  count: number;
}

export interface LeadsCamada1Response {
  totals: { cliques: number; conversas: number; leads: number };
  by_day: LeadsByDayPoint[];
  by_device: LeadsByDevice[];
  by_city: LeadsByCity[];
}

export type FunnelStageKey = "alcance" | "cliques" | "conversas" | "qualificados" | "prontos" | "reservas";

export interface FunnelStage {
  key: FunnelStageKey;
  label: string;
  value: number;
  /** true marks this as the last stage owned by the Reserve side — master doc §3.3 "fronteira" */
  isFronteira?: boolean;
}

/** Camada 1 only ever shows cliques → conversas → leads gerados (§3.3); later
 * stages (qualificados/prontos) are appended by Task 20 once bot data exists. */
export function buildCamada1FunnelStages(response: LeadsCamada1Response): FunnelStage[] {
  return [
    { key: "cliques", label: "Cliques", value: response.totals.cliques },
    { key: "conversas", label: "Conversas iniciadas", value: response.totals.conversas },
    { key: "reservas", label: "Leads gerados", value: response.totals.leads },
  ];
}
