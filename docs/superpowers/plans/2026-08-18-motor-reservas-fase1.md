# Motor de Reservas Réserve — Fase 1 (Núcleo + Admin no Painel) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a Fase 1 do Motor de Reservas (spec: `docs/MOTOR_RESERVAS_RESERVE_MASTER.md`) — modelo de dados, disponibilidade, holds com constraint de exclusão, confirm/release, reservas manuais, blocks, remarcação/cancelamento com política, API do bot — e o admin no Painel Reserve com novo grupo "Calendário" na sidebar e as telas de calendário de ocupação, tarifas, reservas e acomodações.

**Architecture:** Novo bounded context `reserve-motor` no backend NestJS (Prisma 7 + Postgres, guards RBAC existentes, API do bot autenticada pela chave do `BotIntegrationConfig`), com overbooking morto no banco (extensão `btree_gist` + constraints `EXCLUDE` + `SELECT ... FOR UPDATE`). No frontend Next.js, novo módulo gateável `motor` com telas sob `/dashboard/motor/*` seguindo o padrão do Painel Reserve (`PainelPageShell`, React Query, HeroUI).

**Tech Stack:** Backend: NestJS 11, Prisma 7 (`@prisma/adapter-pg`), class-validator, `@nestjs/schedule`, Jest 29. Frontend: Next.js 16 App Router, TypeScript estrito, @tanstack/react-query v5, axios, HeroUI + shadcn, date-fns 4, vitest 4 + Testing Library.

**Repositórios:**
- `BACK` = `C:\Users\gabri\OneDrive\Documents\GitHub\backend_reserve`
- `FRONT` = `C:\Users\gabri\OneDrive\Documents\GitHub\frontend_dashboard_reserve`

Tasks 1–11 rodam no `BACK`; Tasks 12–17 rodam no `FRONT`. Caminhos relativos nas tasks são relativos ao repo indicado.

## Global Constraints

Copiadas da spec (`docs/MOTOR_RESERVAS_RESERVE_MASTER.md`) e das convenções dos repos — **valem para TODAS as tasks**:

- **Checkout exclusivo**: `noites = checkout - checkin`. Uma reserva [05, 07) ocupa as noites 05 e 06.
- **Disponibilidade é por unidade contínua no período** — NUNCA contar "vagas por dia" sem amarrar à unidade (spec §1.1, "erro clássico a evitar").
- **Concorrência resolvida no Postgres, nunca na aplicação/N8N** (spec §1.2): constraints `EXCLUDE USING gist` + `SELECT ... FOR UPDATE`.
- **Invariante de lock**: todo INSERT/UPDATE de `motor_holds` ou `motor_reservations` trava as units candidatas com `SELECT ... FOR UPDATE` dentro da mesma transação e re-checa as DUAS tabelas + blocks. As constraints EXCLUDE não cruzam tabelas (hold×reservation) — o lock é o que serializa os dois fluxos.
- **`capacidade_max = capacidade_base + 1`** (máx. 1 pessoa adicional por quarto): validado na API do motor, não no prompt do bot (spec §2).
- **TTL de hold**: `CARTAO` 30 min · `PIX_LINK` 60 min · `PIX_MANUAL` 120 min (spec §2/§4).
- **Multi-tenant**: toda tabela nova com `tenant_id VARCHAR(25)` + FK `ON DELETE CASCADE`; toda query filtra `tenant_id` explicitamente; índices começam por `tenant_id`.
- **RBAC existente, sem sistema novo** (spec §0.8): permissões `motor.*` na `permission-matrix.ts`. A role "funcionary" da spec **não existe** — equivalente real é `viewer` (leitura). `manager` opera reservas/bloqueios; `owner` configura tarifas/acomodações; `super_admin` bypassa.
- **Sem cupons na v1**; `min_stay` é atributo do `motor_daily_inventory` por data (spec §0.6/§0.7).
- **Dinheiro**: `Decimal @db.Decimal(12, 2)` no Prisma (decisão registrada: o legado usa `Float`, o motor não pode acumular erro de centavos).
- **Migrations**: `prisma migrate`, NUNCA `db push`. Migração com SQL editado à mão via `--create-only`. Toda migração nova ganha `describe()` em `src/shared/database/migrations.spec.ts`.
- **Pool pg `max: 3`** no backend — nada de `Promise.all` com N queries; no máximo 2–3 paralelas.
- **Backend testes**: Jest, specs colocados (`*.spec.ts` ao lado do arquivo), Prisma mockado com objeto literal + `jest.fn()` — **sem banco de teste**. Comando: `npm test -- <padrão>`.
- **Frontend testes**: vitest (`npm run test:run -- <padrão>`), Testing Library; páginas em `src/presentation/components/pages/**` espelhando `src/app/**` (o `page.tsx` do app é one-liner de re-export).
- **Rotas backend**: prefixo global `api` já aplicado em `main.ts` — `@Controller('motor/...')` vira `/api/motor/...`. Sem `RouterModule`.
- **`SecurityPostureGuard` é deny-by-default**: toda rota nova precisa de `@UseGuards(...)` ou `@Public()`, senão 403.
- **Cadeia de guards admin canônica**: `@UseGuards(AdminJwtGuard, TenantGuard, ModuleAccessGuard, PermissionsGuard)` + `@RequiresModule('motor')` na classe; permissões por handler.
- **Idioma**: identificadores de domínio em português `snake_case` (`preco_noite`, `checkin`, `hospede_nome` — igual à spec §1); código/infra em inglês; comentários em português sem acento; commits conventional em português sem acento.
- **Gerenciador**: npm nos dois repos.
- Commits terminam com o trailer: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

## Decisões fechadas neste plano (não rediscutir durante a execução)

1. **Rotas do front**: `/dashboard/motor/*` — a spec diz `/motor/*`, mas toda a arquitetura vive sob `/dashboard/*`, e `/dashboard/hotel/calendario` **já é o calendário editorial de Instagram**. Telas: `/dashboard/motor/calendario`, `/dashboard/motor/tarifas`, `/dashboard/motor/reservas`, `/dashboard/motor/acomodacoes`.
2. **Sidebar**: novo grupo **"Calendário"** (id `hotel-motor-menu`) dentro de `buildHotelNavItems`, com 4 sub-itens. O item existente `hotel-calendario` é renomeado para **"Calendário de conteúdo"** para não haver dois "Calendário".
3. **Módulo gateável novo `motor`** nos dois repos (backend `GATEABLE_MODULES` + frontend `GATEABLE_MODULES`, sem alias — mesmo nome nos dois lados).
4. **API do bot** (`GET /api/motor/availability`, `POST /api/motor/holds`, confirm, release): autenticada pela **mesma chave do `BotIntegrationConfig`** via `BotEventKeyGuard` reutilizado (headers `x-tenant-id` + `x-tenant-key`), `@SkipThrottle()`, fora do gate de módulo (como o `BotEventIngestionController`).
5. **Asaas não entra no backend na Fase 1**: o webhook Asaas já vive no fluxo N8N do bot; é o N8N que chama `confirm`/`release`. Idempotência por `asaas_payment_id`.
6. **Eventos motor→bot** (`hold.expirado`, `pagamento.tardio.exception`): POST fire-and-forget para `n8n_motor_webhook_url` (coluna nova em `bot_integration_configs`), com log de erro. Ledger com retry (padrão `BotStageWebhookDispatch`) é dívida registrada para a Fase 2.
7. **Beds24 (Fase 2) e cutover (Fase 3) ficam fora deste plano** — `channel_sync_state` e a tela `/motor/canais` não são criadas agora.
8. **Best-fit de alocação**: entre as units livres, escolhe a de menor "gap" livre que comporta a estadia (minimiza fragmentação, spec §1.1); empate → menor `identificador`.
9. **Política de cancelamento v1**: uma `motor_cancellation_policies` por tenant (a primeira encontrada). O vínculo por `rate_plan` existe no modelo, mas a resolução v1 é por tenant.
10. **Rate plan "Marina"** (spec §1/§2): `rate_plan` com `nome = 'Marina'` e `percentual_ajuste`; `cliente_marina=true` na chamada aplica o ajuste. O bot nunca calcula desconto.

## Estrutura de arquivos

### Backend (`BACK`)

```
prisma/schema.prisma                                        Task 1 (modelos Motor* + enums + coluna nova em BotIntegrationConfig)
prisma/migrations/20260818000001_add_motor_tables/migration.sql   Task 1
src/shared/database/migrations.spec.ts                      Task 1 (novo describe)
src/shared/auth/constants/gateable-modules.ts (+ .spec.ts)  Task 2 ('motor')
src/shared/auth/rbac/permission-matrix.ts                   Task 2 (motor.*)
src/shared/exceptions/domain-exception.filter.ts            Task 2 (erros do motor)
src/app.module.ts                                           Task 2 (ReserveMotorModule)
src/modules/reserve-motor/
  reserve-motor.module.ts                                   Task 2 (cresce nas tasks seguintes)
  domain/errors/motor.errors.ts                             Task 2
  domain/constants/motor.constants.ts (+ .spec.ts)          Task 2 (TTLs, dow_mask, datas UTC)
  application/dtos/room-type.dto.ts                         Task 3
  application/services/room-type.service.ts (+ .spec.ts)    Task 3
  application/services/unit.service.ts (+ .spec.ts)         Task 3
  infrastructure/controllers/motor-room-type.controller.ts  Task 3
  infrastructure/controllers/motor-unit.controller.ts       Task 3
  application/services/daily-inventory.service.ts (+ .spec) Task 4
  application/dtos/daily-inventory.dto.ts                   Task 4
  infrastructure/controllers/motor-daily-inventory.controller.ts  Task 4
  infrastructure/providers/inventory-materialize-cron.provider.ts Task 4
  application/dtos/tarifa.dto.ts                            Task 5
  application/services/tarifa.service.ts (+ .spec.ts)       Task 5
  infrastructure/controllers/motor-tarifa.controller.ts     Task 5 (seasons, price-rules, policies, rate-plans)
  application/services/availability.service.ts (+ .spec.ts) Task 6
  application/dtos/availability.dto.ts                      Task 6
  infrastructure/controllers/motor-bot.controller.ts        Task 6 (cresce nas Tasks 7–8)
  application/services/hold.service.ts (+ .spec.ts)         Task 7 (confirm na Task 8)
  application/dtos/hold.dto.ts                              Task 7
  infrastructure/providers/hold-expiry-cron.provider.ts     Task 7
  infrastructure/providers/motor-bot-events.provider.ts     Task 7
  application/services/reservation.service.ts (+ .spec.ts)  Task 9
  application/dtos/reservation.dto.ts                       Task 9
  infrastructure/controllers/motor-reservation.controller.ts Task 9
  application/services/block.service.ts (+ .spec.ts)        Task 10
  application/dtos/block.dto.ts                             Task 10
  infrastructure/controllers/motor-block.controller.ts      Task 10
  application/services/calendar.service.ts (+ .spec.ts)     Task 11
  infrastructure/controllers/motor-calendar.controller.ts   Task 11
  infrastructure/controllers/motor-wiring.spec.ts           Task 11 (guards de TODOS os controllers)
```

### Frontend (`FRONT`)

```
src/shared/domain/types/@motor.ts                           Task 12
src/modules/motor/infrastructure/adapters.ts                Task 12 (motorService)
src/shared/hooks/motor/*.ts + index.ts                      Task 12
src/modules/MODULES.md                                      Task 12 (registrar módulo)
src/app/dashboard/motor/acomodacoes/page.tsx                Task 13 (re-export)
src/presentation/components/pages/dashboard/motor/acomodacoes/page.tsx (+ teste)  Task 13
src/app/dashboard/motor/tarifas/page.tsx                    Task 14
src/presentation/components/pages/dashboard/motor/tarifas/page.tsx (+ teste)      Task 14
src/app/dashboard/motor/calendario/page.tsx                 Task 15
src/presentation/components/pages/dashboard/motor/calendario/page.tsx (+ teste)   Task 15
src/presentation/components/organisms/motor/occupancy-grid.tsx (+ teste)          Task 15
src/presentation/components/organisms/motor/cell-action-modal.tsx                 Task 15
src/app/dashboard/motor/reservas/page.tsx                   Task 16
src/presentation/components/pages/dashboard/motor/reservas/page.tsx (+ teste)     Task 16
src/presentation/components/atoms/reserve/hotel-nav-items.tsx                     Task 17
src/modules/settings/domain/navigation.ts (+ navigation.test.ts)                  Task 17
src/modules/settings/domain/tenant-modules.ts               Task 17 ('motor')
src/modules/settings/presentation/components/tenant-modules-card.tsx              Task 17
src/presentation/i18n/messages/pt.json / en.json            Task 17
```

---

### Task 1: Modelo de dados do motor (Prisma + migration + spec)

**Repo:** `BACK`

**Files:**
- Modify: `prisma/schema.prisma` (append dos modelos + relations no `Tenant` e no `BotIntegrationConfig`)
- Create: `prisma/migrations/20260818000001_add_motor_tables/migration.sql`
- Modify: `src/shared/database/migrations.spec.ts` (novo `describe`)

**Interfaces:**
- Consumes: modelos `Tenant` e `BotIntegrationConfig` existentes no schema.
- Produces: modelos Prisma `MotorRoomType`, `MotorUnit`, `MotorCancellationPolicy`, `MotorRatePlan`, `MotorSeason`, `MotorPriceRule`, `MotorDailyInventory`, `MotorReservation`, `MotorReservationEvent`, `MotorHold`, `MotorBlock`, `MotorPaymentException`; enums `EMotorHoldStatus`, `EMotorReservationStatus`, `EMotorReservationOrigem`, `EMotorFormaPagamento`, `EMotorHoldFormaPagamento`, `EMotorBlockMotivo`, `EMotorReservationEventTipo`; coluna `BotIntegrationConfig.n8n_motor_webhook_url`. Todas as tasks seguintes acessam esses modelos via `this.prisma.motorRoomType`, `this.prisma.motorHold`, etc.

- [ ] **Step 1: Escrever o teste da migration (falhando)**

Adicionar ao final de `src/shared/database/migrations.spec.ts`:

```ts
describe('20260818000001_add_motor_tables', () => {
  const sql = readMigration('20260818000001_add_motor_tables');

  it('creates the twelve motor tables', () => {
    for (const table of [
      'motor_room_types',
      'motor_units',
      'motor_cancellation_policies',
      'motor_rate_plans',
      'motor_seasons',
      'motor_price_rules',
      'motor_daily_inventory',
      'motor_reservations',
      'motor_reservation_events',
      'motor_holds',
      'motor_blocks',
      'motor_payment_exceptions',
    ]) {
      expect(sql).toContain(`CREATE TABLE "${table}"`);
    }
  });

  it('enables btree_gist and adds both exclusion constraints (guarda anti-overbooking, spec §1.2)', () => {
    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS btree_gist');
    expect(sql).toContain('"motor_holds_no_overlap"');
    expect(sql).toContain('"motor_reservations_no_overlap"');
    expect(sql).toMatch(/EXCLUDE USING gist[\s\S]*?daterange\(checkin, checkout, '\[\)'\)/);
  });

  it('materializes one calendar row per tenant/room_type/date', () => {
    expect(sql).toContain(
      'CREATE UNIQUE INDEX "motor_daily_inventory_tenant_id_room_type_id_data_key"',
    );
  });

  it('cascades on tenant delete', () => {
    expect(sql).toMatch(/motor_room_types_tenant_id_fkey[\s\S]*?ON DELETE CASCADE/);
    expect(sql).toMatch(/motor_reservations_tenant_id_fkey[\s\S]*?ON DELETE CASCADE/);
  });

  it('adds the motor webhook url to bot_integration_configs', () => {
    expect(sql).toContain('ALTER TABLE "bot_integration_configs" ADD COLUMN "n8n_motor_webhook_url"');
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- migrations.spec`
Expected: FAIL — `ENOENT ... 20260818000001_add_motor_tables\migration.sql`

- [ ] **Step 3: Adicionar os modelos ao `prisma/schema.prisma`**

Append no final do arquivo (bloco inteiro):

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// Motor de Reservas (docs/MOTOR_RESERVAS_RESERVE_MASTER.md §1)
// Hierarquia: room_type (o que o bot vende) -> unit (o que o calendario
// controla) -> rate_plan -> daily_inventory (preco/regras por dia) ->
// reservation/hold/block.
// Dinheiro em Decimal(12,2) — decisao registrada: o legado usa Float, mas o
// motor cobra de verdade e nao pode acumular erro de centavos.
// As constraints EXCLUDE (anti-overbooking) vivem so no SQL da migration —
// Prisma nao as modela.
// ─────────────────────────────────────────────────────────────────────────────

enum EMotorHoldStatus {
  ATIVO
  CONVERTIDO
  EXPIRADO
  CANCELADO
}

enum EMotorReservationStatus {
  HOLD
  CONFIRMADA
  CHECKIN_FEITO
  CONCLUIDA
  CANCELADA
  NOSHOW
}

enum EMotorReservationOrigem {
  BOT_WHATSAPP
  OTA_BOOKING
  OTA_AIRBNB
  OTA_DECOLAR
  SITE_HSYSTEM
  MANUAL
}

enum EMotorFormaPagamento {
  PIX_50
  CARTAO_100
  OTA
}

enum EMotorHoldFormaPagamento {
  PIX_LINK
  CARTAO
  PIX_MANUAL
}

enum EMotorBlockMotivo {
  MANUTENCAO
  USO_PROPRIO
  MENSALISTA
  OUTRO
}

enum EMotorReservationEventTipo {
  CRIADA
  PAGAMENTO_PARCIAL
  CONFIRMADA
  REMARCADA
  CANCELADA
  CHECKIN
  CHECKOUT
  NOSHOW
}

model MotorRoomType {
  id                     String   @id @default(cuid()) @db.VarChar(25)
  tenant_id              String   @db.VarChar(25)
  nome                   String   @db.VarChar(120)
  descricao_curta        String?  @db.VarChar(500)
  capacidade_base        Int
  capacidade_max         Int
  valor_pessoa_adicional Decimal  @default(0) @db.Decimal(12, 2)
  aceita_pets            Boolean  @default(false)
  taxa_pet_dia           Decimal  @default(0) @db.Decimal(12, 2)
  ordem                  Int      @default(0)
  ativo                  Boolean  @default(true)
  created_at             DateTime @default(now())
  updated_at             DateTime @updatedAt

  tenant          Tenant                @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  units           MotorUnit[]
  rate_plans      MotorRatePlan[]
  price_rules     MotorPriceRule[]
  daily_inventory MotorDailyInventory[]
  reservations    MotorReservation[]
  holds           MotorHold[]

  @@index([tenant_id, ativo])
  @@map("motor_room_types")
}

model MotorUnit {
  id            String   @id @default(cuid()) @db.VarChar(25)
  tenant_id     String   @db.VarChar(25)
  room_type_id  String   @db.VarChar(25)
  identificador String   @db.VarChar(80)
  ativo         Boolean  @default(true)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  tenant       Tenant             @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  room_type    MotorRoomType      @relation(fields: [room_type_id], references: [id], onDelete: Cascade)
  reservations MotorReservation[]
  holds        MotorHold[]
  blocks       MotorBlock[]

  @@index([tenant_id, room_type_id])
  @@map("motor_units")
}

model MotorCancellationPolicy {
  id                           String   @id @default(cuid()) @db.VarChar(25)
  tenant_id                    String   @db.VarChar(25)
  nome                         String   @db.VarChar(120)
  dias_antecedencia_remarcacao Int      @default(7)
  reembolso_apos_prazo         Boolean  @default(false)
  taxa_noshow_percent          Decimal  @default(100) @db.Decimal(5, 2)
  created_at                   DateTime @default(now())
  updated_at                   DateTime @updatedAt

  tenant     Tenant          @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  rate_plans MotorRatePlan[]

  @@index([tenant_id])
  @@map("motor_cancellation_policies")
}

model MotorRatePlan {
  id                     String   @id @default(cuid()) @db.VarChar(25)
  tenant_id              String   @db.VarChar(25)
  room_type_id           String   @db.VarChar(25)
  nome                   String   @db.VarChar(120)
  cancellation_policy_id String?  @db.VarChar(25)
  derivado_de            String?  @db.VarChar(25)
  percentual_ajuste      Decimal? @db.Decimal(5, 2)
  ativo                  Boolean  @default(true)
  created_at             DateTime @default(now())
  updated_at             DateTime @updatedAt

  tenant              Tenant                   @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  room_type           MotorRoomType            @relation(fields: [room_type_id], references: [id], onDelete: Cascade)
  cancellation_policy MotorCancellationPolicy? @relation(fields: [cancellation_policy_id], references: [id])
  price_rules         MotorPriceRule[]

  @@index([tenant_id, room_type_id])
  @@map("motor_rate_plans")
}

model MotorSeason {
  id          String   @id @default(cuid()) @db.VarChar(25)
  tenant_id   String   @db.VarChar(25)
  nome        String   @db.VarChar(120)
  data_inicio DateTime @db.Date
  data_fim    DateTime @db.Date
  prioridade  Int      @default(0)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  tenant      Tenant           @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  price_rules MotorPriceRule[]

  @@index([tenant_id, data_inicio, data_fim])
  @@map("motor_seasons")
}

model MotorPriceRule {
  id           String   @id @default(cuid()) @db.VarChar(25)
  tenant_id    String   @db.VarChar(25)
  room_type_id String   @db.VarChar(25)
  rate_plan_id String?  @db.VarChar(25)
  season_id    String?  @db.VarChar(25)
  dow_mask     Int      @default(127)
  preco_noite  Decimal  @db.Decimal(12, 2)
  min_stay     Int      @default(1)
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  tenant    Tenant         @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  room_type MotorRoomType  @relation(fields: [room_type_id], references: [id], onDelete: Cascade)
  rate_plan MotorRatePlan? @relation(fields: [rate_plan_id], references: [id])
  season    MotorSeason?   @relation(fields: [season_id], references: [id], onDelete: Cascade)

  @@index([tenant_id, room_type_id])
  @@map("motor_price_rules")
}

model MotorDailyInventory {
  id               String   @id @default(cuid()) @db.VarChar(25)
  tenant_id        String   @db.VarChar(25)
  room_type_id     String   @db.VarChar(25)
  data             DateTime @db.Date
  preco            Decimal  @db.Decimal(12, 2)
  min_stay         Int      @default(1)
  closed_arrival   Boolean  @default(false)
  closed_departure Boolean  @default(false)
  stop_sell        Boolean  @default(false)
  // Edicao manual no admin grava override=true e o job de materializacao
  // nunca sobrescreve a linha (spec §1, daily_inventory).
  override         Boolean  @default(false)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  tenant    Tenant        @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  room_type MotorRoomType @relation(fields: [room_type_id], references: [id], onDelete: Cascade)

  @@unique([tenant_id, room_type_id, data])
  @@map("motor_daily_inventory")
}

model MotorReservation {
  id               String                  @id @default(cuid()) @db.VarChar(25)
  tenant_id        String                  @db.VarChar(25)
  room_type_id     String                  @db.VarChar(25)
  unit_id          String                  @db.VarChar(25)
  checkin          DateTime                @db.Date
  checkout         DateTime                @db.Date
  status           EMotorReservationStatus @default(CONFIRMADA)
  origem           EMotorReservationOrigem
  external_id      String?                 @db.VarChar(120)
  hospede_nome     String                  @db.VarChar(200)
  hospede_telefone String?                 @db.VarChar(40)
  hospede_email    String?                 @db.VarChar(200)
  hospede_doc      String?                 @db.VarChar(40)
  adultos          Int                     @default(2)
  criancas         Int                     @default(0)
  pets             Int                     @default(0)
  valor_total      Decimal                 @db.Decimal(12, 2)
  valor_pago       Decimal                 @default(0) @db.Decimal(12, 2)
  saldo_checkin    Decimal                 @default(0) @db.Decimal(12, 2)
  forma_pagamento  EMotorFormaPagamento?
  asaas_payment_id String?                 @db.VarChar(120)
  observacoes      String?
  atribuicao       Json?
  created_at       DateTime                @default(now())
  updated_at       DateTime                @updatedAt

  tenant    Tenant                  @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  room_type MotorRoomType           @relation(fields: [room_type_id], references: [id], onDelete: Cascade)
  unit      MotorUnit               @relation(fields: [unit_id], references: [id], onDelete: Cascade)
  events    MotorReservationEvent[]

  @@index([tenant_id, status, checkin])
  @@index([tenant_id, asaas_payment_id])
  @@map("motor_reservations")
}

model MotorReservationEvent {
  id             String                     @id @default(cuid()) @db.VarChar(25)
  reservation_id String                     @db.VarChar(25)
  tipo           EMotorReservationEventTipo
  payload        Json?
  autor          String?                    @db.VarChar(120)
  created_at     DateTime                   @default(now())

  reservation MotorReservation @relation(fields: [reservation_id], references: [id], onDelete: Cascade)

  @@index([reservation_id, created_at])
  @@map("motor_reservation_events")
}

model MotorHold {
  id               String                   @id @default(cuid()) @db.VarChar(25)
  tenant_id        String                   @db.VarChar(25)
  room_type_id     String                   @db.VarChar(25)
  unit_id          String                   @db.VarChar(25)
  checkin          DateTime                 @db.Date
  checkout         DateTime                 @db.Date
  adultos          Int                      @default(2)
  criancas         Int                      @default(0)
  pets             Int                      @default(0)
  contato_whatsapp String                   @db.VarChar(40)
  forma_pagamento  EMotorHoldFormaPagamento
  cliente_marina   Boolean                  @default(false)
  valor_total      Decimal                  @db.Decimal(12, 2)
  valor_antecipado Decimal                  @db.Decimal(12, 2)
  asaas_payment_id String?                  @db.VarChar(120)
  expires_at       DateTime
  status           EMotorHoldStatus         @default(ATIVO)
  created_at       DateTime                 @default(now())
  updated_at       DateTime                 @updatedAt

  tenant    Tenant        @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  room_type MotorRoomType @relation(fields: [room_type_id], references: [id], onDelete: Cascade)
  unit      MotorUnit     @relation(fields: [unit_id], references: [id], onDelete: Cascade)

  @@index([tenant_id, status, expires_at])
  @@map("motor_holds")
}

model MotorBlock {
  id          String            @id @default(cuid()) @db.VarChar(25)
  tenant_id   String            @db.VarChar(25)
  unit_id     String            @db.VarChar(25)
  data_inicio DateTime          @db.Date
  // data_fim null = bloqueio permanente (caso MENSALISTA, spec §1 regra v5).
  data_fim    DateTime?         @db.Date
  motivo      EMotorBlockMotivo
  nota        String?           @db.VarChar(500)
  criado_por  String?           @db.VarChar(120)
  created_at  DateTime          @default(now())

  tenant Tenant    @relation(fields: [tenant_id], references: [id], onDelete: Cascade)
  unit   MotorUnit @relation(fields: [unit_id], references: [id], onDelete: Cascade)

  @@index([tenant_id, unit_id, data_inicio])
  @@map("motor_blocks")
}

model MotorPaymentException {
  id               String   @id @default(cuid()) @db.VarChar(25)
  tenant_id        String   @db.VarChar(25)
  hold_id          String   @db.VarChar(25)
  asaas_payment_id String?  @db.VarChar(120)
  valor_pago       Decimal  @db.Decimal(12, 2)
  // PENDENTE | RESOLVIDA — dinheiro recebido sem reserva (pagamento tardio,
  // spec §2). Resolucao humana: remarcar ou estornar pelo painel.
  status           String   @default("PENDENTE") @db.VarChar(20)
  resolucao        String?  @db.VarChar(500)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  tenant Tenant @relation(fields: [tenant_id], references: [id], onDelete: Cascade)

  @@index([tenant_id, status])
  @@map("motor_payment_exceptions")
}
```

- [ ] **Step 4: Ligar as back-relations e a coluna nova**

No model `Tenant` (em `prisma/schema.prisma`), adicionar ao final da lista de relations:

```prisma
  motor_room_types            MotorRoomType[]
  motor_units                 MotorUnit[]
  motor_cancellation_policies MotorCancellationPolicy[]
  motor_rate_plans            MotorRatePlan[]
  motor_seasons               MotorSeason[]
  motor_price_rules           MotorPriceRule[]
  motor_daily_inventory       MotorDailyInventory[]
  motor_reservations          MotorReservation[]
  motor_holds                 MotorHold[]
  motor_blocks                MotorBlock[]
  motor_payment_exceptions    MotorPaymentException[]
```

No model `BotIntegrationConfig`, adicionar depois de `n8n_stage_webhook_url`:

```prisma
  // Webhook de eventos do motor de reservas (WF9: hold.expirado,
  // pagamento.tardio.exception). Fase 1: dispatch fire-and-forget.
  n8n_motor_webhook_url String? @db.VarChar(500)
```

- [ ] **Step 5: Gerar a migration e editar o SQL à mão**

Run: `npx prisma migrate dev --name add_motor_tables --create-only`
Expected: pasta `prisma/migrations/<timestamp>_add_motor_tables/` criada com o SQL gerado.

Renomear a pasta para `20260818000001_add_motor_tables` (convenção do repo: timestamps sequenciais à mão).

Append no FINAL do `migration.sql` gerado:

```sql
-- ── Editado a mao (nao gerado pelo Prisma) ───────────────────────────────────
-- Anti-overbooking no banco (spec §1.2): duas pessoas fechando a ultima
-- unidade no mesmo segundo sao resolvidas pelo Postgres, nunca pela aplicacao.
-- btree_gist habilita igualdade de unit_id (varchar) dentro do indice GiST.
-- Primeira extensao usada neste repo — decisao registrada no plano do motor.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "motor_holds" ADD CONSTRAINT "motor_holds_no_overlap"
  EXCLUDE USING gist (
    unit_id WITH =,
    daterange(checkin, checkout, '[)') WITH &&
  ) WHERE (status = 'ATIVO');

ALTER TABLE "motor_reservations" ADD CONSTRAINT "motor_reservations_no_overlap"
  EXCLUDE USING gist (
    unit_id WITH =,
    daterange(checkin, checkout, '[)') WITH &&
  ) WHERE (status IN ('HOLD', 'CONFIRMADA', 'CHECKIN_FEITO'));
