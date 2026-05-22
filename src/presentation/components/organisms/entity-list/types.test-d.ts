import { describe, it } from "vitest";
import type { EntityColumn, EntityListDefinition } from "./types";

interface Widget {
  id: string;
  name: string;
}

describe("EntityListDefinition variant typing", () => {
  it("accepts a table variant with columns and no renderItem", () => {
    const columns: readonly EntityColumn<Widget>[] = [
      { key: "name", header: "Nome", render: (w) => w.name },
    ];
    const definition: EntityListDefinition<
      Widget,
      Record<string, unknown>,
      string
    > = {
      id: "widgets",
      ariaLabel: "Widgets",
      getKey: (w) => w.id,
      dataSource: {
        capabilities: {
          search: false,
          sort: false,
          pagination: "local",
          selection: "none",
        },
        query: async () => ({ items: [], total: 0, page: 1, pageSize: 30 }),
      },
      initialState: { pageSize: 30, filters: {} },
      filters: [],
      sorts: [],
      variant: "table",
      columns,
    };
    void definition;
  });

  it("accepts a cards variant with renderItem and no columns (default)", () => {
    const definition: EntityListDefinition<
      Widget,
      Record<string, unknown>,
      string
    > = {
      id: "widgets",
      ariaLabel: "Widgets",
      getKey: (w) => w.id,
      dataSource: {
        capabilities: {
          search: false,
          sort: false,
          pagination: "local",
          selection: "none",
        },
        query: async () => ({ items: [], total: 0, page: 1, pageSize: 30 }),
      },
      initialState: { pageSize: 30, filters: {} },
      filters: [],
      sorts: [],
      renderItem: (w) => w.name,
    };
    void definition;
  });
});
