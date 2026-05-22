import { describe, expect, it } from "vitest";
import { normalizeModuleFlags } from "./tenant-modules";
import {
  canViewMetric,
  canViewMetricGroup,
  filterDashboardGroups,
  metricModuleFor,
} from "./dashboard-visibility";

describe("dashboard metric visibility", () => {
  it("maps a hotel metric group to the hotel module", () => {
    expect(metricModuleFor({ moduleKey: "hotel-occupancy" })).toBe("hotel");
  });

  it("hides metrics from disabled modules even for a super admin", () => {
    // Wildcard permissions alone (a super_admin role) do not bypass a disabled
    // module -- only isMasterTenant does (see the next test). This is
    // deliberately isMasterTenant=false: it isolates the permission bypass
    // from the master-tenant bypass, which the reference plan's fixture
    // conflated (passing isMasterTenant=true here made this test contradict
    // "bypasses module and permission checks for a master tenant" below,
    // since both would then feed satisfiesRule's unconditional
    // `if (isMasterTenant) return true` the exact same isMasterTenant=true
    // input and could not both hold).
    const flags = normalizeModuleFlags({ hotel: false });
    expect(
      canViewMetricGroup(
        { moduleKey: "hotel", metrics: [{ key: "hotel.occupancy_rate" }] },
        flags,
        new Set(["*"]),
        false,
      ),
    ).toBe(false);
  });

  it("requires a matching read permission for tenant admins", () => {
    const flags = normalizeModuleFlags({ leads: true, cms: true });
    const permissions = new Set(["leads.read", "metrics.dashboard.read"]);
    expect(
      canViewMetricGroup(
        { moduleKey: "leads", metrics: [{ key: "leads.total" }] },
        flags,
        permissions,
      ),
    ).toBe(true);
    expect(
      canViewMetricGroup(
        { moduleKey: "cms", metrics: [{ key: "cms.articles.total" }] },
        flags,
        permissions,
      ),
    ).toBe(false);
  });

  it("filters mixed conversion metrics at metric level", () => {
    const flags = normalizeModuleFlags({ leads: true, payments: false });
    const permissions = new Set(["metrics.dashboard.read", "leads.read"]);
    const groups = filterDashboardGroups(
      [
        {
          moduleKey: "conversions",
          label: "Conversoes",
          fetchedAt: "2026-07-21",
          metrics: [
            { key: "conversions.leads_created", label: "Leads", value: 3 },
            { key: "conversions.revenue", label: "Receita", value: 100 },
          ],
        },
      ],
      flags,
      permissions,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].moduleKey).toBe("leads");
    expect(groups[0].metrics.map((metric) => metric.key)).toEqual([
      "conversions.leads_created",
    ]);
  });

  it("requires both leads and payments access for the cross-module conversion rate", () => {
    const flags = normalizeModuleFlags({ leads: true, payments: true });
    expect(
      canViewMetric(
        { moduleKey: "conversions" },
        { key: "conversions.lead_to_paying_rate" },
        flags,
        new Set(["metrics.dashboard.read", "leads.read"]),
      ),
    ).toBe(false);
  });

  it("bypasses module and permission checks for a master tenant", () => {
    const flags = normalizeModuleFlags({ hotel: false });
    expect(
      canViewMetricGroup(
        { moduleKey: "hotel", metrics: [{ key: "hotel.occupancy_rate" }] },
        flags,
        new Set(),
        true,
      ),
    ).toBe(true);
  });
});
