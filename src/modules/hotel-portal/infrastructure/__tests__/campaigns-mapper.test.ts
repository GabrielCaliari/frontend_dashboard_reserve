import { describe, expect, it } from "vitest";
import { toHotelCampaigns } from "../campaigns-mapper";

describe("toHotelCampaigns", () => {
  it("soma as linhas diarias por campanha e monta o resumo por canal", () => {
    const out = toHotelCampaigns([
      { id: "1", channel: "META_ADS", campaign_id: "c1", campaign_name: "Feriado", metric_date: "2026-10-01", spend: 10.5, clicks: 3, conversions: 1 },
      { id: "2", channel: "META_ADS", campaign_id: "c1", campaign_name: "Feriado", metric_date: "2026-10-02", spend: 4.5, clicks: 2, conversions: 2 },
      { id: "3", channel: "META_ADS", campaign_id: "c2", campaign_name: "Verao", metric_date: "2026-10-02", spend: 30 },
    ]);
    expect(out.metrics.map((m) => [m.campaign_name, m.spend, m.clicks])).toEqual([
      ["Verao", 30, 0],
      ["Feriado", 15, 5],
    ]);
    expect(out.summary).toHaveLength(1);
    expect(out.summary[0].total_spend).toBe(45);
    expect(out.summary[0].total_conversions).toBe(3);
  });

  it("lista vazia vira resposta vazia, sem quebrar a tela", () => {
    expect(toHotelCampaigns(null)).toEqual({ summary: [], metrics: [] });
  });
});
