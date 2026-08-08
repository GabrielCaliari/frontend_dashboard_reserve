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

  it("maps the backend module names onto this catalog's names", () => {
    // O backend chama de "client-portal" e "stats" o que aqui e "hotel" e
    // "metrics". Sem a traducao os dois cairiam no default `true` e o Hotel
    // Marketing apareceria para todo tenant, gateado por nada.
    const result = normalizeTenantCapabilities({
      modules: {
        "client-portal": { enabled: false, source: "tenantTypePolicy" },
        stats: { enabled: false, source: "tenantOverride" },
      },
    });
    expect(result.modules.hotel).toBe(false);
    expect(result.modules.metrics).toBe(false);
    expect(result.moduleResolutions.hotel).toEqual({
      enabled: false,
      source: "tenantTypePolicy",
    });
  });

  it("prefers this catalog's own module name over the backend alias", () => {
    const result = normalizeTenantCapabilities({
      modules: {
        hotel: { enabled: true, source: "tenantOverride" },
        "client-portal": { enabled: false, source: "tenantTypePolicy" },
      },
    });
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
