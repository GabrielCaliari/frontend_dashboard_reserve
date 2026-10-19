import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const h = vi.hoisted(() => ({
  perm: true,
  mutate: vi.fn(),
}));

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "t1", hasPermission: () => h.perm }),
}));
vi.mock("@/src/shared/hooks/use-permissions", () => ({ default: () => ({ isSuperAdmin: false }) }));
vi.mock("@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell", () => ({
  PainelPageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PainelSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const issue = {
  id: "i1", numeroContato: "551100", nomeContato: "Maria", categoria: "tecnico", codigo: "WF_TIMEOUT",
  gravidade: "alta", etapa: null, workflow: null, no: null, mensagem: null, socorro: false,
  status: "ABERTO", ocorridoEm: "2026-10-18T12:00:00.000Z",
};
vi.mock("@/src/shared/hooks/hotel-portal", () => ({
  useActiveHotelClient: () => ({ data: { id: "c1" }, isLoading: false }),
  useBotIssues: () => ({ data: { items: [issue], total: 1 }, isLoading: false, isError: false }),
  useBotIssuesSummary: () => ({ data: { total: 1, porCodigo: [{ codigo: "WF_TIMEOUT", categoria: "tecnico", quantidade: 1 }] } }),
  useBotIssue: (_c: string, id: string | null) => ({
    data: id ? { ...issue, mensagemHospede: "oi tudo bem", respostaBot: "ola", ultimasMensagens: [], url: null } : undefined,
    isLoading: false,
  }),
  useUpdateBotIssueStatus: () => ({ mutate: h.mutate, isPending: false }),
}));

import BotErrosPage from "../page";

describe("BotErrosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.perm = true;
  });

  it("lista, abre o detalhe e muda status pelo hook", async () => {
    render(<BotErrosPage />);
    expect(screen.getByText("Mais frequentes na semana")).toBeTruthy();
    await userEvent.click(screen.getByText("Maria"));
    await userEvent.click(await screen.findByRole("button", { name: "Marcar como corrigido" }));
    expect(h.mutate.mock.calls[0][0]).toEqual({ id: "i1", status: "CORRIGIDO" });
  });

  it("sem permissao nao mostra botoes", async () => {
    h.perm = false;
    render(<BotErrosPage />);
    await userEvent.click(screen.getByText("Maria"));
    await screen.findByText("oi tudo bem");
    expect(screen.queryByRole("button", { name: "Marcar como visto" })).toBeNull();
  });
});
