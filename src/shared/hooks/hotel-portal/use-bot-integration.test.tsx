import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const svc = vi.hoisted(() => ({
  regenerateBotPanelSecret: vi.fn(),
}));
vi.mock("@/src/modules/hotel-portal/infrastructure/adapters", () => ({ hotelPortalService: svc }));

import { useRegenerateBotPanelSecret } from "./use-bot-integration";

describe("use-bot-integration", () => {
  it("o segredo devolvido nao fica no MutationCache depois de desmontar", async () => {
    svc.regenerateBotPanelSecret.mockResolvedValue({ panel_webhook_secret: "segredo-b" });
    const qc = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(() => useRegenerateBotPanelSecret("t1"), { wrapper });
    await act(async () => {
      await result.current.mutateAsync();
    });
    unmount();
    await waitFor(() => expect(qc.getMutationCache().getAll()).toHaveLength(0));
  });
});
