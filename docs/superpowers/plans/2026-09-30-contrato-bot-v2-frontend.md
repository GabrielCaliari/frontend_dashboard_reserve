# Contrato Bot ↔ Painel v2 — Frontend — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adequar o `frontend_dashboard_reserve` ao Contrato Bot ↔ Painel v2 (`docs/CONTRATO_BOT_PAINEL_v2.md`): 10 estados do bot, saída do Chatwoot, ocasião e hold no inbox, ações novas (assumir conversa, estender prazo), motivo de perda em lista fechada, canais com modo e IA, aprovação de propostas e os números do bot na home.

**Architecture:** Um módulo único (`bot-status.ts`) vira a fonte de rótulos e regras do status do bot — hoje a checagem `=== "PAUSADO"` está espalhada em 8 lugares. Os tipos em `@hotel-painel.ts` passam a espelhar as formas de resposta definidas no plano do backend. Cada ação nova segue o caminho que já existe para "retomar conversa": adapter em `modules/hotel-portal`, hook de mutation em `shared/hooks/hotel-portal`, UI no organism.

**Tech Stack:** Next.js 16 App Router, TypeScript estrito, @tanstack/react-query v5, axios, HeroUI + shadcn, lucide-react, vitest 4 + Testing Library.

**Repo:** `C:\Users\gabri\OneDrive\Documents\GitHub\frontend_dashboard_reserve`. Caminhos relativos a ele. `HP` = `src/presentation/components/organisms/hotel-portal`.

**Depende de:** `docs/superpowers/plans/2026-09-30-contrato-bot-v2-backend.md` (as formas de resposta estão na seção "Formas de resposta que o frontend consome" daquele plano). Os testes deste plano mockam os hooks, então ele pode ser executado antes de o backend estar no ar.

## Global Constraints

- **Fonte da verdade:** `docs/CONTRATO_BOT_PAINEL_v2.md`, seções 4, 5, 6 e 7.
- **Rótulos dos 10 estados** (contrato §7), exatamente: `ATIVO` "Atendendo" · `VERIFICANDO` "Equipe verificando" · `AGUARDANDO_FICHA` "Preenchendo ficha" · `AGUARDANDO_PAGAMENTO` "Aguardando pagamento" · `EM_CONFIRMACAO` "Conferindo comprovante" · `PAUSADO` "Transferido" · `PAUSADO_HUMANO` "Com a equipe" · `FECHADO` "Reserva feita" · `EM_ESTADIA` "Hospedado" · `FRIO` "Esfriou".
- **O inbox continua somente leitura** (contrato §4.2, decisão 11 mantida). Não adicionar caixa de resposta. A equipe responde pelo WhatsApp Business da pousada; o painel só abre o WhatsApp Web.
- **Nenhuma menção a Chatwoot** pode sobrar em `src/` (código, comentários, testes).
- **Dinheiro chega em reais** nas respostas (`valorCotacao`, `hold.valor`, `home.bot.*`). Formatar com `formatBRL` de `HP/funil/funnel-stages.ts`; não dividir por 100.
- **Arquitetura** (`AGENTS.md`, `src/SRC.md`): `src/app/**` só re-exporta; adapters HTTP em `src/modules/hotel-portal/infrastructure/adapters.ts`; hooks em `src/shared/hooks/hotel-portal/` com barrel `index.ts`; tipos em `src/shared/domain/types/@hotel-painel.ts`. Não editar `src/infraestructure/server/services` (gerado).
- **Rotas admin** são escopadas por `tenantId` no path e usam `adminHeaders`; rotas de leitura são escopadas por `clientId`.
- **Permissões:** ações do funil/inbox exigem `hotel-portal.whatsapp-funnel.manage`; aprovar/rejeitar proposta exige `hotel-portal.bot-config-proposals.manage` (via `useTenantCapabilities().hasPermission`).
- **Testes:** vitest (`npm run test:run -- <padrão>`). Organisms com hooks: `vi.mock("@/src/shared/hooks/hotel-portal", ...)` listando TODOS os hooks que o componente importa + mock de `tenant-capabilities-provider`. Organisms puros: só props.
- **Gerenciador:** npm (não usar pnpm).
- **Strings de UI** em pt-BR, direto no componente (padrão destas telas).
- **Commits** conventional em português sem acento, terminando com: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`
- **Não rodar revisão de qualidade por task** — a revisão é única, no fim de tudo.

## Estrutura de arquivos

```
src/shared/domain/types/@hotel-painel.ts                         Task 1 (tipos do contrato v2)
HP/funil/bot-status.ts (+ __tests__/bot-status.test.ts)          Task 1 (novo: rotulos e regras do status)
HP/funil/funnel-stages.ts                                        Task 4 (motivos de perda)
HP/painel/attendance/whatsapp-inbox.tsx (+teste)                 Tasks 2, 3
HP/painel/attendance/conversation-transcript.tsx                 Task 2
src/presentation/components/pages/dashboard/hotel/atendimento/page.tsx              Task 2
src/presentation/components/pages/dashboard/hotel/atendimento/[numeroContato]/page.tsx  Task 2
HP/funil/funnel-board.tsx (+teste)                               Task 4
HP/funil/move-stage-modal.tsx                                    Task 4
src/presentation/components/pages/dashboard/hotel/funil/page.tsx (+teste)           Task 4
HP/painel/attendance/followup-effectiveness-chart.tsx (+teste)   Task 5
HP/painel/attendance/channel-status-card.tsx (+teste)            Task 5
HP/painel/bot-config/proposal-form.tsx (+teste)                  Task 6
HP/painel/bot-config/proposal-review.tsx (+teste)                Task 6 (novo)
src/presentation/components/pages/dashboard/hotel/atendimento/bot/page.tsx          Task 6
src/presentation/components/organisms/home/manager-home.tsx (+teste)                Task 7
HP/painel/leads/link-cycle-strip.tsx (+teste)                    Task 7 (novo)
HP/painel/attendance/ad-conversations-table.tsx (+teste)         Task 7 (novo)
src/modules/hotel-portal/infrastructure/adapters.ts              Tasks 3, 4, 6
src/shared/hooks/hotel-portal/use-hotel-painel.ts                Tasks 3, 4, 6
```

---

## Task 1: Tipos do contrato v2 + módulo de status do bot

**Files:**
- Modify: `src/shared/domain/types/@hotel-painel.ts`
- Create: `HP/funil/bot-status.ts`
- Create: `HP/funil/__tests__/bot-status.test.ts`

**Interfaces:**
- Produces (todas as tasks seguintes usam):

```ts
// bot-status.ts
export const BOT_STATUS_LABELS: Record<BotContactStatus, string>;
export const BOT_STATUS_TONES: Record<BotContactStatus, string>;
export function botStatusLabel(status: string): string;
export function isWithHuman(status: string): boolean;        // PAUSADO | PAUSADO_HUMANO
export function canTakeOver(status: string): boolean;        // o bot esta atendendo: da para assumir
export const OCCASION_LABELS: Record<string, string>;
export const HOLD_STATUS_LABELS: Record<string, string>;
```

Esta task muda só tipos e cria um módulo novo; os componentes continuam compilando porque os campos antigos (`chatwootDeepLink`, `tipoJanela`) só saem dos tipos nas Tasks 2 e 5, junto com quem os usa.

- [ ] **Step 1: Teste que falha**

`HP/funil/__tests__/bot-status.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  BOT_STATUS_LABELS,
  botStatusLabel,
  canTakeOver,
  isWithHuman,
} from "../bot-status";

