import { describe, expect, it } from "vitest";
import { GATEABLE_MODULES, normalizeModuleFlags } from "./tenant-modules";

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
});
