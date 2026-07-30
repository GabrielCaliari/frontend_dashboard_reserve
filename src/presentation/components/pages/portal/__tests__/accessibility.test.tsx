import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { renderWithQueryClient } from "@/src/shared/query/test-query-provider";
import { PortalKpiCards } from "@/src/presentation/components/organisms/portal/overview/kpi-cards";
import { AcquisitionFunnel } from "@/src/presentation/components/organisms/portal/funnel/acquisition-funnel";
import { PortalNav } from "@/src/presentation/components/organisms/portal/nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/portal/dashboard" }));

/**
 * Plan Task 38's closing verification: a vitest-axe pass across the shared
 * portal primitives, mirroring the accessibility-test convention already
 * used elsewhere in this codebase
 * (src/presentation/components/organisms/access-management/__tests__/accessibility.test.tsx,
 * src/presentation/components/organisms/notifications/notification-view.a11y.test.tsx).
 * This file did not exist despite being the plan's final task — every other
 * portal page/component was built and tested individually, but the
 * cross-cutting a11y pass across the shared building blocks (nav, KPI cards,
 * funnel) was never added.
 */
describe("Portal accessibility (vitest-axe)", () => {
  it("PortalNav has no detectable a11y violations", async () => {
    const { container } = renderWithQueryClient(<PortalNav />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("PortalKpiCards has no detectable a11y violations", async () => {
    const { container } = renderWithQueryClient(
      <PortalKpiCards
        metrics={[
          { metric_key: "investimento", current_value: 1200, previous_value: 1000, variation_pct: 20 },
          { metric_key: "conversas_iniciadas", current_value: 48, previous_value: 40, variation_pct: 20 },
          { metric_key: "custo_por_conversa", current_value: 25, previous_value: 30, variation_pct: -16.7 },
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("AcquisitionFunnel has no detectable a11y violations", async () => {
    const { container } = renderWithQueryClient(
      <AcquisitionFunnel
        stages={[
          { key: "cliques", label: "Cliques", value: 100 },
          { key: "conversas", label: "Conversas", value: 60, isFronteira: true },
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
