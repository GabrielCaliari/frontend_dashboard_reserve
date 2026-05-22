import { describe, expect, it } from "vitest";
import {
  parseEntityListQuery,
  serializeEntityListQuery,
} from "./query-state";

describe("entity list query state", () => {
  it("round-trips list state with entity filters", () => {
    const encoded = serializeEntityListQuery({
      page: 2,
      pageSize: 50,
      search: "ana",
      sort: { field: "last_seen", direction: "desc" },
      filters: { status: "active" },
    });

    expect(parseEntityListQuery(encoded, { status: "" })).toEqual({
      page: 2,
      pageSize: 50,
      search: "ana",
      sort: { field: "last_seen", direction: "desc" },
      filters: { status: "active" },
    });
  });

  it("omits default page and empty filters from the URL", () => {
    const encoded = serializeEntityListQuery({
      page: 1,
      pageSize: 30,
      search: "",
      filters: { status: "", active: false },
    });

    expect(encoded.toString()).toBe("limit=30");
  });
});
