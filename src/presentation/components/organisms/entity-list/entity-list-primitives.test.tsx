import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityListFilters } from "./entity-list-filters";
import { EntityListToolbar } from "./entity-list-toolbar";

describe("entity-list primitives", () => {
  it("updates search and a single facet", () => {
    const onSearchChange = vi.fn();
    const onFilterChange = vi.fn();

    render(
      <>
        <EntityListToolbar searchValue="" onSearchChange={onSearchChange} />
        <EntityListFilters
          definitions={[
            {
              key: "status",
              label: "Status",
              kind: "single",
              options: [{ value: "active", label: "Ativo" }],
            },
          ]}
          values={{ status: "" }}
          onChange={onFilterChange}
        />
      </>,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar" }), {
      target: { value: "Ana" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Status" }), {
      target: { value: "active" },
    });

    expect(onSearchChange).toHaveBeenCalledWith("Ana");
    expect(onFilterChange).toHaveBeenCalledWith("status", "active");
  });
});
