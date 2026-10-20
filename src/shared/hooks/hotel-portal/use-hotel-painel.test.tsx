import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/src/modules/hotel-portal/infrastructure/adapters", () => ({
  hotelPortalService: {
    listConversations: vi.fn().mockResolvedValue([]),
    getConversationDetail: vi.fn().mockResolvedValue({ contact: {}, messages: [], hasMore: false, nextCursor: null }),
    getFunnelBoard: vi.fn().mockResolvedValue([]),
    getBotChannels: vi.fn().mockResolvedValue({}),
  },
}));
import { hotelPortalService } from "@/src/modules/hotel-portal/infrastructure/adapters";
import {
  useHotelConversations,
  useHotelConversationDetail,
  useHotelFunnelBoard,
  flattenConversationPages,
  LIVE_REFETCH,
} from "./use-hotel-painel";

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

const contact = { numeroContato: "+55", nome: "Ana" } as any;
const msg = (em: string, id?: string) => ({ id, role: "user", tipo: "texto", contentPreview: em, ocorridoEm: em });

describe("conversa paginada", () => {
  it("flattenConversationPages junta paginas das mais antigas para as mais novas", () => {
    const first = { contact, messages: [msg("2026-01-03"), msg("2026-01-04")], hasMore: true };
    const older = { contact, messages: [msg("2026-01-01"), msg("2026-01-02")], hasMore: false };
    const flat = flattenConversationPages({ pages: [first, older], pageParams: [undefined, "2026-01-03"] } as any);
    expect(flat.messages.map((m) => m.ocorridoEm)).toEqual(["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"]);
    expect(flat.contact).toBe(contact);
    expect(flat.hasMore).toBe(false);
  });

  it("flattenConversationPages nao duplica mensagens repetidas entre paginas", () => {
    const first = { contact, messages: [msg("2026-01-03", "b"), msg("2026-01-04", "c")], hasMore: true, nextCursor: "x" };
    const older = { contact, messages: [msg("2026-01-02", "a"), msg("2026-01-03", "b")], hasMore: false, nextCursor: null };
    const flat = flattenConversationPages({ pages: [first, older], pageParams: [undefined, "x"] } as any);
    expect(flat.messages.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("flattenConversationPages sem id deduplica por instante+papel+conteudo", () => {
    const first = { contact, messages: [msg("2026-01-03")], hasMore: true, nextCursor: "x" };
    const older = { contact, messages: [msg("2026-01-03"), msg("2026-01-02")], hasMore: false, nextCursor: null };
    const flat = flattenConversationPages({ pages: [first, older], pageParams: [undefined, "x"] } as any);
    expect(flat.messages).toHaveLength(2);
  });

  it("flattenConversationPages sem dados devolve vazio", () => {
    expect(flattenConversationPages(undefined)).toEqual({ contact: undefined, messages: [], hasMore: false });
  });

  it("carrega mensagens anteriores com o cursor opaco devolvido em nextCursor", async () => {
    const mock = vi.mocked(hotelPortalService.getConversationDetail);
    mock.mockReset();
    mock.mockResolvedValueOnce({ contact, messages: [msg("2026-01-03", "b"), msg("2026-01-04", "c")], hasMore: true, nextCursor: "cur-1" });
    mock.mockResolvedValueOnce({ contact, messages: [msg("2026-01-01", "a"), msg("2026-01-02", "z")], hasMore: false, nextCursor: null });
    const { result } = renderHook(() => useHotelConversationDetail("c1", "+55"), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(mock).toHaveBeenLastCalledWith("c1", "+55", { cursor: undefined });
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => { await result.current.fetchNextPage(); });
    expect(mock).toHaveBeenLastCalledWith("c1", "+55", { cursor: "cur-1" });
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
    expect(flattenConversationPages(result.current.data).messages).toHaveLength(4);
  });
});
