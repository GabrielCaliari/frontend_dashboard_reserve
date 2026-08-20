import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WhatsappInbox, formatPhoneBR } from "../whatsapp-inbox";
import type { ConversationListItem } from "@/src/shared/domain/types/@hotel-painel";

const conversas: ConversationListItem[] = [
  {
    numeroContato: "+5535999110001",
    nome: "Ana Souza",
    statusBot: "ATIVO",
    lastMessageAt: "2026-08-19T14:32:00.000Z",
    consentimentoLgpd: true,
    currentStage: "CONTATO_INICIADO",
    chatwootDeepLink: null,
  },
  {
    numeroContato: "+5535999110002",
    nome: "Bruno Lima",
    statusBot: "PAUSADO",
    lastMessageAt: null,
    consentimentoLgpd: false,
    currentStage: "QUALIFICADO",
    chatwootDeepLink: "https://chatwoot.example/conv/2",
  },
];

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "tenant_1", hasPermission: () => true }),
}));

const resumeMutation = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };

vi.mock("@/src/shared/hooks/hotel-portal", () => ({
  useResumeConversation: () => resumeMutation,
  useHotelConversations: () => ({ data: conversas, isLoading: false }),
  useHotelConversationDetail: (_clientId: string | null, numero: string | null) => ({
    data: numero
      ? {
          contact: {
            numeroContato: numero,
            nome: "Bruno Lima",
            statusBot: "PAUSADO",
            consentimentoLgpd: false,
            currentStage: "QUALIFICADO",
            chatwootDeepLink: "https://chatwoot.example/conv/2",
          },
          messages: [
            { role: "user", tipo: "texto", contentPreview: "Oi, tem vaga?", ocorridoEm: "2026-08-19T14:00:00.000Z" },
            { role: "assistant", tipo: "texto", contentPreview: "Temos sim!", ocorridoEm: "2026-08-19T14:01:00.000Z" },
          ],
        }
      : undefined,
    isLoading: false,
  }),
}));

describe("WhatsappInbox", () => {
  it("lista contatos com etiqueta de estagio e placeholder de conversa", () => {
    render(<WhatsappInbox clientId="client_1" />);
    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    expect(screen.getByText("Bruno Lima")).toBeInTheDocument();
    expect(screen.getByText(/selecione uma conversa/i)).toBeInTheDocument();
  });

  it("clicar no contato abre a transcricao somente leitura", () => {
    render(<WhatsappInbox clientId="client_1" />);
    fireEvent.click(screen.getByText("Bruno Lima"));
    expect(screen.getByText("Oi, tem vaga?")).toBeInTheDocument();
    expect(screen.getByText(/somente leitura/i)).toBeInTheDocument();
    expect(screen.getByText(/responder no chatwoot/i)).toBeInTheDocument();
  });

  it("conversa pausada oferece retomada com estagio e chama a mutation", async () => {
    render(<WhatsappInbox clientId="client_1" />);
    fireEvent.click(screen.getByText("Bruno Lima"));
    fireEvent.click(screen.getByRole("button", { name: /retomar conversa/i }));
    expect(screen.getByText(/fica registrado que você assumiu/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^retomar$/i }));
    await waitFor(() =>
      expect(resumeMutation.mutateAsync).toHaveBeenCalledWith({
        numeroContato: "+5535999110002",
        estagio: "QUALIFICADO",
      }),
    );
  });

  it("formata numero brasileiro para exibicao", () => {
    expect(formatPhoneBR("+5535999110001")).toBe("+55 (35) 99911-0001");
    expect(formatPhoneBR("5511987654321")).toBe("+55 (11) 98765-4321");
    expect(formatPhoneBR("+14155550123")).toBe("+14155550123"); // fora do padrao BR, intacto
  });

  it("etiqueta aguardando humano filtra os pausados", () => {
    render(<WhatsappInbox clientId="client_1" />);
    fireEvent.click(screen.getByRole("button", { name: /^aguardando humano/i }));
    expect(screen.queryByText("Ana Souza")).not.toBeInTheDocument();
    expect(screen.getByText("Bruno Lima")).toBeInTheDocument();
  });
});
