import type {
  DashboardKPI,
  DashboardTimeseries,
  HotelDashboardResponse,
} from "@/src/shared/domain/types/@hotel-portal";

/**
 * O que `GET /hotel-portal/:clientId/dashboard` devolve de fato: as linhas de
 * dashboard_snapshots do periodo (uma por dia/mes que a equipe lancou), as
 * campanhas e o site. Nao existe `kpi` nem `timeseries` no backend — a tela
 * monta os dois a partir dos snapshots aqui, sem deixar o formato do backend
 * vazar para a apresentacao.
 */
interface BackendSnapshot {
  snapshot_date: string;
  direct_bookings?: number;
  ota_bookings?: number;
  direct_revenue?: number;
  ota_revenue?: number;
  ota_commission_paid?: number;
  occupancy_rate?: number;
  site_visitors?: number;
  site_conversion_rate?: number;
}

export interface BackendDashboardResponse {
  snapshots?: BackendSnapshot[];
  period?: { from?: string; to?: string };
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Ocupacao chega como fracao (0.72) ou como percentual (72); a tela usa fracao. */
const asFraction = (v: number) => (v > 1 ? v / 100 : v);

/**
 * Comissao "recuperada": o que a pousada teria pago a OTA se as reservas diretas
 * tivessem vindo pela OTA, na taxa efetiva que ela pagou (comissao / receita OTA).
 * Sem receita OTA lancada nao ha taxa para aplicar, entao fica 0 e a tela avisa
 * pelo `ota_data_missing`.
 */
function commissionRecovered(rows: BackendSnapshot[]): number {
  const otaRevenue = rows.reduce((s, r) => s + num(r.ota_revenue), 0);
  const commission = rows.reduce((s, r) => s + num(r.ota_commission_paid), 0);
  if (otaRevenue <= 0) return 0;
  const directRevenue = rows.reduce((s, r) => s + num(r.direct_revenue), 0);
  return directRevenue * (commission / otaRevenue);
}

export function toHotelDashboard(
  raw: BackendDashboardResponse | HotelDashboardResponse | null | undefined,
  now: Date = new Date(),
): HotelDashboardResponse {
  // Se um dia o backend passar a mandar o formato da tela, usa direto.
  if (raw && "kpi" in raw && raw.kpi) return raw as HotelDashboardResponse;

  const snapshots = ((raw as BackendDashboardResponse | null)?.snapshots ?? []).filter(
    (s) => s && s.snapshot_date,
  );
  const monthKey = (d: string) => d.slice(0, 7);
  const currentMonth = now.toISOString().slice(0, 7);

  const byMonth = new Map<string, BackendSnapshot[]>();
  for (const s of snapshots) {
    const key = monthKey(s.snapshot_date);
    byMonth.set(key, [...(byMonth.get(key) ?? []), s]);
  }

  const timeseries: DashboardTimeseries[] = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, rows]) => ({
      month,
      direct_bookings: rows.reduce((s, r) => s + num(r.direct_bookings), 0),
      ota_bookings: rows.reduce((s, r) => s + num(r.ota_bookings), 0),
      direct_revenue: rows.reduce((s, r) => s + num(r.direct_revenue), 0),
      ota_revenue: rows.reduce((s, r) => s + num(r.ota_revenue), 0),
      commission_paid: rows.reduce((s, r) => s + num(r.ota_commission_paid), 0),
    }));

  const monthRows = byMonth.get(currentMonth) ?? [];
  const recoveredMonth = commissionRecovered(monthRows);
  const recoveredTotal = commissionRecovered(snapshots);
  const occupancyRows = snapshots.filter((s) => typeof s.occupancy_rate === "number");
  const occupancy = occupancyRows.length
    ? occupancyRows.reduce((s, r) => s + asFraction(num(r.occupancy_rate)), 0) / occupancyRows.length
    : 0;

  const kpi: DashboardKPI = {
    direct_bookings: monthRows.reduce((s, r) => s + num(r.direct_bookings), 0),
    ota_bookings: monthRows.reduce((s, r) => s + num(r.ota_bookings), 0),
    direct_revenue: monthRows.reduce((s, r) => s + num(r.direct_revenue), 0),
    ota_revenue: monthRows.reduce((s, r) => s + num(r.ota_revenue), 0),
    commission_recovered_month: recoveredMonth,
    commission_recovered_total: recoveredTotal,
    commission_projected_annual: recoveredMonth * 12,
    occupancy_rate: occupancy,
    // As metas moram no cadastro do hotel, nao no dashboard; a tela le de la.
    target_occupancy: 0,
    target_direct_pct: 0,
    site_visitors: monthRows.reduce((s, r) => s + num(r.site_visitors), 0),
    site_conversion_rate: 0,
  };

  return {
    kpi,
    timeseries,
    contract_start: (raw as BackendDashboardResponse | null)?.period?.from ?? "",
    ota_data_missing: !monthRows.some((r) => num(r.ota_revenue) > 0),
  };
}
