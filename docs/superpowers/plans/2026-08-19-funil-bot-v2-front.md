# Funil do Bot v2 no Painel (frontend) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refletir no Painel o funil v2 já pronto no backend: 9 estágios, kanban com movimentação de card (drag + menu), motivo obrigatório no "Perdido" e subtipo de público no "Público identificado".

**Architecture:** Só frontend (`frontend_dashboard_reserve`). Spec: `docs/superpowers/specs/2026-08-19-funil-bot-v2-front-design.md`. Backend PRONTO (main `backend_reserve`): `PATCH /api/admin/hotel-portal/:tenantId/whatsapp/funnel/:contactId/stage` onde **`:contactId` é o `numero_contato`** (body `{ para_estagio, motivo?, tipo_publico? }`); board `GET /hotel-portal/:clientId/whatsapp/funnel` já devolve `tipoPublico` por lead. NÃO tocar no backend.

**Tech Stack:** Next.js 16 App Router, TS estrito, React Query v5, @dnd-kit/core, HeroUI + shadcn, react-hot-toast, vitest + Testing Library.

## Global Constraints

- Estágios (ordem canônica, strings idênticas ao enum do back): `CONTATO_INICIADO`, `PUBLICO_IDENTIFICADO`, `QUALIFICADO`, `ACOMODACAO_APRESENTADA`, `OFERTA_FEITA`, `FECHAMENTO_INICIADO`, `COMPROVANTE_RECEBIDO`, `RESERVA_CONFIRMADA`, `PERDIDO`. Subtipos: `LEAD`, `HOSPEDE_EM_ESTADIA`, `MENSALISTA`, `MARINA`, `EQUIPE`.
- Regras do move (contrato do back): motivo OBRIGATÓRIO (não-vazio, ≤255) só quando destino `PERDIDO`; `tipo_publico` sempre opcional (ausente preserva o já gravado); mover para o MESMO estágio retorna 400 — a UI omite o estágio atual no menu e trata drop na própria coluna como no-op.
- `numero_contato` vai na URL com `encodeURIComponent`.
- Rota admin por path com `adminConfig` (`x-skip-tenant`) — já existe em `src/modules/hotel-portal/infrastructure/adapters.ts` (linha ~90).
- Permissão de escrita: `hasPermission("hotel-portal.whatsapp-funnel.manage")` via `useTenantCapabilities` (`@/src/modules/settings/presentation/hooks/tenant-capabilities-provider`). Sem ela: board read-only (sem drag, sem menu).
- NUNCA chamar webhook/N8N do front — o backend dispara ao gravar o evento.
- Toast: `import toast from "react-hot-toast"`; mensagem de erro real do backend via helper no molde do `apiErrorMessage` de `organisms/motor/grade-cell-modal.tsx`.
- Strings de UI hardcoded pt-BR COM acento; comentários em português sem acento; identificadores de domínio em português.
- Testes: vitest (`npm run test:run -- <padrão>`); testes de página/organism mockam barrels inteiros; SEM QueryClientProvider/router mock. A suíte completa tem ~77 falhas PRÉ-EXISTENTES (CMS/access-management/editor-utils) — ignorar; rodar padrões direcionados.
- Working tree tem mudanças alheias (`.claude/settings.local.json`, docs, `.superpowers/`): NUNCA `git add -A`/`git add .` — sempre paths explícitos.
- Commits: conventional em português sem acento, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Design flat do painel: cards `rounded-3xl border border-border bg-default-50 shadow-none` para superfícies novas; componentes shadcn `Card` existentes do board podem permanecer.

---

## Task 1: Tipos, dicionário de estágios e consumidores existentes

