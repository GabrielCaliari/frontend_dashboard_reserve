import { describe, expect, it } from "vitest";
import {
  createEmptySelection,
  getSelectedCount,
  selectAllMatching,
  selectVisibleKeys,
  toggleEntityKey,
} from "./selection";

describe("entity selection", () => {
  it("stores visible selections as explicit immutable keys", () => {
    const first = selectVisibleKeys(["lead-1", "lead-2"]);
    const second = toggleEntityKey(first, "lead-1");

    expect(first).toEqual({
      mode: "explicit",
      keys: new Set(["lead-1", "lead-2"]),
    });
    expect(second).toEqual({ mode: "explicit", keys: new Set(["lead-2"]) });
  });

  it("excludes an item from all matching selection", () => {
    const selection = selectAllMatching<string>();
    const updated = toggleEntityKey(selection, "lead-2");

    expect(updated).toEqual({
      mode: "allMatching",
      excludedKeys: new Set(["lead-2"]),
    });
    expect(getSelectedCount(updated, 12)).toBe(11);
  });

  it("creates an empty explicit selection", () => {
    expect(createEmptySelection()).toEqual({ mode: "explicit", keys: new Set() });
  });
});
