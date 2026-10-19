import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/src/modules/hotel-portal/infrastructure/adapters", () => ({
  hotelPortalService: {
    listBotIssues: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getBotIssuesSummary: vi.fn().mockResolvedValue({ total: 0, porCodigo: [] }),
    getBotIssue: vi.fn().mockResolvedValue({ id: "i1" }),
    updateBotIssueStatus: vi.fn().mockResolvedValue({ id: "i1", status: "VISTO" }),
    listFeedbacks: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getFeedbacksSummary: vi.fn().mockResolvedValue({ total: 0 }),
  },
}));
import { hotelPortalService as svc } from "@/src/modules/hotel-portal/infrastructure/adapters";
import {
  useBotIssues,
  useBotIssuesSummary,
  useBotIssue,
  useUpdateBotIssueStatus,
  useFeedbacks,
  useFeedbacksSummary,
} from ".";

const period = { from: "2026-10-01", to: "2026-10-19" };

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const spy = vi.spyOn(qc, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, spy };
}

describe("hooks de erros e feedbacks do bot", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fica desabilitado sem clientId", () => {
    const { wrapper } = setup();
    renderHook(() => useBotIssues(null, {}), { wrapper });
    renderHook(() => useBotIssuesSummary(null, period), { wrapper });
    renderHook(() => useBotIssue(null, "i1"), { wrapper });
    renderHook(() => useFeedbacks(null, {}), { wrapper });
    renderHook(() => useFeedbacksSummary(null, period), { wrapper });
    expect(svc.listBotIssues).not.toHaveBeenCalled();
    expect(svc.getBotIssuesSummary).not.toHaveBeenCalled();
    expect(svc.getBotIssue).not.toHaveBeenCalled();
    expect(svc.listFeedbacks).not.toHaveBeenCalled();
    expect(svc.getFeedbacksSummary).not.toHaveBeenCalled();
  });

  it("busca com clientId e filtros", async () => {
    const { wrapper } = setup();
    renderHook(() => useBotIssues("c1", { categoria: "socorro" }), { wrapper });
    renderHook(() => useBotIssuesSummary("c1", period), { wrapper });
    renderHook(() => useBotIssue("c1", "i1"), { wrapper });
    renderHook(() => useFeedbacks("c1", { sentimento: "negativo" }), { wrapper });
    renderHook(() => useFeedbacksSummary("c1", period), { wrapper });
    await waitFor(() => expect(svc.getFeedbacksSummary).toHaveBeenCalledWith("c1", period));
    expect(svc.listBotIssues).toHaveBeenCalledWith("c1", { categoria: "socorro" });
    expect(svc.getBotIssuesSummary).toHaveBeenCalledWith("c1", period);
    expect(svc.getBotIssue).toHaveBeenCalledWith("c1", "i1");
    expect(svc.listFeedbacks).toHaveBeenCalledWith("c1", { sentimento: "negativo" });
  });

  it("useUpdateBotIssueStatus chama o tenant e invalida lista, resumo e detalhe", async () => {
    const { wrapper, spy } = setup();
    const { result } = renderHook(() => useUpdateBotIssueStatus("t1", "c1"), { wrapper });
    await act(async () => { await result.current.mutateAsync({ id: "i1", status: "VISTO" }); });
    expect(svc.updateBotIssueStatus).toHaveBeenCalledWith("t1", "i1", "VISTO");
    expect(spy).toHaveBeenCalledWith({ queryKey: ["hotel-portal", "bot-issues", "c1"] });
  });
});