**Files:**
- Modify: `src/shared/domain/types/@hotel-painel.ts`
- Create: `src/presentation/components/organisms/hotel-portal/funil/funnel-stages.ts`
- Create: `src/presentation/components/organisms/hotel-portal/funil/__tests__/funnel-stages.test.ts`
- Modify: `src/presentation/components/organisms/hotel-portal/painel/attendance/conversation-list.tsx` (remover `STAGE_LABEL`, usar `stageLabel`)
- Modify: `src/presentation/components/organisms/hotel-portal/painel/attendance/conversation-search.tsx` (lista de 5 → `FUNNEL_STAGES`)
- Modify: `src/presentation/components/organisms/hotel-portal/painel/attendance/funnel-columns.tsx` (só trocar o import de `STAGE_LABEL` por `stageLabel` — o componente morre na Task 4)
- Modify: `src/presentation/components/organisms/home/manager-home.tsx` (remover cast)

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces (Tasks 2–4 consomem): `FunnelStage` (união dos 9), `BotContactAudience`, `FunnelBoardLead.tipoPublico: BotContactAudience | null`, `FunnelStageChangeDto { para_estagio: FunnelStage; motivo?: string; tipo_publico?: BotContactAudience }`, `FUNNEL_STAGES: { stage: FunnelStage; label: string }[]`, `AUDIENCE_LABELS: Record<BotContactAudience, string>`, `stageLabel(stage: FunnelStage): string`.

- [ ] **Step 1: Escrever o teste que falha**

`__tests__/funnel-stages.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AUDIENCE_LABELS, FUNNEL_STAGES, stageLabel } from "../funnel-stages";

describe("FUNNEL_STAGES", () => {
  it("tem os 9 estagios na ordem canonica", () => {
    expect(FUNNEL_STAGES.map((s) => s.stage)).toEqual([
      "CONTATO_INICIADO", "PUBLICO_IDENTIFICADO", "QUALIFICADO",
      "ACOMODACAO_APRESENTADA", "OFERTA_FEITA", "FECHAMENTO_INICIADO",
      "COMPROVANTE_RECEBIDO", "RESERVA_CONFIRMADA", "PERDIDO",
    ]);
  });

  it("labels pt-BR com acento", () => {
    expect(stageLabel("PUBLICO_IDENTIFICADO")).toBe("Público identificado");
    expect(stageLabel("ACOMODACAO_APRESENTADA")).toBe("Acomodação apresentada");
    expect(AUDIENCE_LABELS.HOSPEDE_EM_ESTADIA).toBe("Hóspede em estadia");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm run test:run -- funnel-stages` — Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Tipos**

Em `@hotel-painel.ts`: substituir o type `FunnelStage` atual (5 valores) por:

```ts
export type FunnelStage =
  | 'CONTATO_INICIADO'
  | 'PUBLICO_IDENTIFICADO'
  | 'QUALIFICADO'
  | 'ACOMODACAO_APRESENTADA'
  | 'OFERTA_FEITA'
  | 'FECHAMENTO_INICIADO'
  | 'COMPROVANTE_RECEBIDO'
  | 'RESERVA_CONFIRMADA'
  | 'PERDIDO';

export type BotContactAudience =
  | 'LEAD'
  | 'HOSPEDE_EM_ESTADIA'
  | 'MENSALISTA'
  | 'MARINA'
  | 'EQUIPE';

export interface FunnelStageChangeDto {
  para_estagio: FunnelStage;
  motivo?: string;
  tipo_publico?: BotContactAudience;
}
```

E em `FunnelBoardLead` acrescentar `tipoPublico: BotContactAudience | null;`.

- [ ] **Step 4: Dicionário**

`funnel-stages.ts`:

```ts
import type { BotContactAudience, FunnelStage } from "@/src/shared/domain/types/@hotel-painel";

export const FUNNEL_STAGES: { stage: FunnelStage; label: string }[] = [
  { stage: "CONTATO_INICIADO", label: "Contato iniciado" },
  { stage: "PUBLICO_IDENTIFICADO", label: "Público identificado" },
  { stage: "QUALIFICADO", label: "Qualificado" },
  { stage: "ACOMODACAO_APRESENTADA", label: "Acomodação apresentada" },
  { stage: "OFERTA_FEITA", label: "Oferta feita" },
  { stage: "FECHAMENTO_INICIADO", label: "Fechamento iniciado" },
  { stage: "COMPROVANTE_RECEBIDO", label: "Comprovante recebido" },
  { stage: "RESERVA_CONFIRMADA", label: "Reserva confirmada" },
  { stage: "PERDIDO", label: "Perdido" },
];

export const AUDIENCE_LABELS: Record<BotContactAudience, string> = {
  LEAD: "Lead",
  HOSPEDE_EM_ESTADIA: "Hóspede em estadia",
  MENSALISTA: "Mensalista",
  MARINA: "Marina",
  EQUIPE: "Equipe",
};

export function stageLabel(stage: FunnelStage): string {
  return FUNNEL_STAGES.find((s) => s.stage === stage)?.label ?? stage;
}
```