```

- [ ] **Step 6: Aplicar a migration e regenerar o client**

Run: `npx prisma migrate dev`
Expected: `add_motor_tables` aplicada sem erro; client regenerado em `src/generated/prisma`.

- [ ] **Step 7: Rodar o teste e ver passar**

Run: `npm test -- migrations.spec`
Expected: PASS (todos os describes, incluindo o novo).

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260818000001_add_motor_tables src/shared/database/migrations.spec.ts src/generated/prisma
git commit -m "feat(motor): modelo de dados do motor de reservas com constraints de exclusao

Doze tabelas (room_type -> unit -> rate_plan -> daily_inventory ->
reservation/hold/block), enums proprios, Decimal(12,2) para dinheiro e
btree_gist + EXCLUDE para matar overbooking no banco (spec §1).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Bounded context `reserve-motor` + RBAC (módulo gateável, permissões, erros)

**Repo:** `BACK`

**Files:**
- Modify: `src/shared/auth/constants/gateable-modules.ts` e `src/shared/auth/constants/gateable-modules.spec.ts`
- Modify: `src/shared/auth/rbac/permission-matrix.ts`
- Modify: `src/shared/exceptions/domain-exception.filter.ts`
- Modify: `src/app.module.ts`
- Create: `src/modules/reserve-motor/reserve-motor.module.ts`
- Create: `src/modules/reserve-motor/domain/errors/motor.errors.ts`
- Create: `src/modules/reserve-motor/domain/constants/motor.constants.ts` e `motor.constants.spec.ts`

**Interfaces:**
- Consumes: `GATEABLE_MODULES`, `PERMISSIONS`/`ROLE_GRANTS`, `DomainExceptionFilter`, `ReserveAuthModule`, guards compartilhados.
- Produces (usados pelas Tasks 3–11):
  - Módulo `'motor'` gateável; permissões `'motor.read' | 'motor.reservations.manage' | 'motor.blocks.manage' | 'motor.settings.manage'`.
  - Erros: `MotorDomainError` (base), `MotorValidationError` (→400), `MotorNotFoundError` (→404), `MotorTipoEsgotadoError` (→409), `MotorHoldNotActiveError` (→409).
  - Constantes/helpers: `HOLD_TTL_MINUTES: Record<'PIX_LINK'|'CARTAO'|'PIX_MANUAL', number>`, `MATERIALIZE_HORIZON_DAYS = 365`, `dowBit(date: Date): number`, `utcDate(iso: string): Date`, `addDaysUtc(date: Date, days: number): Date`, `nightsBetween(checkin: Date, checkout: Date): number`, `isoDate(date: Date): string`.
  - `ReserveMotorModule` registrado no `app.module.ts` (controllers/providers são adicionados pelas tasks seguintes).

- [ ] **Step 1: Testes falhando (lista de módulos + helpers de data)**

Em `src/shared/auth/constants/gateable-modules.spec.ts`, atualizar o teste da lista literal (ele trava a lista de propósito — a mudança é consciente):

```ts
it('lists exactly the eleven gateable Reserve bounded contexts', () => {
  expect([...GATEABLE_MODULES]).toEqual([
    'cms',
    'leads',
    'mailer',
    'notifications',
    'stats',
    'reports',
    'coupons',
    'payments',
    'products',
    'client-portal',
    'motor',
  ]);
});
```

(Ajustar também o nome do `it` antigo se mencionar "ten".)

Create `src/modules/reserve-motor/domain/constants/motor.constants.spec.ts`:

```ts
import {
  HOLD_TTL_MINUTES,
  addDaysUtc,
  dowBit,
  isoDate,
  nightsBetween,
  utcDate,
} from './motor.constants';

