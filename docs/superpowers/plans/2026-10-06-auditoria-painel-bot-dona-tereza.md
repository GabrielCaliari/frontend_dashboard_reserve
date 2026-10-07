# Auditoria Painel × Bot · Dona Tereza — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar os itens da auditoria de 06/10 (B1–B7 no `backend_reserve`, F1–F4 no `frontend_dashboard_reserve`) que bloqueiam o go-live da Dona Tereza.

**Architecture:** Backend primeiro (robustez do Canal A, contrato documentado da integração, propostas), depois codegen no front e por fim as telas (atualização automática, bloco "Assistente de WhatsApp", campo em reais). Nenhuma mudança de contrato com o bot além do que o `docs/CONTRATO_BOT_PAINEL_v2.md` já define.

**Tech Stack:** NestJS 11 + Prisma + class-validator + @nestjs/swagger + @nestjs/schedule + Jest (back); Next.js + React Query v5 + HeroUI/shadcn + @dnd-kit + Vitest (front); `nextjs-openapi-codegen`.

## Global Constraints

- Repos: back = `C:\Users\gabri\OneDrive\Documents\GitHub\backend_reserve`, front = `C:\Users\gabri\OneDrive\Documents\GitHub\frontend_dashboard_reserve`. Ambos em `main`; commitar direto, sem push sem pedido.
- Package manager: **npm** nos dois repos. Nunca `pnpm install`.
- Nunca editar `frontend_dashboard_reserve/src/infraestructure/server/services/**` à mão — só via `npm run codegen` (rodar `npm run codegen:diff` antes).
- Transporte do backend não vaza para `presentation/` nem `shared/hooks/<domain>/`: mapear em `src/modules/hotel-portal/infrastructure/adapters.ts`.
- Segredos (chave do tenant, segredo do Canal B, `webhook_secret` do Canal C) aparecem **uma única vez** na resposta que os gera; nenhum `GET` os devolve — só flags `*_set: boolean`.
- Rotas do bot sem `/v1`: `/api/ingest/bot-events`, `/api/webhooks/booking/:clientId`.
- Testes direcionados (só os arquivos tocados). Baseline do front: 77 falhas pré-existentes em CMS/access-management/editor — ignorar falhas nessas áreas.
- Mensagens de commit no padrão do repo (`feat(bot): ...`, `fix(...)`, `chore(codegen): ...`) terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Comentários e textos de UI em português, sem acento nos comentários de código do back (padrão existente).

## Estado verificado no código (06/10)

| Item | Estado real | O que falta |
| --- | --- | --- |
| B1 `action_id` | **Feito** (`819650e`): `attempt()` monta o corpo com `action_id` e serve `dispatch` e `retry` | Teste provando o mesmo `action_id` no reenvio (Task 1) |
| B2 eventos presos | Aberto: duplicado nunca reprojeta; nenhum reprocesso | Task 2 |
| B3 crons | Back roda como processo Nest (`app.listen`, sem `vercel.json`) → `@Cron` dispara. Host de produção **não confirmado** | Rota protegida para disparo externo/manual (Task 3) + confirmação humana |
| B4 config da integração | Corpos e respostas sem schema no Swagger; `GET` de cliente **devolve `webhook_secret`**; não há como gravar o segredo do Canal C | Tasks 4 e 5 |
| B5 tipos novos | Validação já aceita qualquer `type` (texto, ≤50); processador ignora tipo desconhecido após o snapshot | Descrição do Swagger + teste (Task 6) |
| B6 `apply_config` | `valor_proposto` documentado como objeto; sem bloqueio de chave de credencial; sem aviso de `tarifa:*`/`calendario:*` | Task 7 |
| B7 Canal C | Rota já faz upsert por `(tenant_id, external_id)` | Só documentar o mapeamento Hospedin (Task 8) |
| F1–F4 | Abertos | Tasks 9–12 |

---

# PARTE 1 · BACKEND (`backend_reserve`)

Todos os caminhos desta parte são relativos a `backend_reserve/`. Módulo: `src/modules/reserve-client-portal/` (abreviado `RCP/`).

### Task 1: B1 — provar o mesmo `action_id` no reenvio

**Files:**
- Test: `RCP/infrastructure/providers/bot-panel-action.provider.spec.ts`

**Interfaces:**
- Consumes: `BotPanelActionProvider.dispatch(tenantId, action, input)` e `.retry(actionId)` (já existem).
- Produces: nada novo.

- [ ] **Step 1: Escrever o teste** (adicionar dentro do `describe` existente, depois do teste `'falha de rede: ...'`)

```ts
  it('reenvio do cron manda o mesmo action_id da primeira tentativa', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await provider.dispatch('tenant_1', 'extend_hold', { phone: '5535999', payload: { minutes: 60 } });

    prisma.botPanelAction.findUnique.mockResolvedValue({
      id: 'act_1', tenant_id: 'tenant_1', action: 'extend_hold', phone: '5535999',
      actor_id: null, payload: { minutes: 60 },
    });
    mockedAxios.post.mockResolvedValueOnce({ data: { ok: true, state: 'ATIVO' } });
    await provider.retry('act_1');

    const ids = mockedAxios.post.mock.calls.map((c) => JSON.parse(c[1] as string).action_id);
    expect(ids).toEqual(['act_1', 'act_1']);
  });
```

- [ ] **Step 2: Rodar** `npx jest RCP/infrastructure/providers/bot-panel-action.provider.spec.ts` (caminho completo `src/modules/reserve-client-portal/...`). Esperado: PASS (o código já está certo; o teste trava a regressão). Se falhar, o B1 não está feito — corrigir `attempt()` para incluir `action_id: actionId` antes do HMAC.

- [ ] **Step 3: Commit**

```bash
git add src/modules/reserve-client-portal/infrastructure/providers/bot-panel-action.provider.spec.ts
git commit -m "test(bot): reenvio do canal B repete o mesmo action_id"
```

---

### Task 2: B2 — reprocessar eventos presos no ledger

**Files:**
- Modify: `prisma/schema.prisma` (model `BotIngestionEvent`, ~linha 390)
- Create: `prisma/migrations/20261006000001_bot_ingestion_attempts/migration.sql`
- Modify: `RCP/application/services/bot-event-ingestion.service.ts`
- Create: `RCP/infrastructure/providers/bot-ingestion-reprocess-cron.provider.ts`
- Modify: `RCP/reserve-client-portal.module.ts` (registrar o provider)
- Test: `RCP/application/services/bot-event-ingestion.service.spec.ts`

**Interfaces:**
- Produces:
  - `BotEventIngestionService.reprocessStuck(now?: Date): Promise<{ reprocessed: number }>`
  - `BotEventIngestionService.countStuck(tenantId: string): Promise<number>` — eventos `FAILED`/`RECEIVED` há mais de 5 min (qualquer número de tentativas).
  - Constantes exportadas: `STUCK_AFTER_MS = 5 * 60_000`, `MAX_PROJECTION_ATTEMPTS = 5`.
  - `BotIngestionReprocessCronProvider.run(): Promise<void>` (cron a cada 5 min).

- [ ] **Step 1: Schema + migration**

Em `model BotIngestionEvent`, depois de `error_message`:

```prisma
  attempts      Int       @default(0)
```

e adicionar o índice `@@index([status, received_at])`.

`prisma/migrations/20261006000001_bot_ingestion_attempts/migration.sql`:

```sql
-- B2 da auditoria 06/10: tentativas de projecao para o reprocesso de eventos presos.
ALTER TABLE "bot_ingestion_events" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "bot_ingestion_events_status_received_at_idx" ON "bot_ingestion_events"("status", "received_at");
```

Rodar `npx prisma generate`. (Não rodar `migrate dev` contra banco remoto.)

- [ ] **Step 2: Escrever os testes que falham** — no spec, trocar o mock do prisma no `beforeEach` por:

```ts
    prisma = {
      botIngestionEvent: {
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
```

(tipar `prisma` como `any`). Ajustar o teste existente `'event_id repetido conta como duplicado e nao reprocessa'` para mockar `findUnique.mockResolvedValue({ status: 'PROCESSED', attempts: 1 })`. Adicionar:

