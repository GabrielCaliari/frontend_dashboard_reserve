import { describe, expect, it } from "vitest";
import { toHotelDashboard } from "../dashboard-mapper";

const NOW = new Date("2026-10-26T12:00:00Z");

describe("toHotelDashboard", () => {
  it("monta kpi vazio e avisa falta de OTA quando o backend nao tem snapshots", () => {
    const out = toHotelDashboard({ snapshots: [], period: { from: "2026-10-01" } }, NOW);
    expect(out.kpi.commission_recovered_month).toBe(0);
    expect(out.kpi.occupancy_rate).toBe(0);
    expect(out.timeseries).toEqual([]);
    expect(out.ota_data_missing).toBe(true);
  });

  it("aplica a taxa efetiva da OTA sobre a receita direta do mes", () => {
    const out = toHotelDashboard(
      {
        snapshots: [
          { snapshot_date: "2026-10-05", direct_revenue: 10000, ota_revenue: 20000, ota_commission_paid: 3000, occupancy_rate: 70 },
          { snapshot_date: "2026-09-05", direct_revenue: 5000, ota_revenue: 5000, ota_commission_paid: 1000, occupancy_rate: 0.5 },
        ],
      },
      NOW,
    );
    expect(out.kpi.commission_recovered_month).toBeCloseTo(1500);
    expect(out.kpi.commission_projected_annual).toBeCloseTo(18000);
    // total: 15000 direto x (4000 / 25000)
    expect(out.kpi.commission_recovered_total).toBeCloseTo(2400);
    expect(out.kpi.occupancy_rate).toBeCloseTo(0.6);
    expect(out.timeseries.map((t) => t.month)).toEqual(["2026-09", "2026-10"]);
    expect(out.ota_data_missing).toBe(false);
  });

  it("repassa o formato da tela quando o backend ja manda kpi", () => {
    const ready = { kpi: { occupancy_rate: 0.8 }, timeseries: [], contract_start: "", ota_data_missing: false };
    expect(toHotelDashboard(ready as never, NOW)).toBe(ready);
  });
});
