import { describe, expect, it } from "vitest";
import { assertEntityListCapabilities } from "./capabilities";

describe("assertEntityListCapabilities", () => {
  it("requires a finite local item limit for local operations", () => {
    expect(() =>
      assertEntityListCapabilities({
        search: "local",
        sort: false,
        pagination: "local",
        selection: "multiple",
      }),
    ).toThrow(/localItemLimit/);
  });

  it("accepts an entirely server-backed source", () => {
    expect(() =>
      assertEntityListCapabilities({
        search: "server",
        sort: "server",
        pagination: "server",
        selection: "none",
      }),
    ).not.toThrow();
  });
});