describe('motor.constants', () => {
  it('usa os TTLs de hold da spec §2 (cartao 30, pix link 60, pix manual 120)', () => {
    expect(HOLD_TTL_MINUTES).toEqual({ PIX_LINK: 60, CARTAO: 30, PIX_MANUAL: 120 });
  });

  it('dowBit segue a mascara da spec (seg=1 ... dom=64)', () => {
    expect(dowBit(utcDate('2026-08-17'))).toBe(1); // segunda
    expect(dowBit(utcDate('2026-08-21'))).toBe(16); // sexta
    expect(dowBit(utcDate('2026-08-23'))).toBe(64); // domingo
  });

  it('nightsBetween usa checkout exclusivo', () => {
    expect(nightsBetween(utcDate('2026-09-05'), utcDate('2026-09-07'))).toBe(2);
  });

  it('addDaysUtc e isoDate fazem ida e volta sem fuso', () => {
    expect(isoDate(addDaysUtc(utcDate('2026-01-31'), 1))).toBe('2026-02-01');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- "gateable-modules|motor.constants"`
Expected: FAIL — lista sem `'motor'`; módulo `motor.constants` inexistente.

- [ ] **Step 3: Implementar**

Em `src/shared/auth/constants/gateable-modules.ts`, adicionar `'motor'` ao final do array `GATEABLE_MODULES`:

```ts
export const GATEABLE_MODULES = [
  'cms',
  'leads',
  'mailer',
  'notifications',
  'stats',
  'reports',
  'coupons',
  'payments',
  'products',
  'client-portal',
  'motor',
] as const;
```

Em `src/shared/auth/rbac/permission-matrix.ts`:

1. Adicionar ao array `PERMISSIONS` (mantendo o agrupamento por módulo do arquivo):

```ts
  // Motor de reservas (spec §5: admin/owner full, manager opera
  // reservas/bloqueios, "funcionary" = viewer le)
  'motor.read',
  'motor.reservations.manage',
  'motor.blocks.manage',
  'motor.settings.manage',
```

2. Nos arrays de grants: `VIEWER` ganha `'motor.read'`; `MANAGER` ganha `'motor.reservations.manage'` e `'motor.blocks.manage'`; `OWNER` ganha `'motor.settings.manage'`.

Create `src/modules/reserve-motor/domain/errors/motor.errors.ts`:

```ts
/**
 * Erros de dominio do motor de reservas. Mapeados para HTTP no
 * DomainExceptionFilter — services lancam, controllers nao traduzem.
 */
export class MotorDomainError extends Error {}

/** Entrada invalida (datas, capacidade, payload) -> 400. */
export class MotorValidationError extends MotorDomainError {}

/** Recurso do motor inexistente no tenant -> 404. */
export class MotorNotFoundError extends MotorDomainError {}

/**
 * Nenhuma unit livre do tipo no periodo (corrida perdida ou esgotado) -> 409.
 * O bot trata com a mensagem de esgotado e SEMPRE refaz GET /availability
 * antes de oferecer alternativa (spec §6).
 */
export class MotorTipoEsgotadoError extends MotorDomainError {
  constructor(message = 'Tipo esgotado no periodo') {
    super(message);
  }
}

/** Operacao exige hold ATIVO (ou convertivel) -> 409. */
export class MotorHoldNotActiveError extends MotorDomainError {}
```

Create `src/modules/reserve-motor/domain/constants/motor.constants.ts`:

```ts
import { EMotorHoldFormaPagamento } from '../../../../generated/prisma/enums';

/**
 * TTL do hold por forma de pagamento (spec §2/§4). PIX_MANUAL existe para o
 * Pix direto com a equipe: TAMBEM cria hold, senao reabre o overbooking que
 * o motor existe para matar.
 */
export const HOLD_TTL_MINUTES: Record<EMotorHoldFormaPagamento, number> = {
  PIX_LINK: 60,
  CARTAO: 30,
  PIX_MANUAL: 120,
};

/** Horizonte de materializacao do daily_inventory (1 ano, como o Beds24 le). */
export const MATERIALIZE_HORIZON_DAYS = 365;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' -> Date em UTC meia-noite (datas de calendario nunca tem fuso). */
export function utcDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/** Noites = checkout - checkin (checkout exclusivo, spec §1). */
export function nightsBetween(checkin: Date, checkout: Date): number {
  return Math.round((checkout.getTime() - checkin.getTime()) / MS_PER_DAY);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Bitmask da spec: seg=1, ter=2, qua=4, qui=8, sex=16, sab=32, dom=64. */
export function dowBit(date: Date): number {
  const day = date.getUTCDay(); // 0=dom ... 6=sab
  return day === 0 ? 64 : 1 << (day - 1);
}
```

Create `src/modules/reserve-motor/reserve-motor.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ReserveAuthModule } from '../reserve-auth/reserve-auth.module';
import { AdminJwtGuard } from '../../shared/auth/guards/admin-jwt.guard';
import { TenantGuard } from '../../shared/auth/guards/tenant.guard';

/**
 * Motor de Reservas (docs/MOTOR_RESERVAS_RESERVE_MASTER.md).
 * Fonte da verdade de disponibilidade e tarifas. Controllers/providers sao
 * adicionados pelas tasks do plano; este modulo nasce vazio de proposito.
 * AdminJwtGuard precisa do ADMIN_TOKEN_VALIDATOR provido pelo ReserveAuthModule.
 */
@Module({
  imports: [ReserveAuthModule],
  controllers: [],
  providers: [AdminJwtGuard, TenantGuard],
})
export class ReserveMotorModule {}
```

Em `src/app.module.ts`: importar e adicionar `ReserveMotorModule` à lista `imports` (junto dos outros `Reserve*Module`; sem `RouterModule`).

Em `src/shared/exceptions/domain-exception.filter.ts`: importar os erros do motor, adicioná-los ao `@Catch(...)` e mapear no corpo:

```ts
import {
  MotorDomainError,
  MotorHoldNotActiveError,
  MotorNotFoundError,
  MotorTipoEsgotadoError,
  MotorValidationError,
} from '../../modules/reserve-motor/domain/errors/motor.errors';
```

No decorator, acrescentar `MotorDomainError` à lista do `@Catch(...)`. No `catch()`, antes do fallback:

```ts
    else if (exception instanceof MotorValidationError) status = HttpStatus.BAD_REQUEST;
    else if (exception instanceof MotorNotFoundError) status = HttpStatus.NOT_FOUND;
    else if (exception instanceof MotorTipoEsgotadoError) status = HttpStatus.CONFLICT;
    else if (exception instanceof MotorHoldNotActiveError) status = HttpStatus.CONFLICT;
    else if (exception instanceof MotorDomainError) status = HttpStatus.BAD_REQUEST;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- "gateable-modules|motor.constants"`
Expected: PASS.

- [ ] **Step 5: Semear as permissões novas e conferir build**

Run: `npx prisma db seed`
Expected: upsert idempotente de `motor.*` em `Permission`/`RolePermission` sem erro.

Run: `npm run build`
Expected: compila sem erro (módulo vazio registrado).

- [ ] **Step 6: Commit**

```bash
git add src/shared/auth src/shared/exceptions/domain-exception.filter.ts src/app.module.ts src/modules/reserve-motor
git commit -m "feat(motor): bounded context reserve-motor com modulo gateavel e permissoes

Modulo 'motor' em GATEABLE_MODULES, permissoes motor.* na matrix
(viewer le, manager opera reservas/bloqueios, owner configura),
erros de dominio mapeados no DomainExceptionFilter e helpers de
data/TTL da spec.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Acomodações — CRUD de room_types e units

**Repo:** `BACK`

**Files:**
- Create: `src/modules/reserve-motor/application/dtos/room-type.dto.ts`
- Create: `src/modules/reserve-motor/application/services/room-type.service.ts` (+ `room-type.service.spec.ts`)
- Create: `src/modules/reserve-motor/application/services/unit.service.ts` (+ `unit.service.spec.ts`)
- Create: `src/modules/reserve-motor/infrastructure/controllers/motor-room-type.controller.ts`
- Create: `src/modules/reserve-motor/infrastructure/controllers/motor-unit.controller.ts`
- Modify: `src/modules/reserve-motor/reserve-motor.module.ts` (registrar controllers/services)

**Interfaces:**
- Consumes: `MotorValidationError`/`MotorNotFoundError` (Task 2), modelos Prisma (Task 1).
- Produces (rotas usadas pelo front na Task 12/13):
  - `GET  /api/motor/:tenantId/room-types` → `MotorRoomType[]` (com `units` incluídas)
  - `POST /api/motor/:tenantId/room-types` body `CreateRoomTypeDto` → 201 `MotorRoomType`
  - `PUT  /api/motor/:tenantId/room-types/:id` body `UpdateRoomTypeDto` → `MotorRoomType`
  - `GET  /api/motor/:tenantId/units?room_type_id=` → `MotorUnit[]`
  - `POST /api/motor/:tenantId/units` body `CreateUnitDto` → 201 `MotorUnit`
  - `PUT  /api/motor/:tenantId/units/:id` body `UpdateUnitDto` → `MotorUnit`
  - Services: `RoomTypeService.{list,create,update}(tenantId, ...)`, `UnitService.{list,create,update}(tenantId, ...)`.

- [ ] **Step 1: Testes falhando dos services**

Create `src/modules/reserve-motor/application/services/room-type.service.spec.ts`:

```ts
import { RoomTypeService } from './room-type.service';
import { MotorNotFoundError, MotorValidationError } from '../../domain/errors/motor.errors';

describe('RoomTypeService', () => {
  let prisma: {
    motorRoomType: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: RoomTypeService;
  const tenantId = 'tenant_1';

  beforeEach(() => {
    prisma = {
      motorRoomType: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'rt_1', ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'rt_1', ...data })),
      },
    };
    service = new RoomTypeService(prisma as any);
  });

  it('cria room_type valido escopado ao tenant', async () => {
    const created = await service.create(tenantId, {
      nome: 'Suite Casal',
      capacidade_base: 2,
      capacidade_max: 3,
      valor_pessoa_adicional: 80,
      aceita_pets: true,
      taxa_pet_dia: 50,
    } as any);
    expect(prisma.motorRoomType.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenant_id: tenantId }) }),
    );
    expect(created.id).toBe('rt_1');
  });

  it('rejeita capacidade_max maior que base+1 (regra: max 1 adicional, spec §2)', async () => {
    await expect(
      service.create(tenantId, { nome: 'X', capacidade_base: 2, capacidade_max: 4 } as any),
    ).rejects.toBeInstanceOf(MotorValidationError);
    expect(prisma.motorRoomType.create).not.toHaveBeenCalled();
  });

  it('update falha com 404 se o room_type nao for do tenant', async () => {
    prisma.motorRoomType.findFirst.mockResolvedValue(null);
    await expect(service.update(tenantId, 'rt_alheio', { nome: 'Y' } as any)).rejects.toBeInstanceOf(
      MotorNotFoundError,
    );
    expect(prisma.motorRoomType.findFirst).toHaveBeenCalledWith({
      where: { id: 'rt_alheio', tenant_id: tenantId },
    });
  });
});
```

Create `src/modules/reserve-motor/application/services/unit.service.spec.ts`:

```ts
import { UnitService } from './unit.service';
import { MotorNotFoundError } from '../../domain/errors/motor.errors';

describe('UnitService', () => {
  let prisma: {
    motorRoomType: { findFirst: jest.Mock };
    motorUnit: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };
  let service: UnitService;
  const tenantId = 'tenant_1';

  beforeEach(() => {
    prisma = {
      motorRoomType: { findFirst: jest.fn().mockResolvedValue({ id: 'rt_1' }) },
      motorUnit: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'u_1', ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'u_1', ...data })),
      },
    };
    service = new UnitService(prisma as any);
  });

  it('cria unit validando que o room_type pertence ao tenant', async () => {
    await service.create(tenantId, { room_type_id: 'rt_1', identificador: 'Casal 01' } as any);
    expect(prisma.motorRoomType.findFirst).toHaveBeenCalledWith({
      where: { id: 'rt_1', tenant_id: tenantId },
    });
    expect(prisma.motorUnit.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenant_id: tenantId }) }),
    );
  });

  it('recusa unit apontando para room_type de outro tenant', async () => {
    prisma.motorRoomType.findFirst.mockResolvedValue(null);
    await expect(
      service.create(tenantId, { room_type_id: 'rt_alheio', identificador: 'X' } as any),
    ).rejects.toBeInstanceOf(MotorNotFoundError);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- "room-type.service|unit.service"`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: Implementar DTOs, services e controllers**

Create `src/modules/reserve-motor/application/dtos/room-type.dto.ts`:

```ts
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateRoomTypeDto {
  @IsString() @Length(1, 120) nome: string;
  @IsOptional() @IsString() @Length(0, 500) descricao_curta?: string;
  @IsInt() @Min(1) capacidade_base: number;
  @IsInt() @Min(1) capacidade_max: number;
  @IsOptional() @IsNumber() @Min(0) valor_pessoa_adicional?: number;
  @IsOptional() @IsBoolean() aceita_pets?: boolean;
  @IsOptional() @IsNumber() @Min(0) taxa_pet_dia?: number;
  @IsOptional() @IsInt() ordem?: number;
}

export class UpdateRoomTypeDto {
  @IsOptional() @IsString() @Length(1, 120) nome?: string;
  @IsOptional() @IsString() @Length(0, 500) descricao_curta?: string;
  @IsOptional() @IsInt() @Min(1) capacidade_base?: number;
  @IsOptional() @IsInt() @Min(1) capacidade_max?: number;
  @IsOptional() @IsNumber() @Min(0) valor_pessoa_adicional?: number;
  @IsOptional() @IsBoolean() aceita_pets?: boolean;
  @IsOptional() @IsNumber() @Min(0) taxa_pet_dia?: number;
  @IsOptional() @IsInt() ordem?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}

export class CreateUnitDto {
  @IsString() room_type_id: string;
  @IsString() @Length(1, 80) identificador: string;
}

export class UpdateUnitDto {
  @IsOptional() @IsString() @Length(1, 80) identificador?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}
```

Create `src/modules/reserve-motor/application/services/room-type.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { MotorNotFoundError, MotorValidationError } from '../../domain/errors/motor.errors';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../dtos/room-type.dto';

@Injectable()
export class RoomTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.motorRoomType.findMany({
      where: { tenant_id: tenantId },
      include: { units: { orderBy: { identificador: 'asc' } } },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });
  }

  async create(tenantId: string, dto: CreateRoomTypeDto) {
    this.assertCapacity(dto.capacidade_base, dto.capacidade_max);
    return this.prisma.motorRoomType.create({
      data: {
        tenant_id: tenantId,
        nome: dto.nome,
        descricao_curta: dto.descricao_curta,
        capacidade_base: dto.capacidade_base,
        capacidade_max: dto.capacidade_max,
        valor_pessoa_adicional: dto.valor_pessoa_adicional ?? 0,
        aceita_pets: dto.aceita_pets ?? false,
        taxa_pet_dia: dto.taxa_pet_dia ?? 0,
        ordem: dto.ordem ?? 0,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateRoomTypeDto) {
    const exists = await this.prisma.motorRoomType.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!exists) throw new MotorNotFoundError('room_type nao encontrado');
    const base = dto.capacidade_base ?? exists.capacidade_base;
    const max = dto.capacidade_max ?? exists.capacidade_max;
    this.assertCapacity(base, max);
    return this.prisma.motorRoomType.update({ where: { id }, data: { ...dto } });
  }

  // capacidade_max = base + no maximo 1 adicional: o limite vive AQUI, nao no
  // prompt do bot (spec §2, alocacao inteligente).
  private assertCapacity(base: number, max: number): void {
    if (max < base || max > base + 1) {
      throw new MotorValidationError('capacidade_max deve ser base ou base+1 (max 1 adicional)');
    }
  }
}
```

Create `src/modules/reserve-motor/application/services/unit.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { MotorNotFoundError } from '../../domain/errors/motor.errors';
import { CreateUnitDto, UpdateUnitDto } from '../dtos/room-type.dto';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, roomTypeId?: string) {
    return this.prisma.motorUnit.findMany({
      where: { tenant_id: tenantId, ...(roomTypeId ? { room_type_id: roomTypeId } : {}) },
      orderBy: { identificador: 'asc' },
    });
  }

  async create(tenantId: string, dto: CreateUnitDto) {
    const roomType = await this.prisma.motorRoomType.findFirst({
      where: { id: dto.room_type_id, tenant_id: tenantId },
    });
    if (!roomType) throw new MotorNotFoundError('room_type nao encontrado');
    return this.prisma.motorUnit.create({
      data: {
        tenant_id: tenantId,
        room_type_id: dto.room_type_id,
        identificador: dto.identificador,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateUnitDto) {
    const exists = await this.prisma.motorUnit.findFirst({ where: { id, tenant_id: tenantId } });
    if (!exists) throw new MotorNotFoundError('unit nao encontrada');
    return this.prisma.motorUnit.update({ where: { id }, data: { ...dto } });
  }
}
```

Create `src/modules/reserve-motor/infrastructure/controllers/motor-room-type.controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../../../shared/auth/guards/admin-jwt.guard';
import { TenantGuard } from '../../../../shared/auth/guards/tenant.guard';
import { ModuleAccessGuard } from '../../../../shared/auth/guards/module-access.guard';
import { PermissionsGuard } from '../../../../shared/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../../shared/auth/decorators/require-permissions.decorator';
import { RequiresModule } from '../../../../shared/auth/decorators/requires-module.decorator';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../../application/dtos/room-type.dto';
import { RoomTypeService } from '../../application/services/room-type.service';

@Controller('motor/:tenantId/room-types')
// O tenant vem do proprio caminho (`:tenantId`): o TenantGuard o resolve,
// valida que o admin pertence a ele e publica request.tenant_id —
// pre-requisito do ModuleAccessGuard.
@UseGuards(AdminJwtGuard, TenantGuard, ModuleAccessGuard, PermissionsGuard)
@RequiresModule('motor')
export class MotorRoomTypeController {
  constructor(private readonly roomTypeService: RoomTypeService) {}

  @Get()
  @RequirePermissions('motor.read')
  async list(@Param('tenantId') tenantId: string) {
    return this.roomTypeService.list(tenantId);
  }

  @Post()
  @RequirePermissions('motor.settings.manage')
  async create(@Param('tenantId') tenantId: string, @Body() dto: CreateRoomTypeDto) {
    return this.roomTypeService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions('motor.settings.manage')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.roomTypeService.update(tenantId, id, dto);
  }
}
```

Create `src/modules/reserve-motor/infrastructure/controllers/motor-unit.controller.ts` (mesma cadeia de guards):

```ts
import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../../../shared/auth/guards/admin-jwt.guard';
import { TenantGuard } from '../../../../shared/auth/guards/tenant.guard';
import { ModuleAccessGuard } from '../../../../shared/auth/guards/module-access.guard';
import { PermissionsGuard } from '../../../../shared/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../../shared/auth/decorators/require-permissions.decorator';
import { RequiresModule } from '../../../../shared/auth/decorators/requires-module.decorator';
import { CreateUnitDto, UpdateUnitDto } from '../../application/dtos/room-type.dto';
import { UnitService } from '../../application/services/unit.service';

@Controller('motor/:tenantId/units')
@UseGuards(AdminJwtGuard, TenantGuard, ModuleAccessGuard, PermissionsGuard)
@RequiresModule('motor')
export class MotorUnitController {
  constructor(private readonly unitService: UnitService) {}

  @Get()
  @RequirePermissions('motor.read')
  async list(@Param('tenantId') tenantId: string, @Query('room_type_id') roomTypeId?: string) {
    return this.unitService.list(tenantId, roomTypeId);
  }

  @Post()
  @RequirePermissions('motor.settings.manage')
  async create(@Param('tenantId') tenantId: string, @Body() dto: CreateUnitDto) {
    return this.unitService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermissions('motor.settings.manage')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.unitService.update(tenantId, id, dto);
  }
}
```

Em `reserve-motor.module.ts`: adicionar `MotorRoomTypeController, MotorUnitController` a `controllers` e `RoomTypeService, UnitService, ModuleAccessGuard, PermissionsGuard` a `providers` (imports dos guards compartilhados iguais aos dos controllers).

**Nota sobre os imports dos decorators/guards:** confirme os caminhos reais olhando um controller existente (`src/modules/reserve-client-portal/infrastructure/controllers/admin-milestone.controller.ts`) e copie os imports de lá — os nomes de arquivo dos decorators (`require-permissions.decorator`, `requires-module.decorator`) devem bater com o que esse controller usa.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- "room-type.service|unit.service"`
Expected: PASS.

Run: `npm run build`
Expected: compila sem erro.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-motor
git commit -m "feat(motor): crud de acomodacoes (room_types e units)

Validacao capacidade_max = base+1 no service (o limite de 1 adicional
vive na API, nao no prompt do bot) e escopo por tenant em toda query.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Calendário materializado (daily_inventory) — job + override manual

**Repo:** `BACK`

**Files:**
- Create: `src/modules/reserve-motor/application/services/daily-inventory.service.ts` (+ `daily-inventory.service.spec.ts`)
- Create: `src/modules/reserve-motor/application/dtos/daily-inventory.dto.ts`
- Create: `src/modules/reserve-motor/infrastructure/controllers/motor-daily-inventory.controller.ts`
- Create: `src/modules/reserve-motor/infrastructure/providers/inventory-materialize-cron.provider.ts`
- Modify: `src/modules/reserve-motor/reserve-motor.module.ts`

**Interfaces:**
- Consumes: `dowBit`, `addDaysUtc`, `utcDate`, `MATERIALIZE_HORIZON_DAYS` (Task 2); modelos `MotorPriceRule`, `MotorSeason`, `MotorDailyInventory` (Task 1).
- Produces:
  - `DailyInventoryService.materializeTenant(tenantId: string, days?: number): Promise<number>` — usado pela Task 5 (após mutação de tarifa) e pelo cron.
  - `DailyInventoryService.pickRule(rules, seasonsById, date)` — regra vencedora por data (temporada com maior prioridade > regra base; filtro por `dow_mask`).
  - `DailyInventoryService.upsertOverride(tenantId, dto)` — edição pontual com `override=true`.
  - `DailyInventoryService.listRange(tenantId, roomTypeId, from, to)` — leitura para a tela de tarifas.
  - Rotas: `GET /api/motor/:tenantId/daily-inventory?room_type_id=&from=&to=`; `PUT /api/motor/:tenantId/daily-inventory` body `UpsertDailyInventoryDto`; `POST /api/motor/:tenantId/daily-inventory/materialize` → `{ rows: number }`.

- [ ] **Step 1: Teste falhando**

Create `src/modules/reserve-motor/application/services/daily-inventory.service.spec.ts`:

```ts
import { DailyInventoryService } from './daily-inventory.service';
import { utcDate } from '../../domain/constants/motor.constants';

const tenantId = 'tenant_1';

function rule(partial: any) {
  return {
    id: 'pr_1',
    tenant_id: tenantId,
    room_type_id: 'rt_1',
    rate_plan_id: null,
    season_id: null,
    dow_mask: 127,
    preco_noite: 300,
    min_stay: 1,
    ...partial,
  };
}

describe('DailyInventoryService.pickRule', () => {
  const service = new DailyInventoryService({} as any);

  it('regra de temporada vence a base na data coberta, por prioridade', () => {
    const seasons = new Map([
      ['s_alta', { id: 's_alta', data_inicio: utcDate('2026-07-01'), data_fim: utcDate('2026-07-31'), prioridade: 1 }],
      ['s_ferias', { id: 's_ferias', data_inicio: utcDate('2026-07-10'), data_fim: utcDate('2026-07-20'), prioridade: 5 }],
    ]);
    const rules = [
      rule({ id: 'base', preco_noite: 300 }),
      rule({ id: 'alta', season_id: 's_alta', preco_noite: 400 }),
      rule({ id: 'ferias', season_id: 's_ferias', preco_noite: 500 }),
    ];
    expect(service.pickRule(rules as any, seasons as any, utcDate('2026-07-15'))!.id).toBe('ferias');
    expect(service.pickRule(rules as any, seasons as any, utcDate('2026-07-05'))!.id).toBe('alta');
    expect(service.pickRule(rules as any, seasons as any, utcDate('2026-08-05'))!.id).toBe('base');
  });

  it('respeita o dow_mask (fim de semana cheio, meio de semana com desconto)', () => {
    const rules = [
      rule({ id: 'fds', dow_mask: 32 + 64 + 16, preco_noite: 400 }), // sex+sab+dom
      rule({ id: 'semana', dow_mask: 1 + 2 + 4 + 8, preco_noite: 320 }),
    ];
    expect(service.pickRule(rules as any, new Map() as any, utcDate('2026-08-21'))!.id).toBe('fds'); // sexta
    expect(service.pickRule(rules as any, new Map() as any, utcDate('2026-08-18'))!.id).toBe('semana'); // terca
  });

  it('sem regra aplicavel retorna null (data fica sem inventario = nao vendavel)', () => {
    expect(service.pickRule([rule({ dow_mask: 1 })] as any, new Map() as any, utcDate('2026-08-23'))).toBeNull();
  });
});

describe('DailyInventoryService.materializeTenant', () => {
  it('apaga so linhas nao-override e recria com skipDuplicates (preserva overrides)', async () => {
    const prisma = {
      motorPriceRule: { findMany: jest.fn().mockResolvedValue([rule({})]) },
      motorSeason: { findMany: jest.fn().mockResolvedValue([]) },
      motorDailyInventory: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
    };
    const service = new DailyInventoryService(prisma as any);
    const rows = await service.materializeTenant(tenantId, 3);
    expect(rows).toBe(3);
    expect(prisma.motorDailyInventory.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenant_id: tenantId, override: false }),
      }),
    );
    expect(prisma.motorDailyInventory.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- daily-inventory.service`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

Create `src/modules/reserve-motor/application/dtos/daily-inventory.dto.ts`:

```ts
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertDailyInventoryDto {
  @IsString() room_type_id: string;
  @IsDateString() data: string;
  @IsOptional() @IsNumber() @Min(0) preco?: number;
  @IsOptional() @IsInt() @Min(1) min_stay?: number;
  @IsOptional() @IsBoolean() closed_arrival?: boolean;
  @IsOptional() @IsBoolean() closed_departure?: boolean;
  @IsOptional() @IsBoolean() stop_sell?: boolean;
}
```

Create `src/modules/reserve-motor/application/services/daily-inventory.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import {
  MATERIALIZE_HORIZON_DAYS,
  addDaysUtc,
  dowBit,
  utcDate,
} from '../../domain/constants/motor.constants';
import { MotorNotFoundError, MotorValidationError } from '../../domain/errors/motor.errors';
import { UpsertDailyInventoryDto } from '../dtos/daily-inventory.dto';

interface SeasonLite {
  id: string;
  data_inicio: Date;
  data_fim: Date;
  prioridade: number;
}

interface PriceRuleLite {
  id: string;
  room_type_id: string;
  season_id: string | null;
  dow_mask: number;
  preco_noite: unknown; // Decimal
  min_stay: number;
}

@Injectable()
export class DailyInventoryService {
  private readonly logger = new Logger(DailyInventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Materializa o calendario diario a partir das price_rules (spec §1:
   * "materializada por job; edicao manual grava override e nao e
   * sobrescrita"). Estrategia: apaga as linhas NAO-override do horizonte e
   * recria via createMany com skipDuplicates — linhas override sobrevivem ao
   * delete e barram o insert da mesma data pelo unique.
   */
  async materializeTenant(tenantId: string, days = MATERIALIZE_HORIZON_DAYS): Promise<number> {
    const [rules, seasons] = await Promise.all([
      this.prisma.motorPriceRule.findMany({ where: { tenant_id: tenantId } }),
      this.prisma.motorSeason.findMany({ where: { tenant_id: tenantId } }),
    ]);
    const seasonsById = new Map<string, SeasonLite>(seasons.map((s: any) => [s.id, s]));
    const start = utcDate(new Date().toISOString().slice(0, 10));
    const end = addDaysUtc(start, days);

    const byType = new Map<string, PriceRuleLite[]>();
    for (const r of rules as any as PriceRuleLite[]) {
      const list = byType.get(r.room_type_id) ?? [];
      list.push(r);
      byType.set(r.room_type_id, list);
    }

    const rows: any[] = [];
    for (const [roomTypeId, typeRules] of byType) {
      for (let date = start; date < end; date = addDaysUtc(date, 1)) {
        const winner = this.pickRule(typeRules, seasonsById, date);
        if (!winner) continue;
        rows.push({
          tenant_id: tenantId,
          room_type_id: roomTypeId,
          data: date,
          preco: winner.preco_noite,
          min_stay: winner.min_stay,
        });
      }
    }

    await this.prisma.$transaction([
      this.prisma.motorDailyInventory.deleteMany({
        where: { tenant_id: tenantId, override: false, data: { gte: start, lt: end } },
      }),
      this.prisma.motorDailyInventory.createMany({ data: rows, skipDuplicates: true }),
    ]);
    this.logger.log(`Materializado calendario do tenant ${tenantId}: ${rows.length} linhas`);
    return rows.length;
  }

  /** Regra vencedora para a data: temporada de maior prioridade > regra base. */
  pickRule(
    rules: PriceRuleLite[],
    seasonsById: Map<string, SeasonLite>,
    date: Date,
  ): PriceRuleLite | null {
    const bit = dowBit(date);
    const candidates = rules.filter((r) => (r.dow_mask & bit) !== 0);
    const inSeason = candidates
      .filter((r) => {
        if (!r.season_id) return false;
        const season = seasonsById.get(r.season_id);
        return season && date >= season.data_inicio && date <= season.data_fim;
      })
      .sort(
        (a, b) =>
          seasonsById.get(b.season_id!)!.prioridade - seasonsById.get(a.season_id!)!.prioridade,
      );
    if (inSeason.length) return inSeason[0];
    return candidates.find((r) => !r.season_id) ?? null;
  }

  /** Edicao pontual do admin: grava override=true, o job nunca sobrescreve. */
  async upsertOverride(tenantId: string, dto: UpsertDailyInventoryDto) {
    const data = utcDate(dto.data);
    const existing = await this.prisma.motorDailyInventory.findFirst({
      where: { tenant_id: tenantId, room_type_id: dto.room_type_id, data },
    });
    if (!existing && dto.preco == null) {
      throw new MotorValidationError('data sem inventario: informe preco para criar o override');
    }
    const fields = {
      ...(dto.preco != null ? { preco: dto.preco } : {}),
      ...(dto.min_stay != null ? { min_stay: dto.min_stay } : {}),
      ...(dto.closed_arrival != null ? { closed_arrival: dto.closed_arrival } : {}),
      ...(dto.closed_departure != null ? { closed_departure: dto.closed_departure } : {}),
      ...(dto.stop_sell != null ? { stop_sell: dto.stop_sell } : {}),
      override: true,
    };
    if (existing) {
      return this.prisma.motorDailyInventory.update({ where: { id: existing.id }, data: fields });
    }
    return this.prisma.motorDailyInventory.create({
      data: { tenant_id: tenantId, room_type_id: dto.room_type_id, data, min_stay: 1, ...fields },
    });
  }

  async listRange(tenantId: string, roomTypeId: string, from: string, to: string) {
    if (!roomTypeId || !from || !to) {
      throw new MotorValidationError('room_type_id, from e to sao obrigatorios');
    }
    const roomType = await this.prisma.motorRoomType.findFirst({
      where: { id: roomTypeId, tenant_id: tenantId },
    });
    if (!roomType) throw new MotorNotFoundError('room_type nao encontrado');
    return this.prisma.motorDailyInventory.findMany({
      where: { tenant_id: tenantId, room_type_id: roomTypeId, data: { gte: utcDate(from), lte: utcDate(to) } },
      orderBy: { data: 'asc' },
    });
  }
}
```

Create `src/modules/reserve-motor/infrastructure/controllers/motor-daily-inventory.controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../../../shared/auth/guards/admin-jwt.guard';
import { TenantGuard } from '../../../../shared/auth/guards/tenant.guard';
import { ModuleAccessGuard } from '../../../../shared/auth/guards/module-access.guard';
import { PermissionsGuard } from '../../../../shared/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../../shared/auth/decorators/require-permissions.decorator';
import { RequiresModule } from '../../../../shared/auth/decorators/requires-module.decorator';
import { UpsertDailyInventoryDto } from '../../application/dtos/daily-inventory.dto';
import { DailyInventoryService } from '../../application/services/daily-inventory.service';

@Controller('motor/:tenantId/daily-inventory')
@UseGuards(AdminJwtGuard, TenantGuard, ModuleAccessGuard, PermissionsGuard)
@RequiresModule('motor')
export class MotorDailyInventoryController {
  constructor(private readonly dailyInventoryService: DailyInventoryService) {}

  @Get()
  @RequirePermissions('motor.read')
  async list(
    @Param('tenantId') tenantId: string,
    @Query('room_type_id') roomTypeId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.dailyInventoryService.listRange(tenantId, roomTypeId, from, to);
  }

  @Put()
  @RequirePermissions('motor.settings.manage')
  async upsert(@Param('tenantId') tenantId: string, @Body() dto: UpsertDailyInventoryDto) {
    return this.dailyInventoryService.upsertOverride(tenantId, dto);
  }

  @Post('materialize')
  @RequirePermissions('motor.settings.manage')
  async materialize(@Param('tenantId') tenantId: string) {
    const rows = await this.dailyInventoryService.materializeTenant(tenantId);
    return { rows };
  }
}
```

Create `src/modules/reserve-motor/infrastructure/providers/inventory-materialize-cron.provider.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { DailyInventoryService } from '../../application/services/daily-inventory.service';

/**
 * Rola o horizonte de 365 dias do daily_inventory todo dia de madrugada.
 * Sequencial por tenant de proposito (pool pg max: 3).
 */
@Injectable()
export class InventoryMaterializeCronProvider {
  private readonly logger = new Logger(InventoryMaterializeCronProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dailyInventoryService: DailyInventoryService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async materializeAll(): Promise<void> {
    const tenants = await this.prisma.motorPriceRule.findMany({
      select: { tenant_id: true },
      distinct: ['tenant_id'],
    });
    for (const { tenant_id: tenantId } of tenants) {
      try {
        await this.dailyInventoryService.materializeTenant(tenantId);
      } catch (error) {
        this.logger.error(`Falha materializando calendario do tenant ${tenantId}`, error as any);
      }
    }
  }
}
```

Em `reserve-motor.module.ts`: adicionar `MotorDailyInventoryController` a `controllers`; `DailyInventoryService, InventoryMaterializeCronProvider` a `providers`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- daily-inventory.service`
Expected: PASS.

Run: `npm run build`
Expected: compila.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-motor
git commit -m "feat(motor): daily_inventory materializado por job com override manual

pickRule resolve temporada por prioridade + dow_mask; materializacao
preserva linhas override (delete parcial + createMany skipDuplicates);
cron diario 4h rola o horizonte de 365 dias por tenant.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Tarifas — CRUD de temporadas, regras de preço, políticas e rate plans

**Repo:** `BACK`

**Files:**
- Create: `src/modules/reserve-motor/application/dtos/tarifa.dto.ts`
- Create: `src/modules/reserve-motor/application/services/tarifa.service.ts` (+ `tarifa.service.spec.ts`)
- Create: `src/modules/reserve-motor/infrastructure/controllers/motor-tarifa.controller.ts`
- Modify: `src/modules/reserve-motor/reserve-motor.module.ts`

**Interfaces:**
- Consumes: `DailyInventoryService.materializeTenant` (Task 4), erros (Task 2).
- Produces (todas sob `@Controller('motor/:tenantId/tarifas')`):
  - `GET  /api/motor/:tenantId/tarifas` → `{ seasons, price_rules, policies, rate_plans }` (uma chamada para a tela toda)
  - `POST /api/motor/:tenantId/tarifas/seasons` / `PUT .../seasons/:id` / `DELETE .../seasons/:id`
  - `POST /api/motor/:tenantId/tarifas/price-rules` / `PUT .../price-rules/:id` / `DELETE .../price-rules/:id`
  - `POST /api/motor/:tenantId/tarifas/policies` / `PUT .../policies/:id`
  - `POST /api/motor/:tenantId/tarifas/rate-plans` / `PUT .../rate-plans/:id`
  - `TarifaService` com métodos `overview`, `createSeason`, `updateSeason`, `deleteSeason`, `createPriceRule`, `updatePriceRule`, `deletePriceRule`, `createPolicy`, `updatePolicy`, `createRatePlan`, `updateRatePlan` — mutações de season/price-rule chamam `materializeTenant` ao final.

- [ ] **Step 1: Teste falhando**

Create `src/modules/reserve-motor/application/services/tarifa.service.spec.ts`:

```ts
import { TarifaService } from './tarifa.service';
import { MotorNotFoundError, MotorValidationError } from '../../domain/errors/motor.errors';

const tenantId = 'tenant_1';

function buildPrisma() {
  const model = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue({ id: 'x', tenant_id: tenantId }),
    create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'novo', ...data })),
    update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'x', ...data })),
    delete: jest.fn().mockResolvedValue({ id: 'x' }),
  });
  return {
    motorSeason: model(),
    motorPriceRule: model(),
    motorCancellationPolicy: model(),
    motorRatePlan: model(),
    motorRoomType: { findFirst: jest.fn().mockResolvedValue({ id: 'rt_1' }) },
  };
}

describe('TarifaService', () => {
  let prisma: ReturnType<typeof buildPrisma>;
  let materializer: { materializeTenant: jest.Mock };
  let service: TarifaService;

  beforeEach(() => {
    prisma = buildPrisma();
    materializer = { materializeTenant: jest.fn().mockResolvedValue(10) };
    service = new TarifaService(prisma as any, materializer as any);
  });

  it('cria season e re-materializa o calendario do tenant', async () => {
    await service.createSeason(tenantId, {
      nome: 'Alta',
      data_inicio: '2026-07-01',
      data_fim: '2026-07-31',
      prioridade: 1,
    } as any);
    expect(prisma.motorSeason.create).toHaveBeenCalled();
    expect(materializer.materializeTenant).toHaveBeenCalledWith(tenantId);
  });

  it('rejeita season com data_fim antes de data_inicio', async () => {
    await expect(
      service.createSeason(tenantId, {
        nome: 'X',
        data_inicio: '2026-07-31',
        data_fim: '2026-07-01',
      } as any),
    ).rejects.toBeInstanceOf(MotorValidationError);
    expect(materializer.materializeTenant).not.toHaveBeenCalled();
  });

  it('cria price_rule validando room_type do tenant e re-materializa', async () => {
    await service.createPriceRule(tenantId, {
      room_type_id: 'rt_1',
      dow_mask: 96,
      preco_noite: 400,
      min_stay: 2,
    } as any);
    expect(prisma.motorRoomType.findFirst).toHaveBeenCalledWith({
      where: { id: 'rt_1', tenant_id: tenantId },
    });
    expect(materializer.materializeTenant).toHaveBeenCalledWith(tenantId);
  });

  it('delete de price_rule de outro tenant falha com 404', async () => {
    prisma.motorPriceRule.findFirst.mockResolvedValue(null);
    await expect(service.deletePriceRule(tenantId, 'pr_alheia')).rejects.toBeInstanceOf(
      MotorNotFoundError,
    );
    expect(prisma.motorPriceRule.delete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- tarifa.service`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

Create `src/modules/reserve-motor/application/dtos/tarifa.dto.ts`:

```ts
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateSeasonDto {
  @IsString() @Length(1, 120) nome: string;
  @IsDateString() data_inicio: string;
  @IsDateString() data_fim: string;
  @IsOptional() @IsInt() prioridade?: number;
}

export class UpdateSeasonDto {
  @IsOptional() @IsString() @Length(1, 120) nome?: string;
  @IsOptional() @IsDateString() data_inicio?: string;
  @IsOptional() @IsDateString() data_fim?: string;
  @IsOptional() @IsInt() prioridade?: number;
}

export class CreatePriceRuleDto {
  @IsString() room_type_id: string;
  @IsOptional() @IsString() rate_plan_id?: string;
  @IsOptional() @IsString() season_id?: string;
  // bitmask seg=1 ... dom=64; 127 = todos os dias
  @IsInt() @Min(1) @Max(127) dow_mask: number;
  @IsNumber() @Min(0) preco_noite: number;
  @IsOptional() @IsInt() @Min(1) min_stay?: number;
}

export class UpdatePriceRuleDto {
  @IsOptional() @IsString() season_id?: string;
  @IsOptional() @IsInt() @Min(1) @Max(127) dow_mask?: number;
  @IsOptional() @IsNumber() @Min(0) preco_noite?: number;
  @IsOptional() @IsInt() @Min(1) min_stay?: number;
}

export class CreatePolicyDto {
  @IsString() @Length(1, 120) nome: string;
  @IsInt() @Min(0) dias_antecedencia_remarcacao: number;
  @IsBoolean() reembolso_apos_prazo: boolean;
  @IsNumber() @Min(0) @Max(100) taxa_noshow_percent: number;
}

export class UpdatePolicyDto {
  @IsOptional() @IsString() @Length(1, 120) nome?: string;
  @IsOptional() @IsInt() @Min(0) dias_antecedencia_remarcacao?: number;
  @IsOptional() @IsBoolean() reembolso_apos_prazo?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(100) taxa_noshow_percent?: number;
}

export class CreateRatePlanDto {
  @IsString() room_type_id: string;
  @IsString() @Length(1, 120) nome: string;
  @IsOptional() @IsString() cancellation_policy_id?: string;
  @IsOptional() @IsString() derivado_de?: string;
  @IsOptional() @IsNumber() @Min(-100) @Max(100) percentual_ajuste?: number;
}

export class UpdateRatePlanDto {
  @IsOptional() @IsString() @Length(1, 120) nome?: string;
  @IsOptional() @IsString() cancellation_policy_id?: string;
  @IsOptional() @IsNumber() @Min(-100) @Max(100) percentual_ajuste?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}
```

Create `src/modules/reserve-motor/application/services/tarifa.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { utcDate } from '../../domain/constants/motor.constants';
import { MotorNotFoundError, MotorValidationError } from '../../domain/errors/motor.errors';
import {
  CreatePolicyDto,
  CreatePriceRuleDto,
  CreateRatePlanDto,
  CreateSeasonDto,
  UpdatePolicyDto,
  UpdatePriceRuleDto,
  UpdateRatePlanDto,
  UpdateSeasonDto,
} from '../dtos/tarifa.dto';
import { DailyInventoryService } from './daily-inventory.service';

@Injectable()
export class TarifaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dailyInventoryService: DailyInventoryService,
  ) {}

  async overview(tenantId: string) {
    // Sequencial de proposito: pool pg max 3, e a tela carrega uma vez.
    const seasons = await this.prisma.motorSeason.findMany({
      where: { tenant_id: tenantId },
      orderBy: { data_inicio: 'asc' },
    });
    const price_rules = await this.prisma.motorPriceRule.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'asc' },
    });
    const policies = await this.prisma.motorCancellationPolicy.findMany({
      where: { tenant_id: tenantId },
    });
    const rate_plans = await this.prisma.motorRatePlan.findMany({
      where: { tenant_id: tenantId },
    });
    return { seasons, price_rules, policies, rate_plans };
  }

  // ── Seasons ────────────────────────────────────────────────────────────────
  async createSeason(tenantId: string, dto: CreateSeasonDto) {
    this.assertRange(dto.data_inicio, dto.data_fim);
    const season = await this.prisma.motorSeason.create({
      data: {
        tenant_id: tenantId,
        nome: dto.nome,
        data_inicio: utcDate(dto.data_inicio),
        data_fim: utcDate(dto.data_fim),
        prioridade: dto.prioridade ?? 0,
      },
    });
    await this.dailyInventoryService.materializeTenant(tenantId);
    return season;
  }

  async updateSeason(tenantId: string, id: string, dto: UpdateSeasonDto) {
    const exists = await this.mustOwn(this.prisma.motorSeason, tenantId, id, 'season');
    const inicio = dto.data_inicio ?? exists.data_inicio.toISOString().slice(0, 10);
    const fim = dto.data_fim ?? exists.data_fim.toISOString().slice(0, 10);
    this.assertRange(inicio, fim);
    const season = await this.prisma.motorSeason.update({
      where: { id },
      data: {
        ...(dto.nome != null ? { nome: dto.nome } : {}),
        ...(dto.prioridade != null ? { prioridade: dto.prioridade } : {}),
        data_inicio: utcDate(inicio),
        data_fim: utcDate(fim),
      },
    });
    await this.dailyInventoryService.materializeTenant(tenantId);
    return season;
  }

  async deleteSeason(tenantId: string, id: string) {
    await this.mustOwn(this.prisma.motorSeason, tenantId, id, 'season');
    // onDelete: Cascade nas price_rules da season
    const season = await this.prisma.motorSeason.delete({ where: { id } });
    await this.dailyInventoryService.materializeTenant(tenantId);
    return season;
  }

  // ── Price rules ────────────────────────────────────────────────────────────
  async createPriceRule(tenantId: string, dto: CreatePriceRuleDto) {
    const roomType = await this.prisma.motorRoomType.findFirst({
      where: { id: dto.room_type_id, tenant_id: tenantId },
    });
    if (!roomType) throw new MotorNotFoundError('room_type nao encontrado');
    if (dto.season_id) await this.mustOwn(this.prisma.motorSeason, tenantId, dto.season_id, 'season');
    const rule = await this.prisma.motorPriceRule.create({
      data: {
        tenant_id: tenantId,
        room_type_id: dto.room_type_id,
        rate_plan_id: dto.rate_plan_id ?? null,
        season_id: dto.season_id ?? null,
        dow_mask: dto.dow_mask,
        preco_noite: dto.preco_noite,
        min_stay: dto.min_stay ?? 1,
      },
    });
    await this.dailyInventoryService.materializeTenant(tenantId);
    return rule;
  }

  async updatePriceRule(tenantId: string, id: string, dto: UpdatePriceRuleDto) {
    await this.mustOwn(this.prisma.motorPriceRule, tenantId, id, 'price_rule');
    const rule = await this.prisma.motorPriceRule.update({ where: { id }, data: { ...dto } });
    await this.dailyInventoryService.materializeTenant(tenantId);
    return rule;
  }

  async deletePriceRule(tenantId: string, id: string) {
    await this.mustOwn(this.prisma.motorPriceRule, tenantId, id, 'price_rule');
    const rule = await this.prisma.motorPriceRule.delete({ where: { id } });
    await this.dailyInventoryService.materializeTenant(tenantId);
    return rule;
  }

  // ── Cancellation policies ──────────────────────────────────────────────────
  async createPolicy(tenantId: string, dto: CreatePolicyDto) {
    return this.prisma.motorCancellationPolicy.create({ data: { tenant_id: tenantId, ...dto } });
  }

  async updatePolicy(tenantId: string, id: string, dto: UpdatePolicyDto) {
    await this.mustOwn(this.prisma.motorCancellationPolicy, tenantId, id, 'policy');
    return this.prisma.motorCancellationPolicy.update({ where: { id }, data: { ...dto } });
  }

  // ── Rate plans (v1: padrao + "Marina" derivado, spec regra v5) ────────────
  async createRatePlan(tenantId: string, dto: CreateRatePlanDto) {
    const roomType = await this.prisma.motorRoomType.findFirst({
      where: { id: dto.room_type_id, tenant_id: tenantId },
    });
    if (!roomType) throw new MotorNotFoundError('room_type nao encontrado');
    return this.prisma.motorRatePlan.create({
      data: {
        tenant_id: tenantId,
        room_type_id: dto.room_type_id,
        nome: dto.nome,
        cancellation_policy_id: dto.cancellation_policy_id ?? null,
        derivado_de: dto.derivado_de ?? null,
        percentual_ajuste: dto.percentual_ajuste ?? null,
      },
    });
  }

  async updateRatePlan(tenantId: string, id: string, dto: UpdateRatePlanDto) {
    await this.mustOwn(this.prisma.motorRatePlan, tenantId, id, 'rate_plan');
    return this.prisma.motorRatePlan.update({ where: { id }, data: { ...dto } });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private assertRange(inicio: string, fim: string): void {
    if (utcDate(fim) < utcDate(inicio)) {
      throw new MotorValidationError('data_fim deve ser igual ou posterior a data_inicio');
    }
  }

  private async mustOwn(model: any, tenantId: string, id: string, label: string) {
    const found = await model.findFirst({ where: { id, tenant_id: tenantId } });
    if (!found) throw new MotorNotFoundError(`${label} nao encontrado`);
    return found;
  }
}
```

Create `src/modules/reserve-motor/infrastructure/controllers/motor-tarifa.controller.ts`:

```ts
import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../../../shared/auth/guards/admin-jwt.guard';
import { TenantGuard } from '../../../../shared/auth/guards/tenant.guard';
import { ModuleAccessGuard } from '../../../../shared/auth/guards/module-access.guard';
import { PermissionsGuard } from '../../../../shared/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../../shared/auth/decorators/require-permissions.decorator';
import { RequiresModule } from '../../../../shared/auth/decorators/requires-module.decorator';
import {
  CreatePolicyDto,
  CreatePriceRuleDto,
  CreateRatePlanDto,
  CreateSeasonDto,
  UpdatePolicyDto,
  UpdatePriceRuleDto,
  UpdateRatePlanDto,
  UpdateSeasonDto,
} from '../../application/dtos/tarifa.dto';
import { TarifaService } from '../../application/services/tarifa.service';

@Controller('motor/:tenantId/tarifas')
@UseGuards(AdminJwtGuard, TenantGuard, ModuleAccessGuard, PermissionsGuard)
@RequiresModule('motor')
export class MotorTarifaController {
  constructor(private readonly tarifaService: TarifaService) {}

  @Get()
  @RequirePermissions('motor.read')
  async overview(@Param('tenantId') tenantId: string) {
    return this.tarifaService.overview(tenantId);
  }

  @Post('seasons')
  @RequirePermissions('motor.settings.manage')
  async createSeason(@Param('tenantId') tenantId: string, @Body() dto: CreateSeasonDto) {
    return this.tarifaService.createSeason(tenantId, dto);
  }

  @Put('seasons/:id')
  @RequirePermissions('motor.settings.manage')
  async updateSeason(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSeasonDto,
  ) {
    return this.tarifaService.updateSeason(tenantId, id, dto);
  }

  @Delete('seasons/:id')
  @RequirePermissions('motor.settings.manage')
  async deleteSeason(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.tarifaService.deleteSeason(tenantId, id);
  }

  @Post('price-rules')
  @RequirePermissions('motor.settings.manage')
  async createPriceRule(@Param('tenantId') tenantId: string, @Body() dto: CreatePriceRuleDto) {
    return this.tarifaService.createPriceRule(tenantId, dto);
  }

  @Put('price-rules/:id')
  @RequirePermissions('motor.settings.manage')
  async updatePriceRule(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePriceRuleDto,
  ) {
    return this.tarifaService.updatePriceRule(tenantId, id, dto);
  }

  @Delete('price-rules/:id')
  @RequirePermissions('motor.settings.manage')
  async deletePriceRule(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.tarifaService.deletePriceRule(tenantId, id);
  }

  @Post('policies')
  @RequirePermissions('motor.settings.manage')
  async createPolicy(@Param('tenantId') tenantId: string, @Body() dto: CreatePolicyDto) {
    return this.tarifaService.createPolicy(tenantId, dto);
  }

  @Put('policies/:id')
  @RequirePermissions('motor.settings.manage')
  async updatePolicy(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.tarifaService.updatePolicy(tenantId, id, dto);
  }

  @Post('rate-plans')
  @RequirePermissions('motor.settings.manage')
  async createRatePlan(@Param('tenantId') tenantId: string, @Body() dto: CreateRatePlanDto) {
    return this.tarifaService.createRatePlan(tenantId, dto);
  }

  @Put('rate-plans/:id')
  @RequirePermissions('motor.settings.manage')
  async updateRatePlan(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRatePlanDto,
  ) {
    return this.tarifaService.updateRatePlan(tenantId, id, dto);
  }
}
```

Em `reserve-motor.module.ts`: adicionar `MotorTarifaController` a `controllers` e `TarifaService` a `providers`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- tarifa.service`
Expected: PASS.

Run: `npm run build`
Expected: compila.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-motor
git commit -m "feat(motor): crud de tarifas (temporadas, regras de preco, politicas, rate plans)

Toda mutacao de season/price_rule re-materializa o daily_inventory do
tenant na hora — o calendario e a fonte que o bot e o admin leem.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Disponibilidade — o coração do motor (spec §1.1) + API do bot

**Repo:** `BACK`

**Files:**
- Create: `src/modules/reserve-motor/application/services/availability.service.ts` (+ `availability.service.spec.ts`)
- Create: `src/modules/reserve-motor/application/dtos/availability.dto.ts`
- Create: `src/modules/reserve-motor/infrastructure/controllers/motor-bot.controller.ts`
- Modify: `src/modules/reserve-motor/reserve-motor.module.ts`

**Interfaces:**
- Consumes: helpers de data (Task 2), modelos (Task 1), `BotEventKeyGuard` + `BotKeyProvider` de `src/modules/reserve-client-portal/infrastructure/{guards,providers}` (reutilizados — decisão 4).
- Produces:
  - `AvailabilityService.search(tenantId, query: AvailabilityQueryDto): Promise<RoomTypeAvailability[]>` onde `RoomTypeAvailability = { room_type_id, nome, descricao_curta, capacidade_base, capacidade_max, unidades_livres, min_stay, preco_por_noite: { data, preco }[], valor_total, valor_pessoa_adicional_total, valor_pets_total }`.
  - `AvailabilityService.quote(tenantId, params: QuoteParams): Promise<Quote>` com `QuoteParams = { room_type_id, checkin: Date, checkout: Date, adultos, criancas, pets, cliente_marina }` e `Quote = { valor_total: number, min_stay: number }` — lança `MotorValidationError`/`MotorTipoEsgotadoError` se invendável. **Usado pelas Tasks 7 (hold) e 9 (reserva manual).**
  - `AvailabilityService.freeUnitIds(db, tenantId, roomTypeId, checkin, checkout, excludeReservationId?): Promise<string[]>` — units do tipo sem reservation ativa, hold ATIVO não vencido ou block sobrepostos ao período. Aceita `db = prisma | tx` para rodar dentro de transação. **Usado pelas Tasks 7, 8, 9.**
  - Rotas: `GET /api/motor/availability` (bot, `BotEventKeyGuard`) e `GET /api/motor/:tenantId/availability` (admin — adicionada no `MotorReservationController` da Task 9; nesta task só a do bot).

- [ ] **Step 1: Teste falhando**

Create `src/modules/reserve-motor/application/services/availability.service.spec.ts`:

```ts
import { AvailabilityService } from './availability.service';
import { utcDate } from '../../domain/constants/motor.constants';

const tenantId = 'tenant_1';

function buildPrisma(overrides: Partial<Record<string, any>> = {}) {
  return {
    motorRoomType: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'rt_1',
          nome: 'Suite Casal',
          descricao_curta: null,
          capacidade_base: 2,
          capacidade_max: 3,
          valor_pessoa_adicional: 80,
          aceita_pets: true,
          taxa_pet_dia: 50,
          units: [
            { id: 'u_1', identificador: 'Casal 01' },
            { id: 'u_2', identificador: 'Casal 02' },
          ],
        },
      ]),
      findFirst: jest.fn(),
    },
    motorDailyInventory: {
      findMany: jest.fn().mockResolvedValue([
        { room_type_id: 'rt_1', data: utcDate('2026-09-05'), preco: 339, min_stay: 2, closed_arrival: false, closed_departure: false, stop_sell: false },
        { room_type_id: 'rt_1', data: utcDate('2026-09-06'), preco: 339, min_stay: 1, closed_arrival: false, closed_departure: false, stop_sell: false },
      ]),
    },
    motorReservation: { findMany: jest.fn().mockResolvedValue([]) },
    motorHold: { findMany: jest.fn().mockResolvedValue([]) },
    motorBlock: { findMany: jest.fn().mockResolvedValue([]) },
    motorRatePlan: { findFirst: jest.fn().mockResolvedValue(null) },
    ...overrides,
  };
}

const query = { checkin: '2026-09-05', checkout: '2026-09-07', adultos: 2, criancas: 0, pets: 0 };

describe('AvailabilityService.search', () => {
  it('retorna tipo com vaga, total calculado e unidades_livres', async () => {
    const prisma = buildPrisma();
    const service = new AvailabilityService(prisma as any);
    const result = await service.search(tenantId, query as any);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      room_type_id: 'rt_1',
      unidades_livres: 2,
      min_stay: 2,
      valor_total: 678, // 339 * 2 noites, sem adicionais
    });
  });

  it('ERRO CLASSICO (spec §1.1): 1 vaga na segunda e 1 na terca em units DIFERENTES nao e disponibilidade', async () => {
    const prisma = buildPrisma({
      motorReservation: {
        findMany: jest.fn().mockResolvedValue([
          // u_1 ocupada na noite de 05; u_2 ocupada na noite de 06
          { unit_id: 'u_1', checkin: utcDate('2026-09-05'), checkout: utcDate('2026-09-06') },
          { unit_id: 'u_2', checkin: utcDate('2026-09-06'), checkout: utcDate('2026-09-07') },
        ]),
      },
    });
    const service = new AvailabilityService(prisma as any);
    const result = await service.search(tenantId, query as any);
    // Nenhuma unit esta livre nas DUAS noites -> tipo fora da resposta.
    expect(result).toHaveLength(0);
  });

  it('cobra pessoa adicional e taxa de pet por noite', async () => {
    const prisma = buildPrisma();
    const service = new AvailabilityService(prisma as any);
    const result = await service.search(tenantId, {
      ...query,
      adultos: 3,
      pets: 1,
    } as any);
    // 678 base + 80*2 noites adicional + 50*2 noites pet
    expect(result[0].valor_total).toBe(678 + 160 + 100);
  });

  it('exclui tipo quando pessoas excedem capacidade_max ou pets sem aceita_pets', async () => {
    const prisma = buildPrisma();
    const service = new AvailabilityService(prisma as any);
    expect(await service.search(tenantId, { ...query, adultos: 4 } as any)).toHaveLength(0);
  });

  it('exclui tipo com stop_sell em qualquer noite ou noites < min_stay do checkin', async () => {
    const prisma = buildPrisma();
    prisma.motorDailyInventory.findMany.mockResolvedValue([
      { room_type_id: 'rt_1', data: utcDate('2026-09-05'), preco: 339, min_stay: 3, closed_arrival: false, closed_departure: false, stop_sell: false },
      { room_type_id: 'rt_1', data: utcDate('2026-09-06'), preco: 339, min_stay: 1, closed_arrival: false, closed_departure: false, stop_sell: false },
    ]);
    const service = new AvailabilityService(prisma as any);
    // 2 noites < min_stay 3 do dia de chegada
    expect(await service.search(tenantId, query as any)).toHaveLength(0);
  });

  it('hold ATIVO nao vencido ocupa a unit; hold vencido nao ocupa', async () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);
    const prisma = buildPrisma({
      motorHold: {
        findMany: jest.fn().mockResolvedValue([
          { unit_id: 'u_1', checkin: utcDate('2026-09-05'), checkout: utcDate('2026-09-07'), expires_at: future },
          { unit_id: 'u_2', checkin: utcDate('2026-09-05'), checkout: utcDate('2026-09-07'), expires_at: past },
        ]),
      },
    });
    const service = new AvailabilityService(prisma as any);
    const result = await service.search(tenantId, query as any);
    expect(result[0].unidades_livres).toBe(1); // so u_2 (hold vencido)
  });

  it('cliente_marina aplica o percentual_ajuste do rate_plan Marina', async () => {
    const prisma = buildPrisma({
      motorRatePlan: {
        findFirst: jest.fn().mockResolvedValue({ id: 'rp_m', percentual_ajuste: -10 }),
      },
    });
    const service = new AvailabilityService(prisma as any);
    const quote = await service.quote(tenantId, {
      room_type_id: 'rt_1',
      checkin: utcDate('2026-09-05'),
      checkout: utcDate('2026-09-07'),
      adultos: 2,
      criancas: 0,
      pets: 0,
      cliente_marina: true,
    });
    expect(quote.valor_total).toBeCloseTo(678 * 0.9, 2);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- availability.service`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

Create `src/modules/reserve-motor/application/dtos/availability.dto.ts`:

```ts
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class AvailabilityQueryDto {
  @IsDateString() checkin: string;
  @IsDateString() checkout: string;
  @Type(() => Number) @IsInt() @Min(1) adultos: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) criancas?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) pets?: number;
  @IsOptional() @Type(() => Boolean) @IsBoolean() cliente_marina?: boolean;
}
```

Create `src/modules/reserve-motor/application/services/availability.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { isoDate, nightsBetween, utcDate } from '../../domain/constants/motor.constants';
import { MotorTipoEsgotadoError, MotorValidationError } from '../../domain/errors/motor.errors';
import { AvailabilityQueryDto } from '../dtos/availability.dto';

export interface QuoteParams {
  room_type_id: string;
  checkin: Date;
  checkout: Date;
  adultos: number;
  criancas: number;
  pets: number;
  cliente_marina: boolean;
}

export interface Quote {
  valor_total: number;
  min_stay: number;
}

export interface RoomTypeAvailability {
  room_type_id: string;
  nome: string;
  descricao_curta: string | null;
  capacidade_base: number;
  capacidade_max: number;
  unidades_livres: number;
  min_stay: number;
  preco_por_noite: { data: string; preco: number }[];
  valor_total: number;
}

// prisma ou tx interativa — mesmos delegates.
type Db = any;

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Disponibilidade de um room_type = existe ao menos UMA unit livre em
   * TODAS as noites do periodo (spec §1.1). Livre = sem reservation ativa,
   * sem hold ATIVO nao vencido, sem block. A checagem e por sobreposicao de
   * intervalo POR UNIT — nunca "vagas por dia".
   */
  async search(tenantId: string, query: AvailabilityQueryDto): Promise<RoomTypeAvailability[]> {
    const checkin = utcDate(query.checkin);
    const checkout = utcDate(query.checkout);
    const nights = nightsBetween(checkin, checkout);
    if (nights < 1) throw new MotorValidationError('checkout deve ser posterior ao checkin');
    const criancas = query.criancas ?? 0;
    const pets = query.pets ?? 0;
    const pessoas = query.adultos + criancas;

    const roomTypes = await this.prisma.motorRoomType.findMany({
      where: { tenant_id: tenantId, ativo: true },
      include: { units: { where: { ativo: true } } },
      orderBy: { ordem: 'asc' },
    });
    const inventory = await this.prisma.motorDailyInventory.findMany({
      where: { tenant_id: tenantId, data: { gte: checkin, lt: checkout } },
    });
    const busy = await this.busyUnitIds(this.prisma, tenantId, checkin, checkout);

    const result: RoomTypeAvailability[] = [];
    for (const roomType of roomTypes) {
      if (pessoas > roomType.capacidade_max) continue;
      if (pets > 0 && !roomType.aceita_pets) continue;

      const days = inventory
        .filter((d: any) => d.room_type_id === roomType.id)
        .sort((a: any, b: any) => a.data.getTime() - b.data.getTime());
      // Toda noite precisa de linha no calendario; data sem linha = sem preco
      // definido = nao vendavel.
      if (days.length !== nights) continue;
      if (days.some((d: any) => d.stop_sell)) continue;
      if (days[0].closed_arrival) continue;
      const minStay = days[0].min_stay;
      if (nights < minStay) continue;

      const freeUnits = roomType.units.filter((u: any) => !busy.has(u.id));
      if (freeUnits.length === 0) continue;

      const base = days.reduce((sum: number, d: any) => sum + Number(d.preco), 0);
      const adicionais = Math.max(0, pessoas - roomType.capacidade_base);
      const valorAdicional = adicionais * Number(roomType.valor_pessoa_adicional) * nights;
      const valorPets = pets * Number(roomType.taxa_pet_dia) * nights;
      let total = base + valorAdicional + valorPets;
      if (query.cliente_marina) {
        total = await this.applyMarina(tenantId, roomType.id, total);
      }

      result.push({
        room_type_id: roomType.id,
        nome: roomType.nome,
        descricao_curta: roomType.descricao_curta,
        capacidade_base: roomType.capacidade_base,
        capacidade_max: roomType.capacidade_max,
        unidades_livres: freeUnits.length,
        min_stay: minStay,
        preco_por_noite: days.map((d: any) => ({ data: isoDate(d.data), preco: Number(d.preco) })),
        valor_total: Math.round(total * 100) / 100,
      });
    }
    return result;
  }

  /** Preco/validacao de UM tipo — usado por hold e reserva manual. */
  async quote(tenantId: string, params: QuoteParams): Promise<Quote> {
    const found = await this.search(tenantId, {
      checkin: isoDate(params.checkin),
      checkout: isoDate(params.checkout),
      adultos: params.adultos,
      criancas: params.criancas,
      pets: params.pets,
      cliente_marina: params.cliente_marina,
    } as AvailabilityQueryDto);
    const match = found.find((r) => r.room_type_id === params.room_type_id);
    if (!match) throw new MotorTipoEsgotadoError();
    return { valor_total: match.valor_total, min_stay: match.min_stay };
  }

  /**
   * Units LIVRES do tipo no periodo. Aceita prisma ou tx — as Tasks 7/8/9
   * chamam dentro de transacao com as units ja travadas por FOR UPDATE.
   */
  async freeUnitIds(
    db: Db,
    tenantId: string,
    roomTypeId: string,
    checkin: Date,
    checkout: Date,
    excludeReservationId?: string,
  ): Promise<string[]> {
    const units = await db.motorUnit.findMany({
      where: { tenant_id: tenantId, room_type_id: roomTypeId, ativo: true },
      orderBy: { identificador: 'asc' },
    });
    const busy = await this.busyUnitIds(db, tenantId, checkin, checkout, excludeReservationId);
    return units.filter((u: any) => !busy.has(u.id)).map((u: any) => u.id);
  }

  /** Units ocupadas por reservation ativa, hold ATIVO nao vencido ou block. */
  private async busyUnitIds(
    db: Db,
    tenantId: string,
    checkin: Date,
    checkout: Date,
    excludeReservationId?: string,
  ): Promise<Set<string>> {
    // 3 queries sequenciais (pool max 3, e pode estar dentro de uma tx).
    const reservations = await db.motorReservation.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: ['HOLD', 'CONFIRMADA', 'CHECKIN_FEITO'] },
        checkin: { lt: checkout },
        checkout: { gt: checkin },
        ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      },
      select: { unit_id: true },
    });
    const holds = await db.motorHold.findMany({
      where: {
        tenant_id: tenantId,
        status: 'ATIVO',
        expires_at: { gt: new Date() },
        checkin: { lt: checkout },
        checkout: { gt: checkin },
      },
      select: { unit_id: true, expires_at: true },
    });
    const blocks = await db.motorBlock.findMany({
      where: {
        tenant_id: tenantId,
        data_inicio: { lt: checkout },
        OR: [{ data_fim: null }, { data_fim: { gt: checkin } }],
      },
      select: { unit_id: true },
    });
    const busy = new Set<string>();
    for (const r of reservations) busy.add(r.unit_id);
    for (const h of holds) if (h.expires_at > new Date()) busy.add(h.unit_id);
    for (const b of blocks) busy.add(b.unit_id);
    return busy;
  }

  /** Desconto Marina: rate_plan derivado com percentual_ajuste (spec v5). */
  private async applyMarina(tenantId: string, roomTypeId: string, total: number): Promise<number> {
    const plan = await this.prisma.motorRatePlan.findFirst({
      where: { tenant_id: tenantId, room_type_id: roomTypeId, nome: 'Marina', ativo: true },
    });
    if (!plan?.percentual_ajuste) return total;
    return total * (1 + Number(plan.percentual_ajuste) / 100);
  }
}
```

Create `src/modules/reserve-motor/infrastructure/controllers/motor-bot.controller.ts`:

```ts
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { BotEventKeyGuard } from '../../../reserve-client-portal/infrastructure/guards/bot-event-key.guard';
import { AvailabilityQueryDto } from '../../application/dtos/availability.dto';
import { AvailabilityService } from '../../application/services/availability.service';

