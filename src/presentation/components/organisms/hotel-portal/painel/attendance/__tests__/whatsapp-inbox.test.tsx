import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WhatsappInbox, formatPhoneBR } from "../whatsapp-inbox";
import type { ConversationListItem } from "@/src/shared/domain/types/@hotel-painel";

const conversas: ConversationListItem[] = [
  {
    numeroContato: "+5535999110001",
    nome: "Ana Souza",
    statusBot: "AGUARDANDO_PAGAMENTO",
    lastMessageAt: "2026-08-19T14:32:00.000Z",
    consentimentoLgpd: true,
    currentStage: "CONTATO_INICIADO",
    whatsappWebLink: "https://web.whatsapp.com/send?phone=5535999110001",
  },
  {
    numeroContato: "+5535999110002",
    nome: "Bruno Lima",
    statusBot: "PAUSADO",
    lastMessageAt: null,
    consentimentoLgpd: false,
    currentStage: "QUALIFICADO",
    whatsappWebLink: "https://web.whatsapp.com/send?phone=5535999110002",
  },
];

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "tenant_1", hasPermission: () => true }),
}));

const pauseMutation = { mutateAsync: vi.fn().mockResolvedValue({ ok: true, state: "PAUSADO" }), isPending: false };
const resumeMutation = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };

vi.mock("@/src/shared/hooks/hotel-portal", () => ({
  useResumeConversation: () => resumeMutation,
  usePauseConversation: () => pauseMutation,
  useHotelConversations: () => ({ data: conversas, isLoading: false }),
  useHotelConversationDetail: (_clientId: string | null, numero: string | null) => ({
    data: numero === "+5535999110001"
      ? {
          contact: {
            numeroContato: numero, nome: "Ana Souza", statusBot: "AGUARDANDO_PAGAMENTO",
            consentimentoLgpd: true, currentStage: "FECHAMENTO_INICIADO",
            whatsappWebLink: "https://web.whatsapp.com/send?phone=5535999110001",
            ocasiao: "romantica",
            hold: {
              codigo: "M57", status: "AGUARDANDO", acomodacao: "Suíte Master",
              checkIn: "2026-11-20", checkOut: "2026-11-22", valor: 1049,
            },
          },
          messages: [],
        }
      : numero
      ? {
          contact: {
            numeroContato: numero,
            nome: "Bruno Lima",
            statusBot: "PAUSADO",
            consentimentoLgpd: false,
            currentStage: "QUALIFICADO",
            whatsappWebLink: "https://web.whatsapp.com/send?phone=5535999110002",
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
    const link = screen.getByRole("link", { name: /abrir no whatsapp web/i });
    expect(link).toHaveAttribute("href", "https://web.whatsapp.com/send?phone=5535999110002");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.queryByText(/chatwoot/i)).not.toBeInTheDocument();
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

  it("cabecalho mostra o status do bot, a ocasiao e a pre-reserva", () => {
    render(<WhatsappInbox clientId="client_1" />);
    fireEvent.click(screen.getByText("Ana Souza"));
    const cabecalho = screen.getByTestId("conversa-cabecalho");
    expect(cabecalho).toHaveTextContent("Aguardando pagamento");
    expect(cabecalho).toHaveTextContent("Romântica");
    expect(cabecalho).toHaveTextContent("Suíte Master");
    expect(cabecalho).toHaveTextContent("20/11 – 22/11");
    expect(cabecalho).toHaveTextContent("R$ 1.049,00");
  });

  it("conversa com o bot oferece assumir, e nao retomar", async () => {
    render(<WhatsappInbox clientId="client_1" />);
    fireEvent.click(screen.getByText("Ana Souza"));
    expect(screen.queryByRole("button", { name: /retomar conversa/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /assumir conversa/i }));
    fireEvent.click(screen.getByRole("button", { name: /^assumir$/i }));
    await waitFor(() =>
      expect(pauseMutation.mutateAsync).toHaveBeenCalledWith({
        numeroContato: "+5535999110001",
        motivo: undefined,
      }),
    );
  });

  it("conversa ja com a equipe nao oferece assumir", () => {
    render(<WhatsappInbox clientId="client_1" />);
    fireEvent.click(screen.getByText("Bruno Lima"));
    expect(screen.queryByRole("button", { name: /assumir conversa/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retomar conversa/i })).toBeInTheDocument();
  });

  it("PAUSADO_HUMANO tambem conta como aguardando humano", () => {
    conversas[0].statusBot = "PAUSADO_HUMANO";
    render(<WhatsappInbox clientId="client_1" />);
    fireEvent.click(screen.getByRole("button", { name: /^aguardando humano/i }));
    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    conversas[0].statusBot = "AGUARDANDO_PAGAMENTO";
  });

  it("lista sinaliza quem esta com a bola em cada conversa", () => {
    render(<WhatsappInbox clientId="client_1" />);
    expect(screen.getByLabelText("Com humano")).toBeInTheDocument();
    expect(screen.getByLabelText("Com o bot")).toBeInTheDocument();
  });
});
