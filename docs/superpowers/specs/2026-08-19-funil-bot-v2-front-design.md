# Funil do Bot v2 no Painel (frontend) — Design

Data: 2026-08-19. Aprovado pelo dono no brainstorming desta data.

## Contexto

O backend do funil v2 esta COMPLETO e mesclado no `main` do `backend_reserve` (merge `69a9127`):

- `EFunnelStage` com 9 etapas: `CONTATO_INICIADO`, `PUBLICO_IDENTIFICADO`, `QUALIFICADO`, `ACOMODACAO_APRESENTADA`, `OFERTA_FEITA`, `FECHAMENTO_INICIADO`, `COMPROVANTE_RECEBIDO`, `RESERVA_CONFIRMADA`, `PERDIDO`.
- `EBotContactAudience` (subtipo do publico, atributo do CONTATO): `LEAD`, `HOSPEDE_EM_ESTADIA`, `MENSALISTA`, `MARINA`, `EQUIPE`.
- `PATCH /api/admin/hotel-portal/:tenantId/whatsapp/funnel/:contactId/stage` (controller `AdminWhatsAppFunnelController`), guards admin canonicos, `@RequiresModule('client-portal')`, permissao `hotel-portal.whatsapp-funnel.manage`. Body `FunnelStageChangeDto`: `para_estagio` (enum, obrigatorio), `motivo` (obrigatorio SO quando destino `PERDIDO`, max 255, nao-vazio; opcional nos demais), `tipo_publico` (opcional sempre; quando ausente preserva o subtipo ja gravado).
- `GET /hotel-portal/:clientId/whatsapp/funnel` (board) ja devolve `tipoPublico` por lead; `GET .../funnel/metrics` ja agrega pelos 9 estagios.
- Webhook N8N na mudanca de estagio: pronto no back (dispatch + retry). NAO tocar.
- Conversas read-only com deep link Chatwoot: ja implementado (front e back). NAO tocar.

O frontend ainda usa os 5 estagios antigos (`NOVO`, `QUALIFICADO`, `PAGAMENTO`, `FECHADO`, `FRIO`) em `@hotel-painel.ts` e nos componentes de atendimento, e a tela do funil (`/dashboard/hotel/funil`) e um board somente leitura. Este design cobre APENAS o frontend.

## 1. Tipos e dicionario de estagios

- `src/shared/domain/types/@hotel-painel.ts`:
  - `FunnelStage` passa a unir os 9 valores novos (strings identicas ao enum Prisma).
  - Novo `export type BotContactAudience = 'LEAD' | 'HOSPEDE_EM_ESTADIA' | 'MENSALISTA' | 'MARINA' | 'EQUIPE'`.
  - `FunnelBoardLead` ganha `tipoPublico: BotContactAudience | null`.
  - Novo `FunnelStageChangeDto { para_estagio: FunnelStage; motivo?: string; tipo_publico?: BotContactAudience }`.
- Novo `src/presentation/components/organisms/hotel-portal/funil/funnel-stages.ts`: dicionario central `FUNNEL_STAGES: { stage, label, cor }[]` na ordem canonica (labels pt-BR: "Contato iniciado", "Publico identificado", "Qualificado", "Acomodacao apresentada", "Oferta feita", "Fechamento iniciado", "Comprovante recebido", "Reserva confirmada", "Perdido") + `AUDIENCE_LABELS` (Lead, Hospede em estadia, Mensalista, Marina, Equipe) + helper `stageLabel(stage)`. Board, filtros de atendimento e home importam daqui — nenhuma lista de estagio duplicada.
- `ManagerHome`: remover o cast de `RESERVA_CONFIRMADA` (o tipo novo ja cobre) e usar `stageLabel` onde exibir estagio.

## 2. Adapter + hooks

