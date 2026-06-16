import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useListQueryState } from "./use-list-query-state";

const replace = vi.fn();
let params = new URLSearchParams("q=campanha&page=2&status=draft&keep=yes");

vi.mock("next/navigation", () => ({
  usePathname: () => "/marketing",
  useRouter: () => ({ replace }),
  useSearchParams: () => params,
}));

describe("useListQueryState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    params = new URLSearchParams("q=campanha&page=2&status=draft&keep=yes");
  });
  afterEach(() => vi.useRealTimers());

  it("reads query, page, and declared filters from the URL", () => {
    const { result } = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    expect(result.current).toMatchObject({
      query: "campanha",
      page: 2,
      filters: { status: "draft" },
    });
  });

  it("preserves raw input and debounces one trimmed URL commit while keeping unrelated params", () => {
    const { result } = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    act(() => result.current.setQuery("  Acme Corp  "));
    expect(result.current.query).toBe("  Acme Corp  ");
    act(() => vi.advanceTimersByTime(299));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/marketing?q=Acme+Corp&status=draft&keep=yes", {
      scroll: false,
    });
  });

  it("removes empty filters and clamps invalid pages", () => {
    params = new URLSearchParams("page=-3&status=draft");
    const { result } = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    expect(result.current.page).toBe(1);
    act(() => result.current.setFilter("status", ""));
    expect(replace).toHaveBeenCalledWith("/marketing", { scroll: false });
  });

  it("clears all declared filters and resets pagination", () => {
    const { result } = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    act(() => result.current.clearFilters());
    expect(replace).toHaveBeenCalledWith("/marketing?q=campanha&keep=yes", { scroll: false });
  });

  it("synchronizes controlled input after back or forward navigation", () => {
    const { result, rerender } = renderHook(() => useListQueryState());
    act(() => result.current.setQuery("stale draft"));
    params = new URLSearchParams("q=restored&keep=yes");
    rerender();
    expect(result.current.query).toBe("restored");
    act(() => vi.advanceTimersByTime(300));
    expect(replace).not.toHaveBeenCalled();
  });

  it("rebases a pending search commit on the latest concurrent URL state", () => {
    params = new URLSearchParams("page=4&status=draft&keep=old");
    const { result, rerender } = renderHook(() =>
      useListQueryState({ filterKeys: ["status"] as const }),
    );
    act(() => result.current.setQuery("Acme"));
    act(() => vi.advanceTimersByTime(100));
    params = new URLSearchParams("page=7&status=active&keep=yes");
    rerender();
    act(() => vi.advanceTimersByTime(200));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/marketing?status=active&keep=yes&q=Acme", {
      scroll: false,
    });
  });

  it("optimistically composes search and filter updates without a navigation rerender", () => {
    params = new URLSearchParams("page=4&status=draft&keep=yes");
    const first = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    act(() => first.result.current.setQuery("Acme"));
    act(() => vi.advanceTimersByTime(100));
    act(() => first.result.current.setFilter("status", "active"));
    act(() => vi.advanceTimersByTime(200));
    expect(replace).toHaveBeenNthCalledWith(2, "/marketing?status=active&keep=yes&q=Acme", {
      scroll: false,
    });

    first.unmount();
    replace.mockClear();
    params = new URLSearchParams("page=4&status=draft&keep=yes");
    const inverse = renderHook(() => useListQueryState({ filterKeys: ["status"] as const }));
    act(() => inverse.result.current.setFilter("status", "active"));
    act(() => inverse.result.current.setQuery("Acme"));
    act(() => vi.advanceTimersByTime(300));
    expect(replace).toHaveBeenLastCalledWith("/marketing?status=active&keep=yes&q=Acme", {
      scroll: false,
    });
  });
});
