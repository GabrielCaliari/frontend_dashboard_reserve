import { describe, expect, it } from "vitest";
import {
  GATEABLE_MODULES,
  backendModuleKey,
  normalizeModuleFlags,
  toBackendModulePatch,
} from "./tenant-modules";

describe("GATEABLE_MODULES", () => {
  it("lists exactly the modules the Reserve backend gates today", () => {
    expect(GATEABLE_MODULES).toEqual([
      "leads",
      "cms",
      "mailer",
      "payments",
      "coupons",
      "reports",
      "notifications",
      "hotel",
      "metrics",
    ]);
  });
});

describe("normalizeModuleFlags", () => {
  it("defaults every module to enabled when nothing is disabled explicitly", () => {
    const flags = normalizeModuleFlags({});
    expect(flags.leads).toBe(true);
    expect(flags.hotel).toBe(true);
    expect(flags.metrics).toBe(true);
  });

  it("reads flags from a values-wrapped patch shape", () => {
    const flags = normalizeModuleFlags({ values: { coupons: false } });
    expect(flags.coupons).toBe(false);
    expect(flags.leads).toBe(true);
  });

  it("reads flags directly when not wrapped in values", () => {
    const flags = normalizeModuleFlags({ mailer: false, hotel: false });
    expect(flags.mailer).toBe(false);
    expect(flags.hotel).toBe(false);
    expect(flags.reports).toBe(true);
  });

  it("defaults defensively for null or non-object input", () => {
    expect(normalizeModuleFlags(null).leads).toBe(true);
    expect(normalizeModuleFlags(undefined).leads).toBe(true);
    expect(normalizeModuleFlags("not an object").leads).toBe(true);
  });

  it("reads the backend's own names for the modules that differ", () => {
    const flags = normalizeModuleFlags({
      "client-portal": false,
      stats: false,
    });
    expect(flags.hotel).toBe(false);
    expect(flags.metrics).toBe(false);
  });

  it("prefers this catalog's name when both are present", () => {
    const flags = normalizeModuleFlags({
      hotel: true,
      "client-portal": false,
    });
    expect(flags.hotel).toBe(true);
  });
});

describe("writing back to the backend", () => {
  it("translates this catalog's names into the backend's", () => {
    expect(backendModuleKey("hotel")).toBe("client-portal");
    expect(backendModuleKey("metrics")).toBe("stats");
    expect(backendModuleKey("leads")).toBe("leads");
  });

  it("builds a patch the backend understands", () => {
    expect(toBackendModulePatch({ hotel: false, leads: true })).toEqual({
      "client-portal": false,
      leads: true,
    });
  });

  it("drops non-boolean entries from the patch", () => {
    expect(
      toBackendModulePatch({ hotel: undefined, cms: false }),
    ).toEqual({ cms: false });
  });

  it("round-trips: what we write comes back onto the same flag", () => {
    const patch = toBackendModulePatch({ hotel: false });
    expect(normalizeModuleFlags(patch).hotel).toBe(false);
  });
});