- [ ] **Step 5: Migrar consumidores**

1. `conversation-list.tsx`: deletar o `export const STAGE_LABEL` (linhas ~10–16); onde usa `STAGE_LABEL[conv.currentStage]`, importar e usar `stageLabel(conv.currentStage)` de `@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages`.
2. `conversation-search.tsx`: deletar o array local `STAGES` (5 valores) e o import de `STAGE_LABEL`; iterar `FUNNEL_STAGES` no `<select>` (`<option key={s.stage} value={s.stage}>{s.label}</option>`), mantendo a option vazia "Todos".
3. `funnel-columns.tsx`: trocar `STAGE_LABEL[column.stage]` por `stageLabel(column.stage)` (import novo). Nada mais — o arquivo será substituído na Task 4.
4. `manager-home.tsx`: deletar a linha `const RESERVA_CONFIRMADA_STAGE = "RESERVA_CONFIRMADA" as FunnelStage;` e comparar direto com o literal: `(item) => item.stage === "RESERVA_CONFIRMADA"`. Remover o import de `FunnelStage` se ficar órfão.

- [ ] **Step 6: Rodar e ver passar** — `npm run test:run -- funnel-stages manager-home conversation funil` e `npx tsc --noEmit` (sem erros NOVOS; baseline pré-existente à parte) — Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/shared/domain/types/@hotel-painel.ts "src/presentation/components/organisms/hotel-portal/funil" src/presentation/components/organisms/hotel-portal/painel/attendance/conversation-list.tsx src/presentation/components/organisms/hotel-portal/painel/attendance/conversation-search.tsx src/presentation/components/organisms/hotel-portal/painel/attendance/funnel-columns.tsx src/presentation/components/organisms/home/manager-home.tsx
git commit -m "feat(funil): tipos e dicionario dos 9 estagios do funil v2"
```

---

## Task 2: Adapter `moveFunnelStage` + hook `useMoveFunnelStage` (otimista)

**Files:**
- Modify: `src/modules/hotel-portal/infrastructure/adapters.ts`
- Modify: `src/shared/hooks/hotel-portal/use-hotel-painel.ts`
- Modify: `src/shared/hooks/hotel-portal/index.ts` (barrel)
- Test: `src/presentation/components/organisms/hotel-portal/funil/__tests__/funnel-stages.test.ts` (acrescenta describe do `moveLeadInBoard`)

**Interfaces:**
- Consumes: `FunnelStageChangeDto`, `FunnelBoardColumn`, `FunnelStage` (Task 1); `adminConfig` já existente no adapters (linha ~90).
- Produces (Task 4 consome): adapter `moveFunnelStage(tenantId: string, numeroContato: string, dto: FunnelStageChangeDto): Promise<void>`; hook `useMoveFunnelStage(tenantId: string | null, clientId: string | null)` — mutation cujo `mutateAsync` recebe `{ numeroContato: string; dto: FunnelStageChangeDto }`; helper puro `moveLeadInBoard(board, numeroContato, paraEstagio): FunnelBoardColumn[]` exportado de `funnel-stages.ts`.

- [ ] **Step 1: Teste do helper puro (falha)**

Acrescentar em `__tests__/funnel-stages.test.ts`:

```ts
import { moveLeadInBoard } from "../funnel-stages";
import type { FunnelBoardColumn } from "@/src/shared/domain/types/@hotel-painel";

const board: FunnelBoardColumn[] = [
  { stage: "CONTATO_INICIADO", count: 2, leads: [
    { numeroContato: "+5511999", nome: "Ana", acomodacaoInteresse: null, datasInteresse: null, tipoPublico: null },
    { numeroContato: "+5511888", nome: "Bia", acomodacaoInteresse: null, datasInteresse: null, tipoPublico: "LEAD" },
  ]},
  { stage: "QUALIFICADO", count: 0, leads: [] },
];

