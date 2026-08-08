import { afterEach, describe, expect, it } from "vitest";
import { handleUnauthorizedError, isUnauthorizedError } from "./auth-error-handler";

describe("isUnauthorizedError", () => {
  it("identifies a 401 response", () => {
    expect(isUnauthorizedError({ response: { status: 401 } })).toBe(true);
  });

  it("does not misclassify other failures", () => {
    expect(isUnauthorizedError({ response: { status: 403 } })).toBe(false);
    expect(isUnauthorizedError({})).toBe(false);
    expect(isUnauthorizedError(null)).toBe(false);
  });
});

describe("handleUnauthorizedError", () => {
  afterEach(() => {
    document.cookie = "token=; Max-Age=0; path=/;";
  });

  // Existe um unico caminho de 401 no app: o Painel Reserve nao tem mais
  // sessao propria, entao um 401 em /hotel-portal/** cai aqui como qualquer
  // outro e volta para o login do painel.
  it("clears the admin cookies and redirects to /auth/login", () => {
    document.cookie = "token=admin-jwt; path=/;";
    delete (window as unknown as { location?: unknown }).location;
    (window as unknown as { location: { href: string } }).location = { href: "" };

    handleUnauthorizedError();

    expect(document.cookie).not.toContain("token=admin-jwt");
    expect(window.location.href).toBe("/auth/login");
  });
});