```ts
  it('duplicado que nao foi PROCESSED e projetado de novo', async () => {
    prisma.botIngestionEvent.create.mockRejectedValueOnce({ code: 'P2002' });
    prisma.botIngestionEvent.findUnique.mockResolvedValue({ status: 'FAILED', attempts: 1 });
    const result = await service.ingestBatch('tenant_1', [evento('a', '2026-10-01T10:00:00.000Z')]);
    expect(result).toEqual({ received: 1, duplicated: 1 });
    expect(processor.process).toHaveBeenCalledTimes(1);
    expect(prisma.botIngestionEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PROCESSED' }) }),
    );
  });

  it('duplicado ja esgotado (5 tentativas) nao e projetado', async () => {
    prisma.botIngestionEvent.create.mockRejectedValueOnce({ code: 'P2002' });
    prisma.botIngestionEvent.findUnique.mockResolvedValue({ status: 'FAILED', attempts: 5 });
    await service.ingestBatch('tenant_1', [evento('a', '2026-10-01T10:00:00.000Z')]);
    expect(processor.process).not.toHaveBeenCalled();
  });

  it('outra execucao ja reivindicou o evento: nao projeta duas vezes', async () => {
    prisma.botIngestionEvent.updateMany.mockResolvedValue({ count: 0 });
    await service.ingestBatch('tenant_1', [evento('a', '2026-10-01T10:00:00.000Z')]);
    expect(processor.process).not.toHaveBeenCalled();
  });

  it('reprocessStuck projeta FAILED/RECEIVED antigos em ordem de occurred_at', async () => {
    const now = new Date('2026-10-06T12:00:00.000Z');
    prisma.botIngestionEvent.findMany.mockResolvedValue([
      { tenant_id: 't1', event_id: 'x', attempts: 1, status: 'FAILED', payload: evento('x', '2026-10-06T11:00:00.000Z') },
      { tenant_id: 't1', event_id: 'y', attempts: 0, status: 'RECEIVED', payload: evento('y', '2026-10-06T11:01:00.000Z') },
    ]);
    const r = await service.reprocessStuck(now);
    expect(prisma.botIngestionEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: { in: ['FAILED', 'RECEIVED'] },
        attempts: { lt: 5 },
        received_at: { lt: new Date('2026-10-06T11:55:00.000Z') },
      },
      orderBy: { occurred_at: 'asc' },
    }));
    expect(processor.process.mock.calls.map((c) => c[1].event_id)).toEqual(['x', 'y']);
    expect(r).toEqual({ reprocessed: 2 });
  });

  it('countStuck conta presos do tenant ha mais de 5 minutos', async () => {
    prisma.botIngestionEvent.count.mockResolvedValue(3);
    const n = await service.countStuck('tenant_1');
    expect(n).toBe(3);
    expect(prisma.botIngestionEvent.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ tenant_id: 'tenant_1', status: { in: ['FAILED', 'RECEIVED'] } }),
    });
  });
```

- [ ] **Step 3: Rodar** `npx jest src/modules/reserve-client-portal/application/services/bot-event-ingestion.service.spec.ts` → FAIL (`reprocessStuck is not a function` etc.).

- [ ] **Step 4: Implementar** — substituir o corpo de `bot-event-ingestion.service.ts` a partir do loop:

```ts
export const STUCK_AFTER_MS = 5 * 60_000;
export const MAX_PROJECTION_ATTEMPTS = 5;
const STUCK_STATUSES = ['FAILED', 'RECEIVED'];
const REPROCESS_BATCH = 500;
```

Dentro de `ingestBatch`, o `catch` do `create` vira:

```ts
      } catch (error) {
        if (!this.isUniqueConstraintError(error)) throw error;
        duplicated += 1;
        // B2: o bot reenvia o lote quando algo deu errado do lado de ca. Se o
        // evento ficou preso (FAILED ou RECEIVED), o reenvio e a chance de projetar.
        const existing = await this.prisma.botIngestionEvent.findUnique({
          where: { tenant_id_event_id: { tenant_id: tenantId, event_id: event.event_id } },
          select: { status: true, attempts: true },
        });
        if (existing && existing.status !== 'PROCESSED' && existing.attempts < MAX_PROJECTION_ATTEMPTS) {
          await this.project(tenantId, event, existing.attempts);
        }
        continue;
      }
      await this.project(tenantId, event, 0);
```

e remover o bloco antigo de projeção do loop. Novos métodos:

```ts
  /** B2: rotina do cron — reprojeta eventos presos ha mais de 5 min, ate 5 tentativas. */
  async reprocessStuck(now = new Date()): Promise<{ reprocessed: number }> {
    const rows = await this.prisma.botIngestionEvent.findMany({
      where: {
        status: { in: STUCK_STATUSES },
        attempts: { lt: MAX_PROJECTION_ATTEMPTS },
        received_at: { lt: new Date(now.getTime() - STUCK_AFTER_MS) },
      },
      orderBy: { occurred_at: 'asc' },
      take: REPROCESS_BATCH,
      select: { tenant_id: true, event_id: true, attempts: true, payload: true },
    });
    let reprocessed = 0;
    for (const row of rows) {
      if (await this.project(row.tenant_id, row.payload as unknown as BotEventV2Dto, row.attempts)) reprocessed += 1;
    }
    return { reprocessed };
  }

  /** B2: contagem visivel para a Reserve (vai no GET da integracao). */
  async countStuck(tenantId: string, now = new Date()): Promise<number> {
    return this.prisma.botIngestionEvent.count({
      where: {
        tenant_id: tenantId,
        status: { in: STUCK_STATUSES },
        received_at: { lt: new Date(now.getTime() - STUCK_AFTER_MS) },
      },
    });
  }

  /**
   * Reivindica o evento incrementando `attempts` so se ninguem mexeu nele desde
   * a leitura (lock otimista): o cron e um reenvio do bot nunca projetam o
   * mesmo evento ao mesmo tempo. Devolve true se projetou com sucesso.
   */
  private async project(tenantId: string, event: BotEventV2Dto, seenAttempts: number): Promise<boolean> {
    const key = { tenant_id: tenantId, event_id: event.event_id };
    const claim = await this.prisma.botIngestionEvent.updateMany({
      where: { ...key, attempts: seenAttempts, status: { not: 'PROCESSED' } },
      data: { attempts: { increment: 1 } },
    });
    if (claim.count !== 1) return false;

    const where = { tenant_id_event_id: key };
    try {
      await this.processor.process(tenantId, event);
      await this.prisma.botIngestionEvent.update({
        where,
        data: { status: 'PROCESSED', processed_at: new Date(), error_message: null },
      });
      return true;
    } catch (error) {
      this.logger.error(`Bot event projection failed (tenant=${tenantId}, event=${event.event_id}): ${error}`);
      await this.prisma.botIngestionEvent.update({
        where,
        data: { status: 'FAILED', error_message: String((error as Error)?.message ?? error) },
      });
      return false;
    }
  }
```

Atualizar o JSDoc da classe e de `ingestBatch`: trocar "nunca reprocessa (§3.3)" por "duplicado que ficou FAILED/RECEIVED e reprojetado (B2)".

- [ ] **Step 5: Cron** — `RCP/infrastructure/providers/bot-ingestion-reprocess-cron.provider.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BotEventIngestionService } from '../../application/services/bot-event-ingestion.service';

/** B2 da auditoria 06/10: eventos do Canal A presos no ledger voltam a ser projetados. */
@Injectable()
export class BotIngestionReprocessCronProvider {
  private readonly logger = new Logger(BotIngestionReprocessCronProvider.name);

  constructor(private readonly ingestion: BotEventIngestionService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async run(): Promise<void> {
    const { reprocessed } = await this.ingestion.reprocessStuck();
    if (reprocessed > 0) this.logger.log(`Eventos do bot reprojetados: ${reprocessed}`);
  }
}
```

Registrar em `providers` de `reserve-client-portal.module.ts`, ao lado de `BotReconciliationCronProvider`.

