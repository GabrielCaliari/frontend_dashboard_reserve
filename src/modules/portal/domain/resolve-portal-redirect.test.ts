import { describe, expect, it } from "vitest";
import { resolvePortalRedirect } from "./resolve-portal-redirect";

describe("resolvePortalRedirect", () => {
  it("returns null for non-portal routes", () => {
    expect(resolvePortalRedirect("/dashboard", false)).toBeNull();
    expect(resolvePortalRedirect("/auth/login", true)).toBeNull();
  });

  it("redirects to /portal/login when there is no token and the route is not login", () => {
    expect(resolvePortalRedirect("/portal/dashboard", false)).toBe("/portal/login");
    expect(resolvePortalRedirect("/portal/trafego", false)).toBe("/portal/login");
  });

  it("does not redirect an unauthenticated visitor already on /portal/login", () => {
    expect(resolvePortalRedirect("/portal/login", false)).toBeNull();
  });

  it("redirects an authenticated visitor away from /portal/login to the dashboard", () => {
    expect(resolvePortalRedirect("/portal/login", true)).toBe("/portal/dashboard");
  });

  it("does not redirect an authenticated visitor on any other portal route", () => {
    expect(resolvePortalRedirect("/portal/leads", true)).toBeNull();
  });
});