/**
 * API de maquina do motor, consumida pelo bot via N8N (spec §2).
 * Autenticacao pela MESMA chave do BotIntegrationConfig (x-tenant-id +
 * x-tenant-key) — o guard publica request.tenant_id. Fora do gate de modulo
 * por design, como o BotEventIngestionController (rotas de maquina nao
 * passam por RequiresModule).
 */
@Controller('motor')
@SkipThrottle()
@UseGuards(BotEventKeyGuard)
export class MotorBotController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('availability')
  async availability(@Req() req: any, @Query() query: AvailabilityQueryDto) {
    return this.availabilityService.search(req.tenant_id, query);
  }
}
```

Em `reserve-motor.module.ts`: adicionar `MotorBotController` a `controllers`; `AvailabilityService, BotEventKeyGuard, BotKeyProvider` a `providers` (importar `BotKeyProvider` de `../reserve-client-portal/infrastructure/providers/bot-key.provider` — o guard depende dele; `ConfigService` já é global).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- availability.service`
Expected: PASS — incluindo o teste do "erro clássico".

Run: `npm run build`
Expected: compila.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-motor
git commit -m "feat(motor): consulta de disponibilidade por unidade continua + API do bot

Disponibilidade = uma unit livre em TODAS as noites (nunca vagas por
dia); preco total com pessoa adicional, pets e desconto Marina;
GET /api/motor/availability autenticado pela chave do bot.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Holds — trava no banco, best-fit, expiração por minuto

**Repo:** `BACK`

**Files:**
- Create: `src/modules/reserve-motor/application/services/hold.service.ts` (+ `hold.service.spec.ts`)
- Create: `src/modules/reserve-motor/application/dtos/hold.dto.ts`
- Create: `src/modules/reserve-motor/infrastructure/providers/hold-expiry-cron.provider.ts`
- Create: `src/modules/reserve-motor/infrastructure/providers/motor-bot-events.provider.ts`
- Modify: `src/modules/reserve-motor/infrastructure/controllers/motor-bot.controller.ts` (rotas de hold)
- Modify: `src/modules/reserve-motor/reserve-motor.module.ts`

**Interfaces:**
- Consumes: `AvailabilityService.quote` e `freeUnitIds` (Task 6), `HOLD_TTL_MINUTES` (Task 2), erros (Task 2).
- Produces:
  - `HoldService.create(tenantId, dto: CreateHoldDto)` → `{ hold_id, unit_id, expires_at, valor_total, valor_antecipado }`; lança `MotorTipoEsgotadoError` (→409).
  - `HoldService.release(tenantId, holdId)` → hold `CANCELADO`.
  - `HoldService.expireDue(): Promise<number>` — job por minuto; dispara `hold.expirado` ao bot.
  - `MotorBotEventsProvider.dispatch(tenantId: string, evento: string, payload: Record<string, unknown>): Promise<void>` — POST fire-and-forget para `n8n_motor_webhook_url`. **Usado também pela Task 8.**
  - Rotas bot: `POST /api/motor/holds` (201 / 409), `POST /api/motor/holds/:id/release`.
  - Helper interno `insertHoldOnUnit(tx, ...)` com detecção de violação da constraint de exclusão (`23P01` / nome da constraint) — padrão reutilizado na Task 8.

- [ ] **Step 1: Teste falhando**

Create `src/modules/reserve-motor/application/services/hold.service.spec.ts`:

```ts
import { HoldService } from './hold.service';
import { MotorTipoEsgotadoError } from '../../domain/errors/motor.errors';

const tenantId = 'tenant_1';
const dto = {
  room_type_id: 'rt_1',
  checkin: '2026-09-05',
  checkout: '2026-09-07',
  adultos: 2,
  criancas: 0,
  pets: 0,
  contato_whatsapp: '5535999990000',
  forma_pagamento: 'PIX_LINK',
  cliente_marina: false,
};

function buildDeps(freeUnits: string[]) {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    motorHold: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'h_1', ...data })),
    },
  };
  const prisma = {
    $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
    motorHold: {
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'h_1', status: 'CANCELADO' }),
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  const availability = {
    quote: jest.fn().mockResolvedValue({ valor_total: 678, min_stay: 2 }),
    freeUnitIds: jest.fn().mockResolvedValue(freeUnits),
  };
  const events = { dispatch: jest.fn().mockResolvedValue(undefined) };
  return { prisma, tx, availability, events };
}

describe('HoldService.create', () => {
  it('cria hold na primeira unit livre com TTL de PIX_LINK (60min) e 50% antecipado', async () => {
    const { prisma, tx, availability, events } = buildDeps(['u_1', 'u_2']);
    const service = new HoldService(prisma as any, availability as any, events as any);
    const before = Date.now();
    const result = await service.create(tenantId, dto as any);
    expect(result.unit_id).toBe('u_1');
    expect(result.valor_total).toBe(678);
    expect(result.valor_antecipado).toBe(339); // Pix 50%
    const ttlMin = (new Date(result.expires_at).getTime() - before) / 60000;
    expect(ttlMin).toBeGreaterThan(59);
    expect(ttlMin).toBeLessThan(61);
    expect(tx.$queryRaw).toHaveBeenCalled(); // FOR UPDATE nas units
  });

  it('cartao antecipa 100%', async () => {
    const { prisma, availability, events } = buildDeps(['u_1']);
    const service = new HoldService(prisma as any, availability as any, events as any);
    const result = await service.create(tenantId, { ...dto, forma_pagamento: 'CARTAO' } as any);
    expect(result.valor_antecipado).toBe(678);
  });

  it('constraint estourou na primeira unit -> tenta a proxima (corrida, spec §1.2)', async () => {
    const { prisma, tx, availability, events } = buildDeps(['u_1', 'u_2']);
    tx.motorHold.create
      .mockRejectedValueOnce(
        Object.assign(new Error('conflicting key value violates exclusion constraint "motor_holds_no_overlap"')),
      )
      .mockImplementationOnce(({ data }: any) => Promise.resolve({ id: 'h_2', ...data }));
    const service = new HoldService(prisma as any, availability as any, events as any);
    const result = await service.create(tenantId, dto as any);
    expect(result.unit_id).toBe('u_2');
  });

  it('nenhuma unit livre -> MotorTipoEsgotadoError (bot responde esgotado e refaz availability)', async () => {
    const { prisma, availability, events } = buildDeps([]);
    const service = new HoldService(prisma as any, availability as any, events as any);
    await expect(service.create(tenantId, dto as any)).rejects.toBeInstanceOf(MotorTipoEsgotadoError);
  });
});

describe('HoldService.expireDue', () => {
  it('marca vencidos como EXPIRADO e dispara hold.expirado ao bot', async () => {
    const { prisma, availability, events } = buildDeps([]);
    prisma.motorHold.findMany.mockResolvedValue([
      { id: 'h_9', tenant_id: tenantId, contato_whatsapp: '5535999990000' },
    ]);
    prisma.motorHold.updateMany.mockResolvedValue({ count: 1 });
    const service = new HoldService(prisma as any, availability as any, events as any);
    const count = await service.expireDue();
    expect(count).toBe(1);
    expect(events.dispatch).toHaveBeenCalledWith(
      tenantId,
      'hold.expirado',
      expect.objectContaining({ hold_id: 'h_9' }),
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- hold.service`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar**

Create `src/modules/reserve-motor/application/dtos/hold.dto.ts`:

```ts
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export const HOLD_FORMAS = ['PIX_LINK', 'CARTAO', 'PIX_MANUAL'] as const;
export type HoldForma = (typeof HOLD_FORMAS)[number];

export class CreateHoldDto {
  @IsString() room_type_id: string;
  @IsDateString() checkin: string;
  @IsDateString() checkout: string;
  @IsInt() @Min(1) adultos: number;
  @IsOptional() @IsInt() @Min(0) criancas?: number;
  @IsOptional() @IsInt() @Min(0) pets?: number;
  @IsString() @Length(8, 40) contato_whatsapp: string;
  @IsIn(HOLD_FORMAS) forma_pagamento: HoldForma;
  @IsOptional() @IsBoolean() cliente_marina?: boolean;
  @IsOptional() @IsString() asaas_payment_id?: string;
}
```

Create `src/modules/reserve-motor/infrastructure/providers/motor-bot-events.provider.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';

/**
 * Eventos motor -> bot (WF9 do N8N: hold.expirado,
 * pagamento.tardio.exception). Fase 1: fire-and-forget com log de erro.
 * TODO(arquitetura): ledger com retry (padrao BotStageWebhookDispatch) na
 * Fase 2 — divida registrada no plano do motor.
 */
@Injectable()
export class MotorBotEventsProvider {
  private readonly logger = new Logger(MotorBotEventsProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  async dispatch(tenantId: string, evento: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const config = await this.prisma.botIntegrationConfig.findUnique({
        where: { tenant_id: tenantId },
        select: { n8n_motor_webhook_url: true, active: true },
      });
      if (!config?.active || !config.n8n_motor_webhook_url) return;
      const response = await fetch(config.n8n_motor_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento, tenant_id: tenantId, ...payload }),
      });
      if (!response.ok) {
        this.logger.error(`Webhook do motor respondeu ${response.status} (tenant ${tenantId}, ${evento})`);
      }
    } catch (error) {
      this.logger.error(`Falha no webhook do motor (tenant ${tenantId}, ${evento})`, error as any);
    }
  }
}
```

Create `src/modules/reserve-motor/application/services/hold.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { HOLD_TTL_MINUTES, isoDate, utcDate } from '../../domain/constants/motor.constants';
import {
  MotorHoldNotActiveError,
  MotorNotFoundError,
  MotorTipoEsgotadoError,
} from '../../domain/errors/motor.errors';
import { MotorBotEventsProvider } from '../../infrastructure/providers/motor-bot-events.provider';
import { CreateHoldDto } from '../dtos/hold.dto';
import { AvailabilityService } from './availability.service';

/** Violacao de constraint de exclusao do Postgres (23P01). */
export function isExclusionViolation(error: unknown): boolean {
  const message = String((error as Error)?.message ?? '');
  return message.includes('exclusion constraint') || message.includes('23P01');
}

@Injectable()
export class HoldService {
  private readonly logger = new Logger(HoldService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly botEvents: MotorBotEventsProvider,
  ) {}

  /**
   * Fluxo da spec §1.2: quote -> transacao com FOR UPDATE nas units do tipo
   * -> tenta INSERT na melhor unit -> constraint estourou (outra transacao
   * ganhou) -> proxima unit -> nenhuma sobrou -> tipo esgotado (409).
   * O FOR UPDATE serializa contra reservas manuais/confirm, que travam as
   * mesmas linhas — as constraints EXCLUDE nao cruzam hold x reservation.
   */
  async create(tenantId: string, dto: CreateHoldDto) {
    const checkin = utcDate(dto.checkin);
    const checkout = utcDate(dto.checkout);
    const quote = await this.availability.quote(tenantId, {
      room_type_id: dto.room_type_id,
      checkin,
      checkout,
      adultos: dto.adultos,
      criancas: dto.criancas ?? 0,
      pets: dto.pets ?? 0,
      cliente_marina: dto.cliente_marina ?? false,
    });
    const antecipadoPct = dto.forma_pagamento === 'CARTAO' ? 1 : 0.5;
    const expiresAt = new Date(Date.now() + HOLD_TTL_MINUTES[dto.forma_pagamento] * 60_000);

    const hold = await this.prisma.$transaction(async (tx: any) => {
      // Trava as units do tipo: quem chegar depois espera este commit.
      await tx.$queryRaw`
        SELECT id FROM "motor_units"
        WHERE tenant_id = ${tenantId} AND room_type_id = ${dto.room_type_id} AND ativo = true
        FOR UPDATE
      `;
      const freeIds = await this.availability.freeUnitIds(
        tx,
        tenantId,
        dto.room_type_id,
        checkin,
        checkout,
      );
      for (const unitId of freeIds) {
        try {
          return await tx.motorHold.create({
            data: {
              tenant_id: tenantId,
              room_type_id: dto.room_type_id,
              unit_id: unitId,
              checkin,
              checkout,
              adultos: dto.adultos,
              criancas: dto.criancas ?? 0,
              pets: dto.pets ?? 0,
              contato_whatsapp: dto.contato_whatsapp,
              forma_pagamento: dto.forma_pagamento,
              cliente_marina: dto.cliente_marina ?? false,
              valor_total: quote.valor_total,
              valor_antecipado: Math.round(quote.valor_total * antecipadoPct * 100) / 100,
              asaas_payment_id: dto.asaas_payment_id ?? null,
              expires_at: expiresAt,
            },
          });
        } catch (error) {
          if (isExclusionViolation(error)) continue;
          throw error;
        }
      }
      throw new MotorTipoEsgotadoError();
    });

    return {
      hold_id: hold.id,
      unit_id: hold.unit_id,
      expires_at: hold.expires_at,
      valor_total: Number(hold.valor_total),
      valor_antecipado: Number(hold.valor_antecipado),
    };
  }

  /** Desistencia ou vencimento de cobranca: libera as datas. */
  async release(tenantId: string, holdId: string) {
    const hold = await this.prisma.motorHold.findFirst({
      where: { id: holdId, tenant_id: tenantId },
    });
    if (!hold) throw new MotorNotFoundError('hold nao encontrado');
    if (hold.status === 'CONVERTIDO') throw new MotorHoldNotActiveError('hold ja convertido em reserva');
    return this.prisma.motorHold.update({ where: { id: holdId }, data: { status: 'CANCELADO' } });
  }

  /** Job por minuto: holds ATIVO vencidos -> EXPIRADO + evento ao bot. */
  async expireDue(): Promise<number> {
    const due = await this.prisma.motorHold.findMany({
      where: { status: 'ATIVO', expires_at: { lt: new Date() } },
      select: { id: true, tenant_id: true, contato_whatsapp: true, checkin: true, checkout: true },
    });
    if (due.length === 0) return 0;
    const result = await this.prisma.motorHold.updateMany({
      where: { id: { in: due.map((h: any) => h.id) }, status: 'ATIVO' },
      data: { status: 'EXPIRADO' },
    });
    for (const hold of due) {
      await this.botEvents.dispatch(hold.tenant_id, 'hold.expirado', {
        hold_id: hold.id,
        contato_whatsapp: hold.contato_whatsapp,
        checkin: isoDate(hold.checkin),
        checkout: isoDate(hold.checkout),
      });
    }
    this.logger.log(`Expirados ${result.count} hold(s)`);
    return result.count;
  }
}
```

Create `src/modules/reserve-motor/infrastructure/providers/hold-expiry-cron.provider.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HoldService } from '../../application/services/hold.service';

/** Hold prendendo estoque e risco da spec §11 — expiracao a cada minuto. */
@Injectable()
export class HoldExpiryCronProvider {
  constructor(private readonly holdService: HoldService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expire(): Promise<void> {
    await this.holdService.expireDue();
  }
}
```

Em `motor-bot.controller.ts`, adicionar as rotas (imports de `Body`, `Param`, `Post`, `HttpCode` e do service):

```ts
  @Post('holds')
  async createHold(@Req() req: any, @Body() dto: CreateHoldDto) {
    return this.holdService.create(req.tenant_id, dto);
  }

  @Post('holds/:id/release')
  @HttpCode(200)
  async releaseHold(@Req() req: any, @Param('id') id: string) {
    const hold = await this.holdService.release(req.tenant_id, id);
    return { hold_id: hold.id, status: hold.status };
  }
```

(injetar `private readonly holdService: HoldService` no construtor.)

