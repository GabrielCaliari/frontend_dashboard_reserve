import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const h = vi.hoisted(() => ({
  config: { data: null as unknown, isLoading: false, isError: false } as { data: unknown; isLoading: boolean; isError?: boolean },
  save: vi.fn(),
  regenKey: vi.fn(),
  regenPanel: vi.fn(),
  setActive: vi.fn(),
  regenClient: vi.fn(),
}));

vi.mock("@/src/shared/hooks/hotel-portal/use-bot-integration", () => ({
  useBotIntegrationConfig: () => h.config,
  useSaveBotIntegration: () => ({ mutateAsync: h.save, isPending: false }),
  useRegenerateBotTenantKey: () => ({ mutateAsync: h.regenKey, isPending: false }),
  useRegenerateBotPanelSecret: () => ({ mutateAsync: h.regenPanel, isPending: false }),
  useSetBotIntegrationActive: () => ({ mutateAsync: h.setActive, isPending: false }),
  useRegenerateClientWebhookSecret: () => ({ mutateAsync: h.regenClient, isPending: false }),
}));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

import { BotIntegrationCard } from "../bot-integration-card";

const base = {
  id: "i1",
  tenant_id: "t1",
  active: true,
  bot_tenant_ref: "cli_dona_tereza",
  n8n_panel_webhook_url: "https://bot.reservemkt.com.br/webhook/painel",
  panel_webhook_secret_set: false,
  last_heartbeat_at: null as string | null,
  stuck_events: 0,
};

function renderCard(webhookSecretSet = false) {
  return render(<BotIntegrationCard tenantId="t1" clientId="c1" webhookSecretSet={webhookSecretSet} />);
}

