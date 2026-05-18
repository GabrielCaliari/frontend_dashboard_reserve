import { beforeEach, describe, expect, it } from "vitest";
import {
  migrateTenantStore,
  useHasSelectedTenant,
  useSelectedTenantId,
  useTenantStore,
} from "./tenant-store";

const tenant = {
  id: "clv1tenant000000000000001",
  name: "Hotel RÉSERVE",
  slug: "hotel-reserve",
  domain: "hotel.reserve.test",
};

beforeEach(() => {
  useTenantStore.setState({ selectedTenant: null });
});

describe("migrateTenantStore", () => {
  it("drops the dead dashboardScope field from a persisted v2 cookie", () => {
    const migrated = migrateTenantStore({
      selectedTenant: tenant,
      dashboardScope: "global",
    });

    expect(migrated.selectedTenant).toEqual(tenant);
    expect("dashboardScope" in migrated).toBe(false);
  });

  it("returns an empty selection for a corrupt or empty persisted state", () => {
    expect(migrateTenantStore(null).selectedTenant).toBeNull();
    expect(migrateTenantStore("not an object").selectedTenant).toBeNull();
    expect(migrateTenantStore({}).selectedTenant).toBeNull();
  });
});

describe("tenant store selectors", () => {
  it("reports the selected tenant id without consulting any scope", () => {
    useTenantStore.setState({ selectedTenant: tenant });
    expect(useSelectedTenantId.getState?.()).toBeUndefined();
    expect(useTenantStore.getState().selectedTenant?.id).toBe(tenant.id);
  });

  it("exposes setSelectedTenant and clearSelectedTenant with no scope side effect", () => {
    useTenantStore.getState().setSelectedTenant(tenant);
    expect(useTenantStore.getState().selectedTenant).toEqual(tenant);

    useTenantStore.getState().clearSelectedTenant();
    expect(useTenantStore.getState().selectedTenant).toBeNull();
    expect(Object.keys(useTenantStore.getState())).toEqual([
      "selectedTenant",
      "setSelectedTenant",
      "clearSelectedTenant",
    ]);
  });

  it("no longer exports a dashboard scope selector", async () => {
    const storeModule = await import("./tenant-store");
    expect("useDashboardScope" in storeModule).toBe(false);
    expect("useIsGlobalDashboardScope" in storeModule).toBe(false);
    expect(typeof useHasSelectedTenant).toBe("function");
  });
});