- [ ] **Step 6: Rodar** o spec do Step 3 → PASS. Rodar `npx tsc --noEmit -p tsconfig.json` filtrando por `reserve-client-portal` → sem erros novos.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20261006000001_bot_ingestion_attempts src/modules/reserve-client-portal
git commit -m "feat(bot): eventos presos no ledger sao reprojetados no reenvio e por cron"
```

---

### Task 3: B3 — disparo externo dos crons do bot (rota protegida)

O back roda como processo (`app.listen`), então os `@Cron` disparam — **a confirmação do host de produção é humana** (ver "Pendências humanas"). Esta rota cobre o caso serverless e serve para o teste de aceite ("ação com falha reenviada sem intervenção").

**Files:**
- Create: `RCP/infrastructure/guards/cron-secret.guard.ts`
- Create: `RCP/infrastructure/controllers/bot-cron.controller.ts`
- Modify: `RCP/reserve-client-portal.module.ts` (controller + guard)
- Test: `RCP/infrastructure/guards/cron-secret.guard.spec.ts`

**Interfaces:**
- Consumes: `BotReconciliationCronProvider.reconcile()`, `BotEventIngestionService.reprocessStuck()` (Task 2).
- Produces: `POST /api/internal/cron/bot-sync` → `200 { reprocessed: number }`; header `Authorization: Bearer <CRON_SECRET>`. Sem `CRON_SECRET` no ambiente → sempre 401.

- [ ] **Step 1: Teste do guard (falha)** — `cron-secret.guard.spec.ts`:

```ts
import { UnauthorizedException } from '@nestjs/common';
import { CronSecretGuard } from './cron-secret.guard';

const ctx = (auth?: string) => ({
  switchToHttp: () => ({ getRequest: () => ({ headers: auth ? { authorization: auth } : {} }) }),
}) as any;

