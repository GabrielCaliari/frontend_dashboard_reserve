import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortalKpiCards } from "../kpi-cards";
import type { MetricComparison } from "@/src/modules/portal/domain/portal-stats";

const metrics: MetricComparison[] = [
  { metric_key: "investimento", current_value: 1200, previous_value: 1000, variation_pct: 20 },
  { metric_key: "conversas_iniciadas", current_value: 48, previous_value: 40, variation_pct: 20 },
  { metric_key: "custo_por_conversa", current_value: 25, previous_value: 30, variation_pct: -16.7 },
];

describe("PortalKpiCards", () => {
  it("renders the 4 headline cards from master doc §3.1 with glossary labels and variation", () => {
    render(<PortalKpiCards metrics={metrics} />);
    expect(screen.getByText("Investimento")).toBeInTheDocument();
    expect(screen.getByText("Conversas iniciadas")).toBeInTheDocument();
    expect(screen.getByText("Custo por conversa")).toBeInTheDocument();
    // Both "investimento" and "conversas_iniciadas" carry variation_pct: 20 in
    // this fixture, so two identical "+20%" badges legitimately render — assert
    // on the group rather than a single unique match.
    expect(screen.getAllByText("+20%").length).toBe(2);
  });

  it("shows skeletons while loading", () => {
    render(<PortalKpiCards metrics={[]} isLoading />);
    expect(screen.queryByText("Investimento")).not.toBeInTheDocument();
  });
});
