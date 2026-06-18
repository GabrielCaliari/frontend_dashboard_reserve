import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { paginateResources } from "./list-utils";

describe("paginateResources (property-based)", () => {
  it("never returns more items than the page size and covers every item across all pages exactly once", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 0, maxLength: 200 }),
        fc.integer({ min: 1, max: 50 }),
        (resources, pageSize) => {
          const { totalPages } = paginateResources(resources, 1, pageSize);
          const seen: number[] = [];

          for (let page = 1; page <= totalPages; page += 1) {
            const result = paginateResources(resources, page, pageSize);
            expect(result.items.length).toBeLessThanOrEqual(pageSize);
            seen.push(...result.items);
          }

          expect(seen).toEqual(resources);
        },
      ),
    );
  });

  it("always clamps the resolved page into [1, totalPages], regardless of how far out of range the request is", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 0, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: -1000, max: 1000 }),
        (resources, pageSize, requestedPage) => {
          const result = paginateResources(resources, requestedPage, pageSize);
          expect(result.page).toBeGreaterThanOrEqual(1);
          expect(result.page).toBeLessThanOrEqual(result.totalPages);
        },
      ),
    );
  });
});
