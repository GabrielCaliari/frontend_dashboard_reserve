import { describe, expect, it, vi, beforeEach } from "vitest";
import { portalStatsService } from "../portal-stats-service";
import api from "@/src/infraestructure/axios/api";

vi.mock("@/src/infraestructure/axios/api", () => ({ default: { get: vi.fn() } }));

describe("portalStatsService.getComparativo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests the comparativo endpoint with the given metric keys and period", async () => {
    const mockResponse = {
      period: { from: "2026-07-16", to: "2026-07-31" },
      previous_period: { from: "2026-07-01", to: "2026-07-15" },
      metrics: [
        { metric_key: "investimento", current_value: 1200, previous_value: 1000, variation_pct: 20 },
      ],
    };
    vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

    const result = await portalStatsService.getComparativo({
      metric_keys: ["investimento"],
      period: "biweekly",
      from: "2026-07-16",
      to: "2026-07-31",
    });

    expect(api.get).toHaveBeenCalledWith("/portal/stats/comparativo", {
      params: {
        metric_keys: "investimento",
        period: "biweekly",
        from: "2026-07-16",
        to: "2026-07-31",
      },
    });
    expect(result).toEqual(mockResponse);
  });
});
