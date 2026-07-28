import { afterEach, describe, expect, it } from "vitest";
import {
  handlePortalUnauthorizedError,
  handleUnauthorizedError,
  isPortalRequestError,
} from "./auth-error-handler";

describe("isPortalRequestError", () => {
  it("identifies a failed request to the client-portal backend", () => {
    expect(isPortalRequestError({ config: { url: "/portal/overview" } })).toBe(true);
  });

  it("does not misclassify admin or unrelated requests", () => {
    expect(isPortalRequestError({ config: { url: "/leads" } })).toBe(false);
    expect(isPortalRequestError({ config: { url: "/api/hotel-portal/123/overview" } })).toBe(false);
    expect(isPortalRequestError({})).toBe(false);
  });
});

describe("handlePortalUnauthorizedError vs handleUnauthorizedError", () => {
  afterEach(() => {
    document.cookie = "token=; Max-Age=0; path=/;";
    document.cookie = "portal-token=; Max-Age=0; path=/;";
  });

  it("clears only portal-* cookies and redirects to /portal/login", () => {
    document.cookie = "token=admin-jwt; path=/;";
    document.cookie = "portal-token=portal-jwt; path=/;";
    delete (window as unknown as { location?: unknown }).location;
    (window as unknown as { location: { href: string } }).location = { href: "" };

    handlePortalUnauthorizedError();

    expect(document.cookie).not.toContain("portal-token=portal-jwt");
    expect(document.cookie).toContain("token=admin-jwt");
    expect(window.location.href).toBe("/portal/login");
  });

  it("handleUnauthorizedError clears only admin cookies and redirects to /auth/login", () => {
    document.cookie = "token=admin-jwt; path=/;";
    document.cookie = "portal-token=portal-jwt; path=/;";
    delete (window as unknown as { location?: unknown }).location;
    (window as unknown as { location: { href: string } }).location = { href: "" };

    handleUnauthorizedError();

    expect(document.cookie).not.toContain("token=admin-jwt");
    expect(document.cookie).toContain("portal-token=portal-jwt");
    expect(window.location.href).toBe("/auth/login");
  });
});
