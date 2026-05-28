import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEntityListState } from "./use-entity-list-state";

const replace = vi.fn();
let params = new URLSearchParams("page=2&status=draft&keep=yes");

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/leads",
  useRouter: () => ({ replace }),
  useSearchParams: () => params,
}));

const initialState = {
  page: 1,
  pageSize: 30,
  search: "",
  filters: { status: "" },
};

describe("useEntityListState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    params = new URLSearchParams("page=2&status=draft&keep=yes");
  });

  afterEach(() => vi.useRealTimers());

  it("updates memory filters and resets to the first page", () => {
    const { result } = renderHook(() =>
      useEntityListState({ mode: "memory", initialState }),
    );

    act(() => result.current.setPage(3));
    act(() => result.current.setFilter("status", "active"));

    expect(result.current.state).toMatchObject({
      page: 1,
      filters: { status: "active" },
    });
  });

  it("debounces URL search updates and preserves unrelated parameters", () => {
    const { result } = renderHook(() =>
      useEntityListState({ mode: "url", initialState }),
    );

    act(() => result.current.setSearch("  Ana  "));
    expect(result.current.searchInput).toBe("  Ana  ");

    act(() => vi.advanceTimersByTime(299));
    expect(replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledWith(
      "/dashboard/leads?limit=30&q=Ana&status=draft&keep=yes",
      { scroll: false },
    );
  });
});