describe('CronSecretGuard', () => {
  const original = process.env.CRON_SECRET;
  afterEach(() => { process.env.CRON_SECRET = original; });

  it('aceita o Bearer igual ao CRON_SECRET', () => {
    process.env.CRON_SECRET = 'x'.repeat(32);
    expect(new CronSecretGuard().canActivate(ctx(`Bearer ${'x'.repeat(32)}`))).toBe(true);
  });
  it('recusa segredo errado', () => {
    process.env.CRON_SECRET = 'x'.repeat(32);
    expect(() => new CronSecretGuard().canActivate(ctx('Bearer errado'))).toThrow(UnauthorizedException);
  });
  it('sem CRON_SECRET configurado recusa sempre', () => {
    delete process.env.CRON_SECRET;
    expect(() => new CronSecretGuard().canActivate(ctx('Bearer '))).toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Rodar** → FAIL (módulo não existe).

- [ ] **Step 3: Implementar o guard**

```ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

/** B3: protege o disparo externo dos crons (Vercel Cron, agendador do host ou chamada manual). */
@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.CRON_SECRET;
    const header = String(context.switchToHttp().getRequest().headers?.authorization ?? '');
    const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!secret || !provided) throw new UnauthorizedException();
    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new UnauthorizedException();
    return true;
  }
}
```

- [ ] **Step 4: Controller** — copiar os decorators de nível de classe de `bot-event-ingestion.controller.ts` (`@SkipThrottle()`; fora do gate de módulo):

```ts
import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiExcludeController } from '@nestjs/swagger';
import { CronSecretGuard } from '../guards/cron-secret.guard';
import { BotReconciliationCronProvider } from '../providers/bot-reconciliation-cron.provider';
import { BotEventIngestionService } from '../../application/services/bot-event-ingestion.service';

/** B3: roda as rotinas do bot sob demanda — necessario se o host nao executar @Cron. */
@ApiExcludeController()
@Controller('internal/cron')
@SkipThrottle()
export class BotCronController {
  constructor(
    private readonly reconciliation: BotReconciliationCronProvider,
    private readonly ingestion: BotEventIngestionService,
  ) {}

  @Post('bot-sync')
  @HttpCode(200)
  @UseGuards(CronSecretGuard)
  async botSync() {
    await this.reconciliation.reconcile();
    return this.ingestion.reprocessStuck();
  }
}
```

Registrar `BotCronController` em `controllers` e `CronSecretGuard` em `providers`. Se existir guard global de JWT que bloqueie (conferir como `BotEventIngestionController` escapa dele — ex. decorator `@Public()` — e aplicar o mesmo). Adicionar `CRON_SECRET=` ao `.env.example` se o arquivo existir.

- [ ] **Step 5: Rodar** o spec → PASS; `npx tsc --noEmit` sem erros novos no módulo.

- [ ] **Step 6: Commit**

```bash
git add src/modules/reserve-client-portal .env.example
git commit -m "feat(bot): rota protegida para disparar reconciliacao e reprocesso fora do @Cron"
```

---

### Task 4: B4 — integração do bot documentada e segredo do Canal B gerado no servidor

**Files:**
- Modify: `RCP/application/dtos/bot-integration-config.dto.ts`
- Create: `RCP/application/dtos/bot-integration-config-responses.dto.ts`
- Modify: `RCP/application/services/bot-integration-config.service.ts`
- Modify: `RCP/infrastructure/controllers/admin-bot-integration-config.controller.ts`
- Modify: `RCP/reserve-client-portal.module.ts` (se `BotEventIngestionService` precisar ser injetado — já é provider do módulo)
- Test: `RCP/application/services/bot-integration-config.service.spec.ts`

**Interfaces:**
- Consumes: `BotEventIngestionService.countStuck(tenantId)` (Task 2).
- Produces (formas que o front vai receber depois do codegen):
  - `BotIntegrationConfigResponseDto { id; tenant_id; active: boolean; bot_tenant_ref: string|null; n8n_panel_webhook_url: string|null; panel_webhook_secret_set: boolean; last_heartbeat_at: string|null; stuck_events: number; created_at; updated_at }`
  - `BotIntegrationConfigWithKeyResponseDto extends ...Response { tenant_key: string }` (POST e `regenerate-key`)
  - `PanelWebhookSecretResponseDto { panel_webhook_secret: string }` — `PATCH .../regenerate-panel-secret`
  - `stuck_events` vem em todas as respostas acima (todas passam pelo `toSafeShape`, agora assíncrono, que consulta `countStuck`).

- [ ] **Step 1: Testes que falham** — no spec existente, adicionar ao mock do construtor um terceiro/quarto colaborador `ingestion = { countStuck: jest.fn().mockResolvedValue(2) }` (construtor passa a ser `(prisma, botKeyProvider, aes, ingestion)`) e:

```ts
  it('GET devolve stuck_events e nunca o segredo', async () => {
    prisma.botIntegrationConfig.findUnique.mockResolvedValue(configRow({ panel_webhook_secret_enc: 'enc' }));
    const r = await service.findByTenant('tenant_1');
    expect(r).toEqual(expect.objectContaining({ panel_webhook_secret_set: true, stuck_events: 2 }));
    expect(JSON.stringify(r)).not.toContain('enc');
    expect(r).not.toHaveProperty('tenant_key');
  });

  it('regeneratePanelSecret grava cifrado e devolve o texto uma unica vez', async () => {
    aes.encrypt.mockReturnValue('cifrado');
    prisma.botIntegrationConfig.update.mockResolvedValue(configRow({ panel_webhook_secret_enc: 'cifrado' }));
    const r = await service.regeneratePanelSecret('tenant_1');
    expect(r.panel_webhook_secret).toMatch(/^[0-9a-f]{64}$/);
    expect(prisma.botIntegrationConfig.update).toHaveBeenCalledWith({
      where: { tenant_id: 'tenant_1' },
      data: { panel_webhook_secret_enc: 'cifrado' },
    });
  });
```

(Usar/criar no spec um helper `configRow(overrides)` com todos os campos de `toSafeShape`.)

- [ ] **Step 2: Rodar** `npx jest src/modules/reserve-client-portal/application/services/bot-integration-config.service.spec.ts` → FAIL.

- [ ] **Step 3: DTOs de entrada** — em `bot-integration-config.dto.ts`, importar `ApiPropertyOptional` e decorar os três campos das duas classes:

```ts
  @ApiPropertyOptional({ description: 'Identificador do tenant no bot (vai como tenant_id no Canal B).', maxLength: 60, example: 'cli_dona_tereza' })
  bot_tenant_ref?: string;

  @ApiPropertyOptional({ description: 'URL do WF6 (Canal B). Em producao: https publico.', example: 'https://bot.reservemkt.com.br/webhook/painel' })
  n8n_panel_webhook_url?: string;

  @ApiPropertyOptional({ description: 'Write-only. Segredo HMAC do Canal B (16-200). Prefira PATCH regenerate-panel-secret.', minLength: 16, maxLength: 200, writeOnly: true })
  panel_webhook_secret?: string;
```

- [ ] **Step 4: DTOs de resposta** — `bot-integration-config-responses.dto.ts` (mesmo padrão de `bot-panel-responses.dto.ts`: só OpenAPI):

```ts
import { ApiProperty } from '@nestjs/swagger';

/** Formas de resposta de admin/hotel-portal/:tenantId/bot-integration-config (so OpenAPI). */
export class BotIntegrationConfigResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() active: boolean;
  @ApiProperty({ type: String, nullable: true, example: 'cli_dona_tereza' }) bot_tenant_ref: string | null;
  @ApiProperty({ type: String, nullable: true }) n8n_panel_webhook_url: string | null;
  @ApiProperty({ description: 'Se o segredo do Canal B ja foi gravado. O valor nunca volta.' }) panel_webhook_secret_set: boolean;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) last_heartbeat_at: string | null;
  @ApiProperty({ description: 'Eventos do Canal A presos (FAILED/RECEIVED ha mais de 5 min).' }) stuck_events: number;
  @ApiProperty({ type: String, format: 'date-time' }) created_at: string;
  @ApiProperty({ type: String, format: 'date-time' }) updated_at: string;
}

export class BotIntegrationConfigWithKeyResponseDto extends BotIntegrationConfigResponseDto {
  @ApiProperty({ description: 'Chave do tenant para o Canal A. Mostrada UMA vez.' }) tenant_key: string;
}

export class PanelWebhookSecretResponseDto {
  @ApiProperty({ description: 'Segredo HMAC do Canal B. Mostrado UMA vez.' }) panel_webhook_secret: string;
}
```

- [ ] **Step 5: Service** — injetar `private readonly ingestion: BotEventIngestionService` no construtor; tornar `toSafeShape` `async` e acrescentar `stuck_events: await this.ingestion.countStuck(config.tenant_id)`; atualizar todos os `return` para `await this.toSafeShape(...)`. Novo método:

```ts
  /** B4: o segredo do Canal B nasce no servidor e aparece uma unica vez. */
  async regeneratePanelSecret(tenantId: string): Promise<{ panel_webhook_secret: string }> {
    const secret = this.generateKey();
    await this.prisma.botIntegrationConfig.update({
      where: { tenant_id: tenantId },
      data: { panel_webhook_secret_enc: this.aes.encrypt(secret) },
    });
    return { panel_webhook_secret: secret };
  }
```

Se a injeção de `BotEventIngestionService` criar dependência circular de módulo, não criará: ambos estão no mesmo módulo.

- [ ] **Step 6: Controller** — importar `ApiCreatedResponse, ApiOkResponse, ApiTags` e os DTOs de resposta; anotar: `@Post()` → `@ApiCreatedResponse({ type: BotIntegrationConfigWithKeyResponseDto })`; `@Get()`, `@Patch()`, `deactivate`, `reactivate` → `@ApiOkResponse({ type: BotIntegrationConfigResponseDto })`; `regenerate-key` → `@ApiOkResponse({ type: BotIntegrationConfigWithKeyResponseDto })`. Nova rota:

```ts
  @Patch('regenerate-panel-secret')
  @ApiOkResponse({ type: PanelWebhookSecretResponseDto })
  async regeneratePanelSecret(@Param('tenantId') tenantId: string) {
    return this.botIntegrationConfigService.regeneratePanelSecret(tenantId);
  }
```

- [ ] **Step 7: Rodar** o spec → PASS; `npx tsc --noEmit` sem erros novos no módulo.

- [ ] **Step 8: Commit**

```bash
git add src/modules/reserve-client-portal
git commit -m "feat(bot): integracao do bot documentada no swagger, segredo do canal B gerado no servidor e contagem de eventos presos"
```

---

### Task 5: B4 — `webhook_secret` do Canal C: nunca devolvido, gerado sob demanda

Hoje `findById`, `findAllByTenant`, `getClientForCurrentTenant`, `update` (e o que o repositório devolve em `findAll`/`findByAdminId`/`create`) entregam a linha crua de `hotel_clients`, **com `webhook_secret`**.

**Files:**
- Modify: `RCP/application/services/hotel-client.service.ts`
- Modify: `RCP/infrastructure/controllers/admin-hotel-client.controller.ts`
- Modify: `RCP/application/dtos/create-client.dto.ts`, `RCP/application/dtos/update-client.dto.ts` (só `@ApiProperty`)
- Test: `RCP/application/services/hotel-client.service.spec.ts` (criar se não existir; mockar `prisma`, `hotelClientRepository`, `hashProvider` conforme o construtor real)

**Interfaces:**
- Produces:
  - Toda resposta de cliente: sem `webhook_secret`; com `webhook_secret_set: boolean` e `tenant_id`.
  - `HotelClientService.regenerateWebhookSecret(id): Promise<{status, data: { webhook_secret: string }}>` (mesmo envelope `successResponse`).
  - `POST /api/admin/hotel-portal/clients/:id/webhook-secret` → `201 { webhook_secret }` (mesma cadeia `TENANT_SCOPED_CHAIN` e permissão `hotel-portal.clients.manage` da classe).

- [ ] **Step 1: Testes que falham**

```ts
  it('findById nao devolve webhook_secret, so webhook_secret_set', async () => {
    prisma.hotelClient.findUnique.mockResolvedValue({ id: 'c1', tenant_id: 't1', webhook_secret: 'segredo', ApiCredentials: [] });
    const r = await service.findById('c1');
    expect(r.data).not.toHaveProperty('webhook_secret');
    expect(r.data).toEqual(expect.objectContaining({ webhook_secret_set: true, tenant_id: 't1' }));
  });

  it('regenerateWebhookSecret grava e devolve o segredo uma vez', async () => {
    prisma.hotelClient.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.hotelClient.update.mockResolvedValue({ id: 'c1' });
    const r = await service.regenerateWebhookSecret('c1');
    expect(r.data.webhook_secret).toMatch(/^[0-9a-f]{64}$/);
    expect(prisma.hotelClient.update).toHaveBeenCalledWith({
      where: { id: 'c1' }, data: { webhook_secret: r.data.webhook_secret },
    });
  });
```

- [ ] **Step 2: Rodar** → FAIL.

- [ ] **Step 3: Implementar** — no topo de `hotel-client.service.ts`:

```ts
/** B4: o segredo HMAC do Canal C nunca sai em resposta; so a flag. */
function toSafeClient<T extends { webhook_secret?: string | null }>(client: T) {
  const { webhook_secret, ...rest } = client;
  return { ...rest, webhook_secret_set: Boolean(webhook_secret) };
}
```

Aplicar em todo `successResponse` que devolve cliente: `create` (o objeto do cliente dentro da resposta), `findAll` (`result.data.map(toSafeClient)`), `findAllByTenant`, `findById`, `findByAdminId`, `getClientForCurrentTenant`, `update`. Novo método:

```ts
  async regenerateWebhookSecret(id: string) {
    try {
      const client = await this.prisma.hotelClient.findUnique({ where: { id }, select: { id: true } });
      if (!client) return errorResponse('404:HOTEL_CLIENT_NOT_FOUND', 404);
      const webhook_secret = crypto.randomBytes(32).toString('hex');
      await this.prisma.hotelClient.update({ where: { id }, data: { webhook_secret } });
      return successResponse({ webhook_secret }, 201);
    } catch (error) {
      return errorResponse('500:HOTEL_CLIENT_WEBHOOK_SECRET_NOT_GENERATED', 500, error);
    }
  }
```

(`import * as crypto from 'crypto'` se ainda não houver.) Controller:

```ts
  @Post(':id/webhook-secret')
  @UseGuards(...TENANT_SCOPED_CHAIN)
  async regenerateWebhookSecret(@Param('id') id: string, @Res() res: Response) {
    const result = await this.hotelClientService.regenerateWebhookSecret(id);
    return res.status(result.status).json(result.data);
  }
```

Nos DTOs de cliente, adicionar `@ApiProperty`/`@ApiPropertyOptional` em cada campo existente (descrição curta; `booking_engine` com `example: 'hospedin'` e descrição "Motor de reservas; ROI nivel 3 exige diferente de manual"). Não adicionar `webhook_secret` aos DTOs.

- [ ] **Step 4: Rodar** spec → PASS. `grep -rn "webhook_secret" src/modules/reserve-client-portal/application/services/hotel-client.service.ts` só mostra `toSafeClient` e `regenerateWebhookSecret`.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-client-portal
git commit -m "fix(security): webhook_secret do cliente nunca volta em resposta; rota gera o segredo do canal C"
```

---

### Task 6: B5 — tipos de evento fora do catálogo aceitos sem recusar o lote

**Files:**
- Modify: `RCP/application/dtos/bot-event.dto.ts` (descrição de `type`)
- Test: `RCP/application/dtos/bot-event.dto.spec.ts` (criar)
- Test: `RCP/application/services/bot-event-processor.service.spec.ts` (se existir; senão só o DTO)

- [ ] **Step 1: Teste**

```ts
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BotEventBatchDto } from './bot-event.dto';

const lote = (type: string) => plainToInstance(BotEventBatchDto, {
  tenant_id: 'cli_dona_tereza',
  events: [{ event_id: 'e1', occurred_at: '2026-10-07T12:00:00.000Z', type, contact: { phone: '5535900000000' } }],
});

describe('BotEventBatchDto (B5)', () => {
  it.each(['aviso.esgotou', 'aviso.pagamento_vencendo', 'aviso.ultima_unidade', 'painel.erro_envio'])(
    'aceita tipo fora do catalogo: %s', async (type) => {
      expect(await validate(lote(type))).toHaveLength(0);
    },
  );
  it('recusa type com mais de 50 caracteres', async () => {
    expect((await validate(lote('x'.repeat(51)))).length).toBeGreaterThan(0);
  });
});
```

No spec do processador (se existir), adicionar: evento `aviso.esgotou` com `contact.phone` chama o upsert do snapshot do contato e não lança.

- [ ] **Step 2: Rodar** → deve PASSAR já (a validação está certa). Se falhar, trocar a validação de `type` para `@IsString() @MaxLength(50)` apenas.

- [ ] **Step 3: Corrigir a descrição** de `type` em `bot-event.dto.ts`:

```ts
  @ApiProperty({ description: 'Tipo do evento (contrato v2 §3.5: contato.iniciado, mensagem, transferencia, hold.criado, reserva.confirmada, perdido, followup.enviado, heartbeat, config.aplicada, ...). Tipos fora do catalogo (ex.: aviso.<tipo>, painel.erro_envio) sao aceitos: vao para o ledger e so o snapshot do contato e aplicado.', maxLength: 50, example: 'contato.iniciado' })
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/reserve-client-portal/application
git commit -m "docs(bot): canal A aceita tipos fora do catalogo; descricao do swagger com os nomes do contrato v2"
```

---

### Task 7: B6 — `apply_config` com valor simples, chaves de credencial recusadas e aviso de pendência

**Files:**
- Modify: `RCP/application/dtos/bot-config-proposal.dto.ts`
- Modify: `RCP/application/services/bot-config-proposal.service.ts`
- Test: `RCP/application/services/bot-config-proposal.service.spec.ts`, `RCP/application/dtos/bot-config-proposal.dto.spec.ts` (criar)

**Interfaces:**
- Produces:
  - `valor_proposto` / `valor_atual`: `string | number | boolean` (objeto/array → 400).
  - `campo` com cara de credencial → 400 (`CREDENTIAL_KEY_PATTERN` exportado).
  - String numérica (`"33900"`) é gravada e enviada ao bot como número (`33900`).
  - Resposta do `approve` ganha `pendente_no_bot: boolean` (`true` para `tarifa:*` e `calendario:*`).
  - Exports: `CREDENTIAL_KEY_PATTERN: RegExp`, `PENDING_IN_BOT_PREFIXES = ['tarifa:', 'calendario:']`, `toBotValue(v: string|number|boolean): string|number|boolean`.

- [ ] **Step 1: Testes que falham** — DTO:

```ts
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBotConfigProposalDto } from './bot-config-proposal.dto';

const dto = (o: Record<string, unknown>) =>
  plainToInstance(CreateBotConfigProposalDto, { campo: 'hold_min_cartao', categoria: 'policies', valor_proposto: 30, ...o });

describe('CreateBotConfigProposalDto (B6)', () => {
  it.each([30, '33900', 'C', true])('aceita valor simples %p', async (v) => {
    expect(await validate(dto({ valor_proposto: v }))).toHaveLength(0);
  });
  it.each([{ a: 1 }, [1]])('recusa objeto/lista %p', async (v) => {
    expect((await validate(dto({ valor_proposto: v }))).length).toBeGreaterThan(0);
  });
  it.each(['asaas_api_key', 'hospedin_secret', 'webhook_token', 'senha_admin'])('recusa chave de credencial %s', async (campo) => {
    expect((await validate(dto({ campo }))).length).toBeGreaterThan(0);
  });
});
```

Service:

```ts
  it('grava string numerica como numero', async () => {
    await service.submit('t1', 'a1', { campo: 'tarifa:361057:A', categoria: 'pricing', valor_proposto: '33900' } as any);
    expect(prisma.botConfigProposal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ valor_proposto: 33900 }),
    });
  });

  it('aprovar tarifa:* devolve pendente_no_bot: true', async () => {
    prisma.botConfigProposal.findFirst.mockResolvedValue({ id: 'p1', status: 'PENDENTE' });
    prisma.botConfigProposal.update.mockResolvedValue({ id: 'p1', campo: 'tarifa:361057:A', valor_proposto: 33900 });
    const r = await service.approve('t1', 'p1', 'rev1');
    expect(r.data).toEqual(expect.objectContaining({ pendente_no_bot: true }));
    expect(panelActions.dispatch).toHaveBeenCalledWith('t1', 'apply_config', expect.objectContaining({
      payload: { key: 'tarifa:361057:A', value: 33900 },
    }));
  });

  it('aprovar hold_min_cartao devolve pendente_no_bot: false', async () => {
    prisma.botConfigProposal.findFirst.mockResolvedValue({ id: 'p1', status: 'PENDENTE' });
    prisma.botConfigProposal.update.mockResolvedValue({ id: 'p1', campo: 'hold_min_cartao', valor_proposto: 30 });
    const r = await service.approve('t1', 'p1', 'rev1');
    expect(r.data).toEqual(expect.objectContaining({ pendente_no_bot: false }));
  });
