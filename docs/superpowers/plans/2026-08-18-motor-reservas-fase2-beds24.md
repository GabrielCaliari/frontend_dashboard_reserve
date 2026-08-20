# Motor de Reservas Réserve — Fase 2 (Beds24, a ponte OTA) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans para executar task a task. Steps usam checkbox (`- [ ]`).
>
> **PRÉ-REQUISITO DURO:** a Fase 1 (`2026-08-18-motor-reservas-fase1.md`) precisa estar concluída, mesclada e com a migration aplicada no banco. Além disso, as tasks 5–8 dependem de **conta Beds24 trial criada com propriedade de teste** (pendência externa do Gabriel, spec §12) — as tasks 1–4 podem ser feitas antes, contra mocks.

**Goal:** Conectar o motor ao Beds24 (Preferred Partner das OTAs): empurrar disponibilidade/preço em lote com debounce, receber reservas das OTAs por webhook, reconciliar diariamente e expor o estado da sincronização na tela `/dashboard/motor/canais`.

**Architecture:** Novos providers no bounded context `reserve-motor` existente: `Beds24ApiProvider` (auth por refresh token cifrado por tenant + backoff em 429), fila de push persistida com debounce (tabela própria, drenada por cron), webhook inbound `@Public()` com validação de segredo, e job diário de reconciliação. O motor continua sendo a fonte da verdade; o Beds24 é espelho.

**Tech Stack:** o mesmo da Fase 1 (NestJS 11, Prisma 7, `@nestjs/schedule`, Jest). Criptografia do refresh token com o `AesEncryptionProvider` já exportado pelo `ReserveClientPortalModule` (AES-256-GCM, mesmo usado no `TenantBillingConfig`).

**Repositórios:** `BACK` = `backend_reserve` (Tasks 1–8) · `FRONT` = `frontend_dashboard_reserve` (Task 9).

## Global Constraints (spec §3 e §11 — inegociáveis)

