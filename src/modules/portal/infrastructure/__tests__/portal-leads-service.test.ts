import { describe, expect, it, vi, beforeEach } from "vitest";
import { portalLeadsService } from "../portal-leads-service";
import api from "@/src/infraestructure/axios/api";

vi.mock("@/src/infraestructure/axios/api", () => ({ default: { get: vi.fn() } }));

describe("portalLeadsService.getCamada1", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests the camada-1 endpoint with the given period", async () => {
    const mockResponse = {
      totals: { cliques: 850, conversas: 850, leads: 30 },
      by_day: [{ date: "2026-07-01", count: 20 }],
      by_device: [{ device: "mobile", count: 600 }],
      by_city: [{ city: "São Paulo", count: 300 }],
    };
    vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

    const result = await portalLeadsService.getCamada1({ from: "2026-07-01", to: "2026-07-31" });

    expect(api.get).toHaveBeenCalledWith("/portal/leads/camada-1", {
      params: { from: "2026-07-01", to: "2026-07-31" },
    });
    expect(result).toEqual(mockResponse);
  });
});
