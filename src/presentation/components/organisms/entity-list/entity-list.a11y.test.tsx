import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
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

function definitionWith(
  items: Array<{ id: string; name: string }>,
): EntityListDefinition<{ id: string; name: string }, { status: string }> {
  return {
    id: "contacts-a11y",
    ariaLabel: "Contatos",
    getKey: (contact) => contact.id,
    dataSource: {
      capabilities: { search: "server", sort: false, pagination: "server", selection: "multiple" },
      query: vi.fn().mockResolvedValue({ items, total: items.length, page: 1, pageSize: 30 }),
    },
    initialState: { pageSize: 30, filters: { status: "" } },
    filters: [
      { key: "status", label: "Status", kind: "single", options: [{ value: "active", label: "Ativo" }] },
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
}

function renderWithClient(
  definition: EntityListDefinition<{ id: string; name: string }, { status: string }>,
) {
  const client = createTestQueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<EntityList definition={definition} searchDebounceMs={0} />, { wrapper });
}

describe("EntityList accessibility", () => {
  it("has no axe violations with a populated list", async () => {
    const { container } = renderWithClient(definitionWith([{ id: "1", name: "Ada Lovelace" }]));
    await waitFor(() => expect(container.textContent).toContain("Ada Lovelace"));

    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations in the empty state", async () => {
    const { container } = renderWithClient(definitionWith([]));
    await waitFor(() => expect(container.textContent).toContain("Nenhum item encontrado"));

    expect(await axe(container)).toHaveNoViolations();
  });
});
