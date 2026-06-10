import { describe, expect, it } from "vitest";
import { filterResources, paginateResources } from "./list-utils";

const resources = [
  { name: "Campanha Julho", status: "active" },
  { name: "Newsletter", status: "draft" },
  { name: "Campanha Agosto", status: "draft" },
];

describe("resource list utilities", () => {
  it("filters client resources with normalized search and typed filters", () => {
    expect(
      filterResources(resources, {
        query: "  CAMPANHA ",
        searchBy: (resource) => resource.name,
        filters: { status: "draft" },
        filterBy: { status: (resource) => resource.status },
      }),
    ).toEqual([resources[2]]);
  });

  it("ignores empty filters and query", () => {
    expect(
      filterResources(resources, {
        query: "",
        searchBy: (resource) => resource.name,
        filters: { status: "" },
        filterBy: { status: (resource) => resource.status },
      }),
    ).toEqual(resources);
  });

  it("fails explicitly when an active filter has no selector", () => {
    expect(() =>
      filterResources(resources, {
        searchBy: (resource) => resource.name,
        filters: { status: "draft" },
        filterBy: {},
      }),
    ).toThrow('Missing filter selector for "status"');
  });

  it("slices pages and clamps page boundaries", () => {
    expect(paginateResources(resources, 0, 2)).toEqual({
      items: resources.slice(0, 2),
      page: 1,
      totalPages: 2,
    });
    expect(paginateResources(resources, 99, 2)).toEqual({
      items: resources.slice(2),
      page: 2,
      totalPages: 2,
    });
  });

  it("returns a stable empty-page result", () => {
    expect(paginateResources([], 3, 10)).toEqual({ items: [], page: 1, totalPages: 1 });
  });
});
