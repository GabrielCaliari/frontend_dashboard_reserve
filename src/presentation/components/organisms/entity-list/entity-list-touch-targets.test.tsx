import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityListFilters } from "./entity-list-filters";
import { EntityListLayout } from "./entity-list-layout";
import { EntityListPagination } from "./entity-list-pagination";
import { EntityListToolbar } from "./entity-list-toolbar";

describe("entity-list touch targets", () => {
  it("gives search and filter controls a minimum 44px height", () => {
    render(
      <>
        <EntityListToolbar searchValue="" onSearchChange={vi.fn()} />
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
          onChange={vi.fn()}
        />
      </>,
    );

    expect(screen.getByRole("searchbox", { name: "Buscar" })).toHaveClass("min-h-11");
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveClass("min-h-11");
  });

  it("gives the mobile filter trigger a minimum 44px height", () => {
    render(
      <EntityListLayout filters={<p>Filtros</p>}>
        <p>Linhas</p>
      </EntityListLayout>,
    );

    expect(screen.getByRole("button", { name: "Abrir filtros" })).toHaveClass(
      "min-h-11",
    );
  });

  it("gives pagination icon controls a minimum 44px square target", () => {
    render(
      <EntityListPagination page={2} pageSize={10} totalItems={30} onPageChange={vi.fn()} />,
    );

    for (const name of ["Página anterior", "Próxima página"]) {
      expect(screen.getByRole("button", { name })).toHaveClass("min-h-11", "min-w-11");
    }
  });
});
