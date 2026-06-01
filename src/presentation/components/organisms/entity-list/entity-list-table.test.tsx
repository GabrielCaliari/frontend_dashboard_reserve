import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityListTable } from "./entity-list-table";
import type { EntityColumn } from "./types";

interface Row {
  id: string;
  name: string;
  status: string;
}

const columns: readonly EntityColumn<Row>[] = [
  { key: "name", header: "Nome", render: (row) => row.name },
  { key: "status", header: "Status", render: (row) => row.status },
];

const items: Row[] = [
  { id: "1", name: "Acme Corp", status: "active" },
  { id: "2", name: "Globex", status: "inactive" },
];

describe("EntityListTable", () => {
  it("renders one header cell per column and one row per item", () => {
    render(
      <EntityListTable
        ariaLabel="Tenants"
        columns={columns}
        items={items}
        getKey={(row) => row.id}
      />,
    );

    expect(screen.getByRole("table", { name: "Tenants" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeVisible();
    expect(screen.getByRole("row", { name: /Acme Corp/ })).toBeVisible();
    expect(screen.getByRole("row", { name: /Globex/ })).toBeVisible();
  });

  it("activates a row on click when onActivate is provided", () => {
    const onActivate = vi.fn();
    render(
      <EntityListTable
        ariaLabel="Tenants"
        columns={columns}
        items={items}
        getKey={(row) => row.id}
        onActivate={onActivate}
      />,
    );

    fireEvent.click(screen.getByRole("row", { name: /Acme Corp/ }));
    expect(onActivate).toHaveBeenCalledWith(items[0]);
  });
});
