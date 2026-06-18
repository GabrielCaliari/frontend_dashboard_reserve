import { describe, expect, it } from "vitest";
import { resolveEventLabel } from "./notification-event-labels";

describe("resolveEventLabel", () => {
  it("maps a known backend event key to its i18n message key", () => {
    const t = (key: string) => (key === "eventLeadCreated" ? "Novo lead" : key);
    expect(resolveEventLabel("lead.created", t)).toBe("Novo lead");
  });

  it("falls back to the raw key for an event the frontend catalog does not know yet", () => {
    const t = (key: string) => key;
    expect(resolveEventLabel("some.new.event", t)).toBe("some.new.event");
  });

  it("returns null when there is no triggering event", () => {
    const t = (key: string) => key;
    expect(resolveEventLabel(null, t)).toBeNull();
    expect(resolveEventLabel(undefined, t)).toBeNull();
  });
});