- `src/modules/hotel-portal/infrastructure/adapters.ts`: `moveFunnelStage(tenantId: string, contactId: string, dto: FunnelStageChangeDto)` → `api.patch('/admin/hotel-portal/${tenantId}/whatsapp/funnel/${contactId}/stage', dto, adminConfig)` (mesmo padrao `x-skip-tenant` das rotas admin por path).
- `src/shared/hooks/hotel-portal/use-funnel-board.ts` (ou arquivo existente do board): novo `useMoveFunnelStage(tenantId: string)` — mutation com update OTIMISTA do cache do board (`['hotel-portal','funnel-board',...]` — conferir a key real do `useHotelFunnelBoard` e reusar), rollback em erro, e `invalidateQueries` do board + metricas do funil + home no `onSettled`. Exportar no barrel.
- Permissao no front: `useTenantCapabilities().hasPermission('hotel-portal.whatsapp-funnel.manage')` decide `canManage`. Sem permissao: kanban read-only (sem drag, sem menu).

## 3. Kanban (`/dashboard/hotel/funil`)

Reescrever a pagina como composicao de um novo organism `FunnelBoard`:

- 9 colunas na ordem canonica, scroll horizontal (`overflow-x-auto`), header com label + contagem; visual flat do painel (cards `rounded-3xl border border-border bg-default-50 shadow-none`).
- Card do lead: nome (fallback numero), badge do subtipo quando `tipoPublico != null`, estado do bot. Clique no card mantem o comportamento atual (se houver: link para a conversa) — nao regredir.
- Mover por DOIS caminhos, mesmo fluxo de codigo (`requestMove(lead, paraEstagio)`):
  - Drag & drop com `@dnd-kit/core` (`DndContext` + `useDraggable`/`useDroppable` por coluna). Sem sortable dentro da coluna (ordem vem do backend por `updated_at`).
  - Menu no card (HeroUI Dropdown) listando os demais estagios.
- Regras do `requestMove`:
  - destino `PERDIDO` → modal com textarea "Motivo da perda" OBRIGATORIO (validacao local: nao-vazio, max 255) antes de mutar;
  - destino `PUBLICO_IDENTIFICADO` → modal com select do subtipo (opcional; botao "Pular" envia sem `tipo_publico`);
  - demais destinos → muta direto (otimista) com toast de sucesso; erro → rollback + toast com a mensagem real do backend (padrao `apiErrorMessage` existente).
- Estados: loading skeleton, erro com retry, board vazio → `PortalEmptyState`.

## 4. Atendimento e home

- `conversation-search.tsx` / `conversation-list.tsx`: trocar a lista hardcoded de 5 estagios pelos 9 via `FUNNEL_STAGES` (filtro e exibicao de label).
- Home (`ManagerHome`): "Fechamentos" continua lendo `distribuicaoFunil` stage `RESERVA_CONFIRMADA` — agora tipado sem cast.

## Erros e restricoes

- Nunca chamar o webhook/N8N do front — o backend dispara na mutacao.
- `motivo` enviado `null`/limpo fora do PERDIDO e aceito pelo back (contrato preservado); o front envia `undefined` quando vazio.
- Strings de UI hardcoded pt-BR com acento (padrao do painel; so sidebar e i18n).
- Multi-tenant: `tenantId` vem de `useTenantCapabilities` (rota admin por path), `clientId` continua para leitura do board.

## Testes (vitest, mock de barrel)

- `funnel-board.test.tsx`: renderiza 9 colunas na ordem; badge de subtipo; menu de mover chama a mutation com `para_estagio`; destino PERDIDO abre modal e bloqueia submit sem motivo; destino PUBLICO_IDENTIFICADO abre modal de subtipo e "Pular" envia sem `tipo_publico`; sem permissao nao ha menu/drag.
- Drag: testar o handler `onDragEnd` diretamente (unidade), nao simular arrasto no jsdom.
- Ajustar testes existentes de atendimento (filtros com 9 estagios), da pagina do funil e da home que citarem estagios antigos.
- Fora de escopo: mudancas de backend, responder conversa pelo painel, reordenacao manual dentro da coluna, tela de edicao avulsa do subtipo (so muda via movimento de card, contrato atual do back).