describe("bot-status", () => {
  it("tem rotulo para os 10 estados do contrato", () => {
    expect(BOT_STATUS_LABELS).toEqual({
      ATIVO: "Atendendo",
      VERIFICANDO: "Equipe verificando",
      AGUARDANDO_FICHA: "Preenchendo ficha",
      AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
      EM_CONFIRMACAO: "Conferindo comprovante",
      PAUSADO: "Transferido",
      PAUSADO_HUMANO: "Com a equipe",
      FECHADO: "Reserva feita",
      EM_ESTADIA: "Hospedado",
      FRIO: "Esfriou",
    });
  });

  it("estado desconhecido cai no proprio texto, sem quebrar", () => {
    expect(botStatusLabel("NOVO_ESTADO")).toBe("NOVO_ESTADO");
  });

  it("com humano sao os dois estados pausados", () => {
    expect(isWithHuman("PAUSADO")).toBe(true);
    expect(isWithHuman("PAUSADO_HUMANO")).toBe(true);
    expect(isWithHuman("ATIVO")).toBe(false);
    expect(isWithHuman("AGUARDANDO_PAGAMENTO")).toBe(false);
  });

  it("so da para assumir quando o bot esta conduzindo a conversa", () => {
    for (const s of ["ATIVO", "VERIFICANDO", "AGUARDANDO_FICHA", "AGUARDANDO_PAGAMENTO", "EM_CONFIRMACAO"]) {
      expect(canTakeOver(s)).toBe(true);
    }
    for (const s of ["PAUSADO", "PAUSADO_HUMANO", "FECHADO", "EM_ESTADIA", "FRIO"]) {
      expect(canTakeOver(s)).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- bot-status`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Tipos**

Em `src/shared/domain/types/@hotel-painel.ts`:

1. Substituir a linha `export type BotContactStatus = 'ATIVO' | 'PAUSADO';` por:

```ts
/** Os 10 estados do bot (contrato v2 §3.4 / §7). */
export type BotContactStatus =
  | 'ATIVO'
  | 'VERIFICANDO'
  | 'AGUARDANDO_FICHA'
  | 'AGUARDANDO_PAGAMENTO'
  | 'EM_CONFIRMACAO'
  | 'PAUSADO'
  | 'PAUSADO_HUMANO'
  | 'FECHADO'
  | 'EM_ESTADIA'
  | 'FRIO';

/** Pre-reserva ou reserva ligada ao contato. `valor` em reais. */
export interface HoldResumo {
  codigo: string | null;
  status: string | null; // DISPONIVEL | AGUARDANDO | CONFIRMADA | EXPIRADA | CANCELADA | EXCECAO
  acomodacao: string | null;
  checkIn: string | null;
  checkOut: string | null;
  valor: number | null;
}

/** Resposta do bot a uma acao do painel (Canal B, contrato v2 §5.2). */
export interface PanelActionResult {
  ok: boolean;
  state: string | null;
}
```

2. Em `ConversationListItem`, acrescentar (o `chatwootDeepLink` sai na Task 2):

```ts
  /** Abre a conversa no WhatsApp Web da conta logada — a da pousada. */
  whatsappWebLink?: string;
```

3. Em `ConversationDetailResponse.contact`, acrescentar:

```ts
    whatsappWebLink?: string;
    /** romantica | familia | grupo | descanso */
    ocasiao?: string | null;
    hold?: HoldResumo | null;
```

4. Em `FunnelBoardLead`, acrescentar:

```ts
  /** caro | data | pesquisando | sumiu | outro (so em leads perdidos). */
  motivoPerda?: string | null;
  holdStatus?: string | null;
  holdCodigo?: string | null;
```

5. Em `BotChannelsResponse.whatsapp`, acrescentar:

```ts
    /** hospedin = bot fecha no PMS; handoff = bot qualifica e passa para a equipe. */
    mode?: string | null;
    aiEnabled?: boolean | null;
    lastEchoAt?: string | null;
    lastPollingAt?: string | null;
```

6. Em `FunnelMetricsResponse`, acrescentar:

```ts
  /** Conversas iniciadas por anuncio (source_id da Meta), maiores primeiro. */
  conversasPorAnuncio?: { sourceId: string; count: number }[];
```

7. Em `LeadsOverviewResponse`, acrescentar:

```ts
  /** Clique no link rastreavel -> conversa iniciada -> reserva confirmada. */
  ciclo?: { cliques: number; conversas: number; reservas: number };
```

8. Em `HotelHomeResponse`, acrescentar:

```ts
  /** Numeros do bot lidos dos eventos (reais). Ausente em backend antigo. */
  bot?: {
    receitaConfirmada: number;
    reservas: number;
    aRecuperar: { quantidade: number; valor: number };
  };
```

9. Em `BotConfigProposal`, acrescentar `justificativa_cliente?: string | null;` e, em `CreateBotConfigProposalDto`, `justificativa?: string;`.

- [ ] **Step 4: Módulo de status**

`HP/funil/bot-status.ts`:

```ts
import type { BotContactStatus } from "@/src/shared/domain/types/@hotel-painel";

/**
 * Fonte unica dos rotulos e regras do status do bot (contrato v2 §7). O bot
 * tem 10 estados; perguntar `=== "PAUSADO"` espalhado pelo codigo deixava de
 * fora PAUSADO_HUMANO (a equipe respondendo pelo app) e tratava como "ativo"
 * estados em que o hospede esta so esperando.
 */
export const BOT_STATUS_LABELS: Record<BotContactStatus, string> = {
  ATIVO: "Atendendo",
  VERIFICANDO: "Equipe verificando",
  AGUARDANDO_FICHA: "Preenchendo ficha",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  EM_CONFIRMACAO: "Conferindo comprovante",
  PAUSADO: "Transferido",
  PAUSADO_HUMANO: "Com a equipe",
  FECHADO: "Reserva feita",
  EM_ESTADIA: "Hospedado",
  FRIO: "Esfriou",
};

/** Mesma escala de cor do funil: salvia = bot, ambar = espera/equipe, verde = fechado, neutro = frio. */
export const BOT_STATUS_TONES: Record<BotContactStatus, string> = {
  ATIVO: "bg-primary/10 text-primary",
  VERIFICANDO: "bg-warning/15 text-warning-600",
  AGUARDANDO_FICHA: "bg-primary/10 text-primary",
  AGUARDANDO_PAGAMENTO: "bg-warning/15 text-warning-600",
  EM_CONFIRMACAO: "bg-warning/15 text-warning-600",
  PAUSADO: "bg-warning/20 text-warning-600",
  PAUSADO_HUMANO: "bg-warning/20 text-warning-600",
  FECHADO: "bg-success/15 text-success-600",
  EM_ESTADIA: "bg-success/15 text-success-600",
  FRIO: "bg-default-100 text-foreground/60",
};

const COM_HUMANO = new Set<string>(["PAUSADO", "PAUSADO_HUMANO"]);
const BOT_CONDUZINDO = new Set<string>([
  "ATIVO",
  "VERIFICANDO",
  "AGUARDANDO_FICHA",
  "AGUARDANDO_PAGAMENTO",
  "EM_CONFIRMACAO",
]);

export function botStatusLabel(status: string): string {
  return (BOT_STATUS_LABELS as Record<string, string>)[status] ?? status;
}

export function botStatusTone(status: string): string {
  return (BOT_STATUS_TONES as Record<string, string>)[status] ?? "bg-default-100 text-foreground/70";
}

/** A conversa esta com a equipe (transferida ou a equipe respondeu pelo app). */
export function isWithHuman(status: string): boolean {
  return COM_HUMANO.has(status);
}

/** O bot esta conduzindo: faz sentido oferecer "Assumir conversa". */
export function canTakeOver(status: string): boolean {
  return BOT_CONDUZINDO.has(status);
}

export const OCCASION_LABELS: Record<string, string> = {
  romantica: "Romântica",
  familia: "Família",
  grupo: "Grupo",
  descanso: "Descanso",
};

export const HOLD_STATUS_LABELS: Record<string, string> = {
  DISPONIVEL: "Disponível",
  AGUARDANDO: "Aguardando pagamento",
  CONFIRMADA: "Confirmada",
  EXPIRADA: "Expirada",
  CANCELADA: "Cancelada",
  EXCECAO: "Exceção",
};
```

(O teste do Step 1 importa só as funções; acrescentar `botStatusTone` não o afeta.)

- [ ] **Step 5: Rodar e ver passar**

Run: `npm run test:run -- bot-status` — Expected: PASS.
Run: `npm run test:run -- hotel-portal` — Expected: PASS (campos novos são opcionais; nada quebra).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(bot): tipos do contrato v2 e modulo unico de status do bot"
```

---

## Task 2: Sai o Chatwoot, entra o WhatsApp Web

**Files:**
- Modify: `src/shared/domain/types/@hotel-painel.ts` (remover `chatwootDeepLink`; `whatsappWebLink` deixa de ser opcional)
- Modify: `HP/painel/attendance/whatsapp-inbox.tsx:109-113,282-300`
- Modify: `HP/painel/attendance/conversation-transcript.tsx`
- Modify: `HP/painel/attendance/__tests__/whatsapp-inbox.test.tsx`
- Modify: `src/presentation/components/pages/dashboard/hotel/atendimento/page.tsx` (comentário e descrição)
- Modify: `src/presentation/components/pages/dashboard/hotel/atendimento/[numeroContato]/page.tsx:38-52`
- Modify: `src/presentation/components/pages/dashboard/hotel/funil/page.tsx:46` (comentário)

- [ ] **Step 1: Teste que falha**

Em `whatsapp-inbox.test.tsx`: nos três objetos de fixture, trocar `chatwootDeepLink: null` / `chatwootDeepLink: "https://chatwoot.example/conv/2"` por `whatsappWebLink: "https://web.whatsapp.com/send?phone=5535999110001"` (primeiro contato) e `whatsappWebLink: "https://web.whatsapp.com/send?phone=5535999110002"` (segundo contato e o detalhe). Trocar a asserção `expect(screen.getByText(/responder no chatwoot/i))…` por:

```ts
    const link = screen.getByRole("link", { name: /abrir no whatsapp web/i });
    expect(link).toHaveAttribute("href", "https://web.whatsapp.com/send?phone=5535999110002");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.queryByText(/chatwoot/i)).not.toBeInTheDocument();
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- whatsapp-inbox` — Expected: FAIL (não há link "Abrir no WhatsApp Web").

- [ ] **Step 3: Tipos**

Em `@hotel-painel.ts`: apagar o campo `chatwootDeepLink` (e seu comentário) de `ConversationListItem` e de `ConversationDetailResponse.contact`; trocar `whatsappWebLink?: string` por `whatsappWebLink: string` nos dois.

- [ ] **Step 4: Inbox**

Em `whatsapp-inbox.tsx`:

1. Comentário de classe (linhas 109–113):

```tsx
/**
 * Inbox estilo WhatsApp Web, SOMENTE LEITURA (contrato v2 §4.2): lista com
 * etiquetas de estagio a esquerda, transcricao a direita. A equipe responde
 * pelo WhatsApp Business da pousada; daqui so se abre a conversa no WhatsApp
 * Web. Mobile alterna lista <-> conversa.
 */
```

2. Substituir o bloco do botão do Chatwoot (linhas 282–293) por um `<a>` simples — o `Button as={Link}` do HeroUI não expõe role `link`, o que já atrapalhou o teste anterior:

```tsx
              <a
                className="inline-flex shrink-0 items-center rounded-xl bg-default-100 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-default-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                href={contato.whatsappWebLink}
                rel="noreferrer"
                target="_blank"
              >
                Abrir no WhatsApp Web <ExternalLink aria-hidden className="ml-1 h-3.5 w-3.5" />
              </a>
```

3. Rodapé (linha 299):

```tsx
              Somente leitura — a equipe responde pelo WhatsApp Business da pousada.
```

4. Remover o import de `Link` de `next/link` se não sobrar outro uso no arquivo.

- [ ] **Step 5: Transcrição**

Em `conversation-transcript.tsx`, trocar o comentário e tratar os tipos de mensagem do contrato (`texto | audio | imagem | botoes | template | sistema`):

```tsx
const tipoLabel: Record<string, string> = {
  audio: "áudio transcrito",
  imagem: "imagem",
  botoes: "botões",
  template: "modelo",
  sistema: "sistema",
};

/**
 * O backend devolve `contentPreview` (previa de ate 180 caracteres), nao a
 * mensagem inteira — o texto completo fica no bot (contrato v2 §8). Nao tente
 * reconstruir o conteudo aqui.
 */
```

e, no JSX, substituir `{msg.tipo === "audio" && " · áudio transcrito"}` por:

```tsx
            {tipoLabel[msg.tipo] ? ` · ${tipoLabel[msg.tipo]}` : ""}
```

- [ ] **Step 6: Páginas**

`atendimento/[numeroContato]/page.tsx`: descrição `"Transcrição somente leitura. A equipe responde pelo WhatsApp Business da pousada."`; o bloco `actions` vira:

```tsx
      actions={
        contact ? (
          <a
            className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
            href={contact.whatsappWebLink}
            rel="noreferrer"
            target="_blank"
          >
            Abrir no WhatsApp Web <ExternalLink aria-hidden className="ml-1 size-3.5" />
          </a>
        ) : undefined
      }
```

Remover os imports de `Link` e `Button` se ficarem sem uso. No Card de resumo, trocar a linha do bot por `{botStatusLabel(contact.statusBot)}` (import de `HP/funil/bot-status`).

`atendimento/page.tsx`: descrição `"Histórico e status das conversas do WhatsApp. Para responder, abra a conversa no WhatsApp Web."`; no comentário de bloco, trocar as duas frases que citam o Chatwoot por: `o painel mostra historico, busca e status; responder acontece no WhatsApp Business da pousada. Nao adicionar caixa de resposta aqui — duas caixas dessincronizam o bot.`

`funil/page.tsx:46`: `seguem read-only; a equipe responde pelo WhatsApp Business.`

- [ ] **Step 7: Verificar que nada sobrou**

Run: `Grep -i "chatwoot" src` — Expected: nenhuma ocorrência.

- [ ] **Step 8: Rodar e ver passar**

Run: `npm run test:run -- "whatsapp-inbox|atendimento"` — Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(atendimento): troca o chatwoot pelo whatsapp web no inbox"
```

---

## Task 3: Inbox — status de 10 estados, ocasião, hold e "Assumir conversa"

**Files:**
- Modify: `src/modules/hotel-portal/infrastructure/adapters.ts` (junto de `resumeConversation`, ~linha 672)
- Modify: `src/shared/hooks/hotel-portal/use-hotel-painel.ts` (junto de `useResumeConversation`)
- Modify: `HP/painel/attendance/whatsapp-inbox.tsx`
- Modify: `HP/painel/attendance/__tests__/whatsapp-inbox.test.tsx`

**Interfaces:**
- Consumes: `isWithHuman`, `canTakeOver`, `botStatusLabel`, `botStatusTone`, `OCCASION_LABELS`, `HOLD_STATUS_LABELS` (Task 1); `formatBRL` de `HP/funil/funnel-stages`.
- Produces:
  - `hotelPortalService.pauseConversation(tenantId: string, numeroContato: string, dto: { motivo?: string }): Promise<PanelActionResult>` → `POST /admin/hotel-portal/${tenantId}/whatsapp/funnel/${numero}/pause`.
  - `usePauseConversation(tenantId: string | null, clientId: string | null)` — mutation `({ numeroContato, motivo? })`.

- [ ] **Step 1: Testes que falham**

Em `whatsapp-inbox.test.tsx`:

1. No mock do barrel, acrescentar `usePauseConversation: () => pauseMutation,` e, acima do `vi.mock`, `const pauseMutation = { mutateAsync: vi.fn().mockResolvedValue({ ok: true, state: "PAUSADO" }), isPending: false };`.
2. Trocar a fixture do primeiro contato (Ana Souza) para `statusBot: "AGUARDANDO_PAGAMENTO"` e fazer o mock de `useHotelConversationDetail` devolver, quando `numero === "+5535999110001"`:

```ts
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
```

(o detalhe de Bruno Lima continua `PAUSADO`, sem `hold`).

3. Acrescentar os testes:

```ts
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
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- whatsapp-inbox` — Expected: FAIL.

- [ ] **Step 3: Adapter e hook**

Em `adapters.ts`, depois de `resumeConversation` (acrescentar `PanelActionResult` ao import de tipos de `@hotel-painel`):

```ts
  /** "Assumir conversa": pausa o bot para o contato (Canal B, pause_bot). */
  async pauseConversation(
    tenantId: string,
    numeroContato: string,
    dto: { motivo?: string },
  ): Promise<PanelActionResult> {
    const res = await api.post<PanelActionResult>(
      `/admin/hotel-portal/${tenantId}/whatsapp/funnel/${encodeURIComponent(numeroContato)}/pause`,
      dto,
      adminHeaders,
    );
    return res.data;
  },
```

Em `use-hotel-painel.ts`, depois de `useResumeConversation`:

```ts
/** "Assumir conversa": o humano pausa o bot para aquele contato. */
export function usePauseConversation(tenantId: string | null, clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numeroContato, motivo }: { numeroContato: string; motivo?: string }) =>
      hotelPortalService.pauseConversation(tenantId!, numeroContato, { motivo }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'conversations', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'conversation', clientId, vars.numeroContato] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'funnel-board', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'bot-channels', clientId] });
    },
  });
}
```

No `onSuccess` do `useResumeConversation` existente, acrescentar a mesma invalidação de `['hotel-portal', 'bot-channels', clientId]` (hoje falta: o contador "aguardando humano" dos canais ficava velho depois de retomar).

- [ ] **Step 4: Inbox — lista e filtro**

Em `whatsapp-inbox.tsx`:

1. Imports: acrescentar `Hand` ao import de `lucide-react`; acrescentar

```tsx
import {
  HOLD_STATUS_LABELS,
  OCCASION_LABELS,
  botStatusLabel,
  botStatusTone,
  canTakeOver,
  isWithHuman,
} from "@/src/presentation/components/organisms/hotel-portal/funil/bot-status";
import { formatBRL } from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages";
```

e `usePauseConversation` ao import do barrel de hooks.

2. Em `ContactRow` (linha 98): `{conv.statusBot === "PAUSADO" ? (` → `{isWithHuman(conv.statusBot) ? (`.
3. Linhas 144 e 147: as duas checagens `c.statusBot === "PAUSADO"` → `isWithHuman(c.statusBot)`.

- [ ] **Step 5: Inbox — cabeçalho**

1. Estado e mutation novos, junto dos de retomada:

```tsx
  const [assumirAberto, setAssumirAberto] = useState(false);
  const [motivoAssumir, setMotivoAssumir] = useState("");
  const pausa = usePauseConversation(tenantId, clientId);
```

2. Helper local, acima do componente:

```tsx
/** 2026-11-20 -> 20/11 */
function diaMes(iso: string | null): string {
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[2]}/${m[1]}` : "";
}
```

3. No `<header>` da conversa: acrescentar `data-testid="conversa-cabecalho"` e a classe `flex-wrap`. Substituir o badge binário (linhas 258–262) por:

```tsx
                  <span className={`rounded-full px-1.5 py-px text-[10px] font-medium ${botStatusTone(contato.statusBot)}`}>
                    {botStatusLabel(contato.statusBot)}
                  </span>
```

4. Logo depois do `<p>` de telefone/estágio (ainda dentro do `div.min-w-0.flex-1`), o que a equipe mais precisa ver (contrato §7):

```tsx
                {contato.ocasiao || contato.hold ? (
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-foreground/70">
                    {contato.ocasiao ? (
                      <span className="rounded-full bg-secondary/20 px-1.5 py-px text-[10px] font-medium text-secondary-600">
                        {OCCASION_LABELS[contato.ocasiao] ?? contato.ocasiao}
                      </span>
                    ) : null}
                    {contato.hold ? (
                      <>
                        {contato.hold.acomodacao ? <span className="font-medium">{contato.hold.acomodacao}</span> : null}
                        {contato.hold.checkIn && contato.hold.checkOut ? (
                          <span>{diaMes(contato.hold.checkIn)} – {diaMes(contato.hold.checkOut)}</span>
                        ) : null}
                        {contato.hold.valor != null ? (
                          <span className="font-semibold text-foreground">{formatBRL(contato.hold.valor)}</span>
                        ) : null}
                        {contato.hold.status ? (
                          <span className="text-foreground/50">
                            {HOLD_STATUS_LABELS[contato.hold.status] ?? contato.hold.status}
                          </span>
                        ) : null}
                      </>
                    ) : null}
                  </p>
                ) : null}
```

5. A condição do botão "Retomar conversa" (linha 270): `contato.statusBot === "PAUSADO" && podeRetomar` → `isWithHuman(contato.statusBot) && podeRetomar`.
6. Logo depois dele, o botão novo:

```tsx
              {canTakeOver(contato.statusBot) && podeRetomar ? (
                <Button size="sm" variant="flat" onPress={() => { setMotivoAssumir(""); setAssumirAberto(true); }}>
                  <Hand className="mr-1 h-3.5 w-3.5" /> Assumir conversa
                </Button>
              ) : null}
```

7. Remover o bloco "LGPD não confirmado" do cabeçalho e o import de `ShieldAlert` (contrato §4.1: o consentimento é `true` por padrão; o aviso deixou de fazer sentido).

- [ ] **Step 6: Inbox — modal de assumir**

Ao lado do modal de retomada (antes do fechamento do `div` raiz):

```tsx
      {assumirAberto && contato ? (
        <Modal isOpen onClose={() => setAssumirAberto(false)}>
          <ModalContent>
            <ModalHeader>Assumir conversa</ModalHeader>
            <ModalBody className="space-y-3">
              <p className="text-sm text-foreground/70">
                O bot para de responder {contato.nome ?? formatPhoneBR(contato.numeroContato)} e os
                lembretes automáticos são encerrados. A conversa continua pelo WhatsApp Business da
                pousada; depois, use "Retomar conversa" para devolver ao bot.
              </p>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Motivo (opcional)</span>
                <input
                  className="w-full rounded-xl border border-border bg-default-50 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  maxLength={255}
                  value={motivoAssumir}
                  onChange={(e) => setMotivoAssumir(e.target.value)}
                />
              </label>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => setAssumirAberto(false)}>
                Cancelar
              </Button>
              <Button
                color="primary"
                isLoading={pausa.isPending}
                onPress={async () => {
                  try {
                    const result = await pausa.mutateAsync({
                      numeroContato: contato.numeroContato,
                      motivo: motivoAssumir.trim() || undefined,
                    });
                    if (result.ok) toast.success("Conversa assumida — o bot parou de responder este contato.");
                    else toast("Pausa registrada. O bot não confirmou agora; o painel vai reenviar.", { icon: "⏳" });
                    setAssumirAberto(false);
                  } catch {
                    toast.error("Não foi possível assumir a conversa.");
                  }
                }}
              >
                Assumir
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      ) : null}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npm run test:run -- whatsapp-inbox` — Expected: PASS (os testes antigos de retomada e de ícone "Com humano"/"Com o bot" continuam passando).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(atendimento): status do bot, ocasiao, pre-reserva e assumir conversa no inbox"
```

---

## Task 4: Funil — motivo de perda em lista, perdido no card e "Estender prazo"

**Files:**
- Modify: `HP/funil/funnel-stages.ts`
- Modify: `HP/funil/move-stage-modal.tsx`
- Modify: `HP/funil/funnel-board.tsx`
- Modify: `HP/funil/__tests__/funnel-board.test.tsx`
- Modify: `src/modules/hotel-portal/infrastructure/adapters.ts`, `src/shared/hooks/hotel-portal/use-hotel-painel.ts`
- Modify: `src/presentation/components/pages/dashboard/hotel/funil/page.tsx` e `__tests__/page.test.tsx`

**Interfaces:**
- Produces:
  - `LOSS_REASONS: { value: string; label: string }[]` e `lossReasonLabel(value: string | null | undefined): string | null` em `funnel-stages.ts`.
  - `FunnelBoard` ganha a prop opcional `onExtendHold?: (lead: FunnelBoardLead) => void`.
  - `hotelPortalService.extendHold(tenantId, numeroContato, dto: { minutos?: number; codigo?: string }): Promise<PanelActionResult>` → `POST …/funnel/${numero}/extend-hold`.
  - `useExtendHold(tenantId, clientId)` — mutation `({ numeroContato, codigo?, minutos? })`.

- [ ] **Step 1: Testes que falham**

Em `funnel-board.test.tsx`:

1. No teste "mover para perdido exige motivo no modal", trocar o preenchimento de texto livre por seleção:

```ts
    fireEvent.click(confirmar);
    expect(onMove).not.toHaveBeenCalled(); // sem motivo nao envia
    fireEvent.change(screen.getByLabelText(/motivo da perda/i), { target: { value: "sumiu" } });
    fireEvent.click(confirmar);
    await waitFor(() =>
      expect(onMove).toHaveBeenCalledWith("+5511999", { para_estagio: "PERDIDO", motivo: "sumiu" }),
    );
```

2. Acrescentar:

```ts
  it("card perdido mostra o motivo traduzido", () => {
    const perdido: FunnelBoardColumn[] = columns.map((c) =>
      c.stage === "PERDIDO"
        ? { ...c, count: 1, leads: [{ ...columns[0].leads[0], motivoPerda: "caro" }] }
        : { ...c, count: 0, leads: [] },
    );
    render(<FunnelBoard columns={perdido} canManage onMove={vi.fn()} />);
    expect(screen.getByText("Achou caro")).toBeInTheDocument();
  });

  it("hold aguardando pagamento oferece estender prazo", async () => {
    const onExtendHold = vi.fn();
    const comHold: FunnelBoardColumn[] = [
      { ...columns[0], leads: [{ ...columns[0].leads[0], holdStatus: "AGUARDANDO", holdCodigo: "M57" }] },
      ...columns.slice(1),
    ];
    render(<FunnelBoard columns={comHold} canManage onMove={vi.fn()} onExtendHold={onExtendHold} />);
    fireEvent.click(screen.getByRole("button", { name: /mover ana/i }));
    fireEvent.click(await screen.findByText(/estender prazo/i));
    expect(onExtendHold).toHaveBeenCalledWith(expect.objectContaining({ holdCodigo: "M57" }));
  });

  it("sem hold aguardando, nao ha opcao de estender", async () => {
    render(<FunnelBoard columns={columns} canManage onMove={vi.fn()} onExtendHold={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /mover ana/i }));
    await screen.findByText("Qualificado");
    expect(screen.queryByText(/estender prazo/i)).not.toBeInTheDocument();
  });

  it("PAUSADO_HUMANO tambem aparece como com humano", () => {
    const comEquipe: FunnelBoardColumn[] = [
      { ...columns[0], leads: [{ ...columns[0].leads[0], statusBot: "PAUSADO_HUMANO" as const }] },
      ...columns.slice(1),
    ];
    render(<FunnelBoard columns={comEquipe} canManage onMove={vi.fn()} />);
    expect(screen.getByLabelText("Com humano")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- funnel-board` — Expected: FAIL.

- [ ] **Step 3: Motivos de perda**

Em `funnel-stages.ts`, depois de `TAG_LABELS`:

```ts
/** Motivos de perda do contrato v2 (§3.5, evento `perdido`). Lista fechada: o backend recusa outro valor. */
export const LOSS_REASONS: { value: string; label: string }[] = [
  { value: "caro", label: "Achou caro" },
  { value: "data", label: "Data indisponível" },
  { value: "pesquisando", label: "Ainda pesquisando" },
  { value: "sumiu", label: "Parou de responder" },
  { value: "outro", label: "Outro motivo" },
];

/** Historico anterior ao contrato v2 tem motivo em texto livre: cai no proprio texto. */
export function lossReasonLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return LOSS_REASONS.find((r) => r.value === value)?.label ?? value;
}
```

- [ ] **Step 4: Modal**

Em `move-stage-modal.tsx`: remover `Textarea` do import do HeroUI; importar `LOSS_REASONS`; substituir o `<Textarea …/>` do ramo `PERDIDO` por um `<select>` nativo (o `Select` do HeroUI não é controlável em jsdom, e o formulário de propostas já usa `<select>` nativo):

```tsx
            <div className="space-y-1">
              <label className="block text-sm font-medium" htmlFor="motivo-perda">
                Motivo da perda
              </label>
              <select
                id="motivo-perda"
                aria-invalid={motivoInvalido}
                className={`w-full rounded-xl border bg-background px-3 py-2 text-sm ${
                  motivoInvalido ? "border-danger" : "border-input"
                }`}
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  if (motivoInvalido) setMotivoInvalido(false);
                }}
              >
                <option value="">Selecione…</option>
                {LOSS_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {motivoInvalido ? <p className="text-xs text-danger">Informe o motivo da perda</p> : null}
            </div>
```

O `handleConfirmarMotivo` não muda (valor vazio continua inválido).

- [ ] **Step 5: Card e menu**

Em `funnel-board.tsx`:

1. Imports: acrescentar `isWithHuman` (de `./bot-status`), `lossReasonLabel` (de `./funnel-stages`) e `DropdownSection` (do HeroUI).
2. `FunnelBoardProps` e `FunnelColumnViewProps` e `FunnelLeadCardProps` ganham `onExtendHold?: (lead: FunnelBoardLead) => void;`, repassado de `FunnelBoard` → `FunnelColumnView` → `FunnelLeadCard`.
3. Linha 241: `lead.statusBot === "PAUSADO"` → `isWithHuman(lead.statusBot)`.
4. Dentro do `<span className="flex flex-wrap gap-1">` das etiquetas, antes da etiqueta de recuperar:

```tsx
            {lossReasonLabel(lead.motivoPerda) && (
              <span className="mt-1 inline-block rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                {lossReasonLabel(lead.motivoPerda)}
              </span>
            )}
```

5. O `DropdownMenu` passa a ter duas seções — a de ações só quando há hold aguardando:

```tsx
          <DropdownMenu aria-label={`Mover ${lead.nome ?? lead.numeroContato}`}>
            {lead.holdStatus === "AGUARDANDO" && onExtendHold ? (
              <DropdownSection showDivider title="Pré-reserva">
                <DropdownItem key="extend-hold" onPress={() => onExtendHold(lead)}>
                  Estender prazo (+60 min)
                </DropdownItem>
              </DropdownSection>
            ) : null}
            <DropdownSection title="Mover para">
              {destinos.map((destino) => (
                <DropdownItem
                  key={destino.stage}
                  onPress={() => onRequestMove(lead, column.stage, destino.stage)}
                >
                  {destino.label}
                </DropdownItem>
              ))}
            </DropdownSection>
          </DropdownMenu>
```

Se o `DropdownMenu` do HeroUI reclamar de filho `null`, montar as seções num array e passar `{secoes}`.

- [ ] **Step 6: Adapter, hook e página**

`adapters.ts`, depois de `pauseConversation`:

```ts
  /** Soma minutos ao prazo do hold que esta aguardando pagamento (Canal B, extend_hold). */
  async extendHold(
    tenantId: string,
    numeroContato: string,
    dto: { minutos?: number; codigo?: string },
  ): Promise<PanelActionResult> {
    const res = await api.post<PanelActionResult>(
      `/admin/hotel-portal/${tenantId}/whatsapp/funnel/${encodeURIComponent(numeroContato)}/extend-hold`,
      dto,
      adminHeaders,
    );
    return res.data;
  },
```

`use-hotel-painel.ts`:

```ts
/** Estende o prazo da pre-reserva que esta aguardando pagamento. */
export function useExtendHold(tenantId: string | null, clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numeroContato, codigo, minutos }: { numeroContato: string; codigo?: string; minutos?: number }) =>
      hotelPortalService.extendHold(tenantId!, numeroContato, { codigo, minutos }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-portal', 'funnel-board', clientId] }),
  });
}
```

`funil/page.tsx`: importar `useExtendHold`; depois de `moveStage`:

```tsx
  const extendHold = useExtendHold(tenantId, clientId);

  const handleExtendHold = async (lead: FunnelBoardLead) => {
    try {
      const result = await extendHold.mutateAsync({
        numeroContato: lead.numeroContato,
        codigo: lead.holdCodigo ?? undefined,
      });
      if (result.ok) toast.success("Prazo estendido em 60 minutos.");
      else toast("Pedido registrado. O bot não confirmou agora; o painel vai reenviar.", { icon: "⏳" });
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível estender o prazo."));
    }
  };
```

e passar `onExtendHold={canManage ? handleExtendHold : undefined}` ao `<FunnelBoard>` (import do tipo `FunnelBoardLead`). No `__tests__/page.test.tsx`, acrescentar `useExtendHold: () => mutation,` ao mock do barrel.

- [ ] **Step 7: Rodar e ver passar**

Run: `npm run test:run -- "funnel-board|funnel-stages|funil"` — Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(funil): motivo de perda em lista fechada e estender prazo da pre-reserva"
```

---

## Task 5: Follow-up por régua e canais com modo e IA

**Files:**
- Modify: `src/shared/domain/types/@hotel-painel.ts` (`efetividadeFollowup`)
- Modify: `HP/painel/attendance/followup-effectiveness-chart.tsx`
- Create: `HP/painel/attendance/__tests__/followup-effectiveness-chart.test.tsx`
- Modify: `HP/painel/attendance/channel-status-card.tsx`
- Create: `HP/painel/attendance/__tests__/channel-status-card.test.tsx`

**Interfaces:**
- Produces: `summarizeFollowup(data): { regua: string; respondeu_pct: number }[]` exportada do chart (função pura, testável sem montar o gráfico).

O gráfico atual agrupa por `tipoJanela` e só conta resposta quando `status === "RESPONDIDO"`. O contrato (§4.4) manda `regua` e `respondeu`/`sem_resposta` — sem esta task o gráfico mostraria 0% para sempre, sem erro nenhum.

- [ ] **Step 1: Testes que falham**

`followup-effectiveness-chart.test.tsx`:

```ts
import { describe, expect, it } from "vitest";
import { summarizeFollowup } from "../followup-effectiveness-chart";

describe("summarizeFollowup", () => {
  it("agrupa por regua e calcula o percentual de resposta", () => {
    expect(
      summarizeFollowup([
        { regua: "anuncio", status: "respondeu", count: 3 },
        { regua: "anuncio", status: "sem_resposta", count: 9 },
        { regua: "pagamento", status: "respondeu", count: 1 },
      ]),
    ).toEqual([
      { regua: "Anúncio (72h)", respondeu_pct: 25 },
      { regua: "Pagamento", respondeu_pct: 100 },
    ]);
  });

  it("regua desconhecida aparece com o proprio nome", () => {
    expect(summarizeFollowup([{ regua: "nova", status: "sem_resposta", count: 2 }])).toEqual([
      { regua: "nova", respondeu_pct: 0 },
    ]);
  });
});
```

`channel-status-card.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BotChannelCards } from "../channel-status-card";
import type { BotChannelsResponse } from "@/src/shared/domain/types/@hotel-painel";

const base: BotChannelsResponse = {
  whatsapp: {
    connected: true, botEnabled: true, heartbeatAgeMinutes: 1, heartbeatStale: false,
    activeConversations: 7, pausedAwaitingHuman: 2, mode: "hospedin", aiEnabled: true,
  },
  instagram: { connected: false, tokenStatus: null },
  metaAds: { connected: true },
};

describe("BotChannelCards", () => {
  it("mostra o modo de operacao e a IA", () => {
    render(<BotChannelCards channels={base} />);
    expect(screen.getByText(/reserva direto no pms/i)).toBeInTheDocument();
    expect(screen.getByText(/ia: ligada/i)).toBeInTheDocument();
    expect(screen.getByText(/7 conversas ativas/i)).toBeInTheDocument();
  });

  it("modo handoff e IA desligada", () => {
    render(
      <BotChannelCards
        channels={{ ...base, whatsapp: { ...base.whatsapp, mode: "handoff", aiEnabled: false } }}
      />,
    );
    expect(screen.getByText(/qualifica e passa para a equipe/i)).toBeInTheDocument();
    expect(screen.getByText(/ia: desligada/i)).toBeInTheDocument();
  });

  it("sem sinal ha mais de 5 minutos avisa que o bot esta fora do ar", () => {
    render(
      <BotChannelCards
        channels={{
          ...base,
          whatsapp: { ...base.whatsapp, connected: false, heartbeatStale: true, heartbeatAgeMinutes: 12 },
        }}
      />,
    );
    expect(screen.getByText(/sem sinal do bot há 12 min/i)).toBeInTheDocument();
  });

  it("backend antigo (sem modo nem IA) nao quebra", () => {
    const { whatsapp } = base;
    render(
      <BotChannelCards
        channels={{ ...base, whatsapp: { ...whatsapp, mode: undefined, aiEnabled: undefined } }}
      />,
    );
    expect(screen.queryByText(/ia:/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- "followup-effectiveness|channel-status-card"` — Expected: FAIL.

- [ ] **Step 3: Tipo**

Em `@hotel-painel.ts`, `FunnelMetricsResponse`:

```ts
  /** Uma linha por regua x status (contrato v2 §4.4). */
  efetividadeFollowup: { regua: string; status: 'respondeu' | 'sem_resposta' | string; count: number }[];
```

- [ ] **Step 4: Gráfico**

Substituir o conteúdo de `followup-effectiveness-chart.tsx`:

```tsx
import { useMemo } from "react";
import { PortalBarChart } from "@/src/presentation/components/organisms/hotel-portal/painel/charts/bar-chart";
import type { FunnelMetricsResponse } from "@/src/shared/domain/types/@hotel-painel";

/** Reguas de follow-up do bot (contrato v2 §3.5): por origem do contato ou por momento da venda. */
const REGUA_LABELS: Record<string, string> = {
  anuncio: "Anúncio (72h)",
  organico: "Orgânico (24h)",
  pre_reserva: "Pré-reserva",
  pagamento: "Pagamento",
};

/**
 * O backend devolve linhas cruas (`regua` x `status` x `count`). Agrupar por
 * regua e derivar o percentual de resposta e trabalho de apresentacao, feito
 * aqui. "Respondeu" = o hospede mandou mensagem depois do toque.
 */
export function summarizeFollowup(
  data: FunnelMetricsResponse["efetividadeFollowup"],
): { regua: string; respondeu_pct: number }[] {
  const porRegua = new Map<string, { total: number; respondeu: number }>();
  for (const row of data) {
    const entry = porRegua.get(row.regua) ?? { total: 0, respondeu: 0 };
    entry.total += row.count;
    if (row.status === "respondeu") entry.respondeu += row.count;
    porRegua.set(row.regua, entry);
  }
  return [...porRegua.entries()].map(([regua, v]) => ({
    regua: REGUA_LABELS[regua] ?? regua,
    respondeu_pct: v.total ? Math.round((v.respondeu / v.total) * 1000) / 10 : 0,
  }));
}

export function FollowupEffectivenessChart({
  data,
}: {
  data: FunnelMetricsResponse["efetividadeFollowup"];
}) {
  const rows = useMemo(() => summarizeFollowup(data), [data]);

  return (
    <PortalBarChart
      data={rows}
      xKey="regua"
      series={[{ key: "respondeu_pct", label: "Responderam (%)", color: "#0ea5e9" }]}
    />
  );
}
```

- [ ] **Step 5: Canais**

Em `channel-status-card.tsx`, acima do componente:

```tsx
const MODE_LABELS: Record<string, string> = {
  hospedin: "Reserva direto no PMS",
  handoff: "Qualifica e passa para a equipe",
};
```

A mensagem do card de WhatsApp passa a distinguir "nunca configurado" de "caiu":

```tsx
        message={
          whatsapp.heartbeatAgeMinutes === null
            ? "Integração não provisionada"
            : whatsapp.heartbeatStale
              ? `Sem sinal do bot há ${whatsapp.heartbeatAgeMinutes} min`
              : `Ativo há ${whatsapp.heartbeatAgeMinutes} min`
        }
```

e o corpo:

```tsx
        <div className="space-y-1 text-sm">
          <p>Atendimento automático: {whatsapp.botEnabled ? "ligado" : "pausado"}</p>
          {whatsapp.mode ? (
            <p className="text-muted-foreground">Modo: {MODE_LABELS[whatsapp.mode] ?? whatsapp.mode}</p>
          ) : null}
          {typeof whatsapp.aiEnabled === "boolean" ? (
            <p className="text-muted-foreground">IA: {whatsapp.aiEnabled ? "ligada" : "desligada"}</p>
          ) : null}
          <p className="text-muted-foreground">
            {whatsapp.activeConversations} conversa
            {whatsapp.activeConversations === 1 ? "" : "s"} ativa
            {whatsapp.activeConversations === 1 ? "" : "s"}
          </p>
          {Boolean(whatsapp.pausedAwaitingHuman) && (
            <p className="font-medium text-amber-600">
              {whatsapp.pausedAwaitingHuman} contato
              {whatsapp.pausedAwaitingHuman === 1 ? "" : "s"} aguardando um humano
            </p>
          )}
        </div>
```

(`activeConversations` agora é o número que o bot informa no heartbeat, não mais "últimas 24h".)

- [ ] **Step 6: Rodar e ver passar**

Run: `npm run test:run -- "followup-effectiveness|channel-status-card|funil"` — Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(funil): follow-up por regua e canais com modo de operacao e ia"
```

---

## Task 6: Propostas de configuração — justificativa, chaves e aprovação

**Files:**
- Modify: `HP/painel/bot-config/proposal-form.tsx`
- Create: `HP/painel/bot-config/__tests__/proposal-form.test.tsx`
- Create: `HP/painel/bot-config/proposal-review.tsx`
- Create: `HP/painel/bot-config/__tests__/proposal-review.test.tsx`
- Modify: `src/modules/hotel-portal/infrastructure/adapters.ts`, `src/shared/hooks/hotel-portal/use-hotel-painel.ts`
- Modify: `src/presentation/components/pages/dashboard/hotel/atendimento/bot/page.tsx`

**Interfaces:**
- Produces:
  - `hotelPortalService.approveBotConfigProposal(tenantId, id): Promise<BotConfigProposal>` → `PATCH /admin/hotel-portal/${tenantId}/bot-config-proposals/${id}/approve`.
  - `hotelPortalService.rejectBotConfigProposal(tenantId, id, dto: { justificativa: string }): Promise<BotConfigProposal>` → `PATCH …/${id}/reject`.
  - `useApproveBotConfigProposal(tenantId, clientId)` / `useRejectBotConfigProposal(tenantId, clientId)`.
  - `ProposalReview({ onApprove, onReject, isBusy })` — botões de aprovar/rejeitar de uma proposta pendente.

O backend já tem as rotas de aprovar/rejeitar; faltava a tela. Ao aprovar, o backend aplica a chave no bot (`apply_config`, contrato §6).

- [ ] **Step 1: Testes que falham**

`proposal-form.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProposalForm } from "../proposal-form";

