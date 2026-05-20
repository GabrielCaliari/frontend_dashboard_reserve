import { describe, expect, it } from "vitest";
import { normalizeTenantCapabilities } from "./tenant-capabilities";

describe("normalizeTenantCapabilities", () => {
  it("normalizes a well-formed MASTER response", () => {
    const raw = {
      tenantId: "tenant-1",
      tenantType: "MASTER",
      isMasterTenant: true,
      role: "super_admin",
      modules: {
        leads: { enabled: true, source: "master" },
        cms: { enabled: true, source: "master" },
      },
      permissions: ["*"],
    };
    const result = normalizeTenantCapabilities(raw);
    expect(result.tenantType).toBe("MASTER");
    expect(result.isMasterTenant).toBe(true);
    expect(result.role).toBe("super_admin");
    expect(result.moduleResolutions.leads).toEqual({
      enabled: true,
      source: "master",
    });
    expect(result.modules.leads).toBe(true);
    expect(result.permissions.has("*")).toBe(true);
  });

  it("defaults defensively when fields are missing", () => {
    const result = normalizeTenantCapabilities({});
    expect(result.tenantType).toBe("COMMON");
    expect(result.isMasterTenant).toBe(false);
    expect(result.role).toBe("viewer");
    expect(result.modules.leads).toBe(true);
    expect(result.permissions.size).toBe(0);
  });

  it("defaults defensively when given null/non-object input", () => {
    expect(normalizeTenantCapabilities(null).tenantType).toBe("COMMON");
    expect(normalizeTenantCapabilities(undefined).tenantType).toBe("COMMON");
    expect(normalizeTenantCapabilities("not an object").tenantType).toBe(
      "COMMON",
    );
  });

  it("derives a module flag from resolution.enabled for every GATEABLE_MODULES entry, defaulting missing ones to true", () => {
    const result = normalizeTenantCapabilities({
      modules: { leads: { enabled: false, source: "tenantOverride" } },
    });
    expect(result.modules.leads).toBe(false);
    expect(result.modules.cms).toBe(true);
    expect(result.modules.payments).toBe(true);
    expect(result.modules.hotel).toBe(true);
  });

  it("filters non-string entries out of permissions", () => {
    const result = normalizeTenantCapabilities({
      permissions: ["leads.read", 42, null, "cms.article.read"],
    });
    expect([...result.permissions].sort()).toEqual([
      "cms.article.read",
      "leads.read",
    ]);
  });
});