```

(Ajustar aos nomes de mocks do spec existente.)

- [ ] **Step 2: Rodar** os dois specs → FAIL.

- [ ] **Step 3: DTO** — em `bot-config-proposal.dto.ts`:

```ts
import { Matches, ValidateBy, ValidationOptions } from 'class-validator';

/** B6: defesa em dobro — o bot ja recusa, mas a API nao aceita proposta para chave de credencial. */
export const CREDENTIAL_KEY_PATTERN = /(secret|segredo|token|senha|password|api[_-]?key|chave[_-]?api|credencial|credential|webhook)/i;

/** apply_config leva um valor simples (contrato v2 §6). */
function IsSimpleValue(options?: ValidationOptions) {
  return ValidateBy({
    name: 'isSimpleValue',
    validator: {
      validate: (v: unknown) => ['string', 'number', 'boolean'].includes(typeof v),
      defaultMessage: () => '$property deve ser texto, numero ou booleano',
    },
  }, options);
}
```

`campo` ganha `@Matches(CREDENTIAL_KEY_PATTERN, { message: 'chave de credencial nao pode ser alterada por proposta' })` invertido — usar `ValidateBy` com `validate: (v) => typeof v === 'string' && !CREDENTIAL_KEY_PATTERN.test(v)` em vez de `Matches` (que não tem negação). `valor_proposto`: `@IsDefined() @IsSimpleValue()`, `@ApiProperty({ description: 'Valor simples (centavos para *_cents e tarifa:*; minutos para hold_min_*; "C" para calendario:*).', oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }], example: 33900 })`, tipo TS `string | number | boolean`. `valor_atual`: `@IsOptional() @IsSimpleValue()`, mesmo `oneOf`, `nullable: true`.

- [ ] **Step 4: Service** — em `bot-config-proposal.service.ts`:

```ts
export const PENDING_IN_BOT_PREFIXES = ['tarifa:', 'calendario:'];

