import { describe, expect, it } from "vitest";
import { normalizeApiRequestUrl } from "./normalize-api-request-url";

describe("normalizeApiRequestUrl", () => {
  it("removes a duplicated /api prefix from relative requests", () => {
    expect(normalizeApiRequestUrl("https://api.example.com/api", "/api/leads")).toBe("/leads");
    expect(normalizeApiRequestUrl("https://api.example.com/api", "/health")).toBe("/health");
    expect(normalizeApiRequestUrl("https://api.example.com/api", "/api?ready=1")).toBe("?ready=1");
  });

  it("leaves requests untouched when baseURL does not end in /api", () => {
    expect(normalizeApiRequestUrl("https://api.example.com", "/api/leads")).toBe("/api/leads");
  });

  it("leaves absolute URLs untouched", () => {
    expect(
      normalizeApiRequestUrl("https://api.example.com/api", "https://cdn.example.com/api/x"),
    ).toBe("https://cdn.example.com/api/x");
  });

  it("returns undefined/empty inputs unchanged", () => {
    expect(normalizeApiRequestUrl(undefined, "/api/leads")).toBe("/api/leads");
    expect(normalizeApiRequestUrl("https://api.example.com/api", undefined)).toBeUndefined();
  });
});
