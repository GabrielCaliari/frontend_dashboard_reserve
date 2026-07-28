import { afterEach, describe, expect, it } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { injectAuthHeaders } from "./get-auth-headers";

function setCookie(value: string) {
  document.cookie = value;
}

function clearAllCookies() {
  ["token", "session-code", "tenant-storage", "portal-token"].forEach((name) => {
    document.cookie = `${name}=; Max-Age=0; path=/;`;
  });
}

function makeConfig(url: string): InternalAxiosRequestConfig {
  return { url, headers: {} } as unknown as InternalAxiosRequestConfig;
}

describe("injectAuthHeaders", () => {
  afterEach(() => {
    clearAllCookies();
  });

  it("uses the admin token cookie for non-portal requests", async () => {
    setCookie("token=admin-jwt");
    setCookie("tenant-storage=" + encodeURIComponent(JSON.stringify({ state: { selectedTenant: { id: "abc123" } } })));

    const config = await injectAuthHeaders(makeConfig("/leads"));

    expect(config.headers.Authorization).toBe("Bearer admin-jwt");
    expect(config.headers["x-tenant-id"]).toBe("abc123");
  });

  it("uses the portal-token cookie — not the admin token — for /portal/** requests", async () => {
    setCookie("token=admin-jwt");
    setCookie("portal-token=portal-jwt");

    const config = await injectAuthHeaders(makeConfig("/portal/overview"));

    expect(config.headers.Authorization).toBe("Bearer portal-jwt");
  });

  it("never leaks the admin x-tenant-id header onto /portal/** requests", async () => {
    setCookie("portal-token=portal-jwt");
    setCookie("tenant-storage=" + encodeURIComponent(JSON.stringify({ state: { selectedTenant: { id: "abc123" } } })));

    const config = await injectAuthHeaders(makeConfig("/portal/traffic"));

    expect(config.headers["x-tenant-id"]).toBeUndefined();
  });

  it("sends no Authorization header on /portal/** requests when there is no portal session", async () => {
    setCookie("token=admin-jwt");

    const config = await injectAuthHeaders(makeConfig("/portal/overview"));

    expect(config.headers.Authorization).toBeUndefined();
  });
});