/** "33900" -> 33900: o form manda texto, o bot espera numero para precos e minutos. */
export function toBotValue(v: string | number | boolean): string | number | boolean {
  return typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim()) ? Number(v.trim()) : v;
}
```

`submit`: `valor_atual: dto.valor_atual === undefined ? undefined : toBotValue(dto.valor_atual)`, `valor_proposto: toBotValue(dto.valor_proposto)`. `approve`: calcular `const pendenteNoBot = PENDING_IN_BOT_PREFIXES.some((p) => updated.campo.startsWith(p));`, mandar `value: toBotValue(updated.valor_proposto as any)`, título do activity log com sufixo `pendenteNoBot ? ' (aplicacao no bot pendente: WF6 ainda nao suporta)' : ''`, e retornar `successResponse({ ...updated, ok: delivery.ok, state: delivery.state, pendente_no_bot: pendenteNoBot })`.

- [ ] **Step 5: Rodar** → PASS. `npx tsc --noEmit` sem erros novos no módulo.

- [ ] **Step 6: Commit**

```bash
git add src/modules/reserve-client-portal/application
git commit -m "feat(bot): propostas com valor simples, chave de credencial recusada e aviso de tarifa/calendario pendentes no bot"
```

---

### Task 8: B7 — mapeamento Hospedin → Canal C documentado

**Files:**
- Modify: `RCP/application/dtos/pms-booking-webhook.dto.ts` (descrições)
- Modify: `frontend_dashboard_reserve/docs/CONTRATO_BOT_PAINEL_v2.md` (§4.7)
- Test: `RCP/application/services/pms-booking-webhook.service.spec.ts` (garantir caso de idempotência)

- [ ] **Step 1:** Conferir no spec existente um teste "mesma reserva enviada duas vezes faz upsert por (tenant_id, external_id)". Se não houver, adicionar: duas chamadas com `externalId: 'H-1'` → `prisma.hotelReservation.upsert` (ou o método real usado nas linhas 70–90 do service) chamado com `where` contendo `external_id: 'H-1'` ambas as vezes. Rodar → PASS.

- [ ] **Step 2:** Descrições no DTO:
  - `status`: `'confirmed = reservation nova no Hospedin; modified = mudanca de datas ou valor; cancelled = cancelamento. pre_reservation e blocked NAO sao enviados.'`
  - `channel`: `'direct | ota:<booking|expedia|airbnb|tripadvisor> | other'`
  - `amount`: `'Valor total em centavos (inteiro).'`

- [ ] **Step 3:** No contrato §4.7, acrescentar a tabela:

```markdown
| Hospedin | Canal C `status` |
| --- | --- |
| `reservation` nova | `confirmed` |
| mudança de datas ou valor | `modified` |
| cancelamento | `cancelled` |
| `pre_reservation`, `blocked` | não enviar |

`amount` em centavos; `channel` em `direct | ota:<nome> | other`. Reenvio da mesma reserva atualiza a linha (`external_id` único por tenant).
```

- [ ] **Step 4: Commits** (um por repo)

```bash
git -C ../backend_reserve add src/modules/reserve-client-portal && git -C ../backend_reserve commit -m "docs(bot): mapeamento hospedin do canal C no swagger"
git add docs/CONTRATO_BOT_PAINEL_v2.md && git commit -m "docs(bot): mapeamento hospedin do canal C no contrato v2"
```

---

# PARTE 2 · FRONTEND (`frontend_dashboard_reserve`)

### Task 9: F4 — sincronizar tipos gerados com o backend (codegen)

Pré-requisito: Tasks 1–8 commitadas e o back rodando localmente (`npm run start:dev` no back, porta do `.env`; o codegen lê `http://localhost:3002/api/docs-json` por padrão ou `OPENAPI_SPEC_URL`).

**Files:**
- Regenerate: `src/infraestructure/server/services/**` (só via codegen)
- Modify: `src/modules/hotel-portal/infrastructure/adapters.ts`
- Modify: `src/shared/domain/types/@hotel-portal.ts` (`HotelClient`: `tenant_id`, `webhook_secret_set`)
- Modify: `src/shared/domain/types/@hotel-painel.ts` (`CreateBotConfigProposalDto.valor_proposto/valor_atual: string | number | boolean`)

**Interfaces:**
- Produces (em `hotelPortalService`, consumidos pelas Tasks 10–11):
  - `getBotIntegrationConfig(tenantId: string): Promise<BotIntegrationConfig | null>` (404 → `null`)
  - `createBotIntegrationConfig(tenantId: string, data: { bot_tenant_ref?: string; n8n_panel_webhook_url?: string }): Promise<BotIntegrationConfigWithKey>`
  - `updateBotIntegrationConfig(tenantId: string, data: { bot_tenant_ref?: string; n8n_panel_webhook_url?: string }): Promise<BotIntegrationConfig>`
  - `regenerateBotTenantKey(tenantId: string): Promise<BotIntegrationConfigWithKey>`
  - `regenerateBotPanelSecret(tenantId: string): Promise<{ panel_webhook_secret: string }>`
  - `setBotIntegrationActive(tenantId: string, active: boolean): Promise<BotIntegrationConfig>`
  - `regenerateClientWebhookSecret(clientId: string): Promise<{ webhook_secret: string }>`
  - Tipos em `@hotel-painel.ts`: `BotIntegrationConfig { id; tenant_id; active; bot_tenant_ref: string|null; n8n_panel_webhook_url: string|null; panel_webhook_secret_set: boolean; last_heartbeat_at: string|null; stuck_events: number }` e `BotIntegrationConfigWithKey = BotIntegrationConfig & { tenant_key: string }`.

- [ ] **Step 1:** `npm run codegen:diff` — salvar a saída no scratchpad e revisar: esperado **adições** (`regeneratePanelSecret`, `regenerateWebhookSecret`, campos tipados em `adminbotintegrationconfig/types.ts`, `oneOf` em `valor_proposto`), nenhuma operação removida/renomeada. Se aparecer remoção/renomeação inesperada ou slug duplicado (além do caso conhecido de notifications), parar e reportar.
- [ ] **Step 2:** `npm run codegen`.
- [ ] **Step 3:** Adicionar os métodos acima ao `hotelPortalService` em `adapters.ts`, delegando a `adminbotintegrationconfigService` e ao serviço gerado de `adminhotelclient` (nome do método gerado conforme `codegen`; mapear o retorno para os tipos de domínio). `getBotIntegrationConfig` captura `AxiosError` com `response.status === 404` e devolve `null`. Remover qualquer `any` nas rotas do bot do arquivo (`grep -n "any" src/modules/hotel-portal/infrastructure/adapters.ts`).
- [ ] **Step 4:** Atualizar os tipos de domínio listados.
- [ ] **Step 5:** `npx tsc --noEmit 2>&1 | grep -E "hotel-portal|hotel-painel|adapters"` → vazio. `npx vitest run src/modules/hotel-portal src/shared/hooks/hotel-portal` → PASS.
- [ ] **Step 6: Commit**

```bash
git add src/infraestructure/server/services src/modules/hotel-portal src/shared/domain/types
git commit -m "chore(codegen): tipos da integracao do bot, segredo do canal C e propostas com valor simples"
```

---

### Task 10: F1 — telas do bot atualizando sozinhas

**Files:**
- Modify: `src/shared/hooks/hotel-portal/use-hotel-painel.ts`
- Modify: `src/presentation/components/organisms/hotel-portal/funil/funnel-board.tsx`
- Modify: `src/presentation/components/pages/dashboard/hotel/funil/page.tsx`
- Test: `src/shared/hooks/hotel-portal/use-hotel-painel.test.tsx` (criar)
- Test: `src/presentation/components/organisms/hotel-portal/funil/__tests__/funnel-board.test.tsx` (existente, se houver)

