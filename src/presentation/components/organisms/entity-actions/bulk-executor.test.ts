import { describe, expect, it } from "vitest";
import { executeEntityBulkAction } from "./bulk-executor";

describe("executeEntityBulkAction", () => {
  it("caps work at the configured concurrency and reports partial failures", async () => {
    let active = 0;
    let peak = 0;
    const result = await executeEntityBulkAction(
      [1, 2, 3, 4, 5],
      async (key) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        if (key === 3) throw new Error("Rejeitado");
      },
      { concurrency: 2 },
    );

    expect(peak).toBe(2);
    expect(result.succeeded).toEqual([1, 2, 4, 5]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.key).toBe(3);
  });
});