describe("BotIntegrationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.config = { data: null, isLoading: false, isError: false };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sem integração, cria e mostra a chave do tenant uma única vez", async () => {
    h.save.mockResolvedValue({ ...base, tenant_key: "chave-123" });
    const user = userEvent.setup();
    renderCard();
    expect((screen.getByLabelText("Identificador do bot") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("URL do WF6") as HTMLInputElement).value).toBe("");
    await user.type(screen.getByLabelText("Identificador do bot"), "cli_dona_tereza");
    await user.click(screen.getByRole("button", { name: "Criar integração" }));
    expect(h.save).toHaveBeenCalledWith({
      exists: false,
      data: { bot_tenant_ref: "cli_dona_tereza", n8n_panel_webhook_url: undefined },
    });
    expect(await screen.findByText("Chave do tenant (Canal A)")).toBeTruthy();
    expect(screen.getByText("chave-123")).toBeTruthy();
  });

  it("com integração, mostra identificador, URL, status, sinal de vida e Canal B", () => {
    h.config = { data: { ...base, active: false }, isLoading: false };
    renderCard();
    expect((screen.getByLabelText("Identificador do bot") as HTMLInputElement).value).toBe("cli_dona_tereza");
    expect((screen.getByLabelText("URL do WF6") as HTMLInputElement).value).toBe(base.n8n_panel_webhook_url);
    expect(screen.getByText("Desativado")).toBeTruthy();
    expect(screen.getByText(/Último sinal de vida:\s*Nunca/)).toBeTruthy();
    expect(screen.getByText(/Segredo do Canal B: não configurado/)).toBeTruthy();
  });

  it("mostra o alerta de eventos presos", () => {
    h.config = { data: { ...base, stuck_events: 3, panel_webhook_secret_set: true }, isLoading: false };
    renderCard();
    expect(screen.getByText("3 eventos do bot presos — o reprocesso automático tenta 5 vezes.")).toBeTruthy();
    expect(screen.getByText(/Segredo do Canal B: configurado/)).toBeTruthy();
  });

  it("gera o segredo do Canal B, mostra uma vez e esconde em Já guardei", async () => {
    h.config = { data: base, isLoading: false };
    h.regenPanel.mockResolvedValue({ panel_webhook_secret: "segredo-b" });
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: "Gerar segredo do Canal B" }));
    expect(await screen.findByText("segredo-b")).toBeTruthy();
    expect(screen.getByText("Segredo do Canal B")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Já guardei" }));
    await waitFor(() => expect(screen.queryByText("segredo-b")).toBeNull());
  });

  it("gera o segredo do Canal C e mostra uma vez", async () => {
    h.config = { data: base, isLoading: false };
    h.regenClient.mockResolvedValue({ webhook_secret: "segredo-c" });
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: "Gerar segredo do Canal C" }));
    expect(await screen.findByText("segredo-c")).toBeTruthy();
    expect(screen.getByText("Segredo do Canal C")).toBeTruthy();
    expect(h.regenClient).toHaveBeenCalled();
  });

  it("nenhum segredo permanece no DOM depois de Já guardei", async () => {
    h.config = { data: base, isLoading: false };
    h.regenClient.mockResolvedValue({ webhook_secret: "segredo-c" });
    const user = userEvent.setup();
    const { container } = renderCard();
    await user.click(screen.getByRole("button", { name: "Gerar segredo do Canal C" }));
    await screen.findByText("segredo-c");
    await user.click(screen.getByRole("button", { name: "Já guardei" }));
    expect(screen.queryByText("segredo-c")).toBeNull();
    expect(container.textContent).not.toContain("segredo-c");
  });

  describe("confirmacoes ao rotacionar segredos em uso", () => {
    it("Canal B com segredo configurado: cancelar nao gera", async () => {
      h.config = { data: { ...base, panel_webhook_secret_set: true }, isLoading: false, isError: false };
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
      const user = userEvent.setup();
      renderCard();
      await user.click(screen.getByRole("button", { name: "Gerar segredo do Canal B" }));
      expect(confirm).toHaveBeenCalledWith(
        "O bot para de aceitar as ações do painel até o WF6 ser atualizado com o novo segredo. Continuar?",
      );
      expect(h.regenPanel).not.toHaveBeenCalled();
    });

    it("Canal B com segredo configurado: confirmar gera", async () => {
      h.config = { data: { ...base, panel_webhook_secret_set: true }, isLoading: false, isError: false };
      vi.spyOn(window, "confirm").mockReturnValue(true);
      h.regenPanel.mockResolvedValue({ panel_webhook_secret: "novo-b" });
      const user = userEvent.setup();
      renderCard();
      await user.click(screen.getByRole("button", { name: "Gerar segredo do Canal B" }));
      expect(await screen.findByText("novo-b")).toBeTruthy();
    });

    it("Canal B ainda sem segredo: gera sem perguntar", async () => {
      h.config = { data: base, isLoading: false, isError: false };
      const confirm = vi.spyOn(window, "confirm");
      h.regenPanel.mockResolvedValue({ panel_webhook_secret: "primeiro-b" });
      const user = userEvent.setup();
      renderCard();
      await user.click(screen.getByRole("button", { name: "Gerar segredo do Canal B" }));
      expect(await screen.findByText("primeiro-b")).toBeTruthy();
      expect(confirm).not.toHaveBeenCalled();
    });

    it("Canal C com segredo configurado: cancelar nao gera, confirmar gera", async () => {
      h.config = { data: base, isLoading: false, isError: false };
      const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
      h.regenClient.mockResolvedValue({ webhook_secret: "novo-c" });
      const user = userEvent.setup();
      renderCard(true);
      await user.click(screen.getByRole("button", { name: "Gerar segredo do Canal C" }));
      expect(confirm).toHaveBeenCalledWith(
        "As reservas do PMS passam a ser recusadas até o WF9a ser atualizado com o novo segredo. Continuar?",
      );
      expect(h.regenClient).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Gerar segredo do Canal C" }));
      expect(await screen.findByText("novo-c")).toBeTruthy();
    });

    it("Canal C ainda sem segredo: gera sem perguntar", async () => {
      h.config = { data: base, isLoading: false, isError: false };
      const confirm = vi.spyOn(window, "confirm");
      h.regenClient.mockResolvedValue({ webhook_secret: "primeiro-c" });
      const user = userEvent.setup();
      renderCard(false);
      await user.click(screen.getByRole("button", { name: "Gerar segredo do Canal C" }));
      expect(await screen.findByText("primeiro-c")).toBeTruthy();
      expect(confirm).not.toHaveBeenCalled();
    });
  });

  it("erro ao carregar a integração não oferece Criar integração", () => {
    h.config = { data: undefined, isLoading: false, isError: true };
    renderCard();
    expect(screen.getByText("Não foi possível carregar a integração do bot.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Criar integração" })).toBeNull();
  });

  it("na atualização, campo apagado vai como string vazia", async () => {
    h.config = { data: base, isLoading: false, isError: false };
    h.save.mockResolvedValue(base);
    const user = userEvent.setup();
    renderCard();
    await user.clear(screen.getByLabelText("URL do WF6"));
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(h.save).toHaveBeenCalledWith({
      exists: true,
      data: { bot_tenant_ref: "cli_dona_tereza", n8n_panel_webhook_url: "" },
    });
  });
});