describe("ProposalForm", () => {
  it("envia a justificativa do cliente junto da proposta", () => {
    const onSubmit = vi.fn();
    render(<ProposalForm isSubmitting={false} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/o que muda/i), { target: { value: "hold_min_pix_manual" } });
    fireEvent.change(screen.getByLabelText(/novo valor/i), { target: { value: "90" } });
    fireEvent.change(screen.getByLabelText(/por que mudar/i), { target: { value: "hóspedes pedem mais prazo" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar para aprovação/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      campo: "hold_min_pix_manual", categoria: "pricing", valor_atual: undefined,
      valor_proposto: "90", justificativa: "hóspedes pedem mais prazo",
    });
  });

  it("sugere as chaves que o bot aceita para a categoria escolhida", () => {
    render(<ProposalForm isSubmitting={false} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/categoria/i), { target: { value: "policies" } });
    const opcoes = [...document.querySelectorAll("#proposal-campo-sugestoes option")].map((o) =>
      o.getAttribute("value"),
    );
    expect(opcoes).toEqual(["hold_min_pix_manual", "hold_min_cartao", "hold_min_pix_link"]);
  });
});
```

`proposal-review.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProposalReview } from "../proposal-review";

describe("ProposalReview", () => {
  it("aprovar chama onApprove", () => {
    const onApprove = vi.fn();
    render(<ProposalReview isBusy={false} onApprove={onApprove} onReject={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /aprovar e publicar/i }));
    expect(onApprove).toHaveBeenCalled();
  });

  it("rejeitar exige o retorno para o cliente", () => {
    const onReject = vi.fn();
    render(<ProposalReview isBusy={false} onApprove={vi.fn()} onReject={onReject} />);
    fireEvent.click(screen.getByRole("button", { name: /^rejeitar$/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar rejeição/i }));
    expect(onReject).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/retorno para o cliente/i), { target: { value: "valor abaixo do custo" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar rejeição/i }));
    expect(onReject).toHaveBeenCalledWith("valor abaixo do custo");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- "proposal-form|proposal-review"` — Expected: FAIL.

- [ ] **Step 3: Formulário**

Em `proposal-form.tsx`:

1. Acima do componente, as chaves que o bot aceita hoje (contrato §6):

```tsx
/**
 * Chaves que o bot aplica por `apply_config` (contrato v2 §6). Sao sugestoes:
 * o campo continua livre, porque o bot pode passar a aceitar chaves novas
 * antes de o painel ser atualizado.
 */
const KEY_SUGGESTIONS: Record<BotConfigProposalCategory, string[]> = {
  pricing: [
    "valor_pessoa_adicional_cents",
    "valor_taxa_pet_cents",
    "desconto_sem_cafe_cents",
    "percentual_desconto_marina",
  ],
  policies: ["hold_min_pix_manual", "hold_min_cartao", "hold_min_pix_link"],
  packages: ["hospedin_chale_familia_bloqueado"],
  hours: ["resumo_dia_hora"],
};
```

2. Estado novo: `const [justificativa, setJustificativa] = useState("");`
3. No `onSubmit`: acrescentar `justificativa: justificativa.trim() || undefined,` ao objeto e `setJustificativa("");` na limpeza.
4. No `<Input id="proposal-campo">`: acrescentar `list="proposal-campo-sugestoes"` e trocar o placeholder para `"Ex.: hold_min_pix_manual"`; logo depois dele:

```tsx
        <datalist id="proposal-campo-sugestoes">
          {KEY_SUGGESTIONS[categoria].map((key) => (
            <option key={key} value={key} />
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">
          Para tarifa use <code>tarifa:&lt;tipo&gt;:&lt;A|B|C&gt;</code> (valor em centavos) e, para
          feriado, <code>calendario:AAAA-MM-DD</code>.
        </p>
```

5. Antes do parágrafo de aviso, o campo novo:

```tsx
      <div className="space-y-1">
        <label className="block text-sm font-medium" htmlFor="proposal-justificativa">
          Por que mudar (opcional)
        </label>
        <Input
          id="proposal-justificativa"
          maxLength={1000}
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
        />
      </div>
```

- [ ] **Step 4: Componente de revisão**

`proposal-review.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";

/**
 * Aprovar/rejeitar uma proposta pendente (so para quem tem a permissao da
 * agencia). Aprovar publica a chave no bot; rejeitar exige o retorno, que o
 * cliente le na lista.
 */
export function ProposalReview({
  onApprove,
  onReject,
  isBusy,
}: {
  onApprove: () => void;
  onReject: (justificativa: string) => void;
  isBusy: boolean;
}) {
  const [rejeitando, setRejeitando] = useState(false);
  const [retorno, setRetorno] = useState("");

  if (!rejeitando) {
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        <Button disabled={isBusy} size="sm" onClick={onApprove}>
          Aprovar e publicar
        </Button>
        <Button disabled={isBusy} size="sm" variant="outline" onClick={() => setRejeitando(true)}>
          Rejeitar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      <label className="block text-sm font-medium" htmlFor="proposal-retorno">
        Retorno para o cliente
      </label>
      <Input id="proposal-retorno" maxLength={500} value={retorno} onChange={(e) => setRetorno(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={isBusy}
          size="sm"
          variant="destructive"
          onClick={() => {
            const texto = retorno.trim();
            if (texto) onReject(texto);
          }}
        >
          Confirmar rejeição
        </Button>
        <Button disabled={isBusy} size="sm" variant="ghost" onClick={() => setRejeitando(false)}>
          Voltar
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Adapter e hooks**

`adapters.ts`, depois de `createBotConfigProposal`:

```ts
  /** Aprovar publica a chave no bot (Canal B, apply_config). */
  async approveBotConfigProposal(tenantId: string, id: string): Promise<BotConfigProposal> {
    const res = await api.patch(
      `/admin/hotel-portal/${tenantId}/bot-config-proposals/${id}/approve`,
      {},
      adminHeaders,
    );
    return res.data?.data ?? res.data;
  },

  async rejectBotConfigProposal(
    tenantId: string,
    id: string,
    dto: { justificativa: string },
  ): Promise<BotConfigProposal> {
    const res = await api.patch(
      `/admin/hotel-portal/${tenantId}/bot-config-proposals/${id}/reject`,
      dto,
      adminHeaders,
    );
    return res.data?.data ?? res.data;
  },
```

`use-hotel-painel.ts`, depois de `useCreateBotConfigProposal`:

```ts
export function useApproveBotConfigProposal(tenantId: string | null, clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hotelPortalService.approveBotConfigProposal(tenantId!, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'bot-config-proposals', clientId] }),
  });
}

export function useRejectBotConfigProposal(tenantId: string | null, clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, justificativa }: { id: string; justificativa: string }) =>
      hotelPortalService.rejectBotConfigProposal(tenantId!, id, { justificativa }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'bot-config-proposals', clientId] }),
  });
}
```

- [ ] **Step 6: Página**

Em `atendimento/bot/page.tsx`:

1. Imports: `toast` de `react-hot-toast`; `useTenantCapabilities`; `useApproveBotConfigProposal`, `useRejectBotConfigProposal`; `ProposalReview`.
2. No corpo:

```tsx
  const { tenantId, hasPermission } = useTenantCapabilities();
  const podeRevisar = hasPermission("hotel-portal.bot-config-proposals.manage");
  const approve = useApproveBotConfigProposal(tenantId, clientId);
  const reject = useRejectBotConfigProposal(tenantId, clientId);
```

3. O `onSubmit` do formulário passa a dar retorno (hoje é silencioso):

```tsx
            onSubmit={(dto) =>
              createProposal.mutate(dto, {
                onSuccess: () => toast.success("Proposta enviada para a Reserve validar."),
                onError: () => toast.error("Não foi possível enviar a proposta."),
              })
            }
```

4. No card de cada proposta, depois da linha de valores:

```tsx
                {proposal.justificativa_cliente && (
                  <p className="text-sm text-muted-foreground">
                    Motivo do pedido: {proposal.justificativa_cliente}
                  </p>
                )}
```

e, no fim do card:

```tsx
                {podeRevisar && proposal.status === "PENDENTE" && (
                  <ProposalReview
                    isBusy={approve.isPending || reject.isPending}
                    onApprove={() =>
                      approve.mutate(proposal.id, {
                        onSuccess: () => toast.success("Proposta aprovada e enviada ao bot."),
                        onError: () => toast.error("Não foi possível aprovar a proposta."),
                      })
                    }
                    onReject={(justificativa) =>
                      reject.mutate(
                        { id: proposal.id, justificativa },
                        {
                          onSuccess: () => toast.success("Proposta rejeitada."),
                          onError: () => toast.error("Não foi possível rejeitar a proposta."),
                        },
                      )
                    }
                  />
                )}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npm run test:run -- "proposal-form|proposal-review"` — Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(bot): justificativa, chaves sugeridas e aprovacao de propostas de configuracao"
```

---

## Task 7: Home, ciclo dos links, conversas por anúncio e aviso de janela

**Files:**
- Modify: `src/presentation/components/organisms/home/manager-home.tsx:136-140,171-175` e `__tests__/manager-home.test.tsx`
- Create: `HP/painel/leads/link-cycle-strip.tsx` + `__tests__/link-cycle-strip.test.tsx`
- Create: `HP/painel/attendance/ad-conversations-table.tsx` + `__tests__/ad-conversations-table.test.tsx`
- Modify: `src/presentation/components/pages/dashboard/hotel/whatsapp-links/page.tsx` (montar o ciclo)
- Modify: `src/presentation/components/pages/dashboard/hotel/campaigns/page.tsx` (montar a tabela)
- Modify: `src/presentation/components/pages/dashboard/hotel-portal/[clientId]/page.tsx` (`WhatsAppTab.handleSend`)

**Interfaces:**
- Consumes: `home.bot`, `leadsOverview.ciclo`, `funil.conversasPorAnuncio` (tipos da Task 1); `useHotelLeadsOverview(clientId, period)` e `useHotelFunnelMetrics(clientId, period)` (já existem); `resolvePreset("current-month")` de `HP/ui/period-picker`.
- Produces: `LinkCycleStrip({ ciclo })` e `AdConversationsTable({ rows })` — organisms puros.

- [ ] **Step 1: Testes que falham**

`link-cycle-strip.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LinkCycleStrip } from "../link-cycle-strip";

describe("LinkCycleStrip", () => {
  it("mostra cliques, conversas e reservas com a taxa de cada passo", () => {
    render(<LinkCycleStrip ciclo={{ cliques: 200, conversas: 50, reservas: 5 }} />);
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("25% dos cliques")).toBeInTheDocument();
    expect(screen.getByText("10% das conversas")).toBeInTheDocument();
  });

  it("sem cliques nao divide por zero", () => {
    render(<LinkCycleStrip ciclo={{ cliques: 0, conversas: 0, reservas: 0 }} />);
    expect(screen.getByText("0% dos cliques")).toBeInTheDocument();
  });
});
```

`ad-conversations-table.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdConversationsTable } from "../ad-conversations-table";

describe("AdConversationsTable", () => {
  it("lista os anuncios com mais conversas", () => {
    render(<AdConversationsTable rows={[{ sourceId: "ad_123", count: 5 }, { sourceId: "ad_456", count: 2 }]} />);
    expect(screen.getByText("ad_123")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("vazio explica o que vai aparecer", () => {
    render(<AdConversationsTable rows={[]} />);
    expect(screen.getByText(/nenhuma conversa veio de anúncio/i)).toBeInTheDocument();
  });
});
```

Em `manager-home.test.tsx`, acrescentar ao objeto que o mock de `useHotelHome` devolve:

```ts
      bot: { receitaConfirmada: 9100, reservas: 6, aRecuperar: { quantidade: 2, valor: 2098 } },
```

e o teste:

```tsx
  it("numeros do bot vem do bloco bot, nao do motor", () => {
    render(<ManagerHome />);
    expect(screen.getByText("R$ 9.100,00")).toBeInTheDocument();
    expect(screen.getByText(/2 cotações em aberto · R\$ 2\.098,00/)).toBeInTheDocument();
  });
```

(se o formatador da home usar NBSP entre "R$" e o número, comparar com regex `/R\$\s?9\.100,00/`.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- "link-cycle-strip|ad-conversations-table|manager-home"` — Expected: FAIL.

- [ ] **Step 3: Home**

Em `manager-home.tsx`:

Linha 138 — o valor de "Gerado pelo bot":

```tsx
                  value={fmtBRL(home.bot?.receitaConfirmada ?? home.motor.receita_bot)}
```

Linhas 171–175 — o card "A recuperar":

```tsx
              <MetricCard
                label="A recuperar"
                value={
                  home.bot
                    ? `${formatNumber(home.bot.aRecuperar.quantidade)} cotações em aberto · ${fmtBRL(home.bot.aRecuperar.valor)}`
                    : `${formatNumber(home.motor.a_recuperar.quantidade)} holds expirados · ${fmtBRL(home.motor.a_recuperar.valor)}`
                }
                hint="hóspedes que não concluíram o pagamento — o bot faz o follow-up"
              />
```

O `??`/ternário mantém a home funcionando contra um backend que ainda não tem o bloco `bot`.

- [ ] **Step 4: Ciclo dos links**

`link-cycle-strip.tsx`:

```tsx
import type { LeadsOverviewResponse } from "@/src/shared/domain/types/@hotel-painel";

function pct(parte: number, todo: number): number {
  return todo > 0 ? Math.round((parte / todo) * 1000) / 10 : 0;
}

/**
 * Fecha o ciclo dos links rastreaveis (contrato v2 §4.6): quem clicou, quem
 * de fato abriu conversa com o bot e quem reservou. Os tres numeros sao do
 * mesmo periodo.
 */
export function LinkCycleStrip({ ciclo }: { ciclo: NonNullable<LeadsOverviewResponse["ciclo"]> }) {
  const passos = [
    { label: "Cliques nos links", valor: ciclo.cliques, taxa: null as string | null },
    { label: "Conversas iniciadas", valor: ciclo.conversas, taxa: `${pct(ciclo.conversas, ciclo.cliques)}% dos cliques` },
    { label: "Reservas confirmadas", valor: ciclo.reservas, taxa: `${pct(ciclo.reservas, ciclo.conversas)}% das conversas` },
  ];

  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {passos.map((passo) => (
        <li key={passo.label} className="rounded-3xl border border-border bg-default-50 p-5">
          <p className="text-sm text-foreground/60">{passo.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{passo.valor}</p>
          {passo.taxa ? <p className="mt-1 text-xs text-foreground/50">{passo.taxa}</p> : null}
        </li>
      ))}
    </ol>
  );
}
```

Em `whatsapp-links/page.tsx`: ler o arquivo para achar o cabeçalho da página e o hook de cliente ativo que ela já usa; logo abaixo do cabeçalho, montar:

```tsx
  const { data: overview } = useHotelLeadsOverview(clientId, resolvePreset("current-month"));
```

```tsx
      {overview?.ciclo ? (
        <PainelSection title="Do clique à reserva (mês atual)">
          <LinkCycleStrip ciclo={overview.ciclo} />
        </PainelSection>
      ) : null}
```

(`clientId` = o id do hotel client que a página já resolve; se ela usar `LayoutScopeRoot` em vez de `PainelPageShell`, usar um `<section className="space-y-4">` com `<h2 className="text-lg font-semibold">` no lugar de `PainelSection`.)

- [ ] **Step 5: Conversas por anúncio**

`ad-conversations-table.tsx`:

```tsx
import { PortalDataTable } from "@/src/presentation/components/organisms/hotel-portal/painel/data-table";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";

type Row = { sourceId: string; count: number };

/**
 * Conversas do WhatsApp que comecaram em um anuncio (contrato v2 §7). A chave
 * e o id do anuncio na Meta: o painel ainda nao guarda o nome do anuncio, por
 * isso a tabela mostra o id.
 */
export function AdConversationsTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <PortalEmptyState
        title="Nenhuma conversa veio de anúncio no período"
        description="Quando alguém clicar em um anúncio de clique para WhatsApp e falar com o bot, a conversa aparece aqui."
      />
    );
  }
  return (
    <PortalDataTable
      columns={[
        { key: "anuncio", header: "Anúncio (ID da Meta)", render: (row: Row) => row.sourceId },
        { key: "conversas", header: "Conversas iniciadas", render: (row: Row) => row.count },
      ]}
      getRowKey={(row: Row) => row.sourceId}
      rows={rows}
    />
  );
}
```

Em `campaigns/page.tsx`: importar `useHotelFunnelMetrics`, `resolvePreset` e `AdConversationsTable`; depois da tabela "Campanhas Detalhadas":

```tsx
  const { data: funil } = useHotelFunnelMetrics(client?.id ?? null, resolvePreset("current-month"));
```

```tsx
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Conversas no WhatsApp por anúncio (mês atual)
        </h2>
        <AdConversationsTable rows={funil?.conversasPorAnuncio ?? []} />
      </section>
```

- [ ] **Step 6: Aviso de janela no envio**

Em `hotel-portal/[clientId]/page.tsx`, no `handleSend` do `WhatsAppTab` (o formulário já manda `{ to_phone, to_name, body }`, que é o corpo que o backend novo espera), trocar o toast de sucesso por:

```tsx
      const result = (await sendMsg(sendForm)) as { ok?: boolean; foraDaJanela?: boolean };
      if (result?.foraDaJanela) {
        toast("Mensagem enviada ao bot, mas o hóspede não escreve há mais de 24h — a Meta pode não entregar.", { icon: "⚠️" });
      } else if (result?.ok === false) {
        toast.error("O bot não confirmou o envio. Tente de novo em instantes.");
      } else {
        toast.success("Mensagem enviada. O bot fica pausado para este contato até você devolver.");
      }
```

(manter o `try/catch` e a limpeza do formulário que já existem; se o arquivo usar outro helper de toast, seguir o padrão local.)

- [ ] **Step 7: Rodar e ver passar**

Run: `npm run test:run -- "link-cycle-strip|ad-conversations-table|manager-home|campaigns|whatsapp-links"` — Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(home): numeros do bot pelos eventos, ciclo dos links e conversas por anuncio"
```

---

## Verificação final

- [ ] `npm run test:run` — só podem falhar as 77 falhas pré-existentes de CMS/access-management/editor (baseline registrada). Qualquer falha fora dessas áreas é deste plano.
- [ ] `npx tsc --noEmit` — nenhum erro em `hotel-portal`, `home`, `hooks/hotel-portal`, `modules/hotel-portal` ou nas páginas tocadas.
- [ ] `Grep -i "chatwoot" src` — nenhuma ocorrência.
- [ ] `Grep '=== "PAUSADO"' src` — nenhuma ocorrência (tudo passa por `isWithHuman`).
- [ ] Com o backend novo no ar: `npm run codegen:diff`, revisar as mudanças de contrato e só então `npm run codegen` (ver `AGENTS.md`).
- [ ] Smoke manual com os dados de teste da RÉSERVE (30 conversas simuladas, contrato §9): inbox com os 10 estados, cabeçalho com ocasião e pré-reserva, "Assumir conversa" e "Retomar conversa", card perdido com motivo, "Estender prazo" num hold aguardando, canais com modo e IA, aprovar uma proposta.

## Fora deste plano (registrado)

- **Nome do anúncio** na tabela de Campanhas: depende de o backend guardar o id do anúncio da Meta (ver "Fora deste plano" do plano do backend).
- **Caixa de resposta no inbox:** não entra. O contrato mantém a decisão 11 (somente leitura); o envio pelo painel existe só na aba administrativa.
- **Tela global de aprovação** (todas as propostas de todos os clientes numa fila): a aprovação entra na própria tela de propostas, para quem tem a permissão. Uma fila cross-tenant fica para quando houver volume.