Em `reserve-motor.module.ts`: adicionar `HoldService, HoldExpiryCronProvider, MotorBotEventsProvider` a `providers`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- hold.service`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-motor
git commit -m "feat(motor): holds com trava no banco, best-fit e expiracao por minuto

FOR UPDATE nas units serializa hold x reserva; violacao da constraint
de exclusao tenta a proxima unit; nenhuma livre vira 409 (bot refaz
availability). Cron por minuto expira e avisa o bot (fire-and-forget,
ledger com retry fica como divida para a Fase 2).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Confirm (webhook Asaas via N8N) + pagamento tardio

**Repo:** `BACK`

**Files:**
- Modify: `src/modules/reserve-motor/application/services/hold.service.ts` (+ spec)
- Modify: `src/modules/reserve-motor/application/dtos/hold.dto.ts` (DTO de confirm)
- Modify: `src/modules/reserve-motor/infrastructure/controllers/motor-bot.controller.ts`

**Interfaces:**
- Consumes: `AvailabilityService.freeUnitIds`, `MotorBotEventsProvider.dispatch`, `isExclusionViolation` (Task 7).
- Produces:
  - `HoldService.confirm(tenantId, holdId, dto: ConfirmHoldDto)` → `{ reservation_id, status: 'CONFIRMADA' }` ou (tardio sem vaga) cria `motor_payment_exceptions`, dispara `pagamento.tardio.exception` e lança `MotorTipoEsgotadoError`.
  - Rota bot: `POST /api/motor/holds/:id/confirm`.
  - Regras: idempotente por `asaas_payment_id` (reservation existente → retorna ela); hold `CONVERTIDO` → retorna a reservation já criada; hold `ATIVO` não vencido → converte; hold `EXPIRADO`/vencido → tenta recriar nas mesmas datas/tipo (hóspede nem percebe); `PIX_50` grava `valor_pago=50%`, `saldo_checkin=50%`; `CARTAO_100` grava 100%/0.

- [ ] **Step 1: Testes falhando (adicionar ao `hold.service.spec.ts`)**

```ts
describe('HoldService.confirm', () => {
  const baseHold = {
    id: 'h_1',
    tenant_id: tenantId,
    room_type_id: 'rt_1',
    unit_id: 'u_1',
    checkin: new Date(Date.UTC(2026, 8, 5)),
    checkout: new Date(Date.UTC(2026, 8, 7)),
    adultos: 2,
    criancas: 0,
    pets: 0,
    contato_whatsapp: '5535999990000',
    forma_pagamento: 'PIX_LINK',
    valor_total: 678,
    valor_antecipado: 339,
    status: 'ATIVO',
    expires_at: new Date(Date.now() + 60_000),
  };

  function buildConfirmDeps(hold: any, freeUnits: string[] = ['u_1']) {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      motorReservation: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'r_1', ...data })),
      },
      motorReservationEvent: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
      motorHold: { update: jest.fn().mockResolvedValue({ ...hold, status: 'CONVERTIDO' }) },
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
      motorHold: { findFirst: jest.fn().mockResolvedValue(hold) },
      motorReservation: { findFirst: jest.fn().mockResolvedValue(null) },
      motorPaymentException: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'pe_1', ...data })),
      },
    };
    const availability = {
      quote: jest.fn(),
      freeUnitIds: jest.fn().mockResolvedValue(freeUnits),
    };
    const events = { dispatch: jest.fn().mockResolvedValue(undefined) };
    return { prisma, tx, availability, events };
  }

  it('converte hold ATIVO em reserva CONFIRMADA com 50/50 do Pix', async () => {
    const { prisma, tx, availability, events } = buildConfirmDeps(baseHold);
    const service = new HoldService(prisma as any, availability as any, events as any);
    const result = await service.confirm(tenantId, 'h_1', { asaas_payment_id: 'pay_1' } as any);
    expect(result.status).toBe('CONFIRMADA');
    expect(tx.motorReservation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          origem: 'BOT_WHATSAPP',
          forma_pagamento: 'PIX_50',
          valor_pago: 339,
          saldo_checkin: 339,
        }),
      }),
    );
    expect(tx.motorHold.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CONVERTIDO' } }),
    );
  });

  it('e idempotente por asaas_payment_id', async () => {
    const { prisma, availability, events } = buildConfirmDeps(baseHold);
    prisma.motorReservation.findFirst.mockResolvedValue({ id: 'r_ja', status: 'CONFIRMADA' });
    const service = new HoldService(prisma as any, availability as any, events as any);
    const result = await service.confirm(tenantId, 'h_1', { asaas_payment_id: 'pay_1' } as any);
    expect(result.reservation_id).toBe('r_ja');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('pagamento tardio com vaga: recria nas mesmas datas e confirma', async () => {
    const expired = { ...baseHold, status: 'EXPIRADO' };
    const { prisma, tx, availability, events } = buildConfirmDeps(expired, ['u_2']);
    const service = new HoldService(prisma as any, availability as any, events as any);
    const result = await service.confirm(tenantId, 'h_1', { asaas_payment_id: 'pay_2' } as any);
    expect(result.status).toBe('CONFIRMADA');
    expect(tx.motorReservation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ unit_id: 'u_2' }) }),
    );
  });

  it('pagamento tardio SEM vaga: cria payment_exception, avisa o bot e retorna 409', async () => {
    const expired = { ...baseHold, status: 'EXPIRADO' };
    const { prisma, availability, events } = buildConfirmDeps(expired, []);
    const service = new HoldService(prisma as any, availability as any, events as any);
    await expect(
      service.confirm(tenantId, 'h_1', { asaas_payment_id: 'pay_3' } as any),
    ).rejects.toBeInstanceOf(MotorTipoEsgotadoError);
    expect(prisma.motorPaymentException.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hold_id: 'h_1', valor_pago: 339 }),
      }),
    );
    expect(events.dispatch).toHaveBeenCalledWith(
      tenantId,
      'pagamento.tardio.exception',
      expect.objectContaining({ hold_id: 'h_1' }),
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- hold.service`
Expected: FAIL — `confirm` não existe.

- [ ] **Step 3: Implementar**

Em `hold.dto.ts`, adicionar:

```ts
export class ConfirmHoldDto {
  @IsOptional() @IsString() asaas_payment_id?: string;
  @IsOptional() @IsString() @Length(1, 200) hospede_nome?: string;
  @IsOptional() @IsString() hospede_email?: string;
  @IsOptional() @IsString() hospede_doc?: string;
  @IsOptional() valor_pago?: number;
  @IsOptional() atribuicao?: Record<string, unknown>;
}
```

Em `hold.service.ts`, adicionar o método:

```ts
  /**
   * Chamado pelo fluxo N8N quando o Asaas confirma o pagamento (spec §2).
   * Idempotente por asaas_payment_id. Hold EXPIRADO = pagamento tardio:
   * tenta recriar nas mesmas datas/tipo; sem vaga vira pending exception
   * com alerta PRIORITARIO (dinheiro recebido sem reserva).
   */
  async confirm(tenantId: string, holdId: string, dto: ConfirmHoldDto) {
    if (dto.asaas_payment_id) {
      const existing = await this.prisma.motorReservation.findFirst({
        where: { tenant_id: tenantId, asaas_payment_id: dto.asaas_payment_id },
      });
      if (existing) return { reservation_id: existing.id, status: existing.status };
    }
    const hold = await this.prisma.motorHold.findFirst({
      where: { id: holdId, tenant_id: tenantId },
    });
    if (!hold) throw new MotorNotFoundError('hold nao encontrado');
    if (hold.status === 'CONVERTIDO') {
      const reservation = await this.prisma.motorReservation.findFirst({
        where: { tenant_id: tenantId, room_type_id: hold.room_type_id, unit_id: hold.unit_id, checkin: hold.checkin },
      });
      return { reservation_id: reservation?.id ?? null, status: 'CONFIRMADA' };
    }
    if (hold.status === 'CANCELADO') throw new MotorHoldNotActiveError('hold cancelado');

    const isLate = hold.status === 'EXPIRADO' || hold.expires_at < new Date();
    const valorPago = dto.valor_pago ?? Number(hold.valor_antecipado);
    const formaPagamento = hold.forma_pagamento === 'CARTAO' ? 'CARTAO_100' : 'PIX_50';

    try {
      const reservation = await this.prisma.$transaction(async (tx: any) => {
        await tx.$queryRaw`
          SELECT id FROM "motor_units"
          WHERE tenant_id = ${tenantId} AND room_type_id = ${hold.room_type_id} AND ativo = true
          FOR UPDATE
        `;
        // Hold ATIVO ainda segura a propria unit; no tardio qualquer unit
        // livre do tipo serve (hospede nem percebe a troca).
        const freeIds = isLate
          ? await this.availability.freeUnitIds(tx, tenantId, hold.room_type_id, hold.checkin, hold.checkout)
          : [hold.unit_id];
        for (const unitId of freeIds) {
          try {
            const created = await tx.motorReservation.create({
              data: {
                tenant_id: tenantId,
                room_type_id: hold.room_type_id,
                unit_id: unitId,
                checkin: hold.checkin,
                checkout: hold.checkout,
                status: 'CONFIRMADA',
                origem: 'BOT_WHATSAPP',
                hospede_nome: dto.hospede_nome ?? hold.contato_whatsapp,
                hospede_telefone: hold.contato_whatsapp,
                hospede_email: dto.hospede_email ?? null,
                hospede_doc: dto.hospede_doc ?? null,
                adultos: hold.adultos,
                criancas: hold.criancas,
                pets: hold.pets,
                valor_total: hold.valor_total,
                valor_pago: valorPago,
                saldo_checkin: Math.round((Number(hold.valor_total) - valorPago) * 100) / 100,
                forma_pagamento: formaPagamento,
                asaas_payment_id: dto.asaas_payment_id ?? hold.asaas_payment_id,
                atribuicao: (dto.atribuicao as any) ?? null,
              },
            });
            await tx.motorReservationEvent.createMany({
              data: [
                { reservation_id: created.id, tipo: 'CRIADA', autor: 'motor', payload: { hold_id: hold.id } },
                { reservation_id: created.id, tipo: 'CONFIRMADA', autor: 'motor', payload: { asaas_payment_id: dto.asaas_payment_id ?? null, valor_pago: valorPago } },
              ],
            });
            await tx.motorHold.update({ where: { id: hold.id }, data: { status: 'CONVERTIDO' } });
            return created;
          } catch (error) {
            if (isExclusionViolation(error)) continue;
            throw error;
          }
        }
        throw new MotorTipoEsgotadoError();
      });
      return { reservation_id: reservation.id, status: 'CONFIRMADA' };
    } catch (error) {
      if (error instanceof MotorTipoEsgotadoError) {
        // Dinheiro recebido sem reserva: excecao PENDENTE + alerta ao bot
        // para fluxo de excecao com transferencia imediata (spec §2).
        await this.prisma.motorPaymentException.create({
          data: {
            tenant_id: tenantId,
            hold_id: hold.id,
            asaas_payment_id: dto.asaas_payment_id ?? hold.asaas_payment_id,
            valor_pago: valorPago,
          },
        });
        await this.botEvents.dispatch(tenantId, 'pagamento.tardio.exception', {
          hold_id: hold.id,
          contato_whatsapp: hold.contato_whatsapp,
          valor_pago: valorPago,
        });
      }
      throw error;
    }
  }
```

Em `motor-bot.controller.ts`, adicionar:

```ts
  @Post('holds/:id/confirm')
  @HttpCode(200)
  async confirmHold(@Req() req: any, @Param('id') id: string, @Body() dto: ConfirmHoldDto) {
    return this.holdService.confirm(req.tenant_id, id, dto);
  }
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- hold.service`
Expected: PASS (create + expire + confirm).

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-motor
git commit -m "feat(motor): confirmacao de hold idempotente com fluxo de pagamento tardio

Confirm converte hold em reserva CONFIRMADA (50/50 Pix, 100 cartao),
idempotente por asaas_payment_id; hold expirado tenta recriar nas
mesmas datas e, sem vaga, vira payment_exception com alerta ao bot.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Reservas admin — lista, detalhe, manual, remarcação e cancelamento com política

**Repo:** `BACK`

**Files:**
- Create: `src/modules/reserve-motor/application/services/reservation.service.ts` (+ `reservation.service.spec.ts`)
- Create: `src/modules/reserve-motor/application/dtos/reservation.dto.ts`
- Create: `src/modules/reserve-motor/infrastructure/controllers/motor-reservation.controller.ts`
- Modify: `src/modules/reserve-motor/reserve-motor.module.ts`

**Interfaces:**
- Consumes: `AvailabilityService.{quote,freeUnitIds}` (Task 6), `isExclusionViolation` (Task 7), erros (Task 2).
- Produces:
  - `ReservationService.list(tenantId, filters: { from?, to?, status?, origem? })` → reservas ordenadas por `checkin desc`.
  - `ReservationService.detail(tenantId, id)` → reserva com `events`, `unit`, `room_type`.
  - `ReservationService.createManual(tenantId, dto: CreateManualReservationDto, autor: string)` — mesmo protocolo de lock do hold (FOR UPDATE + loop de units + constraint); `valor_total` do quote se não informado.
  - `ReservationService.reschedule(tenantId, id, dto: RescheduleDto, autor)` — REMARCAÇÃO é operação própria (spec §1): libera datas antigas, trava novas, mantém `valor_pago`, recalcula `valor_total`/`saldo_checkin`, evento `REMARCADA`.
  - `ReservationService.cancel(tenantId, id, dto: CancelDto, autor)` — aplica `motor_cancellation_policies` (≥N dias: crédito p/ remarcação; <N: sem reembolso), evento `CANCELADA`. Cancelar ≠ estornar (estorno é manual no Asaas).
  - Rotas admin: `GET /api/motor/:tenantId/reservations`, `GET .../reservations/:id`, `POST .../reservations`, `POST .../reservations/:id/reschedule`, `POST .../reservations/:id/cancel`, `GET /api/motor/:tenantId/availability` (mesmo `AvailabilityService.search`, para o form de reserva manual).
  - Rotas bot: `POST /api/motor/reservations/:id/reschedule` e `POST /api/motor/reservations/:id/cancel` no `MotorBotController` (spec §2), chamando os mesmos métodos com `autor='bot'`.

- [ ] **Step 1: Teste falhando**

Create `src/modules/reserve-motor/application/services/reservation.service.spec.ts`:

```ts
import { ReservationService } from './reservation.service';
import { MotorNotFoundError } from '../../domain/errors/motor.errors';

const tenantId = 'tenant_1';
const DAY = 24 * 60 * 60 * 1000;

function futureDate(days: number): Date {
  const d = new Date(Date.now() + days * DAY);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function buildDeps(reservation: any, freeUnits: string[] = ['u_2']) {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    motorReservation: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'r_new', ...data })),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...reservation, ...data })),
    },
    motorReservationEvent: {
      create: jest.fn().mockResolvedValue({ id: 'ev_1' }),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
    motorReservation: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(reservation),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...reservation, ...data })),
    },
    motorReservationEvent: { create: jest.fn().mockResolvedValue({ id: 'ev_1' }) },
    motorCancellationPolicy: {
      findFirst: jest.fn().mockResolvedValue({
        dias_antecedencia_remarcacao: 7,
        reembolso_apos_prazo: false,
        taxa_noshow_percent: 100,
      }),
    },
  };
  const availability = {
    quote: jest.fn().mockResolvedValue({ valor_total: 800, min_stay: 1 }),
    freeUnitIds: jest.fn().mockResolvedValue(freeUnits),
  };
  return { prisma, tx, availability };
}

describe('ReservationService.cancel', () => {
  const base = {
    id: 'r_1',
    tenant_id: tenantId,
    room_type_id: 'rt_1',
    unit_id: 'u_1',
    status: 'CONFIRMADA',
    valor_total: 678,
    valor_pago: 339,
  };

  it('>=7 dias de antecedencia: cancela com credito para remarcacao', async () => {
    const reservation = { ...base, checkin: futureDate(10), checkout: futureDate(12) };
    const { prisma, availability } = buildDeps(reservation);
    const service = new ReservationService(prisma as any, availability as any);
    await service.cancel(tenantId, 'r_1', { motivo: 'mudou de planos' } as any, 'admin_1');
    expect(prisma.motorReservation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CANCELADA' } }),
    );
    expect(prisma.motorReservationEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: 'CANCELADA',
          payload: expect.objectContaining({ credito_remarcacao: true }),
        }),
      }),
    );
  });

  it('<7 dias: cancela sem credito (perde antecipacao)', async () => {
    const reservation = { ...base, checkin: futureDate(3), checkout: futureDate(5) };
    const { prisma, availability } = buildDeps(reservation);
    const service = new ReservationService(prisma as any, availability as any);
    await service.cancel(tenantId, 'r_1', { motivo: 'imprevisto' } as any, 'admin_1');
    expect(prisma.motorReservationEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          payload: expect.objectContaining({ credito_remarcacao: false }),
        }),
      }),
    );
  });
});

describe('ReservationService.reschedule', () => {
  it('remarca mantendo valor_pago e recalculando saldo (nao e cancelar+criar)', async () => {
    const reservation = {
      id: 'r_1',
      tenant_id: tenantId,
      room_type_id: 'rt_1',
      unit_id: 'u_1',
      status: 'CONFIRMADA',
      checkin: futureDate(10),
      checkout: futureDate(12),
      valor_total: 678,
      valor_pago: 339,
      adultos: 2,
      criancas: 0,
      pets: 0,
    };
    const { prisma, tx, availability } = buildDeps(reservation);
    const service = new ReservationService(prisma as any, availability as any);
    await service.reschedule(
      tenantId,
      'r_1',
      { novo_checkin: '2026-10-10', novo_checkout: '2026-10-12' } as any,
      'admin_1',
    );
    expect(tx.motorReservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          unit_id: 'u_2',
          valor_total: 800,
          saldo_checkin: 461, // 800 - 339 pagos
        }),
      }),
    );
    expect(tx.motorReservationEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tipo: 'REMARCADA' }) }),
    );
  });
});

describe('ReservationService.createManual', () => {
  it('cria reserva manual com lock e quote quando valor nao informado', async () => {
    const { prisma, tx, availability } = buildDeps(null);
    prisma.motorReservation.findFirst.mockResolvedValue(null);
    const service = new ReservationService(prisma as any, availability as any);
    const result = await service.createManual(
      tenantId,
      {
        room_type_id: 'rt_1',
        checkin: '2026-10-10',
        checkout: '2026-10-12',
        hospede_nome: 'Maria',
        adultos: 2,
        origem: 'MANUAL',
      } as any,
      'admin_1',
    );
    expect(result.id).toBe('r_new');
    expect(tx.$queryRaw).toHaveBeenCalled(); // FOR UPDATE
    expect(tx.motorReservation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ valor_total: 800 }) }),
    );
  });

  it('detail de reserva alheia falha com 404', async () => {
    const { prisma, availability } = buildDeps(null);
    prisma.motorReservation.findFirst.mockResolvedValue(null);
    const service = new ReservationService(prisma as any, availability as any);
    await expect(service.detail(tenantId, 'r_alheia')).rejects.toBeInstanceOf(MotorNotFoundError);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- reservation.service`
Expected: FAIL — módulo inexistente (atenção: existe `reservation.service.spec` no reserve-client-portal; o padrão acima casa os dois — confira que o novo passa e o antigo continua passando).

- [ ] **Step 3: Implementar**

Create `src/modules/reserve-motor/application/dtos/reservation.dto.ts`:

```ts
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export const MANUAL_ORIGENS = ['MANUAL', 'SITE_HSYSTEM'] as const;

export class CreateManualReservationDto {
  @IsString() room_type_id: string;
  @IsOptional() @IsString() unit_id?: string;
  @IsDateString() checkin: string;
  @IsDateString() checkout: string;
  @IsString() @Length(1, 200) hospede_nome: string;
  @IsOptional() @IsString() hospede_telefone?: string;
  @IsOptional() @IsString() hospede_email?: string;
  @IsInt() @Min(1) adultos: number;
  @IsOptional() @IsInt() @Min(0) criancas?: number;
  @IsOptional() @IsInt() @Min(0) pets?: number;
  @IsOptional() @IsNumber() @Min(0) valor_total?: number;
  @IsOptional() @IsNumber() @Min(0) valor_pago?: number;
  @IsOptional() @IsIn(MANUAL_ORIGENS) origem?: string;
  @IsOptional() @IsString() observacoes?: string;
}

export class RescheduleDto {
  @IsDateString() novo_checkin: string;
  @IsDateString() novo_checkout: string;
}

export class CancelDto {
  @IsString() @Length(1, 500) motivo: string;
}

export class ListReservationsQueryDto {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() origem?: string;
}
```

Create `src/modules/reserve-motor/application/services/reservation.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { nightsBetween, utcDate } from '../../domain/constants/motor.constants';
import {
  MotorNotFoundError,
  MotorTipoEsgotadoError,
  MotorValidationError,
} from '../../domain/errors/motor.errors';
import {
  CancelDto,
  CreateManualReservationDto,
  ListReservationsQueryDto,
  RescheduleDto,
} from '../dtos/reservation.dto';
import { AvailabilityService } from './availability.service';
import { isExclusionViolation } from './hold.service';

@Injectable()
export class ReservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
  ) {}

  async list(tenantId: string, query: ListReservationsQueryDto) {
    return this.prisma.motorReservation.findMany({
      where: {
        tenant_id: tenantId,
        ...(query.status ? { status: query.status as any } : {}),
        ...(query.origem ? { origem: query.origem as any } : {}),
        ...(query.from ? { checkout: { gt: utcDate(query.from) } } : {}),
        ...(query.to ? { checkin: { lte: utcDate(query.to) } } : {}),
      },
      include: { unit: true, room_type: true },
      orderBy: { checkin: 'desc' },
    });
  }

  async detail(tenantId: string, id: string) {
    const reservation = await this.prisma.motorReservation.findFirst({
      where: { id, tenant_id: tenantId },
      include: { unit: true, room_type: true, events: { orderBy: { created_at: 'asc' } } },
    });
    if (!reservation) throw new MotorNotFoundError('reserva nao encontrada');
    return reservation;
  }

  /**
   * Reserva manual (recepcao/gerente). Mesmo protocolo de lock do hold:
   * FOR UPDATE nas units + loop com a constraint de exclusao como rede.
   */
  async createManual(tenantId: string, dto: CreateManualReservationDto, autor: string) {
    const checkin = utcDate(dto.checkin);
    const checkout = utcDate(dto.checkout);
    if (nightsBetween(checkin, checkout) < 1) {
      throw new MotorValidationError('checkout deve ser posterior ao checkin');
    }
    let valorTotal = dto.valor_total;
    if (valorTotal == null) {
      const quote = await this.availability.quote(tenantId, {
        room_type_id: dto.room_type_id,
        checkin,
        checkout,
        adultos: dto.adultos,
        criancas: dto.criancas ?? 0,
        pets: dto.pets ?? 0,
        cliente_marina: false,
      });
      valorTotal = quote.valor_total;
    }
    const valorPago = dto.valor_pago ?? 0;

    return this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`
        SELECT id FROM "motor_units"
        WHERE tenant_id = ${tenantId} AND room_type_id = ${dto.room_type_id} AND ativo = true
        FOR UPDATE
      `;
      const freeIds = await this.availability.freeUnitIds(tx, tenantId, dto.room_type_id, checkin, checkout);
      const candidates = dto.unit_id
        ? freeIds.filter((id) => id === dto.unit_id)
        : freeIds;
      for (const unitId of candidates) {
        try {
          const created = await tx.motorReservation.create({
            data: {
              tenant_id: tenantId,
              room_type_id: dto.room_type_id,
              unit_id: unitId,
              checkin,
              checkout,
              status: 'CONFIRMADA',
              origem: (dto.origem as any) ?? 'MANUAL',
              hospede_nome: dto.hospede_nome,
              hospede_telefone: dto.hospede_telefone ?? null,
              hospede_email: dto.hospede_email ?? null,
              adultos: dto.adultos,
              criancas: dto.criancas ?? 0,
              pets: dto.pets ?? 0,
              valor_total: valorTotal,
              valor_pago: valorPago,
              saldo_checkin: Math.round((valorTotal! - valorPago) * 100) / 100,
              observacoes: dto.observacoes ?? null,
            },
          });
          await tx.motorReservationEvent.createMany({
            data: [{ reservation_id: created.id, tipo: 'CRIADA', autor, payload: { origem: dto.origem ?? 'MANUAL' } }],
          });
          return created;
        } catch (error) {
          if (isExclusionViolation(error)) continue;
          throw error;
        }
      }
      throw new MotorTipoEsgotadoError();
    });
  }

  /**
   * REMARCACAO e operacao propria (spec §1): libera as datas antigas, trava
   * as novas, MANTEM valor_pago. Nao e cancelar + criar.
   */
  async reschedule(tenantId: string, id: string, dto: RescheduleDto, autor: string) {
    const reservation = await this.mustFind(tenantId, id);
    if (!['CONFIRMADA', 'HOLD'].includes(reservation.status)) {
      throw new MotorValidationError(`reserva ${reservation.status} nao pode ser remarcada`);
    }
    const novoCheckin = utcDate(dto.novo_checkin);
    const novoCheckout = utcDate(dto.novo_checkout);
    if (nightsBetween(novoCheckin, novoCheckout) < 1) {
      throw new MotorValidationError('novo_checkout deve ser posterior ao novo_checkin');
    }
    const quote = await this.availability.quote(tenantId, {
      room_type_id: reservation.room_type_id,
      checkin: novoCheckin,
      checkout: novoCheckout,
      adultos: reservation.adultos,
      criancas: reservation.criancas,
      pets: reservation.pets,
      cliente_marina: false,
    });

    return this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`
        SELECT id FROM "motor_units"
        WHERE tenant_id = ${tenantId} AND room_type_id = ${reservation.room_type_id} AND ativo = true
        FOR UPDATE
      `;
      // Exclui a propria reserva do calculo: ela pode continuar na mesma unit.
      const freeIds = await this.availability.freeUnitIds(
        tx,
        tenantId,
        reservation.room_type_id,
        novoCheckin,
        novoCheckout,
        reservation.id,
      );
      for (const unitId of freeIds) {
        try {
          const updated = await tx.motorReservation.update({
            where: { id: reservation.id },
            data: {
              unit_id: unitId,
              checkin: novoCheckin,
              checkout: novoCheckout,
              valor_total: quote.valor_total,
              saldo_checkin:
                Math.round((quote.valor_total - Number(reservation.valor_pago)) * 100) / 100,
            },
          });
          await tx.motorReservationEvent.create({
            data: {
              reservation_id: reservation.id,
              tipo: 'REMARCADA',
              autor,
              payload: {
                de: { checkin: reservation.checkin, checkout: reservation.checkout, unit_id: reservation.unit_id },
                para: { checkin: dto.novo_checkin, checkout: dto.novo_checkout, unit_id: unitId },
              },
            },
          });
          return updated;
        } catch (error) {
          if (isExclusionViolation(error)) continue;
          throw error;
        }
      }
      throw new MotorTipoEsgotadoError('sem unidade livre nas novas datas');
    });
  }

  /**
   * Cancelar != estornar (spec §6): libera datas e registra o evento;
   * estorno no Asaas e acao manual da equipe pelo painel.
   */
  async cancel(tenantId: string, id: string, dto: CancelDto, autor: string) {
    const reservation = await this.mustFind(tenantId, id);
    if (['CANCELADA', 'CONCLUIDA'].includes(reservation.status)) {
      throw new MotorValidationError(`reserva ja esta ${reservation.status}`);
    }
    const policy = await this.prisma.motorCancellationPolicy.findFirst({
      where: { tenant_id: tenantId },
    });
    const diasAntecedencia = policy?.dias_antecedencia_remarcacao ?? 7;
    const diasAteCheckin = Math.floor(
      (reservation.checkin.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
    );
    const creditoRemarcacao = diasAteCheckin >= diasAntecedencia;

    const updated = await this.prisma.motorReservation.update({
      where: { id: reservation.id },
      data: { status: 'CANCELADA' },
    });
    await this.prisma.motorReservationEvent.create({
      data: {
        reservation_id: reservation.id,
        tipo: 'CANCELADA',
        autor,
        payload: {
          motivo: dto.motivo,
          dias_ate_checkin: diasAteCheckin,
          credito_remarcacao: creditoRemarcacao,
          valor_pago: Number(reservation.valor_pago),
        },
      },
    });
    return { ...updated, credito_remarcacao: creditoRemarcacao };
  }

  private async mustFind(tenantId: string, id: string) {
    const reservation = await this.prisma.motorReservation.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!reservation) throw new MotorNotFoundError('reserva nao encontrada');
    return reservation;
  }
}
```

Create `src/modules/reserve-motor/infrastructure/controllers/motor-reservation.controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../../../shared/auth/guards/admin-jwt.guard';
import { TenantGuard } from '../../../../shared/auth/guards/tenant.guard';
import { ModuleAccessGuard } from '../../../../shared/auth/guards/module-access.guard';
import { PermissionsGuard } from '../../../../shared/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../../shared/auth/decorators/require-permissions.decorator';
import { RequiresModule } from '../../../../shared/auth/decorators/requires-module.decorator';
import { AvailabilityQueryDto } from '../../application/dtos/availability.dto';
import {
  CancelDto,
  CreateManualReservationDto,
  ListReservationsQueryDto,
  RescheduleDto,
} from '../../application/dtos/reservation.dto';
import { AvailabilityService } from '../../application/services/availability.service';
import { ReservationService } from '../../application/services/reservation.service';

@Controller('motor/:tenantId')
@UseGuards(AdminJwtGuard, TenantGuard, ModuleAccessGuard, PermissionsGuard)
@RequiresModule('motor')
export class MotorReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Get('availability')
  @RequirePermissions('motor.read')
  async availability(@Param('tenantId') tenantId: string, @Query() query: AvailabilityQueryDto) {
    return this.availabilityService.search(tenantId, query);
  }

  @Get('reservations')
  @RequirePermissions('motor.read')
  async list(@Param('tenantId') tenantId: string, @Query() query: ListReservationsQueryDto) {
    return this.reservationService.list(tenantId, query);
  }

  @Get('reservations/:id')
  @RequirePermissions('motor.read')
  async detail(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.reservationService.detail(tenantId, id);
  }

  @Post('reservations')
  @RequirePermissions('motor.reservations.manage')
  async createManual(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateManualReservationDto,
    @Req() req: any,
  ) {
    return this.reservationService.createManual(tenantId, dto, req.admin_id ?? 'admin');
  }

  @Post('reservations/:id/reschedule')
  @RequirePermissions('motor.reservations.manage')
  async reschedule(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleDto,
    @Req() req: any,
  ) {
    return this.reservationService.reschedule(tenantId, id, dto, req.admin_id ?? 'admin');
  }

  @Post('reservations/:id/cancel')
  @RequirePermissions('motor.reservations.manage')
  async cancel(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: CancelDto,
    @Req() req: any,
  ) {
    return this.reservationService.cancel(tenantId, id, dto, req.admin_id ?? 'admin');
  }
}
```

Em `motor-bot.controller.ts`, adicionar as rotas do bot (spec §2), injetando `ReservationService`:

```ts
  @Post('reservations/:id/reschedule')
  @HttpCode(200)
  async reschedule(@Req() req: any, @Param('id') id: string, @Body() dto: RescheduleDto) {
    return this.reservationService.reschedule(req.tenant_id, id, dto, 'bot');
  }

  @Post('reservations/:id/cancel')
  @HttpCode(200)
  async cancel(@Req() req: any, @Param('id') id: string, @Body() dto: CancelDto) {
    return this.reservationService.cancel(req.tenant_id, id, dto, 'bot');
  }
```

Em `reserve-motor.module.ts`: adicionar `MotorReservationController` a `controllers` e `ReservationService` a `providers`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- reserve-motor`
Expected: PASS em todos os specs do módulo.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-motor
git commit -m "feat(motor): reservas admin com remarcacao e cancelamento por politica

Lista/detalhe com eventos, reserva manual com o mesmo protocolo de
lock do hold, remarcacao que mantem valor_pago (nao e cancelar+criar)
e cancelamento aplicando a politica do tenant (credito >= N dias).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Blocks — bloqueio manual, mensalista permanente

**Repo:** `BACK`

**Files:**
- Create: `src/modules/reserve-motor/application/services/block.service.ts` (+ `block.service.spec.ts`)
- Create: `src/modules/reserve-motor/application/dtos/block.dto.ts`
- Create: `src/modules/reserve-motor/infrastructure/controllers/motor-block.controller.ts`
- Modify: `src/modules/reserve-motor/reserve-motor.module.ts`

**Interfaces:**
- Consumes: modelos (Task 1), erros (Task 2).
- Produces:
  - `BlockService.list(tenantId, { unit_id?, from?, to? })`, `BlockService.create(tenantId, dto, autor)`, `BlockService.remove(tenantId, id)`.
  - Regra: block com reservation ativa sobreposta é rejeitado (`MotorValidationError`) — bloqueio não expulsa hóspede; a equipe resolve a reserva antes.
  - `motivo=MENSALISTA` sem `data_fim` → bloqueio permanente (spec regra v5: a API de disponibilidade NUNCA oferece a unit).
  - Rotas: `GET/POST /api/motor/:tenantId/blocks`, `DELETE /api/motor/:tenantId/blocks/:id` (permissão `motor.blocks.manage`; GET com `motor.read`).

- [ ] **Step 1: Teste falhando**

Create `src/modules/reserve-motor/application/services/block.service.spec.ts`:

```ts
import { BlockService } from './block.service';
import { MotorValidationError } from '../../domain/errors/motor.errors';

const tenantId = 'tenant_1';

function buildPrisma(overlappingReservations = 0) {
  return {
    motorUnit: { findFirst: jest.fn().mockResolvedValue({ id: 'u_1' }) },
    motorReservation: { count: jest.fn().mockResolvedValue(overlappingReservations) },
    motorBlock: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ id: 'b_1', tenant_id: tenantId }),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'b_1', ...data })),
      delete: jest.fn().mockResolvedValue({ id: 'b_1' }),
    },
  };
}

describe('BlockService', () => {
  it('cria block permanente de mensalista (data_fim null)', async () => {
    const prisma = buildPrisma();
    const service = new BlockService(prisma as any);
    const block = await service.create(
      tenantId,
      { unit_id: 'u_1', data_inicio: '2026-09-01', motivo: 'MENSALISTA' } as any,
      'admin_1',
    );
    expect(block.data_fim).toBeNull();
    expect(prisma.motorBlock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenant_id: tenantId, motivo: 'MENSALISTA', data_fim: null }),
      }),
    );
  });

  it('rejeita block sobre reserva ativa (bloqueio nao expulsa hospede)', async () => {
    const prisma = buildPrisma(1);
    const service = new BlockService(prisma as any);
    await expect(
      service.create(
        tenantId,
        { unit_id: 'u_1', data_inicio: '2026-09-01', data_fim: '2026-09-10', motivo: 'MANUTENCAO' } as any,
        'admin_1',
      ),
    ).rejects.toBeInstanceOf(MotorValidationError);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- block.service`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/modules/reserve-motor/application/dtos/block.dto.ts`:

```ts
import { IsDateString, IsIn, IsOptional, IsString, Length } from 'class-validator';

export const BLOCK_MOTIVOS = ['MANUTENCAO', 'USO_PROPRIO', 'MENSALISTA', 'OUTRO'] as const;

export class CreateBlockDto {
  @IsString() unit_id: string;
  @IsDateString() data_inicio: string;
  @IsOptional() @IsDateString() data_fim?: string;
  @IsIn(BLOCK_MOTIVOS) motivo: string;
  @IsOptional() @IsString() @Length(0, 500) nota?: string;
}
```

Create `src/modules/reserve-motor/application/services/block.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { utcDate } from '../../domain/constants/motor.constants';
import { MotorNotFoundError, MotorValidationError } from '../../domain/errors/motor.errors';
import { CreateBlockDto } from '../dtos/block.dto';

