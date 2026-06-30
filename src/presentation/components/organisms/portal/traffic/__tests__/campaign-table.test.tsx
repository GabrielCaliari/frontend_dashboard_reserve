import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CampaignTable } from "../campaign-table";
import type { CampaignPerformance } from "@/src/modules/portal/domain/portal-traffic";

const campaigns: CampaignPerformance[] = [
  { id: "c1", name: "Verão 2026", spend: 850, reach: 12000, impressions: 30000, clicks: 120, cpl: 7.08, frequency: 2.5 },
];

describe("CampaignTable", () => {
  it("renders one row per campaign with investimento and custo por conversa", () => {
    render(<CampaignTable campaigns={campaigns} forceMobile={false} />);
    expect(screen.getByText("Verão 2026")).toBeInTheDocument();
    expect(screen.getByText(/850/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no campaigns", () => {
    render(<CampaignTable campaigns={[]} forceMobile={false} />);
    expect(screen.getByText(/nenhuma campanha/i)).toBeInTheDocument();
  });
});