**Interfaces:**
- Produces:
  - `export const LIVE_REFETCH = { conversations: 30_000, funnel: 60_000, channels: 60_000 }` em `use-hotel-painel.ts`.
  - `useHotelFunnelBoard(clientId: string | null, options?: { paused?: boolean })`.
  - `FunnelBoard` ganha prop opcional `onDraggingChange?: (dragging: boolean) => void`.

- [ ] **Step 1: Teste do hook (falha)** — `use-hotel-painel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/src/modules/hotel-portal/infrastructure/adapters", () => ({
  hotelPortalService: {
    listConversations: vi.fn().mockResolvedValue([]),
    getConversationDetail: vi.fn().mockResolvedValue([]),
    getFunnelBoard: vi.fn().mockResolvedValue([]),
    getBotChannels: vi.fn().mockResolvedValue({}),
  },
}));
import { hotelPortalService } from "@/src/modules/hotel-portal/infrastructure/adapters";
import { useHotelConversations, useHotelFunnelBoard, LIVE_REFETCH } from "./use-hotel-painel";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("F1 · atualizacao automatica", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("conversas refazem a busca a cada 30s", async () => {
    renderHook(() => useHotelConversations("c1", {} as any), { wrapper });
    await waitFor(() => expect(hotelPortalService.listConversations).toHaveBeenCalledTimes(1));
    await act(async () => { vi.advanceTimersByTime(LIVE_REFETCH.conversations); });
    await waitFor(() => expect(hotelPortalService.listConversations).toHaveBeenCalledTimes(2));
  });

  it("funil pausado nao refaz a busca", async () => {
    vi.mocked(hotelPortalService.getFunnelBoard).mockClear();
    renderHook(() => useHotelFunnelBoard("c1", { paused: true }), { wrapper });
    await waitFor(() => expect(hotelPortalService.getFunnelBoard).toHaveBeenCalledTimes(1));
    await act(async () => { vi.advanceTimersByTime(LIVE_REFETCH.funnel * 2); });
    expect(hotelPortalService.getFunnelBoard).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Rodar** `npx vitest run src/shared/hooks/hotel-portal/use-hotel-painel.test.tsx` → FAIL (`LIVE_REFETCH` indefinido).

- [ ] **Step 3: Implementar** em `use-hotel-painel.ts`:

```ts
/**
 * F1 (auditoria 06/10): o bot manda eventos a cada minuto pelo Canal A, entao
 * inbox, conversa, funil e canais se atualizam sozinhos. Com a aba escondida
 * o React Query ja nao refaz a busca (refetchIntervalInBackground = false).
 */
export const LIVE_REFETCH = { conversations: 30_000, funnel: 60_000, channels: 60_000 } as const;
```

- `useHotelBotChannels`: `refetchInterval: LIVE_REFETCH.channels`
- `useHotelConversations`: `refetchInterval: LIVE_REFETCH.conversations`
- `useHotelConversationDetail`: `refetchInterval: LIVE_REFETCH.conversations`
- `useHotelFunnelBoard(clientId, options: { paused?: boolean } = {})`: `refetchInterval: options.paused ? false : LIVE_REFETCH.funnel` + comentário "pausado durante o arrastar e enquanto o movimento otimista esta em voo, para a busca nao desfazer o card".

- [ ] **Step 4: FunnelBoard** — adicionar `onDraggingChange?: (dragging: boolean) => void` às props e no `DndContext`:

```tsx
        <DndContext
          onDragStart={() => onDraggingChange?.(true)}
          onDragCancel={() => onDraggingChange?.(false)}
          onDragEnd={(e) => { onDraggingChange?.(false); handleDragEnd(e); }}
        >
```

- [ ] **Step 5: Página do funil** — em `hotel/funil/page.tsx`: `const [dragging, setDragging] = useState(false);`, chamar `useHotelFunnelBoard(clientId, { paused: dragging || moveMutation.isPending || !!pendingModal })` (usar o nome real da mutation de `useMoveFunnelStage` na página; se o modal de PERDIDO vive dentro do `FunnelBoard`, basta `dragging || isPending`) e passar `onDraggingChange={setDragging}` ao `<FunnelBoard>`. Ajustar o mock em testes existentes da página se a assinatura quebrar.

- [ ] **Step 6: Rodar** `npx vitest run src/shared/hooks/hotel-portal src/presentation/components/organisms/hotel-portal/funil src/presentation/components/pages/dashboard/hotel` → PASS.

- [ ] **Step 7: Commit**

```bash
git add src/shared/hooks/hotel-portal src/presentation/components/organisms/hotel-portal/funil src/presentation/components/pages/dashboard/hotel/funil
git commit -m "feat(painel): inbox, conversa, funil e canais se atualizam sozinhos; funil pausa durante o arrastar"
```

---

### Task 11: F2 — bloco "Assistente de WhatsApp" na configuração do cliente

**Files:**
- Create: `src/shared/hooks/hotel-portal/use-bot-integration.ts` (exportar no `index.ts` da pasta)
- Create: `src/presentation/components/organisms/hotel-portal/painel/bot-integration/bot-integration-card.tsx`
- Create: `src/presentation/components/organisms/hotel-portal/painel/bot-integration/one-time-secret.tsx`
- Create: `src/presentation/components/organisms/hotel-portal/painel/bot-integration/__tests__/bot-integration-card.test.tsx`
- Modify: `src/presentation/components/pages/dashboard/hotel-portal/[clientId]/page.tsx` (`ConfigTab`, ~linha 828: renderizar `<BotIntegrationCard tenantId={client.tenant_id} clientId={clientId} webhookSecretSet={client.webhook_secret_set} />` abaixo do formulário)

**Interfaces:**
- Consumes (Task 9): `hotelPortalService.getBotIntegrationConfig / createBotIntegrationConfig / updateBotIntegrationConfig / regenerateBotTenantKey / regenerateBotPanelSecret / setBotIntegrationActive / regenerateClientWebhookSecret`; tipos `BotIntegrationConfig`, `BotIntegrationConfigWithKey`.
- Produces:
  - Hooks: `useBotIntegrationConfig(tenantId: string | null)` (queryKey `['hotel-portal', 'bot-integration', tenantId]`), `useSaveBotIntegration(tenantId)` (cria se não existe, senão atualiza; devolve `BotIntegrationConfig | BotIntegrationConfigWithKey`), `useRegenerateBotTenantKey(tenantId)`, `useRegenerateBotPanelSecret(tenantId)`, `useSetBotIntegrationActive(tenantId)`, `useRegenerateClientWebhookSecret(clientId)`. Todas as mutations invalidam a query da integração.
  - `<OneTimeSecret label: string; value: string; onDismiss: () => void />` — mostra o valor em `<code>`, botão "Copiar" (`navigator.clipboard.writeText`), aviso "Guarde agora no gerenciador de senhas: este valor não será mostrado de novo." e botão "Já guardei".

- [ ] **Step 1: Testes do card (falham)** — mockar o módulo de hooks `use-bot-integration`:

```tsx
// casos:
// 1. sem integracao (data null): mostra campos "Identificador do bot" e "URL do WF6" vazios e botao "Criar integração";
//    ao criar, a chave devolvida (tenant_key) aparece em OneTimeSecret com label "Chave do tenant (Canal A)".
// 2. com integracao: mostra bot_tenant_ref, URL, chip "Ativo"/"Desativado", "Último sinal de vida" formatado
//    (ou "Nunca" se last_heartbeat_at null), "Segredo do Canal B: configurado/não configurado".
// 3. stuck_events > 0: mostra alerta "3 eventos do bot presos — o reprocesso automático tenta 5 vezes."
// 4. "Gerar segredo do Canal B" chama useRegenerateBotPanelSecret e exibe o segredo uma vez; "Já guardei" esconde.
// 5. "Gerar segredo do Canal C" chama useRegenerateClientWebhookSecret e exibe uma vez.
// 6. Nenhum segredo aparece no DOM depois de "Já guardei" (queryByText(valor) === null).
```

Escrever esses 6 casos em código com `@testing-library/react` + `userEvent`, no mesmo estilo de `bot-config/__tests__/proposal-form.test.tsx`.

- [ ] **Step 2: Rodar** → FAIL.

- [ ] **Step 3: Hooks** — `use-bot-integration.ts` seguindo o padrão de `use-hotel-painel.ts` (`enabled: !!tenantId`, `retry: false`, `staleTime: 60_000`). Mutations com `onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-portal', 'bot-integration', tenantId] })`.

