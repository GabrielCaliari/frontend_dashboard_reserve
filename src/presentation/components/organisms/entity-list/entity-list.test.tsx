import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/src/shared/query/test-query-provider";
import { EntityList } from "./entity-list";
import { EntityListItem } from "./entity-list-item";
import type { EntityListDefinition } from "./types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/contacts",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/src/shared/stores/tenant-store", () => ({
  useSelectedTenantId: () => "tenant-1",
}));

const definition: EntityListDefinition<
  { id: string; name: string },
  { status: string }
> = {
  id: "contacts",
  ariaLabel: "Contatos",
  getKey: (contact) => contact.id,
  dataSource: {
    capabilities: {
      search: "server",
      sort: "server",
      pagination: "server",
      selection: "multiple",
    },
    query: vi.fn().mockResolvedValue({
      items: [{ id: "contact-1", name: "Ada Lovelace" }],
      total: 1,
      page: 1,
      pageSize: 30,
    }),
  },
  initialState: { pageSize: 30, filters: { status: "" } },
  filters: [
    {
      key: "status",
      label: "Status",
      kind: "single",
      options: [{ value: "active", label: "Ativo" }],
    },
  ],
  sorts: [],
  renderItem: (contact, context) => (
    <EntityListItem
      selectable={
        context.selectable
          ? {
              label: `Selecionar ${contact.name}`,
              selected: context.selected,
              onSelectionChange: context.onSelectionChange,
            }
          : undefined
      }
      title={contact.name}
    />
  ),
};

function renderList<TEntity, TFilters extends Record<string, unknown>>(
  listDefinition: EntityListDefinition<TEntity, TFilters> = definition as never,
) {
  const client = createTestQueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<EntityList definition={listDefinition} searchDebounceMs={0} />, {
    wrapper,
  });
}

describe("EntityList", () => {
  it("renders narrative items and connects their selectable state", async () => {
    renderList();

    await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeInTheDocument());
    const checkbox = screen.getByRole("checkbox", { name: "Selecionar Ada Lovelace" });
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText("1 selecionado(s)")).toBeInTheDocument();
  });

  it("hides search when the data source does not support it", async () => {
    renderList({
      ...definition,
      dataSource: {
        ...definition.dataSource,
        capabilities: { ...definition.dataSource.capabilities, search: false },
      },
    });

    await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeInTheDocument());
    expect(screen.queryByRole("searchbox", { name: "Buscar" })).not.toBeInTheDocument();
  });

  it('renders a table when the definition declares variant: "table"', async () => {
    const items = [{ id: "1", name: "Acme Corp" }];
    const tableDefinition: EntityListDefinition<
      { id: string; name: string },
      Record<string, never>
    > = {
      id: "widgets-table",
      ariaLabel: "Widgets",
      getKey: (w) => w.id,
      dataSource: {
        capabilities: {
          search: false,
          sort: false,
          pagination: "local",
          selection: "none",
        },
        query: vi.fn().mockResolvedValue({ items, total: items.length, page: 1, pageSize: 30 }),
      },
      initialState: { pageSize: 30, filters: {} },
      filters: [],
      sorts: [],
      variant: "table",
      columns: [{ key: "name", header: "Nome", render: (w) => w.name }],
    };

    renderList(tableDefinition);

    expect(await screen.findByRole("table", { name: "Widgets" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeVisible();
    expect(screen.getByText("Acme Corp")).toBeVisible();
  });
});
