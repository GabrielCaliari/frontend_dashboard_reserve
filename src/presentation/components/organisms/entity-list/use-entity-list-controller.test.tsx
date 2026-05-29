import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createTestQueryClient,
  createTestQueryWrapper,
} from "@/src/shared/query/test-query-provider";
import { useEntityListController } from "./use-entity-list-controller";
import type { EntityListDefinition } from "./types";

let selectedTenantId: string | null = "tenant-1";

vi.mock("@/src/shared/stores/tenant-store", () => ({
  useSelectedTenantId: () => selectedTenantId,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/contacts",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

type Contact = { id: string; name: string };
type Filters = { status: string };

const query = vi.fn().mockResolvedValue({
  items: [{ id: "contact-1", name: "Ada" }],
  total: 1,
  page: 1,
  pageSize: 30,
});

const definition: EntityListDefinition<Contact, Filters> = {
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
    query,
  },
  initialState: { pageSize: 30, filters: { status: "" } },
  filters: [],
  sorts: [],
  renderItem: (contact) => contact.name,
};

function setup() {
  const wrapper = createTestQueryWrapper(createTestQueryClient());
  return { wrapper };
}

describe("useEntityListController", () => {
  it("queries through the entity data source and retains its page contract", async () => {
    query.mockClear();
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useEntityListController({ definition, searchDebounceMs: 0 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(query).toHaveBeenCalledWith({
      page: 1,
      pageSize: 30,
      search: "",
      filters: { status: "" },
    });
    expect(result.current.page?.items).toEqual([{ id: "contact-1", name: "Ada" }]);
  });

  it("clears a selection when the controlled query changes", async () => {
    query.mockClear();
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useEntityListController({ definition, searchDebounceMs: 0 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    act(() => result.current.toggleSelection("contact-1"));
    expect(result.current.selectedCount).toBe(1);

    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.state.page).toBe(2));
    expect(result.current.selectedCount).toBe(0);
  });

  it("clamps a stale out-of-range page back into the available range", async () => {
    selectedTenantId = "tenant-1";
    const shrinkingQuery = vi.fn().mockImplementation(async (request) => ({
      items: request.page === 1 ? [{ id: "contact-1", name: "Ada" }] : [],
      total: 1,
      page: request.page,
      pageSize: 30,
    }));
    const shrinkingDefinition = {
      ...definition,
      dataSource: { ...definition.dataSource, query: shrinkingQuery },
    };
    const { wrapper } = setup();
    const { result } = renderHook(
      () =>
        useEntityListController({
          definition: shrinkingDefinition,
          searchDebounceMs: 0,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    act(() => result.current.setPage(4));

    await waitFor(() => expect(result.current.state.page).toBe(1));
    expect(result.current.page?.items).toEqual([{ id: "contact-1", name: "Ada" }]);
  });

  it("isolates cached pages and selection by selected tenant", async () => {
    selectedTenantId = "tenant-1";
    const tenantQuery = vi.fn().mockImplementation(async () => ({
      items: [{ id: selectedTenantId!, name: selectedTenantId! }],
      total: 1,
      page: 1,
      pageSize: 30,
    }));
    const tenantDefinition = {
      ...definition,
      dataSource: { ...definition.dataSource, query: tenantQuery },
    };
    const { wrapper } = setup();
    const { result, rerender } = renderHook(
      () =>
        useEntityListController({
          definition: tenantDefinition,
          searchDebounceMs: 0,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.page?.items[0]?.id).toBe("tenant-1"));
    act(() => result.current.toggleSelection("tenant-1"));
    expect(result.current.selectedCount).toBe(1);

    selectedTenantId = "tenant-2";
    rerender();

    await waitFor(() => expect(result.current.page?.items[0]?.id).toBe("tenant-2"));
    expect(tenantQuery).toHaveBeenCalledTimes(2);
    expect(result.current.selectedCount).toBe(0);
  });
});
