import type {
  CampaignMetricItem,
  CampaignSummary,
  HotelCampaignsResponse,
} from "@/src/shared/domain/types/@hotel-portal";

/**
 * `GET /hotel-portal/:clientId/campaigns` devolve as linhas cruas de
 * campaign_metrics (uma por campanha por dia, dinheiro em reais). A tela quer o
 * resumo por canal e uma linha por campanha no periodo; a soma e feita aqui.
 */
interface BackendCampaignRow {
  id: string;
  channel: string;
  campaign_id?: string | null;
  campaign_name: string;
  metric_date: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue_attributed?: number;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function toHotelCampaigns(
  raw: BackendCampaignRow[] | HotelCampaignsResponse | null | undefined,
): HotelCampaignsResponse {
  if (raw && !Array.isArray(raw) && "summary" in raw) return raw;
  const rows = Array.isArray(raw) ? raw : [];

  const byCampaign = new Map<string, CampaignMetricItem>();
  for (const r of rows) {
    const key = `${r.channel}:${r.campaign_id ?? r.campaign_name}`;
    const acc = byCampaign.get(key) ?? {
      id: key,
      channel: r.channel as CampaignMetricItem["channel"],
      campaign_name: r.campaign_name,
      metric_date: r.metric_date,
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue_attributed: 0,
    };
    acc.spend += num(r.spend);
    acc.impressions += num(r.impressions);
    acc.clicks += num(r.clicks);
    acc.conversions += num(r.conversions);
    acc.revenue_attributed += num(r.revenue_attributed);
    if (r.metric_date > acc.metric_date) acc.metric_date = r.metric_date;
    byCampaign.set(key, acc);
  }

  const metrics = [...byCampaign.values()]
    .map((m) => ({ ...m, spend: Math.round(m.spend * 100) / 100 }))
    .sort((a, b) => b.spend - a.spend);

  const byChannel = new Map<string, CampaignSummary>();
  for (const m of metrics) {
    const s = byChannel.get(m.channel) ?? {
      channel: m.channel,
      total_spend: 0,
      total_impressions: 0,
      total_clicks: 0,
      total_conversions: 0,
      total_revenue: 0,
    };
    s.total_spend += m.spend;
    s.total_impressions += m.impressions;
    s.total_clicks += m.clicks;
    s.total_conversions += m.conversions;
    s.total_revenue += m.revenue_attributed;
    byChannel.set(m.channel, s);
  }

  const summary = [...byChannel.values()].map((s) => ({
    ...s,
    total_spend: Math.round(s.total_spend * 100) / 100,
    avg_roas: s.total_spend > 0 ? s.total_revenue / s.total_spend : undefined,
  }));

  return { summary, metrics };
}
