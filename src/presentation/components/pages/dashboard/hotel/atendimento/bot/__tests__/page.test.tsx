import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const h = vi.hoisted(() => ({
  proposals: [] as unknown[],
  approve: vi.fn(),
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock("react-hot-toast", () => ({ default: h.toast }));
vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "t1", hasPermission: () => true }),
}));
vi.mock("@/src/shared/hooks/hotel-portal", () => ({
  useActiveHotelClient: () => ({ data: { id: "c1" }, isLoading: false }),
  useHotelBotConfigProposals: () => ({ data: h.proposals, isLoading: false, isError: false }),
  useCreateBotConfigProposal: () => ({ mutate: vi.fn(), isPending: false }),
  useApproveBotConfigProposal: () => ({ mutate: h.approve, isPending: false }),
  useRejectBotConfigProposal: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell", () => ({
  PainelPageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PainelSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/src/presentation/components/organisms/hotel-portal/painel/bot-config/proposal-form", async (orig) => ({
  ...(await orig<object>()),
  ProposalForm: () => null,
}));

import HotelBotConfigPage from "../page";

const proposal = (over: Record<string, unknown>) => ({
  id: "p1",
  campo: "valor_taxa_pet_cents",
  status: "PENDENTE",
  valor_atual: 3000,
  valor_proposto: 5000,
  ...over,
});

describe("HotelBotConfigPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra valores de chaves em centavos em reais", () => {
    h.proposals = [proposal({})];
    render(<HotelBotConfigPage />);
    expect(screen.getByText(/R\$ 30,00/)).toBeTruthy();
    expect(screen.getByText("R$ 50,00")).toBeTruthy();
  });

  it("aceita numero em string para chaves em centavos e mantem outras chaves intactas", () => {
    h.proposals = [
      proposal({ id: "p1", campo: "tarifa:1:A", valor_atual: "33900", valor_proposto: "35000" }),
      proposal({ id: "p2", campo: "hold_min_cartao", valor_atual: 20, valor_proposto: 30 }),
    ];
    render(<HotelBotConfigPage />);
    expect(screen.getByText(/R\$ 339,00/)).toBeTruthy();
    expect(screen.getByText("R$ 350,00")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
  });

  it("aprovacao com pendente_no_bot avisa que o bot ainda nao aplica", async () => {
    h.proposals = [proposal({})];
    h.approve.mockImplementation((_id, opts) =>
      opts.onSuccess({ ok: true, state: null, pendente_no_bot: true }),
    );
    render(<HotelBotConfigPage />);
    await userEvent.click(screen.getByRole("button", { name: /aprovar/i }));
    expect(h.toast).toHaveBeenCalledWith(
      "Aprovada — aplicação no bot pendente (o bot ainda não aplica tarifa/calendário).",
      expect.anything(),
    );
    expect(h.toast.success).not.toHaveBeenCalled();
  });

  it("aprovacao normal confirma o envio ao bot", async () => {
    h.proposals = [proposal({})];
    h.approve.mockImplementation((_id, opts) =>
      opts.onSuccess({ ok: true, state: null, pendente_no_bot: false }),
    );
    render(<HotelBotConfigPage />);
    await userEvent.click(screen.getByRole("button", { name: /aprovar/i }));
    expect(h.toast.success).toHaveBeenCalledWith("Proposta aprovada e enviada ao bot.");
  });
});