describe("moveLeadInBoard", () => {
  it("move o lead entre colunas ajustando counts", () => {
    const next = moveLeadInBoard(board, "+5511999", "QUALIFICADO");
    expect(next[0].count).toBe(1);
    expect(next[0].leads.map((l) => l.numeroContato)).toEqual(["+5511888"]);
    expect(next[1].count).toBe(1);
    expect(next[1].leads[0].nome).toBe("Ana");
  });

  it("nao muta o board original e ignora numero desconhecido", () => {
    const next = moveLeadInBoard(board, "nao-existe", "QUALIFICADO");
    expect(next).toEqual(board);
    expect(board[0].count).toBe(2);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm run test:run -- funnel-stages` — Expected: FAIL (`moveLeadInBoard` não exportado).

- [ ] **Step 3: Implementar**

Em `funnel-stages.ts` acrescentar:

```ts
import type { FunnelBoardColumn } from "@/src/shared/domain/types/@hotel-painel";

// atualizacao otimista do kanban: tira o lead da coluna de origem e poe no
// topo da coluna destino; counts acompanham. Puro para ser testavel.
export function moveLeadInBoard(
  board: FunnelBoardColumn[],
  numeroContato: string,
  paraEstagio: FunnelStage,
): FunnelBoardColumn[] {
  const origem = board.find((c) => c.leads.some((l) => l.numeroContato === numeroContato));
  if (!origem || origem.stage === paraEstagio) return board;
  const lead = origem.leads.find((l) => l.numeroContato === numeroContato)!;
  return board.map((c) => {
    if (c.stage === origem.stage) {
      return { ...c, count: Math.max(0, c.count - 1), leads: c.leads.filter((l) => l.numeroContato !== numeroContato) };
    }
    if (c.stage === paraEstagio) {
      return { ...c, count: c.count + 1, leads: [lead, ...c.leads] };
    }
    return c;
  });
}
```

No `adapters.ts` do hotel-portal (seguir o formato de export do método do board no MESMO arquivo — objeto service ou função solta — e o uso de `adminConfig` dos métodos admin vizinhos, linhas ~369):

```ts
async moveFunnelStage(tenantId: string, numeroContato: string, dto: FunnelStageChangeDto): Promise<void> {
  await api.patch(
    `/admin/hotel-portal/${tenantId}/whatsapp/funnel/${encodeURIComponent(numeroContato)}/stage`,
    dto,
    adminConfig as never,
  );
},
```

Em `use-hotel-painel.ts` (imports de `useMutation`/`useQueryClient` conforme os hooks vizinhos do arquivo):

```ts
export function useMoveFunnelStage(tenantId: string | null, clientId: string | null) {
  const queryClient = useQueryClient();
  const boardKey = ['hotel-portal', 'funnel-board', clientId];
  return useMutation({
    mutationFn: ({ numeroContato, dto }: { numeroContato: string; dto: FunnelStageChangeDto }) =>
      hotelPortalService.moveFunnelStage(tenantId!, numeroContato, dto),
    onMutate: async ({ numeroContato, dto }) => {
      await queryClient.cancelQueries({ queryKey: boardKey });
      const previous = queryClient.getQueryData<FunnelBoardColumn[]>(boardKey);
      if (previous) {
        queryClient.setQueryData(boardKey, moveLeadInBoard(previous, numeroContato, dto.para_estagio));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(boardKey, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardKey });
      queryClient.invalidateQueries({ queryKey: ['hotel-portal', 'funnel-metrics', clientId] });
      queryClient.invalidateQueries({ queryKey: ['hotel-portal', 'home', clientId] });
    },
  });
}
```

(Se o adapter for função solta em vez de `hotelPortalService.<método>`, ajustar a chamada ao padrão real do arquivo. O import de `moveLeadInBoard` vem de `@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages` — aceitável: é lógica de apresentação do kanban.) Exportar `useMoveFunnelStage` no barrel `index.ts`.

- [ ] **Step 4: Rodar e ver passar** — `npm run test:run -- funnel-stages` e `npx tsc --noEmit` (sem erros novos) — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/hotel-portal/infrastructure/adapters.ts src/shared/hooks/hotel-portal/use-hotel-painel.ts src/shared/hooks/hotel-portal/index.ts "src/presentation/components/organisms/hotel-portal/funil"
git commit -m "feat(funil): adapter e mutation otimista de mover estagio"
```

---

## Task 3: Organisms `FunnelBoard` + `MoveStageModal`

**Files:**
- Create: `src/presentation/components/organisms/hotel-portal/funil/funnel-board.tsx`
- Create: `src/presentation/components/organisms/hotel-portal/funil/move-stage-modal.tsx`
- Test: `src/presentation/components/organisms/hotel-portal/funil/__tests__/funnel-board.test.tsx`

**Interfaces:**
- Consumes: `FUNNEL_STAGES`/`stageLabel`/`AUDIENCE_LABELS` (Task 1); tipos da Task 1; `@dnd-kit/core` (`DndContext`, `useDraggable`, `useDroppable`, `DragEndEvent`); HeroUI (`Dropdown`, `DropdownTrigger`, `DropdownMenu`, `DropdownItem`, `Modal`, `Button`, `Textarea`, `Select`, `SelectItem` — conferir imports usados por organisms vizinhos); `Card` shadcn.
- Produces (Task 4 consome):

```ts
export function resolveDrop(event: DragEndEvent):
  { numeroContato: string; deEstagio: FunnelStage; paraEstagio: FunnelStage } | null;

export function FunnelBoard({ columns, canManage, onMove }: {
  columns: FunnelBoardColumn[];
  canManage: boolean;
  onMove: (numeroContato: string, dto: FunnelStageChangeDto) => Promise<void>;
}): JSX.Element;
```

- [ ] **Step 1: Escrever os testes que falham**

`__tests__/funnel-board.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FunnelBoard, resolveDrop } from "../funnel-board";
import type { FunnelBoardColumn } from "@/src/shared/domain/types/@hotel-painel";
import type { DragEndEvent } from "@dnd-kit/core";

const columns: FunnelBoardColumn[] = [
  { stage: "CONTATO_INICIADO", count: 1, leads: [
    { numeroContato: "+5511999", nome: "Ana", acomodacaoInteresse: null, datasInteresse: null, tipoPublico: "MENSALISTA" },
  ]},
  ...[
    "PUBLICO_IDENTIFICADO", "QUALIFICADO", "ACOMODACAO_APRESENTADA", "OFERTA_FEITA",
    "FECHAMENTO_INICIADO", "COMPROVANTE_RECEBIDO", "RESERVA_CONFIRMADA", "PERDIDO",
  ].map((stage) => ({ stage: stage as FunnelBoardColumn["stage"], count: 0, leads: [] })),
];

describe("FunnelBoard", () => {
  it("renderiza as 9 colunas na ordem e o badge de subtipo", () => {
    render(<FunnelBoard columns={columns} canManage onMove={vi.fn()} />);
    const headers = screen.getAllByTestId("coluna-header").map((h) => h.textContent);
    expect(headers[0]).toContain("Contato iniciado");
    expect(headers[8]).toContain("Perdido");
    expect(headers).toHaveLength(9);
    expect(screen.getByText("Mensalista")).toBeInTheDocument();
  });

  it("menu do card move direto para estagio comum", async () => {
    const onMove = vi.fn().mockResolvedValue(undefined);
    render(<FunnelBoard columns={columns} canManage onMove={onMove} />);
    fireEvent.click(screen.getByRole("button", { name: /mover ana/i }));
    fireEvent.click(await screen.findByText("Qualificado"));
    await waitFor(() =>
      expect(onMove).toHaveBeenCalledWith("+5511999", { para_estagio: "QUALIFICADO" }),
    );
  });

  it("mover para perdido exige motivo no modal", async () => {
    const onMove = vi.fn().mockResolvedValue(undefined);
    render(<FunnelBoard columns={columns} canManage onMove={onMove} />);
    fireEvent.click(screen.getByRole("button", { name: /mover ana/i }));
    fireEvent.click(await screen.findByText("Perdido"));
    const confirmar = await screen.findByRole("button", { name: /confirmar/i });
    fireEvent.click(confirmar);
    expect(onMove).not.toHaveBeenCalled(); // sem motivo nao envia
    fireEvent.change(screen.getByLabelText(/motivo da perda/i), { target: { value: "sem resposta" } });
    fireEvent.click(confirmar);
    await waitFor(() =>
      expect(onMove).toHaveBeenCalledWith("+5511999", { para_estagio: "PERDIDO", motivo: "sem resposta" }),
    );
  });

  it("publico identificado oferece subtipo com pular", async () => {
    const onMove = vi.fn().mockResolvedValue(undefined);
    render(<FunnelBoard columns={columns} canManage onMove={onMove} />);
    fireEvent.click(screen.getByRole("button", { name: /mover ana/i }));
    fireEvent.click(await screen.findByText("Público identificado"));
    fireEvent.click(await screen.findByRole("button", { name: /pular/i }));
    await waitFor(() =>
      expect(onMove).toHaveBeenCalledWith("+5511999", { para_estagio: "PUBLICO_IDENTIFICADO" }),
    );
  });

  it("sem canManage nao ha menu de mover", () => {
    render(<FunnelBoard columns={columns} canManage={false} onMove={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /mover ana/i })).not.toBeInTheDocument();
  });
});

describe("resolveDrop", () => {
  const evt = (activeId: string | null, overId: string | null) =>
    ({ active: activeId ? { id: activeId } : null, over: overId ? { id: overId } : null }) as unknown as DragEndEvent;

  it("extrai numero e estagios do drop valido", () => {
    expect(resolveDrop(evt("CONTATO_INICIADO|+5511999", "QUALIFICADO"))).toEqual({
      numeroContato: "+5511999", deEstagio: "CONTATO_INICIADO", paraEstagio: "QUALIFICADO",
    });
  });

  it("drop na propria coluna ou fora e null", () => {
    expect(resolveDrop(evt("QUALIFICADO|+5511999", "QUALIFICADO"))).toBeNull();
    expect(resolveDrop(evt("QUALIFICADO|+5511999", null))).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm run test:run -- funnel-board` — Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `MoveStageModal`**

`move-stage-modal.tsx` — HeroUI Modal controlado, molde do `grade-cell-modal.tsx` do motor:

```tsx
export interface PendingMove {
  numeroContato: string;
  nome: string | null;
  paraEstagio: FunnelStage;
}
export function MoveStageModal({ pending, onConfirm, onClose }: {
  pending: PendingMove; // so PERDIDO ou PUBLICO_IDENTIFICADO chegam aqui
  onConfirm: (dto: FunnelStageChangeDto) => Promise<void>;
  onClose: () => void;
})
```

- Destino `PERDIDO`: `Textarea` com `label="Motivo da perda"`, `maxLength={255}`; botão "Confirmar" valida localmente `motivo.trim().length > 0` (senão marca `isInvalid` e NÃO chama `onConfirm`); envia `{ para_estagio: "PERDIDO", motivo: motivo.trim() }`.
- Destino `PUBLICO_IDENTIFICADO`: `Select` com `label="Subtipo do público"` iterando `AUDIENCE_LABELS`; botão "Confirmar" envia `{ para_estagio, tipo_publico }` (só se selecionado); botão secundário "Pular" envia `{ para_estagio }` sem subtipo.
- `onConfirm` é `await`-ado dentro de try/catch: sucesso → `onClose()`; erro → modal permanece aberto (o toast de erro é responsabilidade do `onMove` da página, Task 4). Botões com `isLoading` durante o await.
- Título: `Mover {nome ?? numeroContato} para {stageLabel(paraEstagio)}`.

- [ ] **Step 4: Implementar `FunnelBoard`**

`funnel-board.tsx`:

```tsx
export function resolveDrop(event: DragEndEvent) {
  const activeId = event.active?.id;
  const overId = event.over?.id;
  if (typeof activeId !== "string" || typeof overId !== "string") return null;
  const sep = activeId.indexOf("|");
  if (sep < 0) return null;
  const deEstagio = activeId.slice(0, sep) as FunnelStage;
  const numeroContato = activeId.slice(sep + 1);
  const paraEstagio = overId as FunnelStage;
  if (deEstagio === paraEstagio) return null;
  return { numeroContato, deEstagio, paraEstagio };
}
```

Estrutura do componente:
- Estado `const [pending, setPending] = useState<PendingMove | null>(null)`.
- `requestMove(lead, deEstagio, paraEstagio)`: destino `PERDIDO` ou `PUBLICO_IDENTIFICADO` → `setPending(...)`; demais → `void onMove(lead.numeroContato, { para_estagio: paraEstagio })`.
- Layout: preservar TUDO que `funnel-columns.tsx` fazia — colunas empilhadas no mobile / lado a lado no desktop (`flex flex-col gap-3 md:flex-row md:items-stretch`, com `overflow-x-auto` no wrapper desktop), header da coluna (Card com label via `stageLabel` + count, `data-testid="coluna-header"`), campos do card (nome/número, `acomodacaoInteresse`, `datasInteresse`), rodapé "+N não exibidos", e a linha `fronteira Reserve / hotel` (`data-testid="fronteira-line"`) depois de `QUALIFICADO`.
- Card ganha: badge do subtipo quando `tipoPublico != null` (`AUDIENCE_LABELS[tipoPublico]`, pílula `text-xs rounded-full bg-default-100 px-2 py-0.5`) e, quando `canManage`, o Dropdown "Mover" — trigger `Button isIconOnly size="sm" variant="light"` com `aria-label={`Mover ${lead.nome ?? lead.numeroContato}`}` — listando `FUNNEL_STAGES` MENOS o estágio atual da coluna; seleção chama `requestMove`.
- Drag: envolver tudo em `DndContext onDragEnd={(e) => { const drop = resolveDrop(e); if (drop) { const lead = /* achar em columns */; requestMove(lead, drop.deEstagio, drop.paraEstagio); } }}` — só quando `canManage` (senão renderizar sem DndContext). Cada card `useDraggable({ id: `${column.stage}|${lead.numeroContato}` })`; cada coluna `useDroppable({ id: column.stage })` com highlight `ring-1 ring-primary/40` quando `isOver`.
- Renderizar `<MoveStageModal pending={pending} onConfirm={(dto) => onMove(pending.numeroContato, dto)} onClose={() => setPending(null)} />` quando `pending`.

- [ ] **Step 5: Rodar e ver passar** — `npm run test:run -- funnel-board funnel-stages` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/presentation/components/organisms/hotel-portal/funil"
git commit -m "feat(funil): kanban com drag, menu de mover e modais de motivo e subtipo"
```

---

## Task 4: Página do funil recomposta + aposentadoria do `FunnelColumns`

**Files:**
- Modify: `src/presentation/components/pages/dashboard/hotel/funil/page.tsx`
- Delete: `src/presentation/components/organisms/hotel-portal/painel/attendance/funnel-columns.tsx`
- Test: `src/presentation/components/pages/dashboard/hotel/funil/__tests__/page.test.tsx` (novo)

**Interfaces:**
- Consumes: `FunnelBoard` (Task 3), `useMoveFunnelStage` (Task 2), `useTenantCapabilities`, hooks existentes da página (`useActiveHotelClient`, `useHotelFunnelBoard`, `useHotelFunnelMetrics`), `toast` (react-hot-toast) + helper `apiErrorMessage` (copiar a função local de `organisms/motor/grade-cell-modal.tsx` para dentro da página, ~10 linhas, mesmo comportamento).
- Produces: `/dashboard/hotel/funil` com kanban editável (gated) — comportamento read-only preservado sem permissão.

- [ ] **Step 1: Escrever o teste que falha**

`__tests__/page.test.tsx` (molde dos testes de página do motor — mock dos barrels inteiros):

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HotelFunilPage from "../page";

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "tenant_1", hasPermission: () => true }),
}));

const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/src/shared/hooks/hotel-portal", () => ({
  useActiveHotelClient: () => ({ data: { id: "client_1", hotel_name: "Pousada" }, isLoading: false }),
  useHotelFunnelBoard: () => ({
    data: [
      { stage: "CONTATO_INICIADO", count: 1, leads: [{ numeroContato: "+5511999", nome: "Ana", acomodacaoInteresse: null, datasInteresse: null, tipoPublico: null }] },
      { stage: "PUBLICO_IDENTIFICADO", count: 0, leads: [] },
      { stage: "QUALIFICADO", count: 0, leads: [] },
      { stage: "ACOMODACAO_APRESENTADA", count: 0, leads: [] },
      { stage: "OFERTA_FEITA", count: 0, leads: [] },
      { stage: "FECHAMENTO_INICIADO", count: 0, leads: [] },
      { stage: "COMPROVANTE_RECEBIDO", count: 0, leads: [] },
      { stage: "RESERVA_CONFIRMADA", count: 0, leads: [] },
      { stage: "PERDIDO", count: 0, leads: [] },
    ],
    isLoading: false, isError: false,
  }),
  useHotelFunnelMetrics: () => ({ data: undefined }),
  useMoveFunnelStage: () => mutation,
}));

describe("HotelFunilPage", () => {
  it("renderiza o kanban dos 9 estagios com acao de mover", () => {
    render(<HotelFunilPage />);
    expect(screen.getAllByTestId("coluna-header")).toHaveLength(9);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mover ana/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm run test:run -- hotel/funil` — Expected: FAIL (`useMoveFunnelStage`/`FunnelBoard` ainda não usados; `coluna-header` inexistente).

- [ ] **Step 3: Recompor a página**

Em `page.tsx`:
1. Trocar o import de `FunnelColumns` por `FunnelBoard` (`@/src/presentation/components/organisms/hotel-portal/funil/funnel-board`).
2. Somar `useTenantCapabilities` → `const { tenantId, hasPermission } = useTenantCapabilities();` e `const canManage = hasPermission("hotel-portal.whatsapp-funnel.manage");`.
3. `const moveStage = useMoveFunnelStage(tenantId, clientId);`
4. Handler (com o helper `apiErrorMessage` copiado no topo do arquivo):

```tsx
const handleMove = async (numeroContato: string, dto: FunnelStageChangeDto) => {
  try {
    await moveStage.mutateAsync({ numeroContato, dto });
    toast.success(`Movido para ${stageLabel(dto.para_estagio)}.`);
  } catch (error) {
    toast.error(apiErrorMessage(error, "Não foi possível mover o card."));
    throw error; // modal aberto decide permanecer aberto
  }
};
```

5. Na seção "Quadro do funil": `{board ? <FunnelBoard columns={board} canManage={canManage} onMove={handleMove} /> : <PortalCardSkeleton />}`.
6. Atualizar o comentário do arquivo: o board deixou de ser somente leitura (a UI de disparo foi decidida: drag + menu; conversas seguem read-only via Chatwoot).
7. Deletar `funnel-columns.tsx` DEPOIS de `Grep "FunnelColumns" src` confirmar que só esta página o referenciava (estado esperado; se surgir outro consumidor, migrá-lo para `FunnelBoard` read-only `canManage={false}` e relatar).

- [ ] **Step 4: Rodar e ver passar** — `npm run test:run -- hotel/funil funnel-board funnel-stages manager-home conversation` e `npx tsc --noEmit` (sem erros novos) — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/pages/dashboard/hotel/funil
git rm src/presentation/components/organisms/hotel-portal/painel/attendance/funnel-columns.tsx
git commit -m "feat(funil): pagina do funil com kanban editavel e aposentadoria do board legado"
```

---

## Verificação final (após todas as tasks)

- [ ] `npm run test:run` — sem falhas NOVAS além das ~77 pré-existentes (CMS/access-management/editor-utils).
- [ ] `npx tsc --noEmit` — sem erros novos.
- [ ] Smoke manual (usuário): mover card por drag e por menu, modal do PERDIDO exigindo motivo, subtipo no PUBLICO_IDENTIFICADO com "Pular", badge de subtipo no card, filtro de 9 estágios no atendimento, home mostrando Fechamentos.
- [ ] NÃO rodar revisão de qualidade/spec por task (decisão registrada: revisão única no final de tudo).
