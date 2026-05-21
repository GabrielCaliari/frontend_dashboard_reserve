import { describe, expect, it } from "vitest";
import {
  filterNavigationByModuleFlags,
  filterNavigationByPermissions,
  getUsableModuleFlags,
  isTenantSettingsAvailable,
  type ModuleNavItem,
} from "./navigation";
import { normalizeModuleFlags } from "./tenant-modules";

const nav: ModuleNavItem[] = [
  { id: "dashboard" },
  { id: "settings" },
  { id: "access-management" },
  {
    id: "leads-menu",
    subItems: [
      { id: "leads" },
      { id: "lead-collections" },
      { id: "appointments" },
      { id: "abandoned-carts" },
    ],
  },
  {
    id: "cms",
    subItems: [
      { id: "blogs" },
      { id: "articles" },
      { id: "authors" },
      { id: "collections" },
      { id: "media" },
    ],
  },
  {
    id: "payments-menu",
    subItems: [
      { id: "payments-products" },
      { id: "payments-subscriptions" },
      { id: "payments-config" },
      { id: "coupons" },
    ],
  },
  {
    id: "hotel-menu",
    subItems: [{ id: "hotel-overview" }, { id: "hotel-config" }],
  },
];

describe("module navigation", () => {
  it("keeps mixed groups when at least one child is enabled", () => {
    const flags = normalizeModuleFlags({
      cms: false,
      payments: false,
      coupons: true,
      leads: false,
    });
    const result = filterNavigationByModuleFlags(nav, flags);

    expect(result.some((item) => item.id === "cms")).toBe(false);
    expect(
      result
        .find((item) => item.id === "payments-menu")
        ?.subItems?.map((item) => item.id),
    ).toEqual(["coupons"]);
    expect(result.some((item) => item.id === "leads-menu")).toBe(false);
    expect(result.some((item) => item.id === "access-management")).toBe(true);
  });

  it("fails closed for gated items while flags are loading or errored", () => {
    const loaded = normalizeModuleFlags({ leads: true });
    expect(getUsableModuleFlags(loaded, true, false)).toBeUndefined();
    expect(getUsableModuleFlags(loaded, false, true)).toBeUndefined();
    expect(
      filterNavigationByModuleFlags(nav, undefined).map((item) => item.id),
    ).toEqual(["dashboard", "settings", "access-management"]);
  });

  it("only exposes tenant settings when a tenant is selected", () => {
    expect(isTenantSettingsAvailable(null)).toBe(false);
    expect(isTenantSettingsAvailable("tenant-1")).toBe(true);
  });

  it("removes tenant navigation that the admin cannot read", () => {
    const result = filterNavigationByPermissions(nav, new Set(["leads.read"]));
    expect(result.some((item) => item.id === "dashboard")).toBe(false);
    expect(
      result
        .find((item) => item.id === "leads-menu")
        ?.subItems?.map((item) => item.id),
    ).toEqual(["leads"]);
    expect(result.some((item) => item.id === "access-management")).toBe(true);
  });

  it("orders the CMS journey and applies its read permissions", () => {
    const flags = normalizeModuleFlags({ cms: true });
    const enabled = filterNavigationByModuleFlags(nav, flags);
    const allowed = filterNavigationByPermissions(
      enabled,
      new Set(["cms.article.read", "cms.author.read"]),
    );

    expect(
      allowed.find((item) => item.id === "cms")?.subItems?.map((item) => item.id),
    ).toEqual(["articles", "authors"]);
  });
});