@Injectable()
export class BlockService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, filters: { unit_id?: string; from?: string; to?: string }) {
    return this.prisma.motorBlock.findMany({
      where: {
        tenant_id: tenantId,
        ...(filters.unit_id ? { unit_id: filters.unit_id } : {}),
        ...(filters.to ? { data_inicio: { lt: utcDate(filters.to) } } : {}),
        ...(filters.from
          ? { OR: [{ data_fim: null }, { data_fim: { gt: utcDate(filters.from) } }] }
          : {}),
      },
      orderBy: { data_inicio: 'asc' },
    });
  }

  /**
   * data_fim null = permanente (MENSALISTA, spec regra v5: a unit NUNCA e
   * oferecida, mesmo com o mensalista ausente). Block sobre reserva ativa e
   * rejeitado — a equipe resolve a reserva antes de bloquear.
   */
  async create(tenantId: string, dto: CreateBlockDto, autor: string) {
    const unit = await this.prisma.motorUnit.findFirst({
      where: { id: dto.unit_id, tenant_id: tenantId },
    });
    if (!unit) throw new MotorNotFoundError('unit nao encontrada');
    const inicio = utcDate(dto.data_inicio);
    const fim = dto.data_fim ? utcDate(dto.data_fim) : null;
    if (fim && fim <= inicio) {
      throw new MotorValidationError('data_fim deve ser posterior a data_inicio');
    }
    const conflitos = await this.prisma.motorReservation.count({
      where: {
        tenant_id: tenantId,
        unit_id: dto.unit_id,
        status: { in: ['HOLD', 'CONFIRMADA', 'CHECKIN_FEITO'] },
        checkin: fim ? { lt: fim } : undefined,
        checkout: { gt: inicio },
      },
    });
    if (conflitos > 0) {
      throw new MotorValidationError(
        'ha reserva ativa no periodo — resolva a reserva antes de bloquear',
      );
    }
    return this.prisma.motorBlock.create({
      data: {
        tenant_id: tenantId,
        unit_id: dto.unit_id,
        data_inicio: inicio,
        data_fim: fim,
        motivo: dto.motivo as any,
        nota: dto.nota ?? null,
        criado_por: autor,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const block = await this.prisma.motorBlock.findFirst({ where: { id, tenant_id: tenantId } });
    if (!block) throw new MotorNotFoundError('block nao encontrado');
    return this.prisma.motorBlock.delete({ where: { id } });
  }
}
```

Create `src/modules/reserve-motor/infrastructure/controllers/motor-block.controller.ts`:

```ts
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../../../shared/auth/guards/admin-jwt.guard';
import { TenantGuard } from '../../../../shared/auth/guards/tenant.guard';
import { ModuleAccessGuard } from '../../../../shared/auth/guards/module-access.guard';
import { PermissionsGuard } from '../../../../shared/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../../shared/auth/decorators/require-permissions.decorator';
import { RequiresModule } from '../../../../shared/auth/decorators/requires-module.decorator';
import { CreateBlockDto } from '../../application/dtos/block.dto';
import { BlockService } from '../../application/services/block.service';

@Controller('motor/:tenantId/blocks')
@UseGuards(AdminJwtGuard, TenantGuard, ModuleAccessGuard, PermissionsGuard)
@RequiresModule('motor')
export class MotorBlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get()
  @RequirePermissions('motor.read')
  async list(
    @Param('tenantId') tenantId: string,
    @Query('unit_id') unitId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.blockService.list(tenantId, { unit_id: unitId, from, to });
  }

  @Post()
  @RequirePermissions('motor.blocks.manage')
  async create(@Param('tenantId') tenantId: string, @Body() dto: CreateBlockDto, @Req() req: any) {
    return this.blockService.create(tenantId, dto, req.admin_id ?? 'admin');
  }

  @Delete(':id')
  @RequirePermissions('motor.blocks.manage')
  async remove(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.blockService.remove(tenantId, id);
  }
}
```

Em `reserve-motor.module.ts`: adicionar `MotorBlockController` / `BlockService`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- block.service`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-motor
git commit -m "feat(motor): bloqueios manuais com mensalista permanente

Block com data_fim null nunca libera a unit (regra v5); block sobre
reserva ativa e rejeitado.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Mapa do calendário (grid unidade × dia) + wiring spec dos guards

**Repo:** `BACK`

**Files:**
- Create: `src/modules/reserve-motor/application/services/calendar.service.ts` (+ `calendar.service.spec.ts`)
- Create: `src/modules/reserve-motor/infrastructure/controllers/motor-calendar.controller.ts`
- Create: `src/modules/reserve-motor/infrastructure/controllers/motor-wiring.spec.ts`
- Modify: `src/modules/reserve-motor/reserve-motor.module.ts`

**Interfaces:**
- Consumes: modelos (Task 1), helpers de data (Task 2).
- Produces:
  - `CalendarService.month(tenantId, mes: string)` → `{ mes, unidades: [{ unit_id, identificador, room_type_id, room_type_nome, dias: [{ data, estado, reservation_id?, hold_id?, block_id?, hospede_nome? }] }] }` com `estado ∈ 'LIVRE'|'HOLD'|'CONFIRMADA'|'OTA'|'BLOCK'|'MENSALISTA'`. Precedência: `MENSALISTA > BLOCK > OTA > CONFIRMADA > HOLD > LIVRE`.
  - Rota: `GET /api/motor/:tenantId/calendar?mes=2026-09` (permissão `motor.read`) — **este é o payload que a tela `/dashboard/motor/calendario` consome (Task 15).**

- [ ] **Step 1: Teste falhando**

Create `src/modules/reserve-motor/application/services/calendar.service.spec.ts`:

```ts
import { CalendarService } from './calendar.service';
import { utcDate } from '../../domain/constants/motor.constants';

const tenantId = 'tenant_1';

describe('CalendarService.month', () => {
  function buildPrisma() {
    return {
      motorUnit: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'u_1', identificador: 'Casal 01', room_type: { id: 'rt_1', nome: 'Suite Casal' } },
          { id: 'u_2', identificador: 'Chale 02', room_type: { id: 'rt_2', nome: 'Chale' } },
        ]),
      },
      motorReservation: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'r_1', unit_id: 'u_1', hospede_nome: 'Maria', origem: 'OTA_BOOKING',
            status: 'CONFIRMADA', checkin: utcDate('2026-09-05'), checkout: utcDate('2026-09-07'),
          },
        ]),
      },
      motorHold: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'h_1', unit_id: 'u_2', checkin: utcDate('2026-09-10'), checkout: utcDate('2026-09-11'),
            expires_at: new Date(Date.now() + 60_000),
          },
        ]),
      },
      motorBlock: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'b_1', unit_id: 'u_2', motivo: 'MENSALISTA', data_inicio: utcDate('2026-01-01'), data_fim: null },
        ]),
      },
    };
  }

  it('monta o grid do mes com estados e precedencia (mensalista > ota > hold)', async () => {
    const service = new CalendarService(buildPrisma() as any);
    const result = await service.month(tenantId, '2026-09');
    expect(result.mes).toBe('2026-09');
    expect(result.unidades).toHaveLength(2);

    const u1 = result.unidades[0];
    expect(u1.dias).toHaveLength(30); // setembro
    expect(u1.dias[4]).toMatchObject({ data: '2026-09-05', estado: 'OTA', reservation_id: 'r_1' });
    expect(u1.dias[6].estado).toBe('LIVRE'); // checkout exclusivo: dia 07 livre

    const u2 = result.unidades[1];
    // Block permanente de mensalista cobre o mes inteiro, inclusive onde ha hold.
    expect(u2.dias.every((d) => d.estado === 'MENSALISTA')).toBe(true);
  });

  it('rejeita mes mal formado', async () => {
    const service = new CalendarService(buildPrisma() as any);
    await expect(service.month(tenantId, 'setembro')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- calendar.service`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/modules/reserve-motor/application/services/calendar.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { addDaysUtc, isoDate, utcDate } from '../../domain/constants/motor.constants';
import { MotorValidationError } from '../../domain/errors/motor.errors';

export type CalendarEstado = 'LIVRE' | 'HOLD' | 'CONFIRMADA' | 'OTA' | 'BLOCK' | 'MENSALISTA';

export interface CalendarDia {
  data: string;
  estado: CalendarEstado;
  reservation_id?: string;
  hold_id?: string;
  block_id?: string;
  hospede_nome?: string;
}

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  /** Mapa unidade x dia do mes — o que a gerente le em 5 segundos (spec §5). */
  async month(tenantId: string, mes: string) {
    if (!/^\d{4}-\d{2}$/.test(mes ?? '')) {
      throw new MotorValidationError('mes deve ser YYYY-MM');
    }
    const start = utcDate(`${mes}-01`);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));

    const units = await this.prisma.motorUnit.findMany({
      where: { tenant_id: tenantId, ativo: true },
      include: { room_type: true },
      orderBy: [{ room_type_id: 'asc' }, { identificador: 'asc' }],
    });
    const reservations = await this.prisma.motorReservation.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: ['HOLD', 'CONFIRMADA', 'CHECKIN_FEITO'] },
        checkin: { lt: end },
        checkout: { gt: start },
      },
    });
    const holds = await this.prisma.motorHold.findMany({
      where: {
        tenant_id: tenantId,
        status: 'ATIVO',
        expires_at: { gt: new Date() },
        checkin: { lt: end },
        checkout: { gt: start },
      },
    });
    const blocks = await this.prisma.motorBlock.findMany({
      where: {
        tenant_id: tenantId,
        data_inicio: { lt: end },
        OR: [{ data_fim: null }, { data_fim: { gt: start } }],
      },
    });

    const unidades = units.map((unit: any) => {
      const dias: CalendarDia[] = [];
      for (let date = start; date < end; date = addDaysUtc(date, 1)) {
        dias.push(this.resolveDia(unit.id, date, reservations, holds, blocks));
      }
      return {
        unit_id: unit.id,
        identificador: unit.identificador,
        room_type_id: unit.room_type.id,
        room_type_nome: unit.room_type.nome,
        dias,
      };
    });
    return { mes, unidades };
  }

  /** Precedencia: MENSALISTA > BLOCK > OTA > CONFIRMADA > HOLD > LIVRE. */
  private resolveDia(
    unitId: string,
    date: Date,
    reservations: any[],
    holds: any[],
    blocks: any[],
  ): CalendarDia {
    const dia: CalendarDia = { data: isoDate(date), estado: 'LIVRE' };
    const block = blocks.find(
      (b) => b.unit_id === unitId && b.data_inicio <= date && (b.data_fim == null || date < b.data_fim),
    );
    if (block) {
      return { ...dia, estado: block.motivo === 'MENSALISTA' ? 'MENSALISTA' : 'BLOCK', block_id: block.id };
    }
    const reservation = reservations.find(
      (r) => r.unit_id === unitId && r.checkin <= date && date < r.checkout,
    );
    if (reservation) {
      return {
        ...dia,
        estado: String(reservation.origem).startsWith('OTA_') ? 'OTA' : 'CONFIRMADA',
        reservation_id: reservation.id,
        hospede_nome: reservation.hospede_nome,
      };
    }
    const hold = holds.find((h) => h.unit_id === unitId && h.checkin <= date && date < h.checkout);
    if (hold) return { ...dia, estado: 'HOLD', hold_id: hold.id };
    return dia;
  }
}
```

Create `src/modules/reserve-motor/infrastructure/controllers/motor-calendar.controller.ts`:

```ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../../../shared/auth/guards/admin-jwt.guard';
import { TenantGuard } from '../../../../shared/auth/guards/tenant.guard';
import { ModuleAccessGuard } from '../../../../shared/auth/guards/module-access.guard';
import { PermissionsGuard } from '../../../../shared/auth/guards/permissions.guard';
import { RequirePermissions } from '../../../../shared/auth/decorators/require-permissions.decorator';
import { RequiresModule } from '../../../../shared/auth/decorators/requires-module.decorator';
import { CalendarService } from '../../application/services/calendar.service';

@Controller('motor/:tenantId/calendar')
@UseGuards(AdminJwtGuard, TenantGuard, ModuleAccessGuard, PermissionsGuard)
@RequiresModule('motor')
export class MotorCalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @RequirePermissions('motor.read')
  async month(@Param('tenantId') tenantId: string, @Query('mes') mes: string) {
    return this.calendarService.month(tenantId, mes);
  }
}
```

Create `src/modules/reserve-motor/infrastructure/controllers/motor-wiring.spec.ts` (padrão do `client-portal-module-access-wiring.spec.ts`):

```ts
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { TenantGuard } from '../../../../shared/auth/guards/tenant.guard';
import { ModuleAccessGuard } from '../../../../shared/auth/guards/module-access.guard';
import { PermissionsGuard } from '../../../../shared/auth/guards/permissions.guard';
import { MotorRoomTypeController } from './motor-room-type.controller';
import { MotorUnitController } from './motor-unit.controller';
import { MotorDailyInventoryController } from './motor-daily-inventory.controller';
import { MotorTarifaController } from './motor-tarifa.controller';
import { MotorReservationController } from './motor-reservation.controller';
import { MotorBlockController } from './motor-block.controller';
import { MotorCalendarController } from './motor-calendar.controller';
import { MotorBotController } from './motor-bot.controller';

const REQUIRES_MODULE_KEY = 'requires_module';

const ADMIN_CONTROLLERS = [
  MotorRoomTypeController,
  MotorUnitController,
  MotorDailyInventoryController,
  MotorTarifaController,
  MotorReservationController,
  MotorBlockController,
  MotorCalendarController,
];

function classGuards(target: unknown): unknown[] {
  return Reflect.getMetadata(GUARDS_METADATA, target as object) ?? [];
}