- [ ] **Step 4: Componentes** — `bot-integration-card.tsx` (`"use client"`), usando `Card` do shadcn e `Input`/`Button` já usados em `proposal-form.tsx`. Título "Assistente de WhatsApp". Campos: "Identificador do bot" (placeholder `cli_dona_tereza`, maxLength 60), "URL do WF6" (placeholder `https://bot.reservemkt.com.br/webhook/painel`). Botões: "Salvar", "Gerar chave do tenant" (confirmação: "A chave atual para de funcionar até o bot ser atualizado. Continuar?"), "Gerar segredo do Canal B", "Gerar segredo do Canal C", "Ativar"/"Desativar". Estado local `revealed: { label: string; value: string } | null` alimentado pela resposta das mutations; renderiza `<OneTimeSecret>` quando não nulo. O segredo nunca vai para query cache: limpar `revealed` em `onDismiss` e no unmount. Erros via `toast.error` (react-hot-toast, como no resto da página).

- [ ] **Step 5: Plugar no `ConfigTab`** — só renderizar quando `client?.tenant_id` existir; caso contrário mostrar "Este cliente não tem tenant vinculado."

- [ ] **Step 6: Rodar** `npx vitest run src/presentation/components/organisms/hotel-portal/painel/bot-integration src/shared/hooks/hotel-portal` → PASS; `npx tsc --noEmit 2>&1 | grep -E "bot-integration|hotel-portal/\[clientId\]"` → vazio.

- [ ] **Step 7: Commit**

```bash
git add src/shared/hooks/hotel-portal src/presentation/components/organisms/hotel-portal/painel/bot-integration "src/presentation/components/pages/dashboard/hotel-portal/[clientId]/page.tsx"
git commit -m "feat(painel): bloco Assistente de WhatsApp para configurar a integracao do bot sem Postman"
```

---

### Task 12: F3 — valores em reais nas propostas de preço

**Files:**
- Modify: `src/presentation/components/organisms/hotel-portal/painel/bot-config/proposal-form.tsx`
- Test: `src/presentation/components/organisms/hotel-portal/painel/bot-config/__tests__/proposal-form.test.tsx`

**Interfaces:**
- Produces (exportados do próprio arquivo): `isCentsKey(campo: string): boolean` (termina em `_cents` ou começa com `tarifa:`), `reaisToCents(input: string): number | null` (aceita `"339"`, `"339,90"`, `"1.339,90"`, `"339.9"`; inválido → `null`).
- Envio: chave de centavos → `valor_proposto: number` (centavos); chave de minutos (`hold_min_*`) ou numérica → `number`; demais → texto.

- [ ] **Step 1: Testes que falham** (acrescentar ao spec existente):

```tsx
import { isCentsKey, reaisToCents } from "../proposal-form";

describe("F3 · valores em reais", () => {
  it.each([["339", 33900], ["339,90", 33990], ["1.339,90", 133990], ["339.9", 33990], ["abc", null], ["", null]])(
    "reaisToCents(%p) = %p", (input, expected) => expect(reaisToCents(input)).toBe(expected),
  );
  it("identifica chaves de centavos", () => {
    expect(isCentsKey("valor_taxa_pet_cents")).toBe(true);
    expect(isCentsKey("tarifa:361057:A")).toBe(true);
    expect(isCentsKey("hold_min_cartao")).toBe(false);
  });
  it("valor_taxa_pet_cents digitado 50 chega como 5000 com previa R$ 50,00", async () => {
    const onSubmit = vi.fn();
    render(<ProposalForm onSubmit={onSubmit} isSubmitting={false} />);
    await userEvent.type(screen.getByLabelText("O que muda"), "valor_taxa_pet_cents");
    await userEvent.type(screen.getByLabelText(/Novo valor/), "50");
    expect(screen.getByText("R$ 50,00")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Enviar para aprovação/ }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ valor_proposto: 5000 }));
  });
  it("hold_min_cartao 30 vai como numero", async () => {
    const onSubmit = vi.fn();
    render(<ProposalForm onSubmit={onSubmit} isSubmitting={false} />);
    await userEvent.selectOptions(screen.getByLabelText("Categoria"), "policies");
    await userEvent.type(screen.getByLabelText("O que muda"), "hold_min_cartao");
    await userEvent.type(screen.getByLabelText(/Novo valor/), "30");
    await userEvent.click(screen.getByRole("button", { name: /Enviar para aprovação/ }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ valor_proposto: 30 }));
  });
});
```

- [ ] **Step 2: Rodar** `npx vitest run src/presentation/components/organisms/hotel-portal/painel/bot-config` → FAIL.

- [ ] **Step 3: Implementar**:

```ts
/** F3: chaves de preco sao em centavos no bot; a equipe digita reais. */
export function isCentsKey(campo: string): boolean {
  return campo.endsWith("_cents") || campo.startsWith("tarifa:");
}

export function reaisToCents(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

function toProposalValue(campo: string, raw: string): string | number {
  if (isCentsKey(campo)) return reaisToCents(raw) ?? raw;
  return /^-?\d+(\.\d+)?$/.test(raw.trim()) ? Number(raw.trim()) : raw;
}
```

No form: `const cents = isCentsKey(campo);` label do novo valor vira `cents ? "Novo valor (R$)" : "Novo valor"` (mesmo para "Valor atual"); com `cents`, abaixo do input mostrar a prévia `formatBRL(reaisToCents(valorProposto)! / 100)` quando não nulo (reusar `formatBRL` de `funil/funnel-stages`; se o formato dele não for `R$ 50,00`, usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`) ou "Valor inválido" em vermelho. Botão desabilitado se `cents && reaisToCents(valorProposto) === null`. No `onSubmit`: `valor_proposto: toProposalValue(campo, valorProposto)`, `valor_atual: valorAtual ? toProposalValue(campo, valorAtual) : undefined`. Trocar o texto de ajuda "(valor em centavos)" por "(digite em reais)".

- [ ] **Step 4: Rodar** → PASS (inclusive os testes antigos do form; ajustar expectativas antigas que esperavam texto onde agora vai número).

- [ ] **Step 5: Commit**

```bash
git add src/presentation/components/organisms/hotel-portal/painel/bot-config
git commit -m "feat(painel): propostas de preco digitadas em reais com previa e enviadas em centavos"
```

---

## Fechamento (depois da Task 12)

- [ ] Rodar a suíte inteira dos dois repos uma vez: back `npx jest src/modules/reserve-client-portal`; front `npx vitest run` e comparar com o baseline de 77 falhas (só investigar falhas fora de CMS/access-management/editor).
- [ ] Revisão de qualidade única de tudo (`superpowers:requesting-code-review`), conforme preferência do usuário de revisar só no final.

## Pendências humanas (fora do código)

1. **B3:** confirmar onde o backend roda em produção. Se for servidor/container: nada a fazer (os `@Cron` disparam). Se for serverless: configurar `CRON_SECRET` e agendar `POST /api/internal/cron/bot-sync` a cada 5 min; medir um lote de 250 eventos dentro do tempo máximo da função.
2. `prisma migrate deploy` em produção (`20260930000001_bot_contract_v2` + `20261006000001_bot_ingestion_attempts`). A limpeza `20260930000002` foi adiada de propósito (`ef975e3`).
3. Passos 2–8 de "Ligar o tenant Dona Tereza" e os testes de aceite da auditoria; agora a etapa 3 e 4 são feitas pelo bloco "Assistente de WhatsApp" (Task 11).
4. Pendências do lado do bot (WF9a, `audio.transcrito`, `tarifa:*`/`calendario:*` no WF6, modelos Meta, troca de credenciais vazadas).
