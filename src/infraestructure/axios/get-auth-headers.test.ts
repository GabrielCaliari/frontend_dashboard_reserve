import { afterEach, describe, expect, it } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { injectAuthHeaders } from "./get-auth-headers";

function setCookie(value: string) {
  document.cookie = value;
}

function clearAllCookies() {
  ["token", "session-code", "tenant-storage"].forEach((name) => {
    document.cookie = `${name}=; Max-Age=0; path=/;`;
  });
}

function makeConfig(url: string): InternalAxiosRequestConfig {
  return { url, headers: {} } as unknown as InternalAxiosRequestConfig;
}

function tenantCookie(id: string) {
  return (
    "tenant-storage=" +
    encodeURIComponent(JSON.stringify({ state: { selectedTenant: { id } } }))
  );
}

describe("injectAuthHeaders", () => {
  afterEach(() => {
    clearAllCookies();
  });

  it("uses the admin token cookie", async () => {
    setCookie("token=admin-jwt");
    setCookie(tenantCookie("abc123"));

    const config = await injectAuthHeaders(makeConfig("/leads"));

    expect(config.headers.Authorization).toBe("Bearer admin-jwt");
    expect(config.headers["x-tenant-id"]).toBe("abc123");
  });

  // O cliente do Reserve e um tenant e usa o login normal do painel: as rotas
  // do Painel Reserve autenticam com a MESMA sessao do dashboard. Nao existe
  // mais cookie `portal-token` nem caso especial por prefixo de URL.
  it("uses the same admin session on the hotel-portal routes", async () => {
    setCookie("token=admin-jwt");
    setCookie(tenantCookie("abc123"));

    const config = await injectAuthHeaders(
      makeConfig("/hotel-portal/cli_1/overview"),
    );

    expect(config.headers.Authorization).toBe("Bearer admin-jwt");
    expect(config.headers["x-tenant-id"]).toBe("abc123");
  });

  it("sends no Authorization header when there is no session at all", async () => {
    const config = await injectAuthHeaders(
      makeConfig("/hotel-portal/cli_1/overview"),
    );

    expect(config.headers.Authorization).toBeUndefined();
  });
});
