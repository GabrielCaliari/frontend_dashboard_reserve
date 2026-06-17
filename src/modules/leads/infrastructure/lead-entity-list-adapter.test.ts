import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/modules/leads/infrastructure/adapters", () => ({
  listLeadsService: vi.fn(),
}));

import { listLeadsService } from "@/src/modules/leads/infrastructure/adapters";
import { queryLeadEntityList } from "./lead-entity-list-adapter";

describe("queryLeadEntityList", () => {
  it("maps entity-list request fields to the leads API and back to an EntityPage", async () => {
    vi.mocked(listLeadsService).mockResolvedValue({
      success: true,
      data: {
        leads: [{ id: "lead-1" } as never],
        page: { count: 42, count_pages: 2, current_page: 2, limit: 30 },
      },
    });

    const page = await queryLeadEntityList({
      page: 2,
      pageSize: 30,
      search: "",
      filters: { status: "1", origin: "" },
    });

    expect(listLeadsService).toHaveBeenCalledWith({
      page: 2,
      limit: 30,
      status: 1,
      origin: undefined,
    });
    expect(page).toEqual({ items: [{ id: "lead-1" }], total: 42, page: 2, pageSize: 30 });
  });

  it("omits status and origin from the request when the filters are empty", async () => {
    vi.mocked(listLeadsService).mockResolvedValue({
      success: true,
      data: { leads: [], page: { count: 0, count_pages: 1, current_page: 1, limit: 30 } },
    });

    await queryLeadEntityList({
      page: 1,
      pageSize: 30,
      search: "",
      filters: { status: "", origin: "" },
    });

    expect(listLeadsService).toHaveBeenCalledWith({
      page: 1,
      limit: 30,
      status: undefined,
      origin: undefined,
    });
  });
});