- **Rate limit Beds24**: créditos por conta em janela móvel de 5 min. NUNCA uma chamada por dia de calendário — sempre `POST /inventory/rooms/calendar` com ranges por quarto. Fila de push com **debounce de 30s** (várias mudanças viram um push). Retry com **backoff exponencial em 429**. Cache local do calendário (ler 1 ano de uma vez).
- **Idempotência inbound**: por `external_id + updated_at` da reserva da OTA.
- **Webhook perdido não vira overbooking**: a reconciliação diária (`GET /bookings?modifiedSince=<último sync>`) corrige o local, alerta a equipe e marca `channel_sync_state.status = DIVERGENTE` até resolução.
- **Beds24 fora do ar**: venda direta continua (motor é local); pushes ficam na fila e sincronizam ao voltar.
- **`numAvail` empurrado considera holds ativos** (hold criado/expirado é gatilho de push).
- **Mapeamento Booking.com NÃO é via API**: room mapping é manual no painel Beds24, uma vez por propriedade, no onboarding (~uma tarde). O `beds24_room_id_map` (room_type_id → beds24 roomId) é preenchido pelo admin na tela de canais.
- Refresh token guardado **cifrado por tenant**; nunca logado, nunca devolvido em resposta de API.
- Todas as convenções da Fase 1 (tenant_id em tudo, guards, specs colocados, commits PT sem acento, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`).

## Referências oficiais (não descobrir na prática)

- Swagger interativo: `api.beds24.com/v2`
- Wiki: wiki.beds24.com → categoria API_V2 → guia **"PMSs: How to connect to Beds24 via API V2"** (Booking.com e Airbnb têm guias próprios)
- Auth: invite code (Settings > Account > Access) → `GET /authentication/setup` troca por refresh token de longa duração → `GET /authentication/token` gera access tokens curtos
- Webhooks: ativar em Settings > Properties > Access > **Booking webhooks** — chegam com o JSON completo da reserva no corpo

---

### Task 1: Modelo de dados da sincronização (migration + spec)

**Repo:** `BACK` · **Files:** `prisma/schema.prisma`, `prisma/migrations/<seq>_add_channel_sync_tables/migration.sql`, `src/shared/database/migrations.spec.ts`

Dois modelos novos (mesmas convenções da Fase 1 — cuid varchar(25), tenant_id, snake_case, cascade):

- **`MotorChannelSyncState`** (`@@map("motor_channel_sync_states")`): `tenant_id @unique`, `beds24_property_id String?`, `beds24_room_id_map Json?` (room_type_id → beds24 roomId), `refresh_token_encrypted String?` (AES-GCM, nunca exposto), `webhook_secret String?` (valida o inbound), `last_push_at`, `last_webhook_at`, `last_reconcile_at DateTime?`, `status String @default("OK") @db.VarChar(20)` — `OK | DIVERGENTE | ERRO | DESCONECTADO`.
- **`MotorChannelPushQueue`** (`@@map("motor_channel_push_queue")`): `tenant_id`, `room_type_id`, `range_inicio @db.Date`, `range_fim @db.Date`, `status String @default("PENDENTE") @db.VarChar(20)` (`PENDENTE | ENVIADO | ERRO`), `attempts Int @default(0)`, `not_before DateTime?` (backoff), `created_at/updated_at` + índice `[status, not_before]`. A fila coalesce: item novo com mesmo tenant/room_type PENDENTE apenas expande o range (debounce natural).

Spec de migration com asserts das duas tabelas, do unique de tenant no sync state e do índice da fila. Commit: `feat(motor): tabelas de sincronizacao de canais (beds24)`.

### Task 2: `Beds24ApiProvider` — auth, tokens e backoff

**Repo:** `BACK` · **Files:** `infrastructure/providers/beds24-api.provider.ts` (+ spec), `application/dtos/channel.dto.ts`

- `connect(tenantId, inviteCode)`: `GET /authentication/setup` com o invite code → guarda `refresh_token_encrypted` (via `AesEncryptionProvider`) e `status='OK'`. O invite code NÃO é persistido.
- `getAccessToken(tenantId)`: cache em memória por tenant com TTL < expiração; renova via `GET /authentication/token` com o refresh token decifrado.
- `request(tenantId, method, path, body?)`: wrapper `fetch` com `token` header; em **429** lança `Beds24RateLimitError` com `retry_after` sugerido (o chamador agenda `not_before` na fila com backoff exponencial: 1min → 4min → 15min, max 5 tentativas → `status='ERRO'` + alerta).
- Spec: mock de fetch; testa cache de token, cifragem chamada, 429 → erro tipado.
- Commit: `feat(motor): provider beds24 com auth por refresh token cifrado e backoff`.

### Task 3: Push outbound — fila com debounce e lote

**Repo:** `BACK` · **Files:** `application/services/channel-push.service.ts` (+ spec), `infrastructure/providers/channel-push-cron.provider.ts`, hooks nos services da Fase 1

- `ChannelPushService.enqueue(tenantId, roomTypeId, rangeInicio, rangeFim)`: upsert coalescido na fila (expande range de item PENDENTE existente). **Gatilhos (spec §3.3)** — chamar `enqueue` em: `HoldService.create/expireDue/release/confirm`, `ReservationService.createManual/reschedule/cancel`, `BlockService.create/remove`, `DailyInventoryService.materializeTenant/upsertOverride` (range afetado). Fire-and-forget (não pode quebrar o fluxo principal).
- `ChannelPushService.drain()`: cron a cada 30s (`@Cron('*/30 * * * * *')`); pega itens PENDENTE com `not_before <= now`, agrupa por tenant, monta o payload em lote:

```
POST /inventory/rooms/calendar
[ { "roomId": <map[room_type_id]>,
    "calendar": [ { "from": "...", "to": "...", "numAvail": <livres - holds ativos>, "price1": <daily_inventory.preco>, "minStay": <min_stay> } ] } ]
```

  `numAvail` calculado com a MESMA lógica do `AvailabilityService.freeUnitIds` (unidades livres considerando holds ativos). Sucesso → `ENVIADO` + `last_push_at`; 429/erro → `attempts++`, `not_before` com backoff. Tenant sem `beds24_property_id`/room map → itens marcados `ENVIADO` com nota (canal desconectado não acumula fila infinita).
- Spec: coalescência do enqueue, montagem do lote (nunca 1 chamada/dia), backoff em 429.
- Commit: `feat(motor): fila de push ao beds24 com debounce, lote e backoff`.

### Task 4: Webhook inbound (reservas das OTAs)

**Repo:** `BACK` · **Files:** `infrastructure/controllers/beds24-webhook.controller.ts`, `application/services/channel-inbound.service.ts` (+ spec)

- `@Controller('webhooks/beds24')` `@Public()` `@SkipThrottle()` — `POST /:tenantId` com header `x-webhook-secret` comparado (timing-safe, `crypto.timingSafeEqual` — NÃO repetir a dívida do booking-webhook legado) contra `MotorChannelSyncState.webhook_secret`.
- `ChannelInboundService.process(tenantId, payload)`: normaliza a reserva do corpo (JSON completo, sem chamada extra na maioria dos casos) → mapeia canal → `origem OTA_*` → **upsert por `external_id`** com idempotência `external_id + updated_at` → **aloca unit com o MESMO protocolo de lock da Fase 1** (`FOR UPDATE` + freeUnitIds + constraint como rede) → cancelamento da OTA libera datas → `enqueue` push para refletir nos demais canais → `last_webhook_at` → evento no feed do painel (integração com o fluxo Hotel Flow/notificação da equipe, spec §7).
- Reserva OTA sem unit livre (overbooking real vindo de fora): grava com status HOLD + alerta PRIORITÁRIO à equipe + `status='DIVERGENTE'` — resolução humana.
- Adicionar `/api/webhooks/beds24` a `LARGE_BODY_ROUTES` no `main.ts` (5mb).
- Commit: `feat(motor): webhook inbound do beds24 com upsert idempotente e alocacao`.

### Task 5: Reconciliação diária (cinto de segurança) — *requer conta trial*

**Repo:** `BACK` · **Files:** `application/services/channel-reconcile.service.ts` (+ spec), `infrastructure/providers/channel-reconcile-cron.provider.ts`

- Cron na madrugada (3h30): por tenant conectado, `GET /bookings?modifiedSince=<last_reconcile_at>` → compara com `motor_reservations` (`external_id`) → divergência = corrige o local (mesma rotina do inbound), marca `status='DIVERGENTE'`, dispara alerta interno (canal da equipe Réserve — reutilizar `MotorBotEventsProvider` com evento `canal.divergencia`) → `last_reconcile_at`.
- Flag `reconcile_2x` no sync state para o modo reforçado do cutover (roda também às 15h30 quando ligada).
- Commit: `feat(motor): reconciliacao diaria beds24 com alerta de divergencia`.

### Task 6: API admin de canais

**Repo:** `BACK` · **Files:** `infrastructure/controllers/motor-channel.controller.ts`, `application/services/channel-admin.service.ts` (+ spec), wiring spec atualizado

- `GET /api/motor/:tenantId/canais` → estado (status, last_push_at, last_webhook_at, last_reconcile_at, property_id, room map, itens de fila com ERRO) — permissão `motor.read`. NUNCA devolve refresh token/segredo.
- `POST /api/motor/:tenantId/canais/connect` `{ invite_code, beds24_property_id }` → `Beds24ApiProvider.connect` + gera `webhook_secret` (mostrado UMA vez) — permissão `motor.settings.manage`.
- `PUT /api/motor/:tenantId/canais/room-map` `{ room_type_id: beds24RoomId, ... }` — `motor.settings.manage`.
- `POST /api/motor/:tenantId/canais/reconcile` → reconciliação sob demanda — `motor.reservations.manage`.
- Atualizar `motor-wiring.spec.ts` com o controller novo; webhook controller documentado como fora do gate (igual ao MotorBotController).
- Commit: `feat(motor): api admin de canais beds24`.

### Task 7: Validação em conta demo — *manual, requer conta trial*

Checklist executado por humano (Gabriel) com a propriedade de teste, ANTES da real (spec §10 Fase 2):
- [ ] Conta trial criada, propriedade de teste configurada, invite code gerado
- [ ] `connect` funciona; token renova; room map preenchido
- [ ] Mudança de preço no motor aparece no calendário Beds24 em <2 min (debounce + push)
- [ ] Hold criado no motor decrementa `numAvail` no Beds24; expiração devolve
- [ ] Reserva de teste criada no Beds24 chega pelo webhook e aloca unit no mapa
- [ ] Cancelamento na OTA de teste libera as datas no motor
- [ ] Reconciliação manual não acusa divergência em estado são; acusa quando se cria divergência de propósito
- [ ] Suporte/pagamento BR do Beds24 validados (pendência §12)

### Task 8: Eventos `reserva.confirmada_ota` para o bot (WF9)

**Repo:** `BACK` — no `ChannelInboundService`, após upsert de reserva OTA confirmada, `MotorBotEventsProvider.dispatch(tenantId, 'reserva.confirmada_ota', {...})` (o WF9 do N8N já espera esse evento, spec §6). Spec + commit: `feat(motor): evento reserva.confirmada_ota ao bot`.

### Task 9: Frontend — tela `/dashboard/motor/canais`

**Repo:** `FRONT` · **Files:** tipos em `@motor.ts`, métodos no `motorService`, hooks (`useMotorCanais`, `useConnectCanal`, `useSaveRoomMap`, `useReconcileNow`), `src/app/dashboard/motor/canais/page.tsx` + página em presentation (+ teste), sidebar (`motor-canais` no grupo `hotel-motor-menu`, `MODULE_NAV_IDS.motor`, `NAV_READ_PERMISSIONS` com `motor.read`, i18n `motorCanais: "Canais (OTAs)" / "Channels (OTAs)"`).

Tela: card de status com badge (`OK` verde / `DIVERGENTE` warning / `ERRO` danger / `DESCONECTADO` default), timestamps de último push/webhook/reconciliação, form de conexão (invite code + property id, segredo do webhook exibido uma única vez com aviso), editor do room map (room_type → beds24RoomId), botão "Reconciliar agora" e lista de itens de fila com erro. Alertas de divergência em destaque (spec §5). Commit: `feat(motor): tela de canais beds24 com estado da sincronizacao`.

---

## Ordem de execução sugerida

Tópico F (Tasks 1–4, mockável, sem conta) → **gate externo: conta trial** → Tópico G (Tasks 5–6, 8) → Task 7 (validação manual) → Task 9 (front). Testes no fim de cada tópico (regra do Gabriel), suíte completa + build no fim.

## Fora desta fase

White label Beds24, mensageria do Airbnb via API, tarifas derivadas/cupons/widget de site (Fase 4 — spec §10).