describe('reserve-motor: wiring dos guards', () => {
  it.each(ADMIN_CONTROLLERS)('%p carrega @RequiresModule(motor) na classe', (Controller) => {
    expect(Reflect.getMetadata(REQUIRES_MODULE_KEY, Controller)).toBe('motor');
  });

  // ModuleAccessGuard le request.tenant_id; sem TenantGuard antes ele lanca
  // erro em vez de gatear. A ordem e parte do contrato, nao um detalhe.
  it.each(ADMIN_CONTROLLERS)('%p roda TenantGuard antes de ModuleAccessGuard', (Controller) => {
    const guards = classGuards(Controller);
    expect(guards.indexOf(TenantGuard)).toBeGreaterThanOrEqual(0);
    expect(guards.indexOf(TenantGuard)).toBeLessThan(guards.indexOf(ModuleAccessGuard));
  });

  it.each(ADMIN_CONTROLLERS)('%p roda PermissionsGuard por ultimo', (Controller) => {
    const guards = classGuards(Controller);
    expect(guards[guards.length - 1]).toBe(PermissionsGuard);
  });

  it('MotorBotController (API por chave do bot) fica fora do gate de modulo', () => {
    expect(Reflect.getMetadata(REQUIRES_MODULE_KEY, MotorBotController)).toBeUndefined();
  });
});
```

**Nota:** confirme o valor real de `REQUIRES_MODULE_KEY` no spec existente do client-portal (ele importa a constante de `src/shared/auth/decorators/` — importe do mesmo lugar em vez da string literal, se for exportada).

Em `reserve-motor.module.ts`: adicionar `MotorCalendarController` / `CalendarService`.

- [ ] **Step 4: Rodar TODA a suíte do módulo e o build**

Run: `npm test -- reserve-motor`
Expected: PASS (constants, room-type, unit, daily-inventory, tarifa, availability, hold, reservation, block, calendar, wiring).

Run: `npm test`
Expected: PASS — nenhuma regressão nos módulos existentes (atenção a `gateable-modules.spec` e `migrations.spec`).

Run: `npm run build`
Expected: compila.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-motor
git commit -m "feat(motor): mapa unidade x dia do calendario e wiring spec dos guards

GET /api/motor/:tenantId/calendar?mes= devolve o grid com estados
(livre/hold/confirmada/ota/block/mensalista) e o wiring spec trava a
cadeia de guards de todos os controllers do motor.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: Frontend — tipos, adapter `motorService` e hooks React Query

**Repo:** `FRONT`

**Files:**
- Create: `src/shared/domain/types/@motor.ts`
- Create: `src/modules/motor/infrastructure/adapters.ts`
- Create: `src/shared/hooks/motor/use-motor-config.ts`
- Create: `src/shared/hooks/motor/use-motor-calendar.ts`
- Create: `src/shared/hooks/motor/use-motor-reservations.ts`
- Create: `src/shared/hooks/motor/index.ts`
- Modify: `src/modules/MODULES.md` (registrar o módulo `motor` na tabela — obrigatório pela convenção)

**Interfaces:**
- Consumes: rotas `/api/motor/:tenantId/*` (Tasks 3–11); `api` de `@/src/infraestructure/axios/api`.
- Produces (usados pelas Tasks 13–16):
  - Tipos: `MotorRoomType`, `MotorUnit`, `MotorSeason`, `MotorPriceRule`, `MotorCancellationPolicy`, `MotorRatePlan`, `MotorTarifasOverview`, `MotorDailyInventoryRow`, `MotorReservation`, `MotorReservationEvent`, `MotorCalendar`, `MotorCalendarUnidade`, `MotorCalendarDia`, `MotorCalendarEstado`, `MotorBlock` + DTOs de input.
  - `motorService` com métodos listados abaixo.
  - Hooks: `useMotorRoomTypes`, `useCreateRoomType`, `useUpdateRoomType`, `useCreateUnit`, `useUpdateUnit`, `useMotorTarifas`, `useCreateSeason`, `useUpdateSeason`, `useDeleteSeason`, `useCreatePriceRule`, `useUpdatePriceRule`, `useDeletePriceRule`, `useCreatePolicy`, `useUpdatePolicy`, `useUpsertDailyInventory`, `useMotorCalendar`, `useCreateBlock`, `useDeleteBlock`, `useMotorReservations`, `useMotorReservation`, `useCreateManualReservation`, `useRescheduleReservation`, `useCancelReservation`.
  - Convenção de queryKey: `['motor', '<recurso>', tenantId, ...params]`; todo hook recebe `tenantId: string | null` e fica `enabled: !!tenantId`.

- [ ] **Step 1: Criar os tipos**

Create `src/shared/domain/types/@motor.ts`:

```ts
// Tipos do Motor de Reservas (docs/MOTOR_RESERVAS_RESERVE_MASTER.md).
// O backend serializa Decimal como string — o adapter converte para number
// antes de entregar aos componentes.

export interface MotorUnit {
  id: string;
  room_type_id: string;
  identificador: string;
  ativo: boolean;
}

export interface MotorRoomType {
  id: string;
  nome: string;
  descricao_curta: string | null;
  capacidade_base: number;
  capacidade_max: number;
  valor_pessoa_adicional: number;
  aceita_pets: boolean;
  taxa_pet_dia: number;
  ordem: number;
  ativo: boolean;
  units: MotorUnit[];
}

export interface MotorSeason {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  prioridade: number;
}

export interface MotorPriceRule {
  id: string;
  room_type_id: string;
  rate_plan_id: string | null;
  season_id: string | null;
  dow_mask: number;
  preco_noite: number;
  min_stay: number;
}

export interface MotorCancellationPolicy {
  id: string;
  nome: string;
  dias_antecedencia_remarcacao: number;
  reembolso_apos_prazo: boolean;
  taxa_noshow_percent: number;
}

export interface MotorRatePlan {
  id: string;
  room_type_id: string;
  nome: string;
  cancellation_policy_id: string | null;
  percentual_ajuste: number | null;
  ativo: boolean;
}

export interface MotorTarifasOverview {
  seasons: MotorSeason[];
  price_rules: MotorPriceRule[];
  policies: MotorCancellationPolicy[];
  rate_plans: MotorRatePlan[];
}

export interface MotorDailyInventoryRow {
  id: string;
  room_type_id: string;
  data: string;
  preco: number;
  min_stay: number;
  closed_arrival: boolean;
  closed_departure: boolean;
  stop_sell: boolean;
  override: boolean;
}

export type MotorReservationStatus =
  | 'HOLD'
  | 'CONFIRMADA'
  | 'CHECKIN_FEITO'
  | 'CONCLUIDA'
  | 'CANCELADA'
  | 'NOSHOW';

export type MotorReservationOrigem =
  | 'BOT_WHATSAPP'
  | 'OTA_BOOKING'
  | 'OTA_AIRBNB'
  | 'OTA_DECOLAR'
  | 'SITE_HSYSTEM'
  | 'MANUAL';

export interface MotorReservationEvent {
  id: string;
  tipo: string;
  payload: Record<string, unknown> | null;
  autor: string | null;
  created_at: string;
}

export interface MotorReservation {
  id: string;
  room_type_id: string;
  unit_id: string;
  checkin: string;
  checkout: string;
  status: MotorReservationStatus;
  origem: MotorReservationOrigem;
  hospede_nome: string;
  hospede_telefone: string | null;
  hospede_email: string | null;
  adultos: number;
  criancas: number;
  pets: number;
  valor_total: number;
  valor_pago: number;
  saldo_checkin: number;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
  unit?: MotorUnit;
  room_type?: MotorRoomType;
  events?: MotorReservationEvent[];
}

export type MotorCalendarEstado = 'LIVRE' | 'HOLD' | 'CONFIRMADA' | 'OTA' | 'BLOCK' | 'MENSALISTA';

export interface MotorCalendarDia {
  data: string;
  estado: MotorCalendarEstado;
  reservation_id?: string;
  hold_id?: string;
  block_id?: string;
  hospede_nome?: string;
}

export interface MotorCalendarUnidade {
  unit_id: string;
  identificador: string;
  room_type_id: string;
  room_type_nome: string;
  dias: MotorCalendarDia[];
}

export interface MotorCalendar {
  mes: string;
  unidades: MotorCalendarUnidade[];
}

export interface MotorBlock {
  id: string;
  unit_id: string;
  data_inicio: string;
  data_fim: string | null;
  motivo: 'MANUTENCAO' | 'USO_PROPRIO' | 'MENSALISTA' | 'OUTRO';
  nota: string | null;
}

// ── DTOs de input ────────────────────────────────────────────────────────────

export interface CreateMotorRoomTypeDto {
  nome: string;
  descricao_curta?: string;
  capacidade_base: number;
  capacidade_max: number;
  valor_pessoa_adicional?: number;
  aceita_pets?: boolean;
  taxa_pet_dia?: number;
}

export type UpdateMotorRoomTypeDto = Partial<CreateMotorRoomTypeDto> & { ativo?: boolean };

export interface CreateMotorUnitDto {
  room_type_id: string;
  identificador: string;
}

export interface CreateMotorSeasonDto {
  nome: string;
  data_inicio: string;
  data_fim: string;
  prioridade?: number;
}

export interface CreateMotorPriceRuleDto {
  room_type_id: string;
  season_id?: string;
  dow_mask: number;
  preco_noite: number;
  min_stay?: number;
}

export interface CreateMotorPolicyDto {
  nome: string;
  dias_antecedencia_remarcacao: number;
  reembolso_apos_prazo: boolean;
  taxa_noshow_percent: number;
}

export interface UpsertMotorDailyInventoryDto {
  room_type_id: string;
  data: string;
  preco?: number;
  min_stay?: number;
  closed_arrival?: boolean;
  closed_departure?: boolean;
  stop_sell?: boolean;
}

export interface CreateMotorBlockDto {
  unit_id: string;
  data_inicio: string;
  data_fim?: string;
  motivo: MotorBlock['motivo'];
  nota?: string;
}

export interface CreateMotorManualReservationDto {
  room_type_id: string;
  unit_id?: string;
  checkin: string;
  checkout: string;
  hospede_nome: string;
  hospede_telefone?: string;
  adultos: number;
  criancas?: number;
  pets?: number;
  valor_total?: number;
  valor_pago?: number;
  origem?: 'MANUAL' | 'SITE_HSYSTEM';
  observacoes?: string;
}
```

- [ ] **Step 2: Criar o adapter**

Create `src/modules/motor/infrastructure/adapters.ts`:

```ts
import api from '@/src/infraestructure/axios/api';
import type {
  CreateMotorBlockDto,
  CreateMotorManualReservationDto,
  CreateMotorPolicyDto,
  CreateMotorPriceRuleDto,
  CreateMotorRoomTypeDto,
  CreateMotorSeasonDto,
  CreateMotorUnitDto,
  MotorBlock,
  MotorCalendar,
  MotorDailyInventoryRow,
  MotorReservation,
  MotorRoomType,
  MotorTarifasOverview,
  UpdateMotorRoomTypeDto,
  UpsertMotorDailyInventoryDto,
} from '@/src/shared/domain/types/@motor';

// Rotas admin do motor sao chaveadas por :tenantId no path — o header
// x-tenant-id e redundante e o interceptor o remove com x-skip-tenant
// (mesma convencao do hotelPortalService).
const adminConfig = { headers: { 'x-skip-tenant': 'true' } };

// Prisma Decimal chega como string no JSON; normaliza os campos de dinheiro.
function num(value: unknown): number {
  return value == null ? 0 : Number(value);
}

function normalizeRoomType(raw: any): MotorRoomType {
  return {
    ...raw,
    valor_pessoa_adicional: num(raw.valor_pessoa_adicional),
    taxa_pet_dia: num(raw.taxa_pet_dia),
    units: raw.units ?? [],
  };
}

function normalizeReservation(raw: any): MotorReservation {
  return {
    ...raw,
    checkin: String(raw.checkin).slice(0, 10),
    checkout: String(raw.checkout).slice(0, 10),
    valor_total: num(raw.valor_total),
    valor_pago: num(raw.valor_pago),
    saldo_checkin: num(raw.saldo_checkin),
  };
}

export const motorService = {
  // ── Acomodacoes ──────────────────────────────────────────────────────────
  async listRoomTypes(tenantId: string): Promise<MotorRoomType[]> {
    const res = await api.get(`/motor/${tenantId}/room-types`, adminConfig);
    return (res.data as any[]).map(normalizeRoomType);
  },
  async createRoomType(tenantId: string, dto: CreateMotorRoomTypeDto): Promise<MotorRoomType> {
    const res = await api.post(`/motor/${tenantId}/room-types`, dto, adminConfig);
    return normalizeRoomType(res.data);
  },
  async updateRoomType(tenantId: string, id: string, dto: UpdateMotorRoomTypeDto): Promise<MotorRoomType> {
    const res = await api.put(`/motor/${tenantId}/room-types/${id}`, dto, adminConfig);
    return normalizeRoomType(res.data);
  },
  async createUnit(tenantId: string, dto: CreateMotorUnitDto) {
    const res = await api.post(`/motor/${tenantId}/units`, dto, adminConfig);
    return res.data;
  },
  async updateUnit(tenantId: string, id: string, dto: { identificador?: string; ativo?: boolean }) {
    const res = await api.put(`/motor/${tenantId}/units/${id}`, dto, adminConfig);
    return res.data;
  },

  // ── Tarifas ──────────────────────────────────────────────────────────────
  async getTarifas(tenantId: string): Promise<MotorTarifasOverview> {
    const res = await api.get(`/motor/${tenantId}/tarifas`, adminConfig);
    const data = res.data as any;
    return {
      seasons: (data.seasons ?? []).map((s: any) => ({
        ...s,
        data_inicio: String(s.data_inicio).slice(0, 10),
        data_fim: String(s.data_fim).slice(0, 10),
      })),
      price_rules: (data.price_rules ?? []).map((r: any) => ({ ...r, preco_noite: num(r.preco_noite) })),
      policies: (data.policies ?? []).map((p: any) => ({ ...p, taxa_noshow_percent: num(p.taxa_noshow_percent) })),
      rate_plans: (data.rate_plans ?? []).map((p: any) => ({
        ...p,
        percentual_ajuste: p.percentual_ajuste == null ? null : num(p.percentual_ajuste),
      })),
    };
  },
  async createSeason(tenantId: string, dto: CreateMotorSeasonDto) {
    return (await api.post(`/motor/${tenantId}/tarifas/seasons`, dto, adminConfig)).data;
  },
  async updateSeason(tenantId: string, id: string, dto: Partial<CreateMotorSeasonDto>) {
    return (await api.put(`/motor/${tenantId}/tarifas/seasons/${id}`, dto, adminConfig)).data;
  },
  async deleteSeason(tenantId: string, id: string) {
    return (await api.delete(`/motor/${tenantId}/tarifas/seasons/${id}`, adminConfig)).data;
  },
  async createPriceRule(tenantId: string, dto: CreateMotorPriceRuleDto) {
    return (await api.post(`/motor/${tenantId}/tarifas/price-rules`, dto, adminConfig)).data;
  },
  async updatePriceRule(tenantId: string, id: string, dto: Partial<CreateMotorPriceRuleDto>) {
    return (await api.put(`/motor/${tenantId}/tarifas/price-rules/${id}`, dto, adminConfig)).data;
  },
  async deletePriceRule(tenantId: string, id: string) {
    return (await api.delete(`/motor/${tenantId}/tarifas/price-rules/${id}`, adminConfig)).data;
  },
  async createPolicy(tenantId: string, dto: CreateMotorPolicyDto) {
    return (await api.post(`/motor/${tenantId}/tarifas/policies`, dto, adminConfig)).data;
  },
  async updatePolicy(tenantId: string, id: string, dto: Partial<CreateMotorPolicyDto>) {
    return (await api.put(`/motor/${tenantId}/tarifas/policies/${id}`, dto, adminConfig)).data;
  },
  async listDailyInventory(
    tenantId: string,
    params: { room_type_id: string; from: string; to: string },
  ): Promise<MotorDailyInventoryRow[]> {
    const res = await api.get(`/motor/${tenantId}/daily-inventory`, { params, ...adminConfig });
    return (res.data as any[]).map((row) => ({
      ...row,
      data: String(row.data).slice(0, 10),
      preco: num(row.preco),
    }));
  },
  async upsertDailyInventory(tenantId: string, dto: UpsertMotorDailyInventoryDto) {
    return (await api.put(`/motor/${tenantId}/daily-inventory`, dto, adminConfig)).data;
  },

  // ── Calendario e blocks ──────────────────────────────────────────────────
  async getCalendar(tenantId: string, mes: string): Promise<MotorCalendar> {
    const res = await api.get(`/motor/${tenantId}/calendar`, { params: { mes }, ...adminConfig });
    return res.data as MotorCalendar;
  },
  async createBlock(tenantId: string, dto: CreateMotorBlockDto): Promise<MotorBlock> {
    return (await api.post(`/motor/${tenantId}/blocks`, dto, adminConfig)).data as MotorBlock;
  },
  async deleteBlock(tenantId: string, id: string) {
    return (await api.delete(`/motor/${tenantId}/blocks/${id}`, adminConfig)).data;
  },

  // ── Reservas ─────────────────────────────────────────────────────────────
  async listReservations(
    tenantId: string,
    params?: { from?: string; to?: string; status?: string; origem?: string },
  ): Promise<MotorReservation[]> {
    const res = await api.get(`/motor/${tenantId}/reservations`, { params, ...adminConfig });
    return (res.data as any[]).map(normalizeReservation);
  },
  async getReservation(tenantId: string, id: string): Promise<MotorReservation> {
    const res = await api.get(`/motor/${tenantId}/reservations/${id}`, adminConfig);
    return normalizeReservation(res.data);
  },
  async createManualReservation(tenantId: string, dto: CreateMotorManualReservationDto) {
    return normalizeReservation(
      (await api.post(`/motor/${tenantId}/reservations`, dto, adminConfig)).data,
    );
  },
  async rescheduleReservation(
    tenantId: string,
    id: string,
    dto: { novo_checkin: string; novo_checkout: string },
  ) {
    return normalizeReservation(
      (await api.post(`/motor/${tenantId}/reservations/${id}/reschedule`, dto, adminConfig)).data,
    );
  },
  async cancelReservation(tenantId: string, id: string, dto: { motivo: string }) {
    return (await api.post(`/motor/${tenantId}/reservations/${id}/cancel`, dto, adminConfig)).data;
  },
};
```

- [ ] **Step 3: Criar os hooks**

Create `src/shared/hooks/motor/use-motor-config.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motorService } from '@/src/modules/motor/infrastructure/adapters';
import type {
  CreateMotorPolicyDto,
  CreateMotorPriceRuleDto,
  CreateMotorRoomTypeDto,
  CreateMotorSeasonDto,
  CreateMotorUnitDto,
  UpdateMotorRoomTypeDto,
  UpsertMotorDailyInventoryDto,
} from '@/src/shared/domain/types/@motor';

// Todos recebem tenantId explicito e ficam desabilitados enquanto ele for
// nulo — mesma regra dos hooks do hotel-portal (nunca sessao implicita).

export function useMotorRoomTypes(tenantId: string | null) {
  return useQuery({
    queryKey: ['motor', 'room-types', tenantId],
    queryFn: () => motorService.listRoomTypes(tenantId!),
    enabled: !!tenantId,
  });
}

function useInvalidate(keys: string[][]) {
  const qc = useQueryClient();
  return () => keys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
}

export function useCreateRoomType(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'room-types', tenantId]]);
  return useMutation({
    mutationFn: (dto: CreateMotorRoomTypeDto) => motorService.createRoomType(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useUpdateRoomType(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'room-types', tenantId]]);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMotorRoomTypeDto }) =>
      motorService.updateRoomType(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useCreateUnit(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'room-types', tenantId]]);
  return useMutation({
    mutationFn: (dto: CreateMotorUnitDto) => motorService.createUnit(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useUpdateUnit(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'room-types', tenantId]]);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { identificador?: string; ativo?: boolean } }) =>
      motorService.updateUnit(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useMotorTarifas(tenantId: string | null) {
  return useQuery({
    queryKey: ['motor', 'tarifas', tenantId],
    queryFn: () => motorService.getTarifas(tenantId!),
    enabled: !!tenantId,
  });
}

const tarifaKeys = (tenantId: string) => [
  ['motor', 'tarifas', tenantId],
  ['motor', 'daily-inventory', tenantId],
];

export function useCreateSeason(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: (dto: CreateMotorSeasonDto) => motorService.createSeason(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useUpdateSeason(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateMotorSeasonDto> }) =>
      motorService.updateSeason(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useDeleteSeason(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: (id: string) => motorService.deleteSeason(tenantId, id),
    onSuccess: invalidate,
  });
}

export function useCreatePriceRule(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: (dto: CreateMotorPriceRuleDto) => motorService.createPriceRule(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useUpdatePriceRule(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateMotorPriceRuleDto> }) =>
      motorService.updatePriceRule(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useDeletePriceRule(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: (id: string) => motorService.deletePriceRule(tenantId, id),
    onSuccess: invalidate,
  });
}

export function useCreatePolicy(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'tarifas', tenantId]]);
  return useMutation({
    mutationFn: (dto: CreateMotorPolicyDto) => motorService.createPolicy(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useUpdatePolicy(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'tarifas', tenantId]]);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateMotorPolicyDto> }) =>
      motorService.updatePolicy(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useMotorDailyInventory(
  tenantId: string | null,
  params: { room_type_id: string; from: string; to: string } | null,
) {
  return useQuery({
    queryKey: ['motor', 'daily-inventory', tenantId, params],
    queryFn: () => motorService.listDailyInventory(tenantId!, params!),
    enabled: !!tenantId && !!params?.room_type_id,
  });
}

export function useUpsertDailyInventory(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'daily-inventory', tenantId]]);
  return useMutation({
    mutationFn: (dto: UpsertMotorDailyInventoryDto) =>
      motorService.upsertDailyInventory(tenantId, dto),
    onSuccess: invalidate,
  });
}
```

Create `src/shared/hooks/motor/use-motor-calendar.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motorService } from '@/src/modules/motor/infrastructure/adapters';
import type { CreateMotorBlockDto } from '@/src/shared/domain/types/@motor';

export function useMotorCalendar(tenantId: string | null, mes: string) {
  return useQuery({
    queryKey: ['motor', 'calendar', tenantId, mes],
    queryFn: () => motorService.getCalendar(tenantId!, mes),
    enabled: !!tenantId && /^\d{4}-\d{2}$/.test(mes),
  });
}

export function useCreateBlock(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMotorBlockDto) => motorService.createBlock(tenantId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['motor', 'calendar', tenantId] }),
  });
}

export function useDeleteBlock(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => motorService.deleteBlock(tenantId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['motor', 'calendar', tenantId] }),
  });
}
```

Create `src/shared/hooks/motor/use-motor-reservations.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motorService } from '@/src/modules/motor/infrastructure/adapters';
import type { CreateMotorManualReservationDto } from '@/src/shared/domain/types/@motor';

export function useMotorReservations(
  tenantId: string | null,
  params?: { from?: string; to?: string; status?: string; origem?: string },
) {
  return useQuery({
    queryKey: ['motor', 'reservations', tenantId, params],
    queryFn: () => motorService.listReservations(tenantId!, params),
    enabled: !!tenantId,
  });
}

export function useMotorReservation(tenantId: string | null, id: string | null) {
  return useQuery({
    queryKey: ['motor', 'reservations', tenantId, 'detail', id],
    queryFn: () => motorService.getReservation(tenantId!, id!),
    enabled: !!tenantId && !!id,
  });
}

function useInvalidateReservations(tenantId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['motor', 'reservations', tenantId] });
    qc.invalidateQueries({ queryKey: ['motor', 'calendar', tenantId] });
  };
}

export function useCreateManualReservation(tenantId: string) {
  const invalidate = useInvalidateReservations(tenantId);
  return useMutation({
    mutationFn: (dto: CreateMotorManualReservationDto) =>
      motorService.createManualReservation(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useRescheduleReservation(tenantId: string) {
  const invalidate = useInvalidateReservations(tenantId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { novo_checkin: string; novo_checkout: string } }) =>
      motorService.rescheduleReservation(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useCancelReservation(tenantId: string) {
  const invalidate = useInvalidateReservations(tenantId);
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      motorService.cancelReservation(tenantId, id, { motivo }),
    onSuccess: invalidate,
  });
}
```

Create `src/shared/hooks/motor/index.ts`:

```ts
export * from './use-motor-config';
export * from './use-motor-calendar';
export * from './use-motor-reservations';
```

- [ ] **Step 4: Registrar o módulo em `src/modules/MODULES.md`**

Adicionar linha na tabela de módulos: `motor` — "Motor de Reservas: adapter HTTP para /api/motor (acomodações, tarifas, calendário de ocupação, reservas, blocks)".

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros novos.

- [ ] **Step 6: Commit**

```bash
git add src/shared/domain/types/@motor.ts src/modules/motor src/shared/hooks/motor src/modules/MODULES.md
git commit -m "feat(motor): tipos, adapter motorService e hooks react-query do motor

Camada de dados completa para as telas do motor: normalizacao de
Decimal->number, x-skip-tenant nas rotas por :tenantId e queryKeys
['motor', recurso, tenantId].

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: Tela `/dashboard/motor/acomodacoes` (CRUD de tipos e unidades)

**Repo:** `FRONT`

**Files:**
- Create: `src/app/dashboard/motor/acomodacoes/page.tsx`
- Create: `src/presentation/components/pages/dashboard/motor/acomodacoes/page.tsx`
- Create: `src/presentation/components/pages/dashboard/motor/acomodacoes/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: `useMotorRoomTypes`, `useCreateRoomType`, `useUpdateRoomType`, `useCreateUnit`, `useUpdateUnit` (Task 12); `useTenantCapabilities` de `@/src/modules/settings/presentation/hooks/tenant-capabilities-provider`; `PainelPageShell`; HeroUI.
- Produces: página `MotorAcomodacoesPage` (default export).

- [ ] **Step 1: Teste falhando**

Create `src/presentation/components/pages/dashboard/motor/acomodacoes/__tests__/page.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MotorAcomodacoesPage from "../page";

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({
    tenantId: "tenant_1",
    hasPermission: () => true,
  }),
}));

const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/src/shared/hooks/motor", () => ({
  useMotorRoomTypes: () => ({
    data: [
      {
        id: "rt_1",
        nome: "Suíte Casal",
        descricao_curta: null,
        capacidade_base: 2,
        capacidade_max: 3,
        valor_pessoa_adicional: 80,
        aceita_pets: true,
        taxa_pet_dia: 50,
        ordem: 0,
        ativo: true,
        units: [
          { id: "u_1", room_type_id: "rt_1", identificador: "Casal 01", ativo: true },
          { id: "u_2", room_type_id: "rt_1", identificador: "Casal 02", ativo: true },
        ],
      },
    ],
    isLoading: false,
    isError: false,
  }),
  useCreateRoomType: () => mutation,
  useUpdateRoomType: () => mutation,
  useCreateUnit: () => mutation,
  useUpdateUnit: () => mutation,
}));

describe("MotorAcomodacoesPage", () => {
  it("lista os tipos com capacidade e unidades", () => {
    render(<MotorAcomodacoesPage />);
    expect(screen.getByText("Acomodações")).toBeInTheDocument();
    expect(screen.getByText("Suíte Casal")).toBeInTheDocument();
    expect(screen.getByText("Casal 01")).toBeInTheDocument();
    expect(screen.getByText("Casal 02")).toBeInTheDocument();
    expect(screen.getByText(/2 \+ 1 pessoas/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- motor/acomodacoes`
Expected: FAIL — página inexistente.

- [ ] **Step 3: Implementar**

Create `src/app/dashboard/motor/acomodacoes/page.tsx` (arquivo INTEIRO):

```tsx
export { default } from "@/src/presentation/components/pages/dashboard/motor/acomodacoes/page";
```

Create `src/presentation/components/pages/dashboard/motor/acomodacoes/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button, Card, CardBody, Chip, Input, Switch } from "@heroui/react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import {
  useCreateRoomType,
  useCreateUnit,
  useMotorRoomTypes,
  useUpdateRoomType,
  useUpdateUnit,
} from "@/src/shared/hooks/motor";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

interface RoomTypeForm {
  nome: string;
  capacidade_base: number;
  aceita_pets: boolean;
  valor_pessoa_adicional: number;
  taxa_pet_dia: number;
}

const EMPTY_FORM: RoomTypeForm = {
  nome: "",
  capacidade_base: 2,
  aceita_pets: false,
  valor_pessoa_adicional: 0,
  taxa_pet_dia: 0,
};

export default function MotorAcomodacoesPage() {
  const { tenantId, hasPermission } = useTenantCapabilities();
  const { data: roomTypes, isLoading, isError } = useMotorRoomTypes(tenantId);
  const createRoomType = useCreateRoomType(tenantId ?? "");
  const updateRoomType = useUpdateRoomType(tenantId ?? "");
  const createUnit = useCreateUnit(tenantId ?? "");
  const updateUnit = useUpdateUnit(tenantId ?? "");
  const canManage = hasPermission("motor.settings.manage");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RoomTypeForm>(EMPTY_FORM);
  const [newUnit, setNewUnit] = useState<Record<string, string>>({});

  async function handleCreate() {
    if (!form.nome.trim()) return toast.error("Informe o nome do tipo");
    try {
      await createRoomType.mutateAsync({
        nome: form.nome,
        capacidade_base: form.capacidade_base,
        // Regra do motor: no maximo 1 pessoa adicional por quarto.
        capacidade_max: form.capacidade_base + 1,
        aceita_pets: form.aceita_pets,
        valor_pessoa_adicional: form.valor_pessoa_adicional,
        taxa_pet_dia: form.taxa_pet_dia,
      });
      toast.success("Tipo de acomodação criado");
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      toast.error("Erro ao criar o tipo");
    }
  }

  async function handleAddUnit(roomTypeId: string) {
    const identificador = (newUnit[roomTypeId] ?? "").trim();
    if (!identificador) return toast.error("Informe o identificador da unidade");
    try {
      await createUnit.mutateAsync({ room_type_id: roomTypeId, identificador });
      toast.success("Unidade adicionada");
      setNewUnit((prev) => ({ ...prev, [roomTypeId]: "" }));
    } catch {
      toast.error("Erro ao adicionar a unidade");
    }
  }

  return (
    <PainelPageShell
      title="Acomodações"
      description="Os tipos que o bot vende e as unidades que o calendário controla."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar as acomodações."
      actions={
        canManage ? (
          <Button color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => setShowForm((v) => !v)}>
            Novo tipo
          </Button>
        ) : undefined
      }
    >
      {showForm ? (
        <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
          <CardBody className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              label="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <Input
              label="Pessoas incluídas no preço"
              type="number"
              value={String(form.capacidade_base)}
              onChange={(e) => setForm({ ...form, capacidade_base: Number(e.target.value) || 1 })}
            />
            <Input
              label="Valor por pessoa adicional (noite)"
              type="number"
              value={String(form.valor_pessoa_adicional)}
              onChange={(e) => setForm({ ...form, valor_pessoa_adicional: Number(e.target.value) || 0 })}
            />
            <Input
              label="Taxa de pet por dia"
              type="number"
              value={String(form.taxa_pet_dia)}
              onChange={(e) => setForm({ ...form, taxa_pet_dia: Number(e.target.value) || 0 })}
            />
            <div className="flex items-end gap-4">
              <Switch isSelected={form.aceita_pets} onValueChange={(v) => setForm({ ...form, aceita_pets: v })}>
                Aceita pets
              </Switch>
              <Button color="primary" isLoading={createRoomType.isPending} onPress={handleCreate}>
                Salvar
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {roomTypes && roomTypes.length > 0 ? (
        <div className="space-y-6">
          {roomTypes.map((roomType) => (
            <Card key={roomType.id} className="rounded-3xl border border-border bg-default-50 shadow-none">
              <CardBody className="space-y-4 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{roomType.nome}</h2>
                    <p className="text-sm text-muted-foreground">
                      {roomType.capacidade_base} + {roomType.capacidade_max - roomType.capacidade_base} pessoas
                      {" · adicional "}
                      {fmtBRL(roomType.valor_pessoa_adicional)}/noite
                      {roomType.aceita_pets ? ` · pet ${fmtBRL(roomType.taxa_pet_dia)}/dia` : " · não aceita pets"}
                    </p>
                  </div>
                  {canManage ? (
                    <Switch
                      isSelected={roomType.ativo}
                      onValueChange={async (ativo) => {
                        await updateRoomType.mutateAsync({ id: roomType.id, dto: { ativo } });
                        toast.success(ativo ? "Tipo reativado" : "Tipo desativado");
                      }}
                    >
                      Ativo
                    </Switch>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {roomType.units.map((unit) => (
                    <Chip
                      key={unit.id}
                      color={unit.ativo ? "primary" : "default"}
                      variant="flat"
                      onClose={
                        canManage && unit.ativo
                          ? async () => {
                              await updateUnit.mutateAsync({ id: unit.id, dto: { ativo: false } });
                              toast.success(`${unit.identificador} desativada`);
                            }
                          : undefined
                      }
                    >
                      {unit.identificador}
                    </Chip>
                  ))}
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      <Input
                        aria-label={`Nova unidade de ${roomType.nome}`}
                        className="w-40"
                        placeholder="Ex.: Casal 03"
                        size="sm"
                        value={newUnit[roomType.id] ?? ""}
                        onChange={(e) => setNewUnit((prev) => ({ ...prev, [roomType.id]: e.target.value }))}
                      />
                      <Button size="sm" variant="flat" onPress={() => handleAddUnit(roomType.id)}>
                        Adicionar unidade
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <PortalEmptyState
          title="Nenhum tipo de acomodação"
          description="Cadastre os tipos (ex.: Suíte Casal, Chalé) e as unidades físicas de cada um."
        />
      )}
    </PainelPageShell>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:run -- motor/acomodacoes`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/motor/acomodacoes src/presentation/components/pages/dashboard/motor/acomodacoes
git commit -m "feat(motor): tela de acomodacoes com crud de tipos e unidades

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: Tela `/dashboard/motor/tarifas` (temporadas, regras, políticas, edição pontual)

**Repo:** `FRONT`

**Files:**
- Create: `src/app/dashboard/motor/tarifas/page.tsx`
- Create: `src/presentation/components/pages/dashboard/motor/tarifas/page.tsx`
- Create: `src/presentation/components/pages/dashboard/motor/tarifas/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: `useMotorTarifas`, `useMotorRoomTypes`, `useCreateSeason`, `useDeleteSeason`, `useCreatePriceRule`, `useDeletePriceRule`, `useCreatePolicy`, `useUpdatePolicy`, `useUpsertDailyInventory` (Task 12); `PainelPageShell`, `PainelSection`, `PortalDataTable`.
- Produces: página `MotorTarifasPage` (default export); constante `DOW_OPTIONS` (bitmask seg=1..dom=64) e helper `dowLabel(mask: number): string` locais da página.

- [ ] **Step 1: Teste falhando**

Create `src/presentation/components/pages/dashboard/motor/tarifas/__tests__/page.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MotorTarifasPage from "../page";

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "tenant_1", hasPermission: () => true }),
}));

const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/src/shared/hooks/motor", () => ({
  useMotorTarifas: () => ({
    data: {
      seasons: [{ id: "s_1", nome: "Alta — Julho", data_inicio: "2026-07-01", data_fim: "2026-07-31", prioridade: 1 }],
      price_rules: [
        { id: "pr_1", room_type_id: "rt_1", rate_plan_id: null, season_id: null, dow_mask: 96, preco_noite: 400, min_stay: 2 },
      ],
      policies: [
        { id: "cp_1", nome: "Padrão", dias_antecedencia_remarcacao: 7, reembolso_apos_prazo: false, taxa_noshow_percent: 100 },
      ],
      rate_plans: [],
    },
    isLoading: false,
    isError: false,
  }),
  useMotorRoomTypes: () => ({
    data: [{ id: "rt_1", nome: "Suíte Casal", units: [], capacidade_base: 2, capacidade_max: 3, valor_pessoa_adicional: 0, taxa_pet_dia: 0, aceita_pets: false, ordem: 0, ativo: true, descricao_curta: null }],
    isLoading: false,
    isError: false,
  }),
  useCreateSeason: () => mutation,
  useDeleteSeason: () => mutation,
  useCreatePriceRule: () => mutation,
  useDeletePriceRule: () => mutation,
  useCreatePolicy: () => mutation,
  useUpdatePolicy: () => mutation,
  useUpsertDailyInventory: () => mutation,
}));

describe("MotorTarifasPage", () => {
  it("mostra temporadas, regras de preco e politica", () => {
    render(<MotorTarifasPage />);
    expect(screen.getByText("Tarifas")).toBeInTheDocument();
    expect(screen.getByText("Alta — Julho")).toBeInTheDocument();
    expect(screen.getByText(/Sáb, Dom/)).toBeInTheDocument(); // dow_mask 96 = sab+dom
    expect(screen.getByText(/7 dias/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- motor/tarifas`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/app/dashboard/motor/tarifas/page.tsx` (arquivo INTEIRO):

```tsx
export { default } from "@/src/presentation/components/pages/dashboard/motor/tarifas/page";
```

Create `src/presentation/components/pages/dashboard/motor/tarifas/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button, Card, CardBody, Checkbox, Input, Select, SelectItem } from "@heroui/react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import {
  useCreatePolicy,
  useCreatePriceRule,
  useCreateSeason,
  useDeletePriceRule,
  useDeleteSeason,
  useMotorRoomTypes,
  useMotorTarifas,
  useUpdatePolicy,
  useUpsertDailyInventory,
} from "@/src/shared/hooks/motor";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

// Bitmask da spec: seg=1 ... dom=64.
const DOW_OPTIONS = [
  { bit: 1, label: "Seg" },
  { bit: 2, label: "Ter" },
  { bit: 4, label: "Qua" },
  { bit: 8, label: "Qui" },
  { bit: 16, label: "Sex" },
  { bit: 32, label: "Sáb" },
  { bit: 64, label: "Dom" },
];

function dowLabel(mask: number): string {
  if (mask === 127) return "Todos os dias";
  return DOW_OPTIONS.filter((d) => mask & d.bit)
    .map((d) => d.label)
    .join(", ");
}

export default function MotorTarifasPage() {
  const { tenantId, hasPermission } = useTenantCapabilities();
  const { data, isLoading, isError } = useMotorTarifas(tenantId);
  const { data: roomTypes } = useMotorRoomTypes(tenantId);
  const createSeason = useCreateSeason(tenantId ?? "");
  const deleteSeason = useDeleteSeason(tenantId ?? "");
  const createRule = useCreatePriceRule(tenantId ?? "");
  const deleteRule = useDeletePriceRule(tenantId ?? "");
  const createPolicy = useCreatePolicy(tenantId ?? "");
  const updatePolicy = useUpdatePolicy(tenantId ?? "");
  const upsertDay = useUpsertDailyInventory(tenantId ?? "");
  const canManage = hasPermission("motor.settings.manage");

  const [seasonForm, setSeasonForm] = useState({ nome: "", data_inicio: "", data_fim: "", prioridade: 0 });
  const [ruleForm, setRuleForm] = useState({ room_type_id: "", season_id: "", dow_mask: 127, preco_noite: 0, min_stay: 1 });
  const [dayForm, setDayForm] = useState({ room_type_id: "", data: "", preco: "", min_stay: "", stop_sell: false });
  const [policyDias, setPolicyDias] = useState<string>("");

  const roomTypeName = (id: string) => roomTypes?.find((rt) => rt.id === id)?.nome ?? id;
  const seasonName = (id: string | null) => (id ? (data?.seasons.find((s) => s.id === id)?.nome ?? id) : "Fora de temporada");

  async function submit(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast.success(ok);
    } catch {
      toast.error("Algo deu errado — confira os campos");
    }
  }

  const policy = data?.policies[0];

  return (
    <PainelPageShell
      title="Tarifas"
      description="Temporadas, preços por dia da semana, mínimo de noites e política de cancelamento."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar as tarifas."
    >
      <div className="space-y-10">
        <PainelSection title="Temporadas">
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="space-y-4 p-6">
              {data?.seasons.length ? (
                <ul className="space-y-2">
                  {data.seasons.map((season) => (
                    <li key={season.id} className="flex items-center justify-between rounded-xl bg-default-100 px-4 py-2 text-sm">
                      <span>
                        <strong>{season.nome}</strong> · {season.data_inicio} → {season.data_fim} · prioridade {season.prioridade}
                      </span>
                      {canManage ? (
                        <Button
                          isIconOnly
                          aria-label={`Excluir ${season.nome}`}
                          size="sm"
                          variant="light"
                          onPress={() => submit(() => deleteSeason.mutateAsync(season.id), "Temporada excluída")}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma temporada — vale a regra base o ano todo.</p>
              )}
              {canManage ? (
                <div className="grid gap-3 sm:grid-cols-5">
                  <Input label="Nome" value={seasonForm.nome} onChange={(e) => setSeasonForm({ ...seasonForm, nome: e.target.value })} />
                  <Input label="Início" type="date" value={seasonForm.data_inicio} onChange={(e) => setSeasonForm({ ...seasonForm, data_inicio: e.target.value })} />
                  <Input label="Fim" type="date" value={seasonForm.data_fim} onChange={(e) => setSeasonForm({ ...seasonForm, data_fim: e.target.value })} />
                  <Input label="Prioridade" type="number" value={String(seasonForm.prioridade)} onChange={(e) => setSeasonForm({ ...seasonForm, prioridade: Number(e.target.value) || 0 })} />
                  <Button
                    className="self-end"
                    color="primary"
                    onPress={() =>
                      submit(async () => {
                        await createSeason.mutateAsync(seasonForm);
                        setSeasonForm({ nome: "", data_inicio: "", data_fim: "", prioridade: 0 });
                      }, "Temporada criada")
                    }
                  >
                    Adicionar
                  </Button>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </PainelSection>

        <PainelSection title="Regras de preço">
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="space-y-4 p-6">
              {data?.price_rules.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-4">Acomodação</th>
                        <th className="py-2 pr-4">Temporada</th>
                        <th className="py-2 pr-4">Dias</th>
                        <th className="py-2 pr-4">Preço/noite</th>
                        <th className="py-2 pr-4">Mín. noites</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.price_rules.map((rule) => (
                        <tr key={rule.id} className="border-t border-border">
                          <td className="py-2 pr-4">{roomTypeName(rule.room_type_id)}</td>
                          <td className="py-2 pr-4">{seasonName(rule.season_id)}</td>
                          <td className="py-2 pr-4">{dowLabel(rule.dow_mask)}</td>
                          <td className="py-2 pr-4">{fmtBRL(rule.preco_noite)}</td>
                          <td className="py-2 pr-4">{rule.min_stay}</td>
                          <td className="py-2">
                            {canManage ? (
                              <Button
                                isIconOnly
                                aria-label="Excluir regra"
                                size="sm"
                                variant="light"
                                onPress={() => submit(() => deleteRule.mutateAsync(rule.id), "Regra excluída")}
                              >
                                <Trash2 className="h-4 w-4 text-danger" />
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma regra — o calendário fica sem preço (não vendável).</p>
              )}
              {canManage ? (
                <div className="grid gap-3 lg:grid-cols-6">
                  <Select
                    label="Acomodação"
                    selectedKeys={ruleForm.room_type_id ? [ruleForm.room_type_id] : []}
                    onChange={(e) => setRuleForm({ ...ruleForm, room_type_id: e.target.value })}
                  >
                    {(roomTypes ?? []).map((rt) => (
                      <SelectItem key={rt.id}>{rt.nome}</SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Temporada (opcional)"
                    selectedKeys={ruleForm.season_id ? [ruleForm.season_id] : []}
                    onChange={(e) => setRuleForm({ ...ruleForm, season_id: e.target.value })}
                  >
                    {(data?.seasons ?? []).map((s) => (
                      <SelectItem key={s.id}>{s.nome}</SelectItem>
                    ))}
                  </Select>
                  <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
                    {DOW_OPTIONS.map((d) => (
                      <Checkbox
                        key={d.bit}
                        isSelected={(ruleForm.dow_mask & d.bit) !== 0}
                        size="sm"
                        onValueChange={(checked) =>
                          setRuleForm({
                            ...ruleForm,
                            dow_mask: checked ? ruleForm.dow_mask | d.bit : ruleForm.dow_mask & ~d.bit,
                          })
                        }
                      >
                        {d.label}
                      </Checkbox>
                    ))}
                  </div>
                  <Input label="Preço/noite" type="number" value={String(ruleForm.preco_noite)} onChange={(e) => setRuleForm({ ...ruleForm, preco_noite: Number(e.target.value) || 0 })} />
                  <div className="flex items-end gap-2">
                    <Input label="Mín. noites" type="number" value={String(ruleForm.min_stay)} onChange={(e) => setRuleForm({ ...ruleForm, min_stay: Number(e.target.value) || 1 })} />
                    <Button
                      color="primary"
                      onPress={() =>
                        submit(async () => {
                          await createRule.mutateAsync({
                            room_type_id: ruleForm.room_type_id,
                            season_id: ruleForm.season_id || undefined,
                            dow_mask: ruleForm.dow_mask,
                            preco_noite: ruleForm.preco_noite,
                            min_stay: ruleForm.min_stay,
                          });
                        }, "Regra criada — calendário atualizado")
                      }
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </PainelSection>

        <PainelSection title="Edição pontual de data">
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="grid gap-3 p-6 sm:grid-cols-6">
              <Select
                label="Acomodação"
                selectedKeys={dayForm.room_type_id ? [dayForm.room_type_id] : []}
                onChange={(e) => setDayForm({ ...dayForm, room_type_id: e.target.value })}
              >
                {(roomTypes ?? []).map((rt) => (
                  <SelectItem key={rt.id}>{rt.nome}</SelectItem>
                ))}
              </Select>
              <Input label="Data" type="date" value={dayForm.data} onChange={(e) => setDayForm({ ...dayForm, data: e.target.value })} />
              <Input label="Preço (opcional)" type="number" value={dayForm.preco} onChange={(e) => setDayForm({ ...dayForm, preco: e.target.value })} />
              <Input label="Mín. noites (opcional)" type="number" value={dayForm.min_stay} onChange={(e) => setDayForm({ ...dayForm, min_stay: e.target.value })} />
              <Checkbox className="self-end" isSelected={dayForm.stop_sell} onValueChange={(v) => setDayForm({ ...dayForm, stop_sell: v })}>
                Fechar venda
              </Checkbox>
              <Button
                className="self-end"
                color="primary"
                isDisabled={!canManage}
                onPress={() =>
                  submit(async () => {
                    await upsertDay.mutateAsync({
                      room_type_id: dayForm.room_type_id,
                      data: dayForm.data,
                      preco: dayForm.preco ? Number(dayForm.preco) : undefined,
                      min_stay: dayForm.min_stay ? Number(dayForm.min_stay) : undefined,
                      stop_sell: dayForm.stop_sell,
                    });
                  }, "Data ajustada (não será sobrescrita pelo gerador)")
                }
              >
                Aplicar
              </Button>
            </CardBody>
          </Card>
        </PainelSection>

        <PainelSection title="Política de cancelamento">
          <Card className="rounded-3xl border border-border bg-default-50 shadow-none">
            <CardBody className="flex flex-wrap items-end gap-4 p-6">
              {policy ? (
                <p className="text-sm text-foreground">
                  Remarcação com crédito até <strong>{policy.dias_antecedencia_remarcacao} dias</strong> antes do
                  check-in; depois disso, sem reembolso automático. No-show cobra {policy.taxa_noshow_percent}%.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma política cadastrada — o padrão de 7 dias é aplicado.</p>
              )}
              {canManage ? (
                <div className="flex items-end gap-2">
                  <Input
                    className="w-44"
                    label="Dias de antecedência"
                    type="number"
                    value={policyDias}
                    onChange={(e) => setPolicyDias(e.target.value)}
                  />
                  <Button
                    color="primary"
                    onPress={() =>
                      submit(async () => {
                        const dias = Number(policyDias);
                        if (policy) {
                          await updatePolicy.mutateAsync({ id: policy.id, dto: { dias_antecedencia_remarcacao: dias } });
                        } else {
                          await createPolicy.mutateAsync({
                            nome: "Padrão",
                            dias_antecedencia_remarcacao: dias,
                            reembolso_apos_prazo: false,
                            taxa_noshow_percent: 100,
                          });
                        }
                      }, "Política salva")
                    }
                  >
                    Salvar
                  </Button>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </PainelSection>
      </div>
    </PainelPageShell>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:run -- motor/tarifas`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/motor/tarifas src/presentation/components/pages/dashboard/motor/tarifas
git commit -m "feat(motor): tela de tarifas com temporadas, regras dow e edicao pontual

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 15: Tela `/dashboard/motor/calendario` — mapa de ocupação unidade × dia

**Repo:** `FRONT`

**Files:**
- Create: `src/app/dashboard/motor/calendario/page.tsx`
- Create: `src/presentation/components/pages/dashboard/motor/calendario/page.tsx`
- Create: `src/presentation/components/organisms/motor/occupancy-grid.tsx`
- Create: `src/presentation/components/organisms/motor/cell-action-modal.tsx`
- Create: `src/presentation/components/organisms/motor/__tests__/occupancy-grid.test.tsx`

**Interfaces:**
- Consumes: `useMotorCalendar`, `useCreateBlock`, `useCreateManualReservation`, `useMotorRoomTypes` (Task 12); payload de `GET /calendar` (Task 11).
- Produces:
  - `OccupancyGrid({ calendar, onCellClick }: { calendar: MotorCalendar; onCellClick: (unidade: MotorCalendarUnidade, dia: MotorCalendarDia) => void })` — desktop: grid com primeira coluna sticky; mobile: lista por dia (spec §5).
  - `CellActionModal({ tenantId, unidade, dia, canManage, onClose })` — célula LIVRE: criar bloqueio ou reserva manual; célula ocupada: detalhes.
  - Página `MotorCalendarioPage` (default export).

- [ ] **Step 1: Teste falhando**

Create `src/presentation/components/organisms/motor/__tests__/occupancy-grid.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OccupancyGrid } from "../occupancy-grid";
import type { MotorCalendar } from "@/src/shared/domain/types/@motor";

const calendar: MotorCalendar = {
  mes: "2026-09",
  unidades: [
    {
      unit_id: "u_1",
      identificador: "Casal 01",
      room_type_id: "rt_1",
      room_type_nome: "Suíte Casal",
      dias: [
        { data: "2026-09-01", estado: "LIVRE" },
        { data: "2026-09-02", estado: "CONFIRMADA", reservation_id: "r_1", hospede_nome: "Maria" },
        { data: "2026-09-03", estado: "MENSALISTA", block_id: "b_1" },
      ],
    },
  ],
};

describe("OccupancyGrid", () => {
  it("renderiza uma linha por unidade e uma celula por dia com o estado", () => {
    render(<OccupancyGrid calendar={calendar} onCellClick={vi.fn()} />);
    expect(screen.getByText("Casal 01")).toBeInTheDocument();
    const cells = screen.getAllByRole("button", { name: /Casal 01/ });
    expect(cells).toHaveLength(3);
    expect(cells[1]).toHaveAccessibleName(expect.stringContaining("Confirmada"));
    expect(cells[2]).toHaveAccessibleName(expect.stringContaining("Mensalista"));
  });

  it("clique na celula devolve unidade e dia", () => {
    const onCellClick = vi.fn();
    render(<OccupancyGrid calendar={calendar} onCellClick={onCellClick} />);
    screen.getAllByRole("button", { name: /Casal 01/ })[0].click();
    expect(onCellClick).toHaveBeenCalledWith(
      expect.objectContaining({ unit_id: "u_1" }),
      expect.objectContaining({ data: "2026-09-01", estado: "LIVRE" }),
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- occupancy-grid`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/presentation/components/organisms/motor/occupancy-grid.tsx`:

```tsx
"use client";

import type {
  MotorCalendar,
  MotorCalendarDia,
  MotorCalendarEstado,
  MotorCalendarUnidade,
} from "@/src/shared/domain/types/@motor";

// Mapa legivel em 5 segundos (spec §5): cor por estado + legenda na pagina.
export const ESTADO_STYLES: Record<MotorCalendarEstado, { cell: string; label: string }> = {
  LIVRE: { cell: "bg-default-100 hover:bg-default-200", label: "Livre" },
  HOLD: { cell: "bg-warning/40", label: "Pré-reserva" },
  CONFIRMADA: { cell: "bg-success/50", label: "Confirmada" },
  OTA: { cell: "bg-primary/40", label: "OTA" },
  BLOCK: { cell: "bg-default-400/60", label: "Bloqueio" },
  MENSALISTA: { cell: "bg-secondary/40", label: "Mensalista" },
};

interface OccupancyGridProps {
  calendar: MotorCalendar;
  onCellClick: (unidade: MotorCalendarUnidade, dia: MotorCalendarDia) => void;
}

export function OccupancyGrid({ calendar, onCellClick }: OccupancyGridProps) {
  const days = calendar.unidades[0]?.dias ?? [];

  return (
    <>
      {/* Desktop: grid unidade x dia com primeira coluna fixa */}
      <div className="hidden overflow-x-auto rounded-3xl border border-border md:block">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-default-50 px-3 py-2 text-left font-medium">Unidade</th>
              {days.map((dia) => (
                <th key={dia.data} className="min-w-8 px-1 py-2 text-center font-normal text-muted-foreground">
                  {Number(dia.data.slice(8, 10))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendar.unidades.map((unidade) => (
              <tr key={unidade.unit_id} className="border-t border-border">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-default-50 px-3 py-1.5 font-medium">
                  {unidade.identificador}
                  <span className="ml-2 text-muted-foreground">{unidade.room_type_nome}</span>
                </td>
                {unidade.dias.map((dia) => (
                  <td key={dia.data} className="p-0.5">
                    <button
                      aria-label={`${unidade.identificador} ${dia.data}: ${ESTADO_STYLES[dia.estado].label}${dia.hospede_nome ? ` — ${dia.hospede_nome}` : ""}`}
                      className={`h-7 w-full rounded transition-colors ${ESTADO_STYLES[dia.estado].cell}`}
                      title={dia.hospede_nome ?? ESTADO_STYLES[dia.estado].label}
                      type="button"
                      onClick={() => onCellClick(unidade, dia)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: lista por dia com o que NAO esta livre (spec §5) */}
      <div className="space-y-3 md:hidden">
        {days.map((day) => {
          const ocupadas = calendar.unidades
            .map((unidade) => ({ unidade, dia: unidade.dias.find((d) => d.data === day.data)! }))
            .filter(({ dia }) => dia.estado !== "LIVRE");
          return (
            <div key={day.data} className="rounded-2xl border border-border bg-default-50 p-4">
              <p className="mb-2 text-sm font-semibold">{day.data}</p>
              {ocupadas.length ? (
                <ul className="space-y-1 text-sm">
                  {ocupadas.map(({ unidade, dia }) => (
                    <li key={unidade.unit_id}>
                      <button
                        aria-label={`${unidade.identificador} ${dia.data}: ${ESTADO_STYLES[dia.estado].label}`}
                        className="flex w-full items-center gap-2 text-left"
                        type="button"
                        onClick={() => onCellClick(unidade, dia)}
                      >
                        <span className={`h-3 w-3 rounded-full ${ESTADO_STYLES[dia.estado].cell}`} />
                        {unidade.identificador} — {ESTADO_STYLES[dia.estado].label}
                        {dia.hospede_nome ? ` (${dia.hospede_nome})` : ""}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Tudo livre</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
```

Create `src/presentation/components/organisms/motor/cell-action-modal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader, Select, SelectItem, Tab, Tabs } from "@heroui/react";
import toast from "react-hot-toast";
import { useCreateBlock } from "@/src/shared/hooks/motor/use-motor-calendar";
import { useCreateManualReservation } from "@/src/shared/hooks/motor/use-motor-reservations";
import type { MotorCalendarDia, MotorCalendarUnidade } from "@/src/shared/domain/types/@motor";
import { ESTADO_STYLES } from "./occupancy-grid";

const BLOCK_MOTIVOS = [
  { key: "MANUTENCAO", label: "Manutenção" },
  { key: "USO_PROPRIO", label: "Uso próprio" },
  { key: "MENSALISTA", label: "Mensalista (permanente)" },
  { key: "OUTRO", label: "Outro" },
];

interface CellActionModalProps {
  tenantId: string;
  unidade: MotorCalendarUnidade;
  dia: MotorCalendarDia;
  canManage: boolean;
  onClose: () => void;
}

export function CellActionModal({ tenantId, unidade, dia, canManage, onClose }: CellActionModalProps) {
  const createBlock = useCreateBlock(tenantId);
  const createReservation = useCreateManualReservation(tenantId);
  const [block, setBlock] = useState({ data_fim: "", motivo: "MANUTENCAO", nota: "" });
  const [reserva, setReserva] = useState({ checkout: "", hospede_nome: "", hospede_telefone: "", adultos: 2 });

  const livre = dia.estado === "LIVRE";

  async function handleBlock() {
    try {
      await createBlock.mutateAsync({
        unit_id: unidade.unit_id,
        data_inicio: dia.data,
        // Mensalista e bloqueio permanente: sem data_fim (regra v5).
        data_fim: block.motivo === "MENSALISTA" ? undefined : block.data_fim || undefined,
        motivo: block.motivo as never,
        nota: block.nota || undefined,
      });
      toast.success("Bloqueio criado");
      onClose();
    } catch {
      toast.error("Não foi possível bloquear — há reserva no período?");
    }
  }

  async function handleReserva() {
    if (!reserva.hospede_nome.trim() || !reserva.checkout) {
      return toast.error("Informe hóspede e data de saída");
    }
    try {
      await createReservation.mutateAsync({
        room_type_id: unidade.room_type_id,
        unit_id: unidade.unit_id,
        checkin: dia.data,
        checkout: reserva.checkout,
        hospede_nome: reserva.hospede_nome,
        hospede_telefone: reserva.hospede_telefone || undefined,
        adultos: reserva.adultos,
        origem: "MANUAL",
      });
      toast.success("Reserva criada");
      onClose();
    } catch {
      toast.error("Não foi possível reservar — datas indisponíveis?");
    }
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex-col gap-1">
          {unidade.identificador} · {dia.data}
          <span className="text-sm font-normal text-muted-foreground">
            {ESTADO_STYLES[dia.estado].label}
            {dia.hospede_nome ? ` — ${dia.hospede_nome}` : ""}
          </span>
        </ModalHeader>
        <ModalBody className="pb-6">
          {!livre || !canManage ? (
            <p className="text-sm text-muted-foreground">
              {livre
                ? "Você tem acesso somente de leitura."
                : "Para alterar esta ocupação, use a tela Reservas (remarcar/cancelar) ou remova o bloqueio."}
            </p>
          ) : (
            <Tabs aria-label="Ação na célula">
              <Tab key="block" title="Bloquear">
                <div className="space-y-3 pt-2">
                  <Select
                    label="Motivo"
                    selectedKeys={[block.motivo]}
                    onChange={(e) => setBlock({ ...block, motivo: e.target.value })}
                  >
                    {BLOCK_MOTIVOS.map((m) => (
                      <SelectItem key={m.key}>{m.label}</SelectItem>
                    ))}
                  </Select>
                  {block.motivo !== "MENSALISTA" ? (
                    <Input label="Até (exclusivo)" type="date" value={block.data_fim} onChange={(e) => setBlock({ ...block, data_fim: e.target.value })} />
                  ) : null}
                  <Input label="Nota" value={block.nota} onChange={(e) => setBlock({ ...block, nota: e.target.value })} />
                  <Button color="primary" isLoading={createBlock.isPending} onPress={handleBlock}>
                    Confirmar bloqueio
                  </Button>
                </div>
              </Tab>
              <Tab key="reserva" title="Reserva manual">
                <div className="space-y-3 pt-2">
                  <Input label="Hóspede" value={reserva.hospede_nome} onChange={(e) => setReserva({ ...reserva, hospede_nome: e.target.value })} />
                  <Input label="Telefone" value={reserva.hospede_telefone} onChange={(e) => setReserva({ ...reserva, hospede_telefone: e.target.value })} />
                  <div className="flex gap-3">
                    <Input isReadOnly label="Check-in" type="date" value={dia.data} />
                    <Input label="Check-out" type="date" value={reserva.checkout} onChange={(e) => setReserva({ ...reserva, checkout: e.target.value })} />
                    <Input className="w-24" label="Adultos" type="number" value={String(reserva.adultos)} onChange={(e) => setReserva({ ...reserva, adultos: Number(e.target.value) || 1 })} />
                  </div>
                  <Button color="primary" isLoading={createReservation.isPending} onPress={handleReserva}>
                    Criar reserva
                  </Button>
                </div>
              </Tab>
            </Tabs>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
```

Create `src/app/dashboard/motor/calendario/page.tsx` (arquivo INTEIRO):

```tsx
export { default } from "@/src/presentation/components/pages/dashboard/motor/calendario/page";
```

Create `src/presentation/components/pages/dashboard/motor/calendario/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import { useMotorCalendar } from "@/src/shared/hooks/motor";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { CellActionModal } from "@/src/presentation/components/organisms/motor/cell-action-modal";
import { ESTADO_STYLES, OccupancyGrid } from "@/src/presentation/components/organisms/motor/occupancy-grid";
import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";
import type { MotorCalendarDia, MotorCalendarUnidade } from "@/src/shared/domain/types/@motor";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function MotorCalendarioPage() {
  const { tenantId, hasPermission } = useTenantCapabilities();
  const [month, setMonth] = useState(currentMonth);
  const { data: calendar, isLoading, isError } = useMotorCalendar(tenantId, month);
  const [selected, setSelected] = useState<{ unidade: MotorCalendarUnidade; dia: MotorCalendarDia } | null>(null);
  const canManage = hasPermission("motor.blocks.manage") || hasPermission("motor.reservations.manage");

  return (
    <PainelPageShell
      title="Mapa de ocupação"
      description="Cada linha é uma unidade, cada célula é uma noite. Clique numa célula livre para bloquear ou criar reserva."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar o mapa de ocupação."
      actions={
        <Input
          aria-label="Mês do mapa"
          className="w-44"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      }
    >
      {calendar && calendar.unidades.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {Object.entries(ESTADO_STYLES).map(([estado, style]) => (
              <span key={estado} className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded ${style.cell}`} /> {style.label}
              </span>
            ))}
          </div>
          <OccupancyGrid calendar={calendar} onCellClick={(unidade, dia) => setSelected({ unidade, dia })} />
        </div>
      ) : (
        <PortalEmptyState
          title="Nenhuma unidade cadastrada"
          description="Cadastre acomodações e unidades para o mapa aparecer aqui."
        />
      )}
      {selected && tenantId ? (
        <CellActionModal
          canManage={canManage}
          dia={selected.dia}
          tenantId={tenantId}
          unidade={selected.unidade}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </PainelPageShell>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:run -- occupancy-grid`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/motor/calendario src/presentation/components/pages/dashboard/motor/calendario src/presentation/components/organisms/motor
git commit -m "feat(motor): mapa de ocupacao unidade x dia com acao por celula

Grid desktop com coluna fixa + lista por dia no mobile (spec §5);
celula livre abre modal de bloqueio ou reserva manual.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 16: Tela `/dashboard/motor/reservas` — lista, detalhe, remarcar/cancelar

**Repo:** `FRONT`

**Files:**
- Create: `src/app/dashboard/motor/reservas/page.tsx`
- Create: `src/presentation/components/pages/dashboard/motor/reservas/page.tsx`
- Create: `src/presentation/components/pages/dashboard/motor/reservas/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: `useMotorReservations`, `useMotorReservation`, `useRescheduleReservation`, `useCancelReservation` (Task 12); `PortalDataTable`.
- Produces: página `MotorReservasPage` (default export).

- [ ] **Step 1: Teste falhando**

Create `src/presentation/components/pages/dashboard/motor/reservas/__tests__/page.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MotorReservasPage from "../page";

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "tenant_1", hasPermission: () => true }),
}));

const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/src/shared/hooks/motor", () => ({
  useMotorReservations: () => ({
    data: [
      {
        id: "r_1",
        room_type_id: "rt_1",
        unit_id: "u_1",
        checkin: "2026-09-05",
        checkout: "2026-09-07",
        status: "CONFIRMADA",
        origem: "BOT_WHATSAPP",
        hospede_nome: "Maria Silva",
        hospede_telefone: "5535999990000",
        hospede_email: null,
        adultos: 2,
        criancas: 0,
        pets: 0,
        valor_total: 678,
        valor_pago: 339,
        saldo_checkin: 339,
        forma_pagamento: "PIX_50",
        observacoes: null,
        created_at: "2026-08-18T10:00:00.000Z",
        unit: { id: "u_1", room_type_id: "rt_1", identificador: "Casal 01", ativo: true },
        room_type: { nome: "Suíte Casal" },
      },
    ],
    isLoading: false,
    isError: false,
  }),
  useMotorReservation: () => ({ data: undefined, isLoading: false, isError: false }),
  useRescheduleReservation: () => mutation,
  useCancelReservation: () => mutation,
}));

describe("MotorReservasPage", () => {
  it("lista reservas com hospede, unidade, status e saldo do check-in", () => {
    render(<MotorReservasPage />);
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("Casal 01")).toBeInTheDocument();
    expect(screen.getByText("CONFIRMADA")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?339,00/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- motor/reservas`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/app/dashboard/motor/reservas/page.tsx` (arquivo INTEIRO):

```tsx
export { default } from "@/src/presentation/components/pages/dashboard/motor/reservas/page";
```

Create `src/presentation/components/pages/dashboard/motor/reservas/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button, Chip, Input, Modal, ModalBody, ModalContent, ModalHeader, Select, SelectItem, Textarea } from "@heroui/react";
import toast from "react-hot-toast";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import {
  useCancelReservation,
  useMotorReservation,
  useMotorReservations,
  useRescheduleReservation,
} from "@/src/shared/hooks/motor";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalDataTable } from "@/src/presentation/components/organisms/hotel-portal/painel/data-table";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import type { MotorReservation } from "@/src/shared/domain/types/@motor";

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const STATUS_OPTIONS = ["CONFIRMADA", "CHECKIN_FEITO", "CONCLUIDA", "CANCELADA", "NOSHOW"];
const ORIGEM_LABELS: Record<string, string> = {
  BOT_WHATSAPP: "Bot WhatsApp",
  OTA_BOOKING: "Booking",
  OTA_AIRBNB: "Airbnb",
  OTA_DECOLAR: "Decolar",
  SITE_HSYSTEM: "Site (HSystem)",
  MANUAL: "Manual",
};

const STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "default" | "primary"> = {
  CONFIRMADA: "success",
  HOLD: "warning",
  CHECKIN_FEITO: "primary",
  CONCLUIDA: "default",
  CANCELADA: "danger",
  NOSHOW: "danger",
};

export default function MotorReservasPage() {
  const { tenantId, hasPermission } = useTenantCapabilities();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data: reservations, isLoading, isError } = useMotorReservations(
    tenantId,
    statusFilter ? { status: statusFilter } : undefined,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail } = useMotorReservation(tenantId, selectedId);
  const reschedule = useRescheduleReservation(tenantId ?? "");
  const cancel = useCancelReservation(tenantId ?? "");
  const canManage = hasPermission("motor.reservations.manage");

  const [novasDatas, setNovasDatas] = useState({ novo_checkin: "", novo_checkout: "" });
  const [motivo, setMotivo] = useState("");

  async function handleReschedule() {
    if (!selectedId || !novasDatas.novo_checkin || !novasDatas.novo_checkout) return;
    try {
      await reschedule.mutateAsync({ id: selectedId, dto: novasDatas });
      toast.success("Reserva remarcada — o valor pago foi mantido");
      setNovasDatas({ novo_checkin: "", novo_checkout: "" });
    } catch {
      toast.error("Sem unidade livre nas novas datas");
    }
  }

  async function handleCancel() {
    if (!selectedId) return;
    if (!motivo.trim()) return toast.error("Informe o motivo do cancelamento");
    // Acao destrutiva: confirmacao obrigatoria (spec §5).
    if (!window.confirm("Cancelar esta reserva? Estorno, se houver, é feito manualmente no Asaas.")) return;
    try {
      await cancel.mutateAsync({ id: selectedId, motivo });
      toast.success("Reserva cancelada — as datas foram liberadas");
      setSelectedId(null);
      setMotivo("");
    } catch {
      toast.error("Não foi possível cancelar");
    }
  }

  const rows = reservations ?? [];

  return (
    <PainelPageShell
      title="Reservas"
      description="Todas as reservas do motor: do bot, das OTAs e manuais."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar as reservas."
      actions={
        <Select
          aria-label="Filtrar por status"
          className="w-48"
          placeholder="Todos os status"
          selectedKeys={statusFilter ? [statusFilter] : []}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status}>{status}</SelectItem>
          ))}
        </Select>
      }
    >
      {rows.length > 0 ? (
        <PortalDataTable<MotorReservation>
          columns={[
            { key: "hospede", header: "Hóspede", render: (r) => r.hospede_nome },
            { key: "periodo", header: "Período", render: (r) => `${r.checkin} → ${r.checkout}` },
            { key: "unidade", header: "Unidade", render: (r) => r.unit?.identificador ?? "—" },
            { key: "origem", header: "Origem", render: (r) => ORIGEM_LABELS[r.origem] ?? r.origem },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <Chip color={STATUS_COLORS[r.status] ?? "default"} size="sm" variant="flat">
                  {r.status}
                </Chip>
              ),
            },
            { key: "total", header: "Total", render: (r) => fmtBRL(r.valor_total) },
            { key: "saldo", header: "Saldo no check-in", render: (r) => fmtBRL(r.saldo_checkin) },
            {
              key: "acoes",
              header: "",
              render: (r) => (
                <Button size="sm" variant="flat" onPress={() => setSelectedId(r.id)}>
                  Detalhes
                </Button>
              ),
            },
          ]}
          getRowKey={(r) => r.id}
          rows={rows}
        />
      ) : (
        <PortalEmptyState
          title="Nenhuma reserva"
          description="Quando o bot ou a equipe criarem reservas, elas aparecem aqui."
        />
      )}

      <Modal isOpen={!!selectedId} size="2xl" onClose={() => setSelectedId(null)}>
        <ModalContent>
          <ModalHeader className="flex-col gap-1">
            {detail?.hospede_nome ?? "Reserva"}
            <span className="text-sm font-normal text-muted-foreground">
              {detail ? `${detail.checkin} → ${detail.checkout} · ${detail.unit?.identificador ?? ""}` : ""}
            </span>
          </ModalHeader>
          <ModalBody className="space-y-5 pb-6">
            {detail ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><p className="text-muted-foreground">Total</p><p>{fmtBRL(detail.valor_total)}</p></div>
                  <div><p className="text-muted-foreground">Pago</p><p>{fmtBRL(detail.valor_pago)}</p></div>
                  <div><p className="text-muted-foreground">Saldo no check-in</p><p>{fmtBRL(detail.saldo_checkin)}</p></div>
                  <div><p className="text-muted-foreground">Pagamento</p><p>{detail.forma_pagamento ?? "—"}</p></div>
                </div>
                {detail.events?.length ? (
                  <div>
                    <p className="mb-1 text-sm font-medium">Histórico</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {detail.events.map((event) => (
                        <li key={event.id}>
                          {new Date(event.created_at).toLocaleString("pt-BR")} — {event.tipo}
                          {event.autor ? ` (${event.autor})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {canManage && !["CANCELADA", "CONCLUIDA"].includes(detail.status) ? (
                  <>
                    <div className="flex flex-wrap items-end gap-3">
                      <Input label="Novo check-in" type="date" value={novasDatas.novo_checkin} onChange={(e) => setNovasDatas({ ...novasDatas, novo_checkin: e.target.value })} />
                      <Input label="Novo check-out" type="date" value={novasDatas.novo_checkout} onChange={(e) => setNovasDatas({ ...novasDatas, novo_checkout: e.target.value })} />
                      <Button color="primary" isLoading={reschedule.isPending} variant="flat" onPress={handleReschedule}>
                        Remarcar
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <Textarea className="flex-1" label="Motivo do cancelamento" minRows={1} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                      <Button color="danger" isLoading={cancel.isPending} variant="flat" onPress={handleCancel}>
                        Cancelar reserva
                      </Button>
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </PainelPageShell>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test:run -- motor/reservas`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/motor/reservas src/presentation/components/pages/dashboard/motor/reservas
git commit -m "feat(motor): tela de reservas com detalhe, remarcacao e cancelamento

Lista responsiva (PortalDataTable), historico de eventos e acoes de
remarcar (mantem valor pago) e cancelar com confirmacao.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 17: Sidebar "Calendário" + gating do módulo `motor` no front

**Repo:** `FRONT`

**Files:**
- Modify: `src/presentation/components/atoms/reserve/hotel-nav-items.tsx`
- Modify: `src/modules/settings/domain/tenant-modules.ts`
- Modify: `src/modules/settings/domain/navigation.ts` (+ `navigation.test.ts`)
- Modify: `src/modules/settings/presentation/components/tenant-modules-card.tsx`
- Modify: `src/presentation/i18n/messages/pt.json` e `en.json`

**Interfaces:**
- Consumes: `buildHotelNavItems`/`HOTEL_GROUP_IDS`, `GATEABLE_MODULES` (front), `MODULE_NAV_IDS`, `NAV_READ_PERMISSIONS`, `MODULE_LABELS`/`MODULE_ORDER`, páginas das Tasks 13–16.
- Produces: grupo `hotel-motor-menu` ("Calendário") na sidebar com 4 itens gateados pelo módulo `motor` e pela permissão `motor.read`; item antigo `hotel-calendario` renomeado para "Calendário de conteúdo"; toggle do módulo na aba Módulos do tenant.

- [ ] **Step 1: Testes falhando (adicionar em `navigation.test.ts`)**

```ts
describe('modulo motor', () => {
  it('todos os ids do grupo motor estao gateados pelo modulo motor', () => {
    const groupIds = ['hotel-motor-menu', 'motor-calendario', 'motor-tarifas', 'motor-reservas', 'motor-acomodacoes'];
    for (const id of groupIds) {
      expect(MODULE_NAV_IDS.motor).toContain(id);
    }
  });

  it('itens do motor exigem motor.read', () => {
    for (const id of ['motor-calendario', 'motor-tarifas', 'motor-reservas', 'motor-acomodacoes']) {
      expect(NAV_READ_PERMISSIONS[id]).toEqual(['motor.read']);
    }
  });

  it('grupo motor some quando o modulo esta desligado', () => {
    const t = (key: string) => key;
    const nav = buildHotelNavItems(t);
    const flags = normalizeModuleFlags({ motor: false, hotel: true });
    const result = filterNavigationByModuleFlags(nav, flags);
    expect(result.some((item) => item.id === 'hotel-motor-menu')).toBe(false);
  });
});
```

(Ajustar imports do teste conforme os já usados no arquivo: `MODULE_NAV_IDS`, `NAV_READ_PERMISSIONS`, `filterNavigationByModuleFlags`, `normalizeModuleFlags`, `buildHotelNavItems`.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test:run -- navigation`
Expected: FAIL — `MODULE_NAV_IDS.motor` não existe.

- [ ] **Step 3: Implementar**

Em `src/modules/settings/domain/tenant-modules.ts`: adicionar `"motor"` a `GATEABLE_MODULES` (o backend usa o mesmo nome — sem alias em `BACKEND_MODULE_ALIASES`).

Em `src/presentation/components/atoms/reserve/hotel-nav-items.tsx`:

1. Importar os ícones novos de `lucide-react`: `CalendarDays`, `CalendarRange`, `DollarSign`, `BookMarked`, `BedDouble`.
2. Adicionar o grupo (depois do grupo `hotel-reservas-menu`):

```tsx
    {
      id: "hotel-motor-menu",
      label: t("hotelMotor"),
      icon: CalendarDays,
      subItems: [
        {
          id: "motor-calendario",
          label: t("motorCalendario"),
          icon: CalendarRange,
          path: "/dashboard/motor/calendario",
        },
        {
          id: "motor-tarifas",
          label: t("motorTarifas"),
          icon: DollarSign,
          path: "/dashboard/motor/tarifas",
        },
        {
          id: "motor-reservas",
          label: t("motorReservas"),
          icon: BookMarked,
          path: "/dashboard/motor/reservas",
        },
        {
          id: "motor-acomodacoes",
          label: t("motorAcomodacoes"),
          icon: BedDouble,
          path: "/dashboard/motor/acomodacoes",
        },
      ],
    },
```

3. Adicionar `"hotel-motor-menu"` a `HOTEL_GROUP_IDS`.

Em `src/modules/settings/domain/navigation.ts`:

1. `MODULE_NAV_IDS` ganha a entrada (o tipo `Record<GateableModule, ...>` obriga — o compilador aponta o lugar):

```ts
  motor: [
    "hotel-motor-menu",
    "motor-calendario",
    "motor-tarifas",
    "motor-reservas",
    "motor-acomodacoes",
  ],
```

2. `NAV_READ_PERMISSIONS` ganha:

```ts
  "motor-calendario": ["motor.read"],
  "motor-tarifas": ["motor.read"],
  "motor-reservas": ["motor.read"],
  "motor-acomodacoes": ["motor.read"],
```

Em `src/presentation/i18n/messages/pt.json`, namespace `sidebar`:

```json
    "hotelCalendario": "Calendário de conteúdo",
    "hotelMotor": "Calendário",
    "motorCalendario": "Mapa de ocupação",
    "motorTarifas": "Tarifas",
    "motorReservas": "Reservas",
    "motorAcomodacoes": "Acomodações",
```

Em `en.json`:

```json
    "hotelCalendario": "Content calendar",
    "hotelMotor": "Calendar",
    "motorCalendario": "Occupancy map",
    "motorTarifas": "Rates",
    "motorReservas": "Bookings",
    "motorAcomodacoes": "Accommodations",
```

Em `src/modules/settings/presentation/components/tenant-modules-card.tsx`:

```tsx
  motor: {
    title: "Motor de Reservas",
    hint: "Calendário de ocupação, tarifas, reservas e acomodações",
  },
```

E inserir `"motor"` em `MODULE_ORDER` logo depois de `"hotel"`.

- [ ] **Step 4: Rodar a suíte toda do front e o build**

Run: `npm run test:run`
Expected: PASS — incluindo `navigation.test.ts` novo e os testes das Tasks 13–16; nenhuma regressão.

Run: `npm run build`
Expected: build Next.js sem erro (todas as rotas `/dashboard/motor/*` compilam).

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/atoms/reserve/hotel-nav-items.tsx src/modules/settings src/presentation/i18n/messages
git commit -m "feat(sidebar): grupo Calendario do motor de reservas gateado pelo modulo motor

Quatro telas novas no menu (mapa, tarifas, reservas, acomodacoes),
item antigo renomeado para Calendario de conteudo e toggle do modulo
na aba Modulos do tenant.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Notas de execução (instruções do Gabriel — prevalecem sobre os steps)

1. **Backend inteiro primeiro** (Tasks 1–11 no `BACK`); só depois o frontend (Tasks 12–17 no `FRONT`).
2. **No máximo 2 subagentes em paralelo**, e só em tasks sem dependência entre si.
3. **Testes rodam no FINAL do último task de cada tópico**, não task por task. Os steps "rodar e ver falhar/passar" dentro das tasks viram: escrever teste + implementação direto, commit por task, e UMA rodada de verificação no fim do tópico (`npm test` no backend / `npm run test:run` no frontend + build). Tópicos:
   - **Tópico A — Fundação:** Tasks 1–2 (sequencial: a Task 2 importa enums gerados pela Task 1). Verificação: `npm test -- "migrations|gateable-modules|motor.constants"` + `npm run build`.
   - **Tópico B — Configuração do inventário:** Tasks 3, 4, 5 (3 e 4 podem rodar em paralelo; 5 depende da 4). Verificação: `npm test -- "room-type|unit.service|daily-inventory|tarifa"` + build.
   - **Tópico C — Núcleo transacional:** Tasks 6, 7, 8 (sequencial). Verificação: `npm test -- "availability|hold"` + build.
   - **Tópico D — Operação e mapa:** Tasks 9, 10, 11 (9 e 10 em paralelo; 11 por último). Verificação: `npm test` COMPLETO no backend + build.
   - **Tópico E — Frontend:** Tasks 12–17 (12 primeiro; 13–16 podem ser 2 a 2 em paralelo; 17 por último). Verificação: `npm run test:run` completo + `npm run build`.
4. **Migração sem banco local:** se `npx prisma migrate dev` falhar por falta de `DATABASE_URL` local, seguir com `npx prisma generate` (o client compila sem banco), manter o SQL editado na pasta da migration e deixar o `migrate deploy` para o ambiente com banco. O spec de migration lê o SQL como texto e passa sem banco.
5. **Revisão de qualidade fica para o final de tudo** (regra já combinada) — nenhum `/code-review` por task.
6. Commits por task, mensagens conforme os blocos de commit de cada task.

## Self-review (feito na escrita do plano)

- **Cobertura da spec (Fase 1, §10):** modelo de dados completo (Task 1) · availability + holds com constraint de exclusão (Tasks 6–7) · confirm/release via webhook Asaas→N8N (Tasks 7–8) · reservas manuais e blocks (Tasks 9–10) · mapa admin básico (Tasks 11+15) · API do bot (Tasks 6–9) · remarcação/cancelamento com política (Task 9) · admin no painel §5 (Tasks 12–17). `channel_sync_state`/`/motor/canais` intencionalmente fora (Fase 2 — decisão 7).
- **Consistência de nomes conferida:** `AvailabilityService.{search,quote,freeUnitIds}` usados nas Tasks 7/8/9 batem com a Task 6; `isExclusionViolation` exportado na Task 7 e importado na 9; hooks da Task 12 batem com os `vi.mock` das Tasks 13–16; ids de navegação da Task 17 batem entre `hotel-nav-items`, `MODULE_NAV_IDS.motor` e `NAV_READ_PERMISSIONS`; permissões `motor.*` (Task 2) batem com os controllers e com `hasPermission` nas telas.
- **Pontos de verificação no código real (não inventar):** caminhos exatos dos decorators de guard (copiar do `admin-milestone.controller.ts`), constante `REQUIRES_MODULE_KEY` (importar do decorator), formato exato do `DomainExceptionFilter` e assinatura de `PortalEmptyState`/`PainelSection` — os steps citam onde conferir.

---

*Plano gerado a partir de `docs/MOTOR_RESERVAS_RESERVE_MASTER.md` v1.0 — Fase 1. Beds24 (Fase 2) e cutover Dona Tereza (Fase 3) terão planos próprios.*







