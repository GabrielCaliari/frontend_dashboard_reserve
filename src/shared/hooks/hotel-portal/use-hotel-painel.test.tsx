import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/src/modules/hotel-portal/infrastructure/adapters", () => ({
  hotelPortalService: {
    listConversations: vi.fn().mockResolvedValue([]),
    getConversationDetail: vi.fn().mockResolvedValue([]),
    getFunnelBoard: vi.fn().mockResolvedValue([]),
    getBotChannels: vi.fn().mockResolvedValue({}),
  },
}));
import { hotelPortalService } from "@/src/modules/hotel-portal/infrastructure/adapters";
import { useHotelConversations, useHotelFunnelBoard, LIVE_REFETCH } from "./use-hotel-painel";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("F1 · atualizacao automatica", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("conversas refazem a busca a cada 30s", async () => {
    renderHook(() => useHotelConversations("c1", {} as any), { wrapper });
    await waitFor(() => expect(hotelPortalService.listConversations).toHaveBeenCalledTimes(1));
    await act(async () => { vi.advanceTimersByTime(LIVE_REFETCH.conversations); });
    await waitFor(() => expect(hotelPortalService.listConversations).toHaveBeenCalledTimes(2));
  });

  it("funil pausado nao refaz a busca", async () => {
    vi.mocked(hotelPortalService.getFunnelBoard).mockClear();
    renderHook(() => useHotelFunnelBoard("c1", { paused: true }), { wrapper });
    await waitFor(() => expect(hotelPortalService.getFunnelBoard).toHaveBeenCalledTimes(1));
    await act(async () => { vi.advanceTimersByTime(LIVE_REFETCH.funnel * 2); });
    expect(hotelPortalService.getFunnelBoard).toHaveBeenCalledTimes(1);
  });
});
