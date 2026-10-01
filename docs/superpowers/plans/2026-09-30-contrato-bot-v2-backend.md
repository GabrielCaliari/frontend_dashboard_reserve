# Contrato Bot ↔ Painel v2 — Backend — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adequar o `backend_reserve` ao Contrato Bot ↔ Painel v2 (`docs/CONTRATO_BOT_PAINEL_v2.md` no repo do front): ingestão em lote com envelope novo, projeções a partir de eventos, canal reverso assinado por HMAC, webhook de reservas do PMS e saída do Chatwoot.

**Architecture:** O ledger `bot_ingestion_events` vira o log append-only do contrato (guarda o evento v2 inteiro). Um projetor único aplica cada evento, em ordem de `occurred_at`, sobre `bot_contacts` (snapshot do contato), `bot_leads` (estágio + hold + etiquetas) e `bot_messages`. Os endpoints de leitura do painel passam a ler só dessas projeções — o funil deixa de consultar `motor_*`. Toda ação humana vira uma linha em `bot_panel_actions` (outbox) antes de ser enviada ao bot com assinatura HMAC; um cron reconcilia as que falharem.

**Tech Stack:** NestJS 11, Prisma 7 (`@prisma/adapter-pg`), class-validator/class-transformer, axios, `@nestjs/schedule`, Jest 29 (services instanciados direto, Prisma mockado como objeto literal).

**Repo:** `C:\Users\gabri\OneDrive\Documents\GitHub\backend_reserve`. Todos os caminhos abaixo são relativos a ele. `CP` = `src/modules/reserve-client-portal`.

## Global Constraints

- **Fonte da verdade do contrato:** `C:\Users\gabri\OneDrive\Documents\GitHub\frontend_dashboard_reserve\docs\CONTRATO_BOT_PAINEL_v2.md`. Em dúvida sobre um campo, ler a seção citada na task — não inventar.
- **O painel nunca acessa o banco do bot** (contrato §1.2). O estado de um contato é o snapshot do evento mais recente por `occurred_at`. Evento que chega atrasado **não** sobrescreve estado mais novo.
- **Dinheiro:** centavos no contrato e nas colunas novas (`*_cents`, `Int`); reais (2 casas) nas respostas `valorCotacao`, `valorAberto`, `valorConfirmado`.
- **Idempotência:** `event_id` já gravado é ignorado em silêncio e o lote responde `202` (contrato §3.3). Nunca gravar duas vezes.
- **`content_preview`:** no máximo 180 caracteres (contrato §8), truncado no servidor independentemente do que o bot mandar.
- **CPF e endereço nunca entram no painel** (contrato §8). Não criar colunas para eles.
- **Canal B:** HMAC-SHA256 do **corpo bruto** em hex no header `X-Reserve-Signature`; comparação em tempo constante (`crypto.timingSafeEqual`) onde o backend valida assinatura.
- **A ação humana é gravada antes de chamar o bot** (contrato §5.3). Falha de envio não desfaz a ação; o cron reconcilia.
- **Migrations:** SQL escrito à mão em `prisma/migrations/<timestamp>_<nome>/migration.sql`, NUNCA `db push`. Toda migration ganha um `describe()` em `src/shared/database/migrations.spec.ts`. Depois de editar `prisma/schema.prisma`: `npx prisma generate`.
- **Enums do Prisma** importados de `src/generated/prisma/enums` (não de `@prisma/client`).
- **`SecurityPostureGuard` é deny-by-default:** toda rota nova precisa de `@UseGuards(...)` ou `@Public()`.
- **Pool pg `max: 3`:** no máximo 2–3 queries em `Promise.all`; loops são sequenciais.
- **Testes:** Jest, spec ao lado do arquivo, service instanciado com `new` e Prisma mockado como objeto de `jest.fn()`. Comando: `npm test -- <padrão>`.
- **Idioma:** identificadores de domínio em português `snake_case`; comentários em português sem acento; commits conventional em português sem acento.
- **Commits** terminam com: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`
- **Não rodar revisão de qualidade por task** — a revisão é única, no fim de tudo.

## Decisões fechadas neste plano

1. **Identidade do tenant no contrato.** O bot manda `tenant_id: "cli_dona_tereza"`; nossos tenants são cuids. Nova coluna `bot_integration_configs.bot_tenant_ref` (única) guarda o identificador do bot. O guard aceita o `tenant_id` do corpo casando com `bot_tenant_ref` **ou** com o nosso `tenant_id`. O Canal B envia `bot_tenant_ref ?? tenant_id`.
2. **O envelope v1 morre.** Só o WF11 do bot envia eventos, e ele já fala v2. Os nomes antigos (`conversa.iniciada`, `mensagem.recebida`, `bot.pausado`…) deixam de ser tratados. O `BotEventKeyGuard` (headers `x-tenant-id`/`x-tenant-key`) continua existindo porque as rotas do motor o usam.
3. **O funil para de ler `motor_*`.** O bot cria a pré-reserva no Hospedin; o valor chega no bloco `hold` do evento. `valorCotacao`, `valorAberto`, `valorConfirmado` e a etiqueta `RECUPERAR` passam a vir de `bot_leads`.
4. **`GuestStatusService` + cron são aposentados.** Eles reescrevem `tipo_publico` a partir de reservas do motor e brigariam com o snapshot do bot, que agora manda `audience` e `bot_status = EM_ESTADIA`.
5. **Um único canal reverso.** `n8n_panel_webhook_url` + segredo HMAC substituem `n8n_stage_webhook_url` e `n8n_config_publish_webhook_url`. `bot_panel_actions` substitui `bot_stage_webhook_dispatches`.
6. **`send_message` não é reenviado pelo cron.** Uma mensagem entregue 10 minutos depois, fora de contexto, é pior que uma mensagem perdida.
7. **Motivo de perda vira enum** (`caro | data | pesquisando | sumiu | outro`), igual ao `data.motivo` do evento `perdido`. O histórico em texto livre permanece no banco.
8. **Duas migrations:** uma aditiva no início (Task 1) e uma de limpeza no fim (Task 12), para que cada task termine com a suíte verde.

## Formas de resposta que o frontend consome

Estas são as formas finais. O plano do front (`2026-09-30-contrato-bot-v2-frontend.md`) tipa exatamente isto.

```ts
type BotContactStatus =
  | 'ATIVO' | 'VERIFICANDO' | 'AGUARDANDO_FICHA' | 'AGUARDANDO_PAGAMENTO' | 'EM_CONFIRMACAO'
  | 'PAUSADO' | 'PAUSADO_HUMANO' | 'FECHADO' | 'EM_ESTADIA' | 'FRIO';

// GET /hotel-portal/:clientId/whatsapp/conversations  ->  { conversations: ConversationListItem[] }
interface ConversationListItem {
  numeroContato: string; nome: string | null; statusBot: BotContactStatus;
  lastMessageAt: string | null; consentimentoLgpd: boolean;
  tipoPublico: string | null; currentStage: string;
  whatsappWebLink: string;                 // https://web.whatsapp.com/send?phone=<so digitos>
}

interface HoldResumo {
  codigo: string | null; status: string | null; acomodacao: string | null;
  checkIn: string | null; checkOut: string | null; valor: number | null;   // reais
}

// GET /hotel-portal/:clientId/whatsapp/conversations/:numero
interface ConversationDetailResponse {
  contact: ConversationListItem & { ocasiao: string | null; hold: HoldResumo | null };
  messages: { role: string; tipo: string; contentPreview: string | null; ocorridoEm: string }[];
}

// GET /hotel-portal/:clientId/whatsapp/funnel  ->  FunnelBoardColumn[]
interface FunnelBoardLead {
  numeroContato: string; nome: string | null; tipoPublico: string | null;
  acomodacaoInteresse: string | null; datasInteresse: string | null;
  statusBot: BotContactStatus; aguardandoDesde: string | null;
  valorCotacao: number | null; etiqueta: 'RECUPERAR' | null;
  motivoPerda: string | null; holdStatus: string | null; holdCodigo: string | null;
}

// GET .../whatsapp/funnel/metrics — campos que MUDAM de forma (os demais ficam iguais)
//   efetividadeFollowup: { regua: string; status: 'respondeu' | 'sem_resposta'; count: number }[]
//   conversasPorAnuncio: { sourceId: string; count: number }[]        (novo)

// GET .../whatsapp/channels — bloco whatsapp ganha:
//   mode: 'hospedin' | 'handoff' | null; aiEnabled: boolean | null;
//   lastEchoAt: string | null; lastPollingAt: string | null

// GET .../home — ganha o bloco:
//   bot: { receitaConfirmada: number; reservas: number; aRecuperar: { quantidade: number; valor: number } }

// GET .../leads-overview — ganha:
//   ciclo: { cliques: number; conversas: number; reservas: number }

// POST admin/hotel-portal/:tenantId/whatsapp/funnel/:contactId/pause        body { motivo?: string }
// POST admin/hotel-portal/:tenantId/whatsapp/funnel/:contactId/extend-hold  body { minutos?: number; codigo?: string }
//   -> ambos respondem { ok: boolean; state: string | null }
// POST admin/hotel-portal/whatsapp/:clientId/send  body { to_phone: string; to_name?: string; body: string }
//   -> { ok: boolean; state: string | null; foraDaJanela: boolean }
```

## Estrutura de arquivos

```
prisma/schema.prisma                                              Tasks 1, 12
prisma/migrations/20260930000001_bot_contract_v2/migration.sql    Task 1
prisma/migrations/20260930000002_bot_contract_v2_cleanup/…        Task 12
src/shared/database/migrations.spec.ts                            Tasks 1, 12
src/main.ts                                                       Task 2 (limite de corpo da ingestao)

CP/application/dtos/bot-event.dto.ts                              Task 2 (reescrito: lote + evento v2)
CP/infrastructure/guards/bot-ingest-bearer.guard.ts (+spec)       Task 2 (novo)
CP/infrastructure/controllers/bot-event-ingestion.controller.ts   Task 2
CP/application/services/bot-event-ingestion.service.ts (+spec)    Task 2
CP/application/services/bot-event-processor.service.ts (+spec)    Task 3 (reescrito: projetor v2)
CP/application/services/bot-conversation.service.ts (+spec)       Task 4
CP/application/services/bot-channel-health.service.ts (+spec)     Task 4
CP/application/services/funnel-metrics.service.ts (+spec)         Tasks 5, 6
CP/infrastructure/providers/bot-panel-action.provider.ts (+spec)  Task 7 (novo)
CP/infrastructure/providers/bot-reconciliation-cron.provider.ts   Task 7
CP/application/services/bot-integration-config.service.ts         Task 7
CP/application/dtos/bot-integration-config.dto.ts                 Task 7
CP/application/services/funnel.service.ts (+spec)                 Task 8
CP/application/dtos/funnel-action.dto.ts                          Task 8 (novo)
CP/infrastructure/controllers/admin-whatsapp-funnel.controller.ts Task 8
CP/application/dtos/whatsapp.dto.ts + whatsapp.service.ts         Task 8 (send)
CP/application/services/bot-config-proposal.service.ts (+spec)    Task 9
CP/application/dtos/bot-config-proposal.dto.ts                    Task 9
CP/application/services/pms-booking-webhook.service.ts (+spec)    Task 10 (novo)
CP/infrastructure/controllers/pms-booking-webhook.controller.ts   Task 10 (novo)
CP/application/services/home.service.ts (+spec)                   Task 11
CP/application/services/leads-overview.service.ts (+spec)         Task 11
CP/reserve-client-portal.module.ts                                Tasks 2, 7, 10, 11, 12
```

---

## Task 1: Migração aditiva + schema

Só adiciona. Nada é removido aqui, para o código antigo continuar compilando até a Task 12.

**Files:**
- Create: `prisma/migrations/20260930000001_bot_contract_v2/migration.sql`
- Modify: `prisma/schema.prisma` (enums nas linhas ~311–353 e ~2192; models `BotIntegrationConfig` ~358, `BotContact` ~395, `BotLead` ~445, `FollowupAttempt` ~459, `BotConfigProposal` ~2357; model novo `BotPanelAction`)
- Test: `src/shared/database/migrations.spec.ts`

**Interfaces:**
- Produces (todas as tasks seguintes usam):
  - `EBotContactStatus` com 10 valores; `EBotMessageType` com `texto | audio | imagem | botoes | template | sistema`; `EBookingEngineType.HOSPEDIN`.
  - `BotIntegrationConfig`: `bot_tenant_ref String? @unique`, `n8n_panel_webhook_url String?`, `panel_webhook_secret_enc String?`, `last_heartbeat_data Json?`.
  - `BotContact`: `ocasiao`, `source_id`, `link_code`, `ctwa_clid`, `iniciado_em`, `snapshot_em`, `last_user_message_at`.
  - `BotLead`: `stage_em`, `hold_codigo`, `hold_status`, `hold_valor_cents`, `hold_pms_reservation_id`, `hold_em`, `valor_confirmado_cents`, `recuperar`, `motivo_perda`.
  - `FollowupAttempt.regua`; `BotConfigProposal.justificativa_cliente`.
  - Model `BotPanelAction` (delegate `prisma.botPanelAction`).

- [ ] **Step 1: Escrever o teste que falha**

Em `src/shared/database/migrations.spec.ts`, ao final do arquivo (o helper `readMigration` já existe no topo):

```ts
describe('20260930000001_bot_contract_v2', () => {
  const sql = readMigration('20260930000001_bot_contract_v2');

  it('amplia o status do contato para os 10 estados do contrato', () => {
    for (const estado of [
      'VERIFICANDO', 'AGUARDANDO_FICHA', 'AGUARDANDO_PAGAMENTO', 'EM_CONFIRMACAO',
      'PAUSADO_HUMANO', 'FECHADO', 'EM_ESTADIA', 'FRIO',
    ]) {
      expect(sql).toContain(`ALTER TYPE "EBotContactStatus" ADD VALUE IF NOT EXISTS '${estado}'`);
    }
  });

  it('cria o outbox de acoes do painel', () => {
    expect(sql).toContain('CREATE TABLE "bot_panel_actions"');
    expect(sql).toContain('CREATE INDEX "bot_panel_actions_tenant_id_status_idx"');
  });

  it('identificador do bot por tenant e unico', () => {
    expect(sql).toContain('CREATE UNIQUE INDEX "bot_integration_configs_bot_tenant_ref_key"');
  });

  it('guarda hold e etiquetas no lead, em centavos', () => {
    expect(sql).toContain('"hold_valor_cents" INTEGER');
    expect(sql).toContain('"valor_confirmado_cents" INTEGER NOT NULL DEFAULT 0');
    expect(sql).toContain('"recuperar" BOOLEAN NOT NULL DEFAULT false');
  });

  it('nao remove nada (a limpeza e outra migration)', () => {
    expect(sql).not.toMatch(/DROP (TABLE|COLUMN)/);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- migrations.spec`
Expected: FAIL — `ENOENT … 20260930000001_bot_contract_v2/migration.sql`.

- [ ] **Step 3: Escrever a migration**

Antes, confirmar o nome exato dos tipos no Postgres: `Grep 'CREATE TYPE "EBotContactStatus"' prisma/migrations` (o Prisma usa o nome do enum como nome do tipo). Se o nome for diferente, usar o que aparecer.

`prisma/migrations/20260930000001_bot_contract_v2/migration.sql`:

```sql
-- Contrato Bot <-> Painel v2 (parte aditiva). ADD VALUE nao pode ser usado na
-- mesma transacao em que e criado: nenhum dos valores novos e referenciado aqui.

-- AlterEnum
ALTER TYPE "EBotContactStatus" ADD VALUE IF NOT EXISTS 'VERIFICANDO';
ALTER TYPE "EBotContactStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_FICHA';
ALTER TYPE "EBotContactStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_PAGAMENTO';
ALTER TYPE "EBotContactStatus" ADD VALUE IF NOT EXISTS 'EM_CONFIRMACAO';
ALTER TYPE "EBotContactStatus" ADD VALUE IF NOT EXISTS 'PAUSADO_HUMANO';
ALTER TYPE "EBotContactStatus" ADD VALUE IF NOT EXISTS 'FECHADO';
ALTER TYPE "EBotContactStatus" ADD VALUE IF NOT EXISTS 'EM_ESTADIA';
ALTER TYPE "EBotContactStatus" ADD VALUE IF NOT EXISTS 'FRIO';

ALTER TYPE "EBotMessageType" ADD VALUE IF NOT EXISTS 'botoes';
ALTER TYPE "EBotMessageType" ADD VALUE IF NOT EXISTS 'template';
ALTER TYPE "EBotMessageType" ADD VALUE IF NOT EXISTS 'sistema';

ALTER TYPE "EBookingEngineType" ADD VALUE IF NOT EXISTS 'HOSPEDIN';

-- AlterTable: integracao do bot
ALTER TABLE "bot_integration_configs"
  ADD COLUMN "bot_tenant_ref" VARCHAR(60),
  ADD COLUMN "n8n_panel_webhook_url" VARCHAR(500),
  ADD COLUMN "panel_webhook_secret_enc" TEXT,
  ADD COLUMN "last_heartbeat_data" JSONB;

CREATE UNIQUE INDEX "bot_integration_configs_bot_tenant_ref_key"
  ON "bot_integration_configs"("bot_tenant_ref");

-- AlterTable: snapshot do contato
ALTER TABLE "bot_contacts"
  ADD COLUMN "ocasiao" VARCHAR(20),
  ADD COLUMN "source_id" VARCHAR(100),
  ADD COLUMN "link_code" VARCHAR(20),
  ADD COLUMN "ctwa_clid" VARCHAR(255),
  ADD COLUMN "iniciado_em" TIMESTAMP(3),
  ADD COLUMN "snapshot_em" TIMESTAMP(3),
  ADD COLUMN "last_user_message_at" TIMESTAMP(3);

-- Contatos antigos: o inicio conhecido e a criacao da linha.
UPDATE "bot_contacts" SET "iniciado_em" = "created_at" WHERE "iniciado_em" IS NULL;

-- Contrato 4.1: consentimento e true por padrao (a conversa e iniciada pelo hospede).
UPDATE "bot_contacts" SET "consentimento_lgpd" = true;
ALTER TABLE "bot_contacts" ALTER COLUMN "consentimento_lgpd" SET DEFAULT true;

CREATE INDEX "bot_contacts_tenant_id_iniciado_em_idx" ON "bot_contacts"("tenant_id", "iniciado_em");

-- AlterTable: projecao do lead (estagio + hold + etiquetas)
ALTER TABLE "bot_leads"
  ADD COLUMN "stage_em" TIMESTAMP(3),
  ADD COLUMN "hold_codigo" VARCHAR(20),
  ADD COLUMN "hold_status" VARCHAR(20),
  ADD COLUMN "hold_valor_cents" INTEGER,
  ADD COLUMN "hold_pms_reservation_id" VARCHAR(60),
  ADD COLUMN "hold_em" TIMESTAMP(3),
  ADD COLUMN "valor_confirmado_cents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "recuperar" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "motivo_perda" VARCHAR(255);

-- AlterTable
ALTER TABLE "bot_followup_attempts" ADD COLUMN "regua" VARCHAR(20);
ALTER TABLE "bot_config_propostas" ADD COLUMN "justificativa_cliente" TEXT;

-- CreateTable: outbox do canal reverso (painel -> bot)
CREATE TABLE "bot_panel_actions" (
    "id" VARCHAR(25) NOT NULL,
    "tenant_id" VARCHAR(25) NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "phone" VARCHAR(20),
    "actor_id" VARCHAR(25),
    "payload" JSONB NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "response_state" VARCHAR(30),
    "last_error" TEXT,
    "last_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_panel_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bot_panel_actions_tenant_id_status_idx" ON "bot_panel_actions"("tenant_id", "status");
```

- [ ] **Step 4: Espelhar no `schema.prisma`**

Enums:

```prisma
enum EBotContactStatus {
  ATIVO
  VERIFICANDO
  AGUARDANDO_FICHA
  AGUARDANDO_PAGAMENTO
  EM_CONFIRMACAO
  PAUSADO
  PAUSADO_HUMANO
  FECHADO
  EM_ESTADIA
  FRIO
}

enum EBotMessageType {
  texto
  audio
  imagem
  botoes
  template
  sistema
}
```

Em `EBookingEngineType`, acrescentar `HOSPEDIN` ao final.

Em `BotIntegrationConfig`, depois de `chatwoot_base_url`:

```prisma
  bot_tenant_ref           String?  @unique @db.VarChar(60) // identificador do tenant no bot (ex.: cli_dona_tereza)
  n8n_panel_webhook_url    String?  @db.VarChar(500)
  panel_webhook_secret_enc String?  @db.Text                // segredo HMAC do canal reverso, cifrado (AES-256-GCM)
  last_heartbeat_data      Json?
```

Em `BotContact`, depois de `last_message_at` (e trocar o default de `consentimento_lgpd` para `true`):

```prisma
  ocasiao              String?   @db.VarChar(20)  // romantica | familia | grupo | descanso
  source_id            String?   @db.VarChar(100)
  link_code            String?   @db.VarChar(20)
  ctwa_clid            String?   @db.VarChar(255)
  iniciado_em          DateTime?                  // occurred_at do contato.iniciado
  snapshot_em          DateTime?                  // occurred_at do ultimo snapshot aplicado
  last_user_message_at DateTime?

  @@index([tenant_id, iniciado_em])
```

Em `BotLead`, depois de `datas_interesse`:

```prisma
  stage_em                DateTime?
  hold_codigo             String?   @db.VarChar(20)
  hold_status             String?   @db.VarChar(20) // DISPONIVEL | AGUARDANDO | CONFIRMADA | EXPIRADA | CANCELADA | EXCECAO
  hold_valor_cents        Int?
  hold_pms_reservation_id String?   @db.VarChar(60)
  hold_em                 DateTime?
  valor_confirmado_cents  Int       @default(0)
  recuperar               Boolean   @default(false)
  motivo_perda            String?   @db.VarChar(255)
```

Em `FollowupAttempt`: `regua String? @db.VarChar(20) // anuncio | organico | pre_reserva | pagamento`.
Em `BotConfigProposal`: `justificativa_cliente String? @db.Text`.

Model novo, logo depois de `BotStageWebhookDispatch`:

```prisma
/// Outbox do canal reverso (contrato v2 §5): a acao do humano e gravada ANTES
/// de ser enviada ao bot; o cron reconcilia as que falharem.
model BotPanelAction {
  id              String    @id @default(cuid()) @db.VarChar(25)
  tenant_id       String    @db.VarChar(25)
  action          String    @db.VarChar(30)
  phone           String?   @db.VarChar(20)
  actor_id        String?   @db.VarChar(25)
  payload         Json
  status          String    @default("PENDING") @db.VarChar(10) // PENDING | SENT | FAILED
  attempts        Int       @default(0) @db.SmallInt
  response_state  String?   @db.VarChar(30)
  last_error      String?   @db.Text
  last_attempt_at DateTime?
  created_at      DateTime  @default(now())

  @@index([tenant_id, status])
  @@map("bot_panel_actions")
}
```

- [ ] **Step 5: Gerar o client e rodar**

Run: `npx prisma generate` — Expected: `Generated Prisma Client`.
Run: `npm test -- migrations.spec` — Expected: PASS.
Run: `npm test -- reserve-client-portal` — Expected: PASS (nada foi removido).

- [ ] **Step 6: Commit**

```bash
git add prisma/ src/shared/database/migrations.spec.ts
git commit -m "feat(bot): migracao aditiva do contrato bot-painel v2"
```

---

## Task 2: Ingestão v2 — lote, chave Bearer, resposta `{received, duplicated}`

**Files:**
- Modify: `CP/application/dtos/bot-event.dto.ts` (reescrever)
- Create: `CP/infrastructure/guards/bot-ingest-bearer.guard.ts`
- Create: `CP/infrastructure/guards/bot-ingest-bearer.guard.spec.ts`
- Modify: `CP/application/services/bot-event-ingestion.service.ts`
- Create: `CP/application/services/bot-event-ingestion.service.spec.ts`
- Modify: `CP/infrastructure/controllers/bot-event-ingestion.controller.ts`
- Modify: `CP/infrastructure/controllers/client-portal-module-access-wiring.spec.ts:118-122`
- Modify: `CP/reserve-client-portal.module.ts` (providers += `BotIngestBearerGuard`)
- Modify: `src/main.ts:24-29`

**Interfaces:**
- Consumes: `BotKeyProvider.verify(rawKey, hash, salt): boolean`; `prisma.botIntegrationConfig`, `prisma.botIngestionEvent`.
- Produces:
  - `class BotEventV2Dto { event_id; tenant_id?; occurred_at; type; actor?; contact?; stage?; hold?; data? }` e `class BotEventBatchDto { tenant_id; events: BotEventV2Dto[] }`.
  - `BotEventIngestionService.ingestBatch(tenantId: string, events: BotEventV2Dto[]): Promise<{ received: number; duplicated: number }>`.
  - A Task 3 implementa `BotEventProcessorService.process(tenantId: string, event: BotEventV2Dto): Promise<void>`; nesta task o processor é só mockado.

- [ ] **Step 1: Testes que falham — guard**

`CP/infrastructure/guards/bot-ingest-bearer.guard.spec.ts`:

```ts
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { BotIngestBearerGuard } from './bot-ingest-bearer.guard';

function ctx(request: any) {
  return { switchToHttp: () => ({ getRequest: () => request }) } as any;
}

describe('BotIngestBearerGuard', () => {
  const config = {
    id: 'cfg_1', tenant_id: 'tenant_1', active: true,
    tenant_key_hash: 'hash', tenant_key_salt: 'salt',
  };
  let prisma: { botIntegrationConfig: { findFirst: jest.Mock } };
  let keys: { verify: jest.Mock };
  let guard: BotIngestBearerGuard;

  beforeEach(() => {
    prisma = { botIntegrationConfig: { findFirst: jest.fn().mockResolvedValue(config) } };
    keys = { verify: jest.fn().mockReturnValue(true) };
    guard = new BotIngestBearerGuard(prisma as any, keys as any);
  });

  it('aceita a chave Bearer e resolve o tenant pelo identificador do bot', async () => {
    const request: any = {
      headers: { authorization: 'Bearer chave-secreta' },
      body: { tenant_id: 'cli_dona_tereza' },
    };
    await expect(guard.canActivate(ctx(request))).resolves.toBe(true);
    expect(prisma.botIntegrationConfig.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ bot_tenant_ref: 'cli_dona_tereza' }, { tenant_id: 'cli_dona_tereza' }] },
    });
    expect(keys.verify).toHaveBeenCalledWith('chave-secreta', 'hash', 'salt');
    expect(request.tenant_id).toBe('tenant_1');
  });

  it('401 sem Authorization Bearer', async () => {
    const request = { headers: {}, body: { tenant_id: 'cli_dona_tereza' } };
    await expect(guard.canActivate(ctx(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('400 sem tenant_id no corpo', async () => {
    const request = { headers: { authorization: 'Bearer x' }, body: {} };
    await expect(guard.canActivate(ctx(request))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('403 quando o tenant nao existe ou esta desativado', async () => {
    prisma.botIntegrationConfig.findFirst.mockResolvedValue({ ...config, active: false });
    const request = { headers: { authorization: 'Bearer x' }, body: { tenant_id: 'cli_outro' } };
    await expect(guard.canActivate(ctx(request))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('401 quando a chave nao bate', async () => {
    keys.verify.mockReturnValue(false);
    const request = { headers: { authorization: 'Bearer errada' }, body: { tenant_id: 'cli_dona_tereza' } };
    await expect(guard.canActivate(ctx(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Testes que falham — service**

`CP/application/services/bot-event-ingestion.service.spec.ts`:

```ts
import { BotEventIngestionService } from './bot-event-ingestion.service';

const evento = (id: string, occurredAt: string, type = 'mensagem') =>
  ({ event_id: id, occurred_at: occurredAt, type }) as any;

describe('BotEventIngestionService.ingestBatch', () => {
  let prisma: { botIngestionEvent: { create: jest.Mock; update: jest.Mock } };
  let processor: { process: jest.Mock };
  let service: BotEventIngestionService;

  beforeEach(() => {
    prisma = {
      botIngestionEvent: {
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    processor = { process: jest.fn().mockResolvedValue(undefined) };
    service = new BotEventIngestionService(prisma as any, processor as any);
  });

  it('processa em ordem de occurred_at, mesmo que o lote chegue embaralhado', async () => {
    await service.ingestBatch('tenant_1', [
      evento('b', '2026-10-01T10:05:00.000Z'),
      evento('a', '2026-10-01T10:00:00.000Z'),
    ]);
    expect(processor.process.mock.calls.map((c) => c[1].event_id)).toEqual(['a', 'b']);
  });

  it('guarda o evento inteiro no ledger com o type do contrato', async () => {
    const e = evento('a', '2026-10-01T10:00:00.000Z', 'reserva.confirmada');
    await service.ingestBatch('tenant_1', [e]);
    expect(prisma.botIngestionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenant_id: 'tenant_1', event_id: 'a', event_type: 'reserva.confirmada',
        payload: e, status: 'RECEIVED',
      }),
    });
  });

  it('event_id repetido conta como duplicado e nao reprocessa', async () => {
    prisma.botIngestionEvent.create
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ code: 'P2002' });
    const result = await service.ingestBatch('tenant_1', [
      evento('a', '2026-10-01T10:00:00.000Z'),
      evento('a', '2026-10-01T10:00:00.000Z'),
    ]);
    expect(result).toEqual({ received: 2, duplicated: 1 });
    expect(processor.process).toHaveBeenCalledTimes(1);
  });

  it('falha de projecao marca FAILED e segue com o resto do lote', async () => {
    processor.process.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(undefined);
    const result = await service.ingestBatch('tenant_1', [
      evento('a', '2026-10-01T10:00:00.000Z'),
      evento('b', '2026-10-01T10:01:00.000Z'),
    ]);
    expect(result).toEqual({ received: 2, duplicated: 0 });
    expect(prisma.botIngestionEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED', error_message: 'boom' }) }),
    );
    expect(processor.process).toHaveBeenCalledTimes(2);
  });

  it('erro de banco no ledger sobe (vira 5xx e o bot reenvia o lote)', async () => {
    prisma.botIngestionEvent.create.mockRejectedValue(new Error('db fora'));
    await expect(
      service.ingestBatch('tenant_1', [evento('a', '2026-10-01T10:00:00.000Z')]),
    ).rejects.toThrow('db fora');
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- "bot-ingest-bearer|bot-event-ingestion.service"`
Expected: FAIL — módulo do guard inexistente; `ingestBatch is not a function`.

- [ ] **Step 4: DTO**

Em `CP/application/dtos/bot-event.dto.ts`, **manter a classe `BotEventDto` antiga no fim do arquivo** (o processor atual ainda a importa; ela sai na Task 3) e acrescentar, acima dela, o envelope v2. O arquivo fica assim, com a classe antiga preservada abaixo do bloco novo:

```ts
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsISO8601, IsObject, IsOptional, IsString,
  MaxLength, ValidateNested,
} from 'class-validator';

/** Contrato v2 §3.1: no maximo 50 eventos de funil + 200 mensagens + 1 heartbeat. */
export const BOT_EVENT_BATCH_MAX = 250;

/**
 * Evento do contrato v2 (§3.4). `actor`, `contact`, `hold` e `data` sao objetos
 * soltos de proposito: vem de um sistema externo e o projetor os le de forma
 * defensiva. Tipa-los como classe faria o whitelist do ValidationPipe descartar
 * em silencio qualquer campo novo que o bot passe a mandar.
 */
export class BotEventV2Dto {
  @IsString() @MaxLength(100)
  event_id: string;

  @IsOptional() @IsString()
  tenant_id?: string;

  @IsISO8601()
  occurred_at: string;

  @IsString() @MaxLength(50)
  type: string;

  @IsOptional() @IsObject()
  actor?: Record<string, unknown> | null;

  @IsOptional() @IsObject()
  contact?: Record<string, unknown> | null;

  @IsOptional() @IsString()
  stage?: string | null;

  @IsOptional() @IsObject()
  hold?: Record<string, unknown> | null;

  @IsOptional() @IsObject()
  data?: Record<string, unknown> | null;
}

export class BotEventBatchDto {
  @IsString()
  tenant_id: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(BOT_EVENT_BATCH_MAX)
  @ValidateNested({ each: true })
  @Type(() => BotEventV2Dto)
  events: BotEventV2Dto[];
}
```

- [ ] **Step 5: Guard**

`CP/infrastructure/guards/bot-ingest-bearer.guard.ts`:

```ts
import {
  BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { BotKeyProvider } from '../providers/bot-key.provider';

/**
 * Autenticacao do Canal A (contrato v2 §3.1): `Authorization: Bearer <tenant_key>`
 * + `tenant_id` no corpo. O `tenant_id` do bot e o identificador DELE
 * (bot_tenant_ref, ex.: "cli_dona_tereza"); o nosso tenant_id tambem e aceito.
 *
 * Contrato §3.2: chave invalida -> 401; tenant errado -> 403. A chave e
 * derivada com salt por linha, entao e preciso achar o tenant antes de
 * conferi-la — por isso o 403 vem antes do 401 da chave.
 */
@Injectable()
export class BotIngestBearerGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly botKeyProvider: BotKeyProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = String(request.headers?.authorization ?? '');
    const key = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    if (!key) throw new UnauthorizedException('Missing bearer tenant key');

    const ref = typeof request.body?.tenant_id === 'string' ? request.body.tenant_id.trim() : '';
    if (!ref) throw new BadRequestException('tenant_id is required');

    const config = await this.prisma.botIntegrationConfig.findFirst({
      where: { OR: [{ bot_tenant_ref: ref }, { tenant_id: ref }] },
    });
    if (!config || !config.active) throw new ForbiddenException('Unknown tenant');

    if (!this.botKeyProvider.verify(key, config.tenant_key_hash, config.tenant_key_salt)) {
      throw new UnauthorizedException('Invalid tenant key');
    }

    request.tenant_id = config.tenant_id;
    request.bot_integration_config_id = config.id;
    return true;
  }
}
```

- [ ] **Step 6: Service**

Em `CP/application/services/bot-event-ingestion.service.ts`: trocar o import do DTO para `BotEventV2Dto`, remover `IBotEventIngestResult` e o método `ingest`, e colocar no lugar (o `isUniqueConstraintError` privado permanece):

```ts
  /**
   * Contrato v2 §3: lote de ate 250 eventos. Cada evento vai para o ledger
   * (append-only) e so depois e projetado. Processa em ordem de occurred_at
   * porque o estado do contato e "o ultimo evento dele" — um lote embaralhado
   * nao pode fazer um evento antigo sobrescrever um novo.
   *
   * event_id repetido: conta como duplicado, nunca reprocessa (§3.3).
   * Falha de projecao: marca FAILED e segue — reenviar o lote nao ajudaria,
   * porque o event_id ja esta no ledger. Erro de banco no ledger: sobe, vira
   * 5xx, e o bot reenvia o lote inteiro no minuto seguinte (seguro: idempotente).
   */
  async ingestBatch(
    tenantId: string,
    events: BotEventV2Dto[],
  ): Promise<{ received: number; duplicated: number }> {
    const ordered = [...events].sort(
      (a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at),
    );
    let duplicated = 0;

    for (const event of ordered) {
      try {
        await this.prisma.botIngestionEvent.create({
          data: {
            tenant_id: tenantId,
            event_id: event.event_id,
            event_type: event.type,
            occurred_at: new Date(event.occurred_at),
            payload: event as object,
            status: 'RECEIVED',
          },
        });
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {
          duplicated += 1;
          continue;
        }
        throw error;
      }

      const where = { tenant_id_event_id: { tenant_id: tenantId, event_id: event.event_id } };
      try {
        await this.processor.process(tenantId, event);
        await this.prisma.botIngestionEvent.update({
          where,
          data: { status: 'PROCESSED', processed_at: new Date() },
        });
      } catch (error) {
        this.logger.error(
          `Bot event projection failed (tenant=${tenantId}, event=${event.event_id}): ${error}`,
        );
        await this.prisma.botIngestionEvent.update({
          where,
          data: { status: 'FAILED', error_message: String((error as Error)?.message ?? error) },
        });
      }
    }

    return { received: events.length, duplicated };
  }
```

- [ ] **Step 7: Controller**

Em `bot-event-ingestion.controller.ts`: tirar o `@UseGuards(BotEventKeyGuard)` da classe e pôr um guard por método (o `GET handoff-summary` continua com a chave antiga). Imports novos: `HttpCode`, `Req` de `@nestjs/common`; `BotIngestBearerGuard`; `BotEventBatchDto`. Remover `Res`, `Response` e `BotEventDto`.

```ts
@Controller('ingest/bot-events')
@SkipThrottle()
export class BotEventIngestionController {
  constructor(
    private readonly ingestionService: BotEventIngestionService,
    private readonly handoffSummary: HandoffSummaryService,
  ) {}

  /** Canal A do contrato v2: lote de eventos, 202 com a contagem. */
  @Post()
  @HttpCode(202)
  @UseGuards(BotIngestBearerGuard)
  async ingest(@Req() request: { tenant_id: string }, @Body() dto: BotEventBatchDto) {
    return this.ingestionService.ingestBatch(request.tenant_id, dto.events);
  }

  @Get('handoff-summary/:numeroContato')
  @UseGuards(BotEventKeyGuard)
  async handoffSummaryFor(
    @Headers('x-tenant-id') tenantId: string,
    @Param('numeroContato') numeroContato: string,
  ) {
    return this.handoffSummary.build(tenantId, numeroContato);
  }
}
```

Registrar `BotIngestBearerGuard` em `providers` de `CP/reserve-client-portal.module.ts` (ao lado de `BotEventKeyGuard`).

No spec de wiring (`client-portal-module-access-wiring.spec.ts:118-122`), trocar só o comentário do teste: "Autenticado por BotIngestBearerGuard (chave Bearer do bot)…". A asserção (`REQUIRES_MODULE_KEY` indefinido) não muda.

- [ ] **Step 8: Limite de corpo**

Um lote de 250 eventos com previews passa de 100kb. Em `src/main.ts`, acrescentar à lista `LARGE_BODY_ROUTES`:

```ts
    // Canal A do contrato bot-painel v2: lote de ate 250 eventos por chamada.
    /^\/api\/ingest\//,
```

- [ ] **Step 9: Rodar e ver passar**

Na chamada `this.processor.process(tenantId, event)` do Step 6, usar `event as any` por enquanto: o processor ainda tem a assinatura v1 e só muda na Task 3, que remove o cast.

Run: `npm test -- "bot-ingest-bearer|bot-event-ingestion.service|module-access-wiring|bot-event-processor"`
Expected: PASS (o spec antigo do processor continua verde porque `BotEventDto` foi preservada).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(bot): ingestao v2 em lote com chave bearer e contagem de duplicados"
```

---

## Task 3: Projetor v2 — snapshot, estágio idempotente, hold e catálogo de tipos

Reescreve `BotEventProcessorService`. É o coração do contrato (§3.4, §3.5, §4).

**Files:**
- Modify: `CP/application/services/bot-event-processor.service.ts` (reescrever)
- Modify: `CP/application/services/bot-event-processor.service.spec.ts` (reescrever)

**Interfaces:**
- Consumes: `BotEventV2Dto` (Task 2); colunas da Task 1; `AttributionService.record(tenantId, { numeroContato, ocorridoEm, ctwaClid?, sourceId?, sourceType?, linkCode? })` (já existe).
- Produces: `BotEventProcessorService.process(tenantId: string, event: BotEventV2Dto): Promise<void>` e `static HANDOFF_MOTIVO_PREFIX = 'HANDOFF:'` (as métricas da Task 6 agregam por ele).

Regras que o código precisa obedecer:

| Bloco do evento | Efeito |
|---|---|
| `contact` | Upsert do contato; os campos do snapshot só são aplicados se `snapshot_em` for nulo ou `<= occurred_at` |
| `stage` | Se o lead já está naquele estágio: só atualiza `stage_em` (é o eco de uma ação do painel). Se `stage_em > occurred_at`: ignora (evento atrasado). Senão: `funnelEvent` + `botLead` em transação |
| `hold` | Grava código, status, valor (centavos), acomodação e datas no lead, com a mesma guarda de `hold_em` |
| `type` | Efeito específico (tabela abaixo) |

| `type` | Efeito específico |
|---|---|
| `contato.iniciado` | `iniciado_em` (só se nulo), origem, `ctwa_clid`, `source_id`, `link_code` + linha de atribuição |
| `mensagem` | `bot_messages` (preview ≤ 180); `last_message_at`; se `role = user`: `last_user_message_at` e follow-ups pendentes viram `respondeu` |
| `transferencia` | Anotação `HANDOFF:<motivo>` no funil + `motivo_pausa` no contato |
| `hold.expirado`, `followup.regua_esgotada`, `followup.fora_da_janela` | `recuperar = true` |
| `reserva.confirmada` | `valor_confirmado_cents` = `data.valor_cents` (ou o valor do hold) e `recuperar = false` |
| `perdido` | `motivo_perda` = `data.motivo` |
| `followup.enviado` | `bot_followup_attempts` com `regua` e `status = 'sem_resposta'` |
| `heartbeat` | `last_heartbeat_at` + `last_heartbeat_data` (o `contact` é nulo) |
| qualquer outro | Nenhum efeito além do ledger (o snapshot/estágio/hold já foram aplicados) |

- [ ] **Step 1: Testes que falham**

Substituir o conteúdo de `bot-event-processor.service.spec.ts`:

```ts
import { BotEventProcessorService } from './bot-event-processor.service';

const T = 'tenant_1';
const PHONE = '553598067432';
const AT = '2026-10-01T10:00:00.000Z';

function contact(over: Record<string, unknown> = {}) {
  return {
    phone: PHONE, name: 'Gabriel Caliari', audience: 'LEAD', origin: 'anuncio',
    ctwa_clid: null, source_id: 'ad_123', link_code: null, bot_status: 'ATIVO', occasion: 'romantica',
    ...over,
  };
}

function evento(type: string, over: Record<string, unknown> = {}) {
  return { event_id: 'e1', occurred_at: AT, type, contact: contact(), stage: null, hold: null, data: {}, ...over } as any;
}

describe('BotEventProcessorService (contrato v2)', () => {
  let prisma: any;
  let attribution: { record: jest.Mock };
  let service: BotEventProcessorService;

  beforeEach(() => {
    prisma = {
      botContact: { upsert: jest.fn().mockResolvedValue({}), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      botLead: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      funnelEvent: { create: jest.fn().mockResolvedValue({}) },
      botMessage: { create: jest.fn().mockResolvedValue({}) },
      followupAttempt: { create: jest.fn().mockResolvedValue({}), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      botIntegrationConfig: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      $transaction: jest.fn().mockImplementation((ops) => Promise.all(ops)),
    };
    attribution = { record: jest.fn().mockResolvedValue(undefined) };
    service = new BotEventProcessorService(prisma, attribution as any);
  });

  describe('snapshot do contato', () => {
    it('aplica os campos do snapshot so se o evento nao for mais antigo que o ja aplicado', async () => {
      await service.process(T, evento('qualificado'));
      expect(prisma.botContact.updateMany).toHaveBeenCalledWith({
        where: {
          tenant_id: T, numero_contato: PHONE,
          OR: [{ snapshot_em: null }, { snapshot_em: { lte: new Date(AT) } }],
        },
        data: expect.objectContaining({
          nome: 'Gabriel Caliari', tipo_publico: 'LEAD', origem: 'anuncio',
          status_bot: 'ATIVO', ocasiao: 'romantica', snapshot_em: new Date(AT),
        }),
      });
    });

    it('bot_status fora do enum e ignorado, nao derruba o evento', async () => {
      await service.process(T, evento('qualificado', { contact: contact({ bot_status: 'INVENTADO' }) }));
      const data = prisma.botContact.updateMany.mock.calls[0][0].data;
      expect(data).not.toHaveProperty('status_bot');
    });

    it('evento sem contact (e que nao e heartbeat) so avisa', async () => {
      const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);
      await service.process(T, evento('qualificado', { contact: null }));
      expect(warn).toHaveBeenCalled();
      expect(prisma.botContact.upsert).not.toHaveBeenCalled();
    });

    it('reserva vista no PMS (sem contato) fica so no ledger, sem aviso', async () => {
      const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);
      await service.process(T, evento('reserva.detectada_polling', { contact: null }));
      expect(warn).not.toHaveBeenCalled();
      expect(prisma.botContact.upsert).not.toHaveBeenCalled();
    });
  });

  describe('estagio', () => {
    it('muda de estagio gravando o log e a projecao na mesma transacao', async () => {
      prisma.botLead.findUnique.mockResolvedValue({ current_stage: 'QUALIFICADO', stage_em: null });
      await service.process(T, evento('acomodacao.apresentada', { stage: 'ACOMODACAO_APRESENTADA' }));
      expect(prisma.funnelEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          de_estagio: 'QUALIFICADO', para_estagio: 'ACOMODACAO_APRESENTADA',
          autor_tipo: 'bot', ocorrido_em: new Date(AT),
        }),
      });
      expect(prisma.botLead.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ current_stage: 'ACOMODACAO_APRESENTADA', stage_em: new Date(AT) }),
        }),
      );
    });

    it('eco de um estagio em que o lead ja esta nao duplica o log', async () => {
      prisma.botLead.findUnique.mockResolvedValue({ current_stage: 'PERDIDO', stage_em: new Date('2026-10-01T09:59:00.000Z') });
      await service.process(T, evento('painel.estagio', { stage: 'PERDIDO' }));
      expect(prisma.funnelEvent.create).not.toHaveBeenCalled();
      expect(prisma.botLead.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { stage_em: new Date(AT) } }),
      );
    });

    it('evento de estagio atrasado nao volta o lead no tempo', async () => {
      prisma.botLead.findUnique.mockResolvedValue({
        current_stage: 'RESERVA_CONFIRMADA', stage_em: new Date('2026-10-01T11:00:00.000Z'),
      });
      await service.process(T, evento('qualificado', { stage: 'QUALIFICADO' }));
      expect(prisma.funnelEvent.create).not.toHaveBeenCalled();
      expect(prisma.botLead.upsert).not.toHaveBeenCalled();
    });

    it('acao de humano entra no log como autor humano', async () => {
      await service.process(T, evento('painel.estagio', {
        stage: 'OFERTA_FEITA', actor: { type: 'human', id: 'usr_1' },
      }));
      expect(prisma.funnelEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ autor_tipo: 'humano', autor_id: 'usr_1' }),
      });
    });

    it('estagio desconhecido e ignorado com aviso', async () => {
      const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => undefined);
      await service.process(T, evento('qualificado', { stage: 'INVENTADO' }));
      expect(warn).toHaveBeenCalled();
      expect(prisma.funnelEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('hold', () => {
    it('grava o hold no lead em centavos, com acomodacao e datas', async () => {
      await service.process(T, evento('hold.criado', {
        hold: {
          code: 'M57', status: 'AGUARDANDO', accommodation: 'Suíte Master',
          check_in: '2026-11-20', check_out: '2026-11-22', amount_cents: 104900, pms_reservation_id: 'r_30644146',
        },
      }));
      expect(prisma.botLead.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            hold_codigo: 'M57', hold_status: 'AGUARDANDO', hold_valor_cents: 104900,
            hold_pms_reservation_id: 'r_30644146', acomodacao_interesse: 'Suíte Master',
            datas_interesse: { checkin: '2026-11-20', checkout: '2026-11-22' },
            hold_em: new Date(AT),
          }),
        }),
      );
    });
  });

  describe('tipos', () => {
    it('contato.iniciado marca o inicio e registra a atribuicao', async () => {
      await service.process(T, evento('contato.iniciado', {
        stage: 'CONTATO_INICIADO',
        data: { origem: 'anuncio', ctwa_clid: 'clid_1', source_id: 'ad_123', link_code: null },
      }));
      expect(prisma.botContact.updateMany).toHaveBeenCalledWith({
        where: { tenant_id: T, numero_contato: PHONE, iniciado_em: null },
        data: { iniciado_em: new Date(AT) },
      });
      expect(attribution.record).toHaveBeenCalledWith(T, expect.objectContaining({
        numeroContato: PHONE, ctwaClid: 'clid_1', sourceId: 'ad_123', sourceType: 'ad',
      }));
    });

    it('mensagem do hospede corta o preview em 180 e marca follow-ups como respondidos', async () => {
      await service.process(T, evento('mensagem', {
        data: { role: 'user', kind: 'texto', content_preview: 'x'.repeat(400) },
      }));
      const msg = prisma.botMessage.create.mock.calls[0][0].data;
      expect(msg.role).toBe('user');
      expect(msg.content_preview).toHaveLength(180);
      expect(prisma.followupAttempt.updateMany).toHaveBeenCalledWith({
        where: { tenant_id: T, numero_contato: PHONE, status: 'sem_resposta', ocorrido_em: { lte: new Date(AT) } },
        data: { status: 'respondeu' },
      });
    });

    it('mensagem do bot nao mexe em follow-up', async () => {
      await service.process(T, evento('mensagem', { data: { role: 'assistant', kind: 'botoes', content_preview: 'oi' } }));
      expect(prisma.botMessage.create.mock.calls[0][0].data.tipo).toBe('botoes');
      expect(prisma.followupAttempt.updateMany).not.toHaveBeenCalled();
    });

    it('transferencia vira anotacao HANDOFF com o motivo', async () => {
      prisma.botLead.findUnique.mockResolvedValue({ current_stage: 'QUALIFICADO', stage_em: null });
      await service.process(T, evento('transferencia', { data: { motivo: 'pediu_humano', tag: 'x' } }));
      expect(prisma.funnelEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          de_estagio: null, para_estagio: 'QUALIFICADO', motivo: 'HANDOFF:pediu_humano',
        }),
      });
    });

    it('hold.expirado marca o lead para recuperar', async () => {
      await service.process(T, evento('hold.expirado', { data: { codigo: 'M57' } }));
      expect(prisma.botLead.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { recuperar: true } }),
      );
    });

    it('reserva.confirmada grava o valor e tira a etiqueta de recuperar', async () => {
      await service.process(T, evento('reserva.confirmada', {
        stage: 'RESERVA_CONFIRMADA', data: { codigo: 'M57', valor_cents: 104900 },
      }));
      expect(prisma.botLead.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { valor_confirmado_cents: 104900, recuperar: false } }),
      );
    });

    it('perdido guarda o motivo', async () => {
      await service.process(T, evento('perdido', { stage: 'PERDIDO', data: { motivo: 'caro' } }));
      expect(prisma.botLead.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { motivo_perda: 'caro' } }),
      );
    });

    it('followup.enviado entra por regua, sem resposta ate o hospede falar', async () => {
      await service.process(T, evento('followup.enviado', { data: { toque: 2, regua: 'pre_reserva' } }));
      expect(prisma.followupAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tentativa: 2, regua: 'pre_reserva', status: 'sem_resposta', ocorrido_em: new Date(AT),
        }),
      });
    });

    it('heartbeat guarda o instante e os dados, sem contato', async () => {
      const data = { bot_enabled: true, mode: 'hospedin', ai_enabled: true, active_conversations: 4, paused_awaiting_human: 1 };
      await service.process(T, evento('heartbeat', { contact: null, data }));
      expect(prisma.botIntegrationConfig.updateMany).toHaveBeenCalledWith({
        where: { tenant_id: T },
        data: { last_heartbeat_at: new Date(AT), last_heartbeat_data: data },
      });
      expect(prisma.botContact.upsert).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- bot-event-processor`
Expected: FAIL — o processor atual lê `event.event_type`/`payload`.

- [ ] **Step 3: Implementar**

Substituir o conteúdo de `bot-event-processor.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { AttributionService } from './attribution.service';
import { BotEventV2Dto } from '../dtos/bot-event.dto';
import {
  EBotContactAudience,
  EBotContactStatus,
  EBotMessageRole,
  EBotMessageType,
  EFunnelStage,
} from '../../../../generated/prisma/enums';
import { FUNNEL_ENTRY_STAGE } from '../../domain/enums/funnel-stage-groups';

/** Contrato v2 §8: o painel so guarda uma previa da mensagem. */
const CONTENT_PREVIEW_MAX_LENGTH = 180;
/** Espelha o VarChar(255) de funil_eventos.motivo. */
const MOTIVO_MAX_LENGTH = 255;
/** Tipos que viram a etiqueta RECUPERAR no card (contrato §3.5 e §4.3). */
const TIPOS_RECUPERAR = new Set(['hold.expirado', 'followup.regua_esgotada', 'followup.fora_da_janela']);
/**
 * Tipos que nao sao de um contato: reservas vistas no PMS que nao vieram do
 * bot (site, OTA, balcao) e o eco de configuracao. Ficam so no ledger.
 */
const TIPOS_SEM_CONTATO = new Set([
  'reserva.detectada_polling',
  'reserva.alterada_polling',
  'reserva.cancelada_polling',
  'config.aplicada',
]);

type Json = Record<string, unknown>;

interface ContactSnapshot {
  phone: string;
  name: string | null;
  audience: EBotContactAudience | null;
  origin: string | null;
  ctwaClid: string | null;
  sourceId: string | null;
  linkCode: string | null;
  botStatus: EBotContactStatus | null;
  occasion: string | null;
}

function texto(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const limpo = value.trim();
  return limpo ? limpo.slice(0, max) : null;
}

function enumValue<T extends string>(enumObj: Record<string, T>, value: unknown): T | null {
  if (typeof value !== 'string') return null;
  return enumObj[value] ?? enumObj[value.toUpperCase()] ?? null;
}

/**
 * Projetor do contrato Bot <-> Painel v2 (§3.4/§3.5). O painel nunca le o banco
 * do bot: o estado de um contato e o snapshot do evento mais recente dele. Por
 * isso contato, estagio e hold carregam cada um o seu carimbo (`snapshot_em`,
 * `stage_em`, `hold_em`) — um evento que chega atrasado nao desfaz o que um
 * evento mais novo ja escreveu.
 */
@Injectable()
export class BotEventProcessorService {
  private readonly logger = new Logger(BotEventProcessorService.name);

  /** Prefixo do motivo de escalacao no log do funil; as metricas agregam por ele. */
  static readonly HANDOFF_MOTIVO_PREFIX = 'HANDOFF:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly attributionService: AttributionService,
  ) {}

  async process(tenantId: string, event: BotEventV2Dto): Promise<void> {
    const occurredAt = new Date(event.occurred_at);
    const data = (event.data ?? {}) as Json;

    if (event.type === 'heartbeat') {
      await this.prisma.botIntegrationConfig.updateMany({
        where: { tenant_id: tenantId },
        data: { last_heartbeat_at: occurredAt, last_heartbeat_data: data as object },
      });
      return;
    }

    const snapshot = this.parseContact(event.contact);
    if (!snapshot) {
      if (!TIPOS_SEM_CONTATO.has(event.type)) {
        this.logger.warn(`Evento "${event.type}" sem contact.phone (tenant=${tenantId}, event=${event.event_id})`);
      }
      return;
    }
    const phone = snapshot.phone;

    await this.applyContactSnapshot(tenantId, snapshot, occurredAt);
    if (event.hold) await this.applyHold(tenantId, phone, event.hold as Json, occurredAt);
    if (event.stage) {
      const actor = (event.actor ?? {}) as Json;
      await this.applyStage(
        tenantId,
        phone,
        event.stage,
        occurredAt,
        actor.type === 'human' ? 'humano' : 'bot',
        texto(actor.id, 25),
        texto(data.motivo, MOTIVO_MAX_LENGTH),
      );
    }

    if (TIPOS_RECUPERAR.has(event.type)) {
      await this.patchLead(tenantId, phone, { recuperar: true });
      return;
    }

    switch (event.type) {
      case 'contato.iniciado':
        return this.handleContatoIniciado(tenantId, snapshot, data, occurredAt);
      case 'mensagem':
        return this.handleMensagem(tenantId, phone, data, occurredAt);
      case 'transferencia':
        return this.handleTransferencia(tenantId, phone, data, occurredAt);
      case 'reserva.confirmada':
        return this.handleReservaConfirmada(tenantId, phone, data, event.hold as Json | null);
      case 'perdido':
        return this.patchLead(tenantId, phone, { motivo_perda: texto(data.motivo, MOTIVO_MAX_LENGTH) });
      case 'followup.enviado':
        return this.handleFollowupEnviado(tenantId, phone, data, occurredAt);
      default:
        // Os demais tipos do catalogo so carregam snapshot/estagio/hold (ja
        // aplicados) ou sao lidos direto do ledger (ex.: audio.transcrito).
        return;
    }
  }

  private parseContact(raw: unknown): ContactSnapshot | null {
    if (!raw || typeof raw !== 'object') return null;
    const c = raw as Json;
    const phone = texto(c.phone, 20);
    if (!phone) return null;
    return {
      phone,
      name: texto(c.name, 150),
      audience: enumValue(EBotContactAudience as Record<string, EBotContactAudience>, c.audience),
      origin: texto(c.origin, 20),
      ctwaClid: texto(c.ctwa_clid, 255),
      sourceId: texto(c.source_id, 100),
      linkCode: texto(c.link_code, 20),
      botStatus: enumValue(EBotContactStatus as Record<string, EBotContactStatus>, c.bot_status),
      occasion: texto(c.occasion, 20),
    };
  }

  private async applyContactSnapshot(tenantId: string, s: ContactSnapshot, occurredAt: Date): Promise<void> {
    // Campo ausente no snapshot nao apaga o que ja se sabe; `ocasiao` e a
    // excecao: e parte do snapshot e pode voltar a null.
    const campos = {
      ...(s.name ? { nome: s.name } : {}),
      ...(s.audience ? { tipo_publico: s.audience } : {}),
      ...(s.origin ? { origem: s.origin } : {}),
      ...(s.botStatus ? { status_bot: s.botStatus } : {}),
      ...(s.ctwaClid ? { ctwa_clid: s.ctwaClid } : {}),
      ...(s.sourceId ? { source_id: s.sourceId } : {}),
      ...(s.linkCode ? { link_code: s.linkCode } : {}),
      ocasiao: s.occasion,
      snapshot_em: occurredAt,
    };

    await this.prisma.botContact.upsert({
      where: { tenant_id_numero_contato: { tenant_id: tenantId, numero_contato: s.phone } },
      create: { tenant_id: tenantId, numero_contato: s.phone, ...campos },
      update: {},
    });
    await this.prisma.botContact.updateMany({
      where: {
        tenant_id: tenantId,
        numero_contato: s.phone,
        OR: [{ snapshot_em: null }, { snapshot_em: { lte: occurredAt } }],
      },
      data: campos,
    });
  }

  private leadWhere(tenantId: string, phone: string) {
    return { tenant_id_numero_contato: { tenant_id: tenantId, numero_contato: phone } };
  }

  /** Atualiza colunas do lead criando-o na entrada do funil se ainda nao existir. */
  private async patchLead(tenantId: string, phone: string, data: Json): Promise<void> {
    await this.prisma.botLead.upsert({
      where: this.leadWhere(tenantId, phone),
      create: { tenant_id: tenantId, numero_contato: phone, current_stage: FUNNEL_ENTRY_STAGE, ...data },
      update: data,
    });
  }

  private async applyStage(
    tenantId: string,
    phone: string,
    stageRaw: string,
    occurredAt: Date,
    autorTipo: 'bot' | 'humano',
    autorId: string | null,
    motivo: string | null,
  ): Promise<void> {
    const stage = enumValue(EFunnelStage as Record<string, EFunnelStage>, stageRaw);
    if (!stage) {
      this.logger.warn(`Estagio desconhecido "${stageRaw}" ignorado (tenant=${tenantId}, contato=${phone})`);
      return;
    }

    const where = this.leadWhere(tenantId, phone);
    const lead = await this.prisma.botLead.findUnique({ where });
    if (lead?.stage_em && lead.stage_em.getTime() > occurredAt.getTime()) return;

    // Eco de uma acao que o painel ja gravou (ou reenvio): mesmo estagio nao
    // gera linha no log — duplicaria a transicao nas metricas.
    if (lead && lead.current_stage === stage) {
      await this.prisma.botLead.update({ where, data: { stage_em: occurredAt } });
      return;
    }

    await this.prisma.$transaction([
      this.prisma.funnelEvent.create({
        data: {
          tenant_id: tenantId,
          numero_contato: phone,
          de_estagio: lead?.current_stage ?? null,
          para_estagio: stage,
          autor_tipo: autorTipo,
          autor_id: autorId,
          motivo,
          ocorrido_em: occurredAt,
        },
      }),
      this.prisma.botLead.upsert({
        where,
        create: { tenant_id: tenantId, numero_contato: phone, current_stage: stage, stage_em: occurredAt },
        update: { current_stage: stage, stage_em: occurredAt },
      }),
    ]);
  }

  private async applyHold(tenantId: string, phone: string, hold: Json, occurredAt: Date): Promise<void> {
    const lead = await this.prisma.botLead.findUnique({ where: this.leadWhere(tenantId, phone) });
    if (lead?.hold_em && lead.hold_em.getTime() > occurredAt.getTime()) return;

    const valor = Number(hold.amount_cents);
    const checkIn = texto(hold.check_in, 10);
    const checkOut = texto(hold.check_out, 10);
    await this.patchLead(tenantId, phone, {
      hold_codigo: texto(hold.code, 20),
      hold_status: texto(hold.status, 20),
      hold_valor_cents: Number.isFinite(valor) ? Math.round(valor) : null,
      hold_pms_reservation_id: texto(hold.pms_reservation_id, 60),
      acomodacao_interesse: texto(hold.accommodation, 255),
      ...(checkIn && checkOut ? { datas_interesse: { checkin: checkIn, checkout: checkOut } } : {}),
      hold_em: occurredAt,
    });
  }

  private async handleContatoIniciado(
    tenantId: string,
    s: ContactSnapshot,
    data: Json,
    occurredAt: Date,
  ): Promise<void> {
    await this.prisma.botContact.updateMany({
      where: { tenant_id: tenantId, numero_contato: s.phone, iniciado_em: null },
      data: { iniciado_em: occurredAt },
    });

    const origem = texto(data.origem, 20) ?? s.origin;
    await this.attributionService.record(tenantId, {
      numeroContato: s.phone,
      ocorridoEm: occurredAt,
      ctwaClid: texto(data.ctwa_clid, 255) ?? s.ctwaClid ?? undefined,
      sourceId: texto(data.source_id, 100) ?? s.sourceId ?? undefined,
      sourceType: origem === 'anuncio' ? 'ad' : undefined,
      linkCode: texto(data.link_code, 20) ?? s.linkCode ?? undefined,
    });
  }

  private async handleMensagem(tenantId: string, phone: string, data: Json, occurredAt: Date): Promise<void> {
    const role = enumValue(EBotMessageRole as Record<string, EBotMessageRole>, data.role) ?? EBotMessageRole.user;
    const tipo = enumValue(EBotMessageType as Record<string, EBotMessageType>, data.kind) ?? EBotMessageType.texto;

    await this.prisma.botMessage.create({
      data: {
        tenant_id: tenantId,
        numero_contato: phone,
        role,
        tipo,
        // Defesa em profundidade (LGPD): corta aqui independentemente do que o bot mandar.
        content_preview: String(data.content_preview ?? '').slice(0, CONTENT_PREVIEW_MAX_LENGTH),
        ocorrido_em: occurredAt,
      },
    });

    const where = { tenant_id: tenantId, numero_contato: phone };
    if (role !== EBotMessageRole.user) {
      await this.prisma.botContact.updateMany({ where, data: { last_message_at: occurredAt } });
      return;
    }

    await this.prisma.botContact.updateMany({
      where,
      data: { last_message_at: occurredAt, last_user_message_at: occurredAt },
    });
    // Contrato §4.4: o follow-up "respondeu" se o hospede falou depois do toque.
    await this.prisma.followupAttempt.updateMany({
      where: { ...where, status: 'sem_resposta', ocorrido_em: { lte: occurredAt } },
      data: { status: 'respondeu' },
    });
  }

  /**
   * Anotacao que nao muda estagio (de_estagio: null, para_estagio: o atual),
   * com o motivo da escalacao — e o que as metricas de handoff agregam.
   */
  private async handleTransferencia(tenantId: string, phone: string, data: Json, occurredAt: Date): Promise<void> {
    const motivo = texto(data.motivo, 100) ?? 'nao_informado';
    const lead = await this.prisma.botLead.findUnique({ where: this.leadWhere(tenantId, phone) });

    await this.prisma.funnelEvent.create({
      data: {
        tenant_id: tenantId,
        numero_contato: phone,
        de_estagio: null,
        para_estagio: lead?.current_stage ?? FUNNEL_ENTRY_STAGE,
        autor_tipo: 'bot',
        motivo: `${BotEventProcessorService.HANDOFF_MOTIVO_PREFIX}${motivo}`.slice(0, MOTIVO_MAX_LENGTH),
        ocorrido_em: occurredAt,
      },
    });
    await this.prisma.botContact.updateMany({
      where: { tenant_id: tenantId, numero_contato: phone },
      data: { motivo_pausa: motivo },
    });
  }

  private async handleReservaConfirmada(
    tenantId: string,
    phone: string,
    data: Json,
    hold: Json | null,
  ): Promise<void> {
    const valor = Number(data.valor_cents ?? hold?.amount_cents);
    await this.patchLead(tenantId, phone, {
      valor_confirmado_cents: Number.isFinite(valor) ? Math.round(valor) : 0,
      recuperar: false,
    });
  }

  private async handleFollowupEnviado(tenantId: string, phone: string, data: Json, occurredAt: Date): Promise<void> {
    const regua = texto(data.regua, 20) ?? 'desconhecida';
    await this.prisma.followupAttempt.create({
      data: {
        tenant_id: tenantId,
        numero_contato: phone,
        tentativa: Number(data.toque ?? 1) || 1,
        // Coluna legada VarChar(10) e obrigatoria; a regua completa vive em `regua`.
        tipo_janela: regua.slice(0, 10),
        regua,
        status: 'sem_resposta',
        ocorrido_em: occurredAt,
      },
    });
  }
}
```

Depois: remover o cast `event as any` da chamada `processor.process` em `bot-event-ingestion.service.ts` e apagar a classe `BotEventDto` antiga de `bot-event.dto.ts` (`Grep "BotEventDto\b" src` não pode devolver nada além de `BotEventV2Dto`/`BotEventBatchDto`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- "bot-event-processor|bot-event-ingestion"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(bot): projetor de eventos do contrato v2 com snapshot, estagio e hold"
```

---

## Task 4: Conversas e canais a partir das projeções

**Files:**
- Modify: `CP/application/services/bot-conversation.service.ts`
- Create: `CP/application/services/bot-conversation.service.spec.ts`
- Modify: `CP/application/services/bot-channel-health.service.ts`
- Create: `CP/application/services/bot-channel-health.service.spec.ts`

**Interfaces:**
- Consumes: colunas da Task 1 escritas pelo projetor (Task 3).
- Produces: as formas `ConversationListItem`, `ConversationDetailResponse` e o bloco `whatsapp` de canais descritos em "Formas de resposta".

- [ ] **Step 1: Testes que falham**

`bot-conversation.service.spec.ts`:

```ts
import { BotConversationService } from './bot-conversation.service';

describe('BotConversationService (contrato v2)', () => {
  const contato = {
    numero_contato: '+55 (35) 98067-432', nome: 'Gabriel', status_bot: 'AGUARDANDO_PAGAMENTO',
    last_message_at: new Date('2026-10-01T10:00:00.000Z'), consentimento_lgpd: true,
    tipo_publico: 'LEAD', ocasiao: 'romantica',
  };
  let prisma: any;
  let service: BotConversationService;

  beforeEach(() => {
    prisma = {
      hotelClient: { findUnique: jest.fn().mockResolvedValue({ tenant_id: 'tenant_1' }) },
      botContact: {
        findMany: jest.fn().mockResolvedValue([contato]),
        findUnique: jest.fn().mockResolvedValue(contato),
      },
      botLead: {
        findMany: jest.fn().mockResolvedValue([{ numero_contato: contato.numero_contato, current_stage: 'FECHAMENTO_INICIADO' }]),
        findUnique: jest.fn().mockResolvedValue({
          current_stage: 'FECHAMENTO_INICIADO', hold_codigo: 'M57', hold_status: 'AGUARDANDO',
          hold_valor_cents: 104900, acomodacao_interesse: 'Suíte Master',
          datas_interesse: { checkin: '2026-11-20', checkout: '2026-11-22' },
        }),
      },
      botMessage: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new BotConversationService(prisma);
  });

  it('lista com link do WhatsApp Web (so digitos) e o status ampliado', async () => {
    const { conversations } = await service.list('client_1', {} as any);
    expect(conversations[0]).toMatchObject({
      statusBot: 'AGUARDANDO_PAGAMENTO',
      whatsappWebLink: 'https://web.whatsapp.com/send?phone=553598067432',
      currentStage: 'FECHAMENTO_INICIADO',
    });
    expect(conversations[0]).not.toHaveProperty('chatwootDeepLink');
  });

  it('detalhe traz ocasiao e o hold em reais', async () => {
    const { contact } = await service.detail('client_1', contato.numero_contato);
    expect(contact.ocasiao).toBe('romantica');
    expect(contact.hold).toEqual({
      codigo: 'M57', status: 'AGUARDANDO', acomodacao: 'Suíte Master',
      checkIn: '2026-11-20', checkOut: '2026-11-22', valor: 1049,
    });
  });

  it('sem hold no lead, hold e null', async () => {
    prisma.botLead.findUnique.mockResolvedValue({ current_stage: 'QUALIFICADO', hold_codigo: null, hold_status: null });
    const { contact } = await service.detail('client_1', contato.numero_contato);
    expect(contact.hold).toBeNull();
  });
});
```

`bot-channel-health.service.spec.ts`:

```ts
import { BotChannelHealthService } from './bot-channel-health.service';

describe('BotChannelHealthService (contrato v2 §4.5)', () => {
  function build(lastHeartbeatAt: Date | null, data: unknown) {
    const prisma = {
      hotelClient: { findUnique: jest.fn().mockResolvedValue({ tenant_id: 'tenant_1' }) },
      botIntegrationConfig: {
        findUnique: jest.fn().mockResolvedValue({ active: true, last_heartbeat_at: lastHeartbeatAt, last_heartbeat_data: data }),
      },
      hotelApiCredential: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    return new BotChannelHealthService(prisma as any);
  }

  it('heartbeat recente: conectado, com os numeros que o bot informou', async () => {
    const service = build(new Date(Date.now() - 60_000), {
      bot_enabled: true, mode: 'hospedin', ai_enabled: false,
      active_conversations: 7, paused_awaiting_human: 2,
      last_echo_at: '2026-10-01T10:00:00.000Z', last_polling_at: '2026-10-01T10:01:00.000Z',
    });
    const { whatsapp } = await service.getChannels('client_1');
    expect(whatsapp).toMatchObject({
      connected: true, botEnabled: true, heartbeatStale: false, heartbeatAgeMinutes: 1,
      activeConversations: 7, pausedAwaitingHuman: 2,
      mode: 'hospedin', aiEnabled: false,
      lastEchoAt: '2026-10-01T10:00:00.000Z', lastPollingAt: '2026-10-01T10:01:00.000Z',
    });
  });

  it('heartbeat com mais de 5 minutos: desconectado e stale', async () => {
    const service = build(new Date(Date.now() - 6 * 60_000), { bot_enabled: true });
    const { whatsapp } = await service.getChannels('client_1');
    expect(whatsapp.connected).toBe(false);
    expect(whatsapp.heartbeatStale).toBe(true);
  });

  it('sem heartbeat nenhum: tudo zerado, sem quebrar', async () => {
    const service = build(null, null);
    const { whatsapp } = await service.getChannels('client_1');
    expect(whatsapp).toMatchObject({
      connected: false, botEnabled: false, heartbeatAgeMinutes: null, heartbeatStale: true,
      activeConversations: 0, pausedAwaitingHuman: 0, mode: null, aiEnabled: null,
    });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- "bot-conversation|bot-channel-health"` — Expected: FAIL.

- [ ] **Step 3: Implementar conversas**

Em `bot-conversation.service.ts`:

1. Trocar o comentário de classe para: `/** §5.3 Bloco Conversas — somente leitura; o atendimento humano acontece no WhatsApp Business da pousada (contrato v2 §1.1). */`
2. Remover `getChatwootBaseUrl` e `buildChatwootDeepLink`, e as duas chamadas `this.getChatwootBaseUrl(tenantId)` (em `list` vira só a busca de leads; em `detail` o `Promise.all` fica com 2 itens).
3. Adicionar, no fim da classe:

```ts
  /** Abre a conversa no WhatsApp Web da conta logada — a da pousada (contrato v2 §4.1). */
  private whatsappWebLink(numeroContato: string): string {
    return `https://web.whatsapp.com/send?phone=${numeroContato.replace(/\D/g, '')}`;
  }

  private holdResumo(lead: {
    hold_codigo?: string | null; hold_status?: string | null; hold_valor_cents?: number | null;
    acomodacao_interesse?: string | null; datas_interesse?: unknown;
  } | null) {
    if (!lead || (!lead.hold_codigo && !lead.hold_status)) return null;
    const datas = (lead.datas_interesse ?? {}) as { checkin?: unknown; checkout?: unknown };
    return {
      codigo: lead.hold_codigo ?? null,
      status: lead.hold_status ?? null,
      acomodacao: lead.acomodacao_interesse ?? null,
      checkIn: typeof datas.checkin === 'string' ? datas.checkin : null,
      checkOut: typeof datas.checkout === 'string' ? datas.checkout : null,
      valor: lead.hold_valor_cents == null ? null : lead.hold_valor_cents / 100,
    };
  }
```

4. No `list`, o item passa a ser:

```ts
      conversations: filtered.map((c) => ({
        numeroContato: c.numero_contato,
        nome: c.nome,
        statusBot: c.status_bot,
        lastMessageAt: c.last_message_at,
        consentimentoLgpd: c.consentimento_lgpd,
        tipoPublico: c.tipo_publico,
        currentStage: leadByContact.get(c.numero_contato)?.current_stage ?? FUNNEL_ENTRY_STAGE,
        whatsappWebLink: this.whatsappWebLink(c.numero_contato),
      })),
```

5. No `detail`, o `contact` passa a ser:

```ts
      contact: {
        numeroContato: contact.numero_contato,
        nome: contact.nome,
        statusBot: contact.status_bot,
        lastMessageAt: contact.last_message_at,
        consentimentoLgpd: contact.consentimento_lgpd,
        tipoPublico: contact.tipo_publico,
        currentStage: lead?.current_stage ?? FUNNEL_ENTRY_STAGE,
        whatsappWebLink: this.whatsappWebLink(contact.numero_contato),
        ocasiao: contact.ocasiao ?? null,
        hold: this.holdResumo(lead),
      },
```

- [ ] **Step 4: Implementar canais**

Substituir o corpo de `bot-channel-health.service.ts` a partir das constantes:

```ts
/** Contrato v2 §4.5: o bot manda heartbeat a cada minuto; mais de 5 min sem sinal = fora do ar. */
const HEARTBEAT_STALE_MINUTES = 5;

interface HeartbeatData {
  bot_enabled?: unknown; mode?: unknown; ai_enabled?: unknown;
  last_echo_at?: unknown; last_polling_at?: unknown;
  active_conversations?: unknown; paused_awaiting_human?: unknown;
}

const inteiro = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.trunc(Number(v))) : 0);
const textoOuNull = (v: unknown) => (typeof v === 'string' && v ? v : null);

/** Bloco Canais — saude do bot de WhatsApp lida do ultimo heartbeat, mais Instagram e Meta Ads. */
@Injectable()
export class BotChannelHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getChannels(clientId: string) {
    const client = await this.prisma.hotelClient.findUnique({
      where: { id: clientId },
      select: { tenant_id: true },
    });
    const tenantId = client?.tenant_id ?? null;

    const [botConfig, metaAdsCredential] = await Promise.all([
      tenantId
        ? this.prisma.botIntegrationConfig.findUnique({ where: { tenant_id: tenantId } })
        : Promise.resolve(null),
      this.prisma.hotelApiCredential.findFirst({
        where: { client_id: clientId, platform: EPlatform.META_ADS },
      }),
    ]);

    const heartbeat = (botConfig?.last_heartbeat_data ?? {}) as HeartbeatData;
    const heartbeatAgeMinutes = botConfig?.last_heartbeat_at
      ? Math.floor((Date.now() - botConfig.last_heartbeat_at.getTime()) / 60000)
      : null;
    const heartbeatStale = heartbeatAgeMinutes === null || heartbeatAgeMinutes > HEARTBEAT_STALE_MINUTES;

    return {
      whatsapp: {
        connected: Boolean(botConfig?.active) && !heartbeatStale,
        botEnabled: heartbeat.bot_enabled === true,
        heartbeatAgeMinutes,
        heartbeatStale,
        activeConversations: inteiro(heartbeat.active_conversations),
        pausedAwaitingHuman: inteiro(heartbeat.paused_awaiting_human),
        mode: textoOuNull(heartbeat.mode),
        aiEnabled: typeof heartbeat.ai_enabled === 'boolean' ? heartbeat.ai_enabled : null,
        lastEchoAt: textoOuNull(heartbeat.last_echo_at),
        lastPollingAt: textoOuNull(heartbeat.last_polling_at),
      },
      // Stubbed until Fase 4 Task 4 (Instagram overview) lands.
      instagram: { connected: false, tokenStatus: null },
      metaAds: {
        connected: Boolean(metaAdsCredential),
        tokenStatus: metaAdsCredential?.sync_status ?? null,
      },
    };
  }
}
```

Remover o import de `EBotContactStatus` (não é mais usado) e a constante `ACTIVE_CONVERSATION_WINDOW_HOURS`.

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- "bot-conversation|bot-channel-health"` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(bot): conversas com link do whatsapp web e canais lidos do heartbeat"
```

---

## Task 5: Board do funil a partir de `bot_leads` (sem o motor)

**Files:**
- Modify: `CP/application/services/funnel-metrics.service.ts:52-159` (`STATUS_VENDA` e `getBoard`)
- Modify: `CP/application/services/funnel-metrics.service.spec.ts` (bloco de testes do `getBoard`)

**Interfaces:**
- Consumes: colunas de hold/etiqueta do lead (Tasks 1 e 3).
- Produces: `getBoard(clientId): Promise<FunnelBoardColumn[]>` na forma de "Formas de resposta" (inclui `motivoPerda`, `holdStatus`, `holdCodigo`).

- [ ] **Step 1: Testes que falham**

No spec, substituir o `describe` do `getBoard` (e remover os mocks de `motorHold`/`motorReservation` do `buildPrisma` desse bloco):

```ts
describe('FunnelMetricsService.getBoard (contrato v2 §4.3)', () => {
  function build(leadsPorEstagio: Record<string, any[]>) {
    const prisma: any = {
      hotelClient: { findUnique: jest.fn().mockResolvedValue({ tenant_id: 'tenant_1' }) },
      botLead: {
        groupBy: jest.fn().mockImplementation(({ where }) => {
          if (where.hold_status) {
            return Promise.resolve([{ current_stage: 'FECHAMENTO_INICIADO', _sum: { hold_valor_cents: 154900 } }]);
          }
          return Promise.resolve([
            { current_stage: 'FECHAMENTO_INICIADO', _count: { _all: 2 }, _sum: { valor_confirmado_cents: 0 } },
            { current_stage: 'RESERVA_CONFIRMADA', _count: { _all: 1 }, _sum: { valor_confirmado_cents: 104900 } },
          ]);
        }),
        findMany: jest.fn().mockImplementation(({ where }) => Promise.resolve(leadsPorEstagio[where.current_stage] ?? [])),
      },
      botContact: {
        findMany: jest.fn().mockResolvedValue([
          {
            numero_contato: '5535999', nome: 'Ana', tipo_publico: 'LEAD', status_bot: 'AGUARDANDO_PAGAMENTO',
            last_user_message_at: new Date('2026-10-01T10:00:00.000Z'),
          },
        ]),
      },
    };
    return { prisma, service: new FunnelMetricsService(prisma, {} as any) };
  }

  const lead = {
    numero_contato: '5535999', acomodacao_interesse: 'Suíte Master',
    datas_interesse: { checkin: '2026-11-20', checkout: '2026-11-22' },
    hold_codigo: 'M57', hold_status: 'EXPIRADA', hold_valor_cents: 104900,
    recuperar: true, motivo_perda: null,
  };

  it('soma em aberto e confirmado por coluna, em reais, sem tocar no motor', async () => {
    const { prisma, service } = build({ FECHAMENTO_INICIADO: [lead] });
    const board = await service.getBoard('client_1');
    const fechamento = board.find((c) => c.stage === 'FECHAMENTO_INICIADO')!;
    const confirmada = board.find((c) => c.stage === 'RESERVA_CONFIRMADA')!;
    expect(fechamento).toMatchObject({ count: 2, valorAberto: 1549, valorConfirmado: 0 });
    expect(confirmada).toMatchObject({ count: 1, valorConfirmado: 1049 });
    expect(prisma.motorHold).toBeUndefined();
    expect(prisma.botLead.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenant_id: 'tenant_1', hold_status: { in: ['DISPONIVEL', 'AGUARDANDO', 'EXPIRADA'] } },
      }),
    );
  });

  it('card traz cotacao, etiqueta, hold e a espera contada da ultima mensagem do hospede', async () => {
    const { service } = build({ FECHAMENTO_INICIADO: [lead] });
    const board = await service.getBoard('client_1');
    expect(board.find((c) => c.stage === 'FECHAMENTO_INICIADO')!.leads[0]).toEqual({
      numeroContato: '5535999', nome: 'Ana', tipoPublico: 'LEAD',
      acomodacaoInteresse: 'Suíte Master', datasInteresse: '20/11/2026 – 22/11/2026',
      statusBot: 'AGUARDANDO_PAGAMENTO', aguardandoDesde: '2026-10-01T10:00:00.000Z',
      valorCotacao: 1049, etiqueta: 'RECUPERAR',
      motivoPerda: null, holdStatus: 'EXPIRADA', holdCodigo: 'M57',
    });
  });

  it('lead perdido expoe o motivo', async () => {
    const { service } = build({ PERDIDO: [{ ...lead, recuperar: false, hold_status: null, hold_valor_cents: null, motivo_perda: 'caro' }] });
    const board = await service.getBoard('client_1');
    expect(board.find((c) => c.stage === 'PERDIDO')!.leads[0]).toMatchObject({
      motivoPerda: 'caro', etiqueta: null, valorCotacao: null,
    });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- funnel-metrics` — Expected: FAIL (o board ainda lê `motorHold`).

- [ ] **Step 3: Implementar**

Em `funnel-metrics.service.ts`, remover `STATUS_VENDA` e substituir o `getBoard` inteiro:

```ts
  /** Holds que ainda representam dinheiro em aberto na coluna (contrato v2 §4.3). */
  private static readonly HOLD_EM_ABERTO = ['DISPONIVEL', 'AGUARDANDO', 'EXPIRADA'];

  async getBoard(clientId: string) {
    const tenantId = await this.resolveTenantId(clientId);
    if (!tenantId) return [];

    // Os totais vem da projecao do lead (alimentada pelos eventos do bot) —
    // o funil nao le mais o motor de reservas: a pre-reserva vive no PMS.
    const [porEstagio, abertoPorEstagio] = await Promise.all([
      this.prisma.botLead.groupBy({
        by: ['current_stage'],
        where: { tenant_id: tenantId },
        _count: { _all: true },
        _sum: { valor_confirmado_cents: true },
      }),
      this.prisma.botLead.groupBy({
        by: ['current_stage'],
        where: { tenant_id: tenantId, hold_status: { in: FunnelMetricsService.HOLD_EM_ABERTO } },
        _sum: { hold_valor_cents: true },
      }),
    ]);
    const totais = new Map(porEstagio.map((g) => [g.current_stage, g]));
    const aberto = new Map(abertoPorEstagio.map((g) => [g.current_stage, g._sum.hold_valor_cents ?? 0]));
    const reais = (cents: number) => Math.round(cents) / 100;

    const board = [];
    // Sequencial de proposito: pool pg max 3.
    for (const stage of ALL_STAGES) {
      const leads = await this.prisma.botLead.findMany({
        where: { tenant_id: tenantId, current_stage: stage },
        take: LEADS_PER_STAGE_CAP,
        orderBy: { updated_at: 'desc' },
      });
      const numeros = leads.map((l) => l.numero_contato);
      const contacts = numeros.length
        ? await this.prisma.botContact.findMany({
            where: { tenant_id: tenantId, numero_contato: { in: numeros } },
            select: {
              numero_contato: true, nome: true, tipo_publico: true,
              status_bot: true, last_user_message_at: true,
            },
          })
        : [];
      const contatoByNumero = new Map(contacts.map((c) => [c.numero_contato, c]));

      board.push({
        stage,
        count: totais.get(stage)?._count._all ?? 0,
        valorAberto: reais(aberto.get(stage) ?? 0),
        valorConfirmado: reais(totais.get(stage)?._sum.valor_confirmado_cents ?? 0),
        leads: leads.map((l) => {
          const contato = contatoByNumero.get(l.numero_contato);
          return {
            numeroContato: l.numero_contato,
            nome: contato?.nome ?? null,
            tipoPublico: contato?.tipo_publico ?? null,
            acomodacaoInteresse: l.acomodacao_interesse,
            datasInteresse: formatDatasInteresse(l.datas_interesse),
            statusBot: contato?.status_bot ?? 'ATIVO',
            // Contrato §4.3: a espera conta da ultima mensagem DO HOSPEDE.
            aguardandoDesde: contato?.last_user_message_at?.toISOString() ?? null,
            valorCotacao: l.hold_valor_cents == null ? null : reais(l.hold_valor_cents),
            etiqueta: l.recuperar ? ('RECUPERAR' as const) : null,
            motivoPerda: l.motivo_perda ?? null,
            holdStatus: l.hold_status ?? null,
            holdCodigo: l.hold_codigo ?? null,
          };
        }),
      });
    }
    return board;
  }
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- funnel-metrics` — Expected: PASS no bloco do board. Os testes de `getMetrics` do mesmo arquivo continuam verdes (mudam na Task 6).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(funil): board lido das projecoes do bot em vez do motor de reservas"
```

---

## Task 6: Métricas do funil conforme a Seção 4.4

**Files:**
- Modify: `CP/application/services/funnel-metrics.service.ts` (`getMetrics`, `avgFirstResponseSeconds`, `handoffMetrics`, `conversionByStage`, `emptyMetrics`)
- Modify: `CP/application/services/funnel-metrics.service.spec.ts` (bloco de testes do `getMetrics`)

**Interfaces:**
- Consumes: `bot_contacts.iniciado_em`/`source_id`, `bot_followup_attempts.regua`, ledger `bot_ingestion_events` (para `audio.transcrito`).
- Produces: `getMetrics` com `efetividadeFollowup: { regua, status, count }[]` e o campo novo `conversasPorAnuncio: { sourceId, count }[]`.

O que muda em relação ao código atual, campo a campo:

| Campo | Antes | Contrato §4.4 |
|---|---|---|
| `conversasIniciadas` | contatos por `created_at` | contatos por `iniciado_em` |
| `taxaRespostaBot` | mensagens do bot ÷ mensagens do hóspede | contatos com resposta do bot ÷ conversas iniciadas |
| `tempoMedioPrimeiraRespostaSegundos` | 1ª do bot − 1ª do hóspede | 1ª do bot − `iniciado_em` |
| `leadsProntos` | anotações `TRANSFERIR` | leads em `FECHAMENTO_INICIADO` ou `COMPROVANTE_RECEBIDO` |
| `taxaConversaoPorEtapa` | nº de eventos por estágio | contatos **distintos** que chegaram ao estágio ÷ conversas iniciadas |
| `efetividadeFollowup` | por `tipo_janela` | por `regua`, status `respondeu`/`sem_resposta` |
| `volumePorOrigem` | por `created_at` | por `iniciado_em` |
| `contatosPausados` | `PAUSADO` | `PAUSADO` ou `PAUSADO_HUMANO` |
| `audiosTranscritos` | mensagens do tipo áudio | eventos `audio.transcrito` no ledger |
| `handoff.tempoMedioComBotSegundos` | handoff − `created_at` | handoff − `iniciado_em` |
| `conversasPorAnuncio` | não existia | contatos iniciados no período agrupados por `source_id` |

- [ ] **Step 1: Testes que falham**

Substituir o `describe` do `getMetrics` no spec:

```ts
describe('FunnelMetricsService.getMetrics (contrato v2 §4.4)', () => {
  const from = new Date('2026-10-01T00:00:00.000Z');
  const to = new Date('2026-10-31T23:59:59.000Z');

  function build() {
    const prisma: any = {
      hotelClient: { findUnique: jest.fn().mockResolvedValue({ tenant_id: 'tenant_1' }) },
      botContact: {
        count: jest.fn().mockImplementation(({ where }) => {
          if (where.status_bot) return Promise.resolve(3);
          return Promise.resolve(where.iniciado_em.gte.getTime() === from.getTime() ? 10 : 8);
        }),
        groupBy: jest.fn().mockImplementation(({ by }) =>
          Promise.resolve(
            by[0] === 'origem'
              ? [{ origem: 'anuncio', _count: { _all: 6 } }, { origem: 'link', _count: { _all: 4 } }]
              : [{ source_id: 'ad_123', _count: { _all: 5 } }],
          ),
        ),
        findMany: jest.fn().mockResolvedValue([]),
      },
      botMessage: { findMany: jest.fn().mockResolvedValue([{ numero_contato: 'a' }, { numero_contato: 'b' }]) },
      botLead: {
        groupBy: jest.fn().mockResolvedValue([{ current_stage: 'QUALIFICADO', _count: { _all: 4 } }]),
        count: jest.fn().mockResolvedValue(2),
      },
      funnelEvent: {
        findMany: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve(where.motivo ? [] : [{ numero_contato: 'a' }, { numero_contato: 'b' }, { numero_contato: 'c' }]),
        ),
      },
      followupAttempt: {
        groupBy: jest.fn().mockResolvedValue([
          { regua: 'anuncio', status: 'respondeu', _count: { _all: 3 } },
          { regua: 'anuncio', status: 'sem_resposta', _count: { _all: 5 } },
        ]),
      },
      botIngestionEvent: { count: jest.fn().mockResolvedValue(7) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    const periodComparison = {
      previousPeriod: () => ({ prevFrom: new Date('2026-09-01T00:00:00.000Z'), prevTo: new Date('2026-09-30T23:59:59.000Z') }),
      metric: (value: number, previous: number, source: string) => ({ value, previous, delta: null, source }),
      ratio: (a: number, b: number) => (b ? a / b : 0),
      round2: (n: number) => Math.round(n * 100) / 100,
    };
    return { prisma, service: new FunnelMetricsService(prisma, periodComparison as any) };
  }

  it('conversas iniciadas contam pelo inicio do contato', async () => {
    const { prisma, service } = build();
    const m = await service.getMetrics('client_1', from, to);
    expect(m.conversasIniciadas.value).toBe(10);
    expect(prisma.botContact.count).toHaveBeenCalledWith({
      where: { tenant_id: 'tenant_1', iniciado_em: { gte: from, lte: to } },
    });
  });

  it('taxa de resposta e por contato, nao por mensagem', async () => {
    const { service } = build();
    const m = await service.getMetrics('client_1', from, to);
    expect(m.taxaRespostaBot).toBe(0.2); // 2 contatos com resposta / 10 iniciadas
  });

  it('leads prontos sao os que estao em fechamento ou com comprovante', async () => {
    const { prisma, service } = build();
    const m = await service.getMetrics('client_1', from, to);
    expect(m.leadsProntos).toBe(2);
    expect(prisma.botLead.count).toHaveBeenCalledWith({
      where: { tenant_id: 'tenant_1', current_stage: { in: ['FECHAMENTO_INICIADO', 'COMPROVANTE_RECEBIDO'] } },
    });
  });

  it('follow-up sai por regua', async () => {
    const { service } = build();
    const m = await service.getMetrics('client_1', from, to);
    expect(m.efetividadeFollowup).toEqual([
      { regua: 'anuncio', status: 'respondeu', count: 3 },
      { regua: 'anuncio', status: 'sem_resposta', count: 5 },
    ]);
  });

  it('pausados incluem os que estao com a equipe', async () => {
    const { prisma, service } = build();
    const m = await service.getMetrics('client_1', from, to);
    expect(m.contatosPausados).toBe(3);
    expect(prisma.botContact.count).toHaveBeenCalledWith({
      where: { tenant_id: 'tenant_1', status_bot: { in: ['PAUSADO', 'PAUSADO_HUMANO'] } },
    });
  });

  it('audios transcritos vem dos eventos audio.transcrito', async () => {
    const { prisma, service } = build();
    const m = await service.getMetrics('client_1', from, to);
    expect(m.audiosTranscritos).toBe(7);
    expect(prisma.botIngestionEvent.count).toHaveBeenCalledWith({
      where: { tenant_id: 'tenant_1', event_type: 'audio.transcrito', occurred_at: { gte: from, lte: to } },
    });
  });

  it('conversas por anuncio agrupam pelo source_id', async () => {
    const { service } = build();
    const m = await service.getMetrics('client_1', from, to);
    expect(m.conversasPorAnuncio).toEqual([{ sourceId: 'ad_123', count: 5 }]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- funnel-metrics` — Expected: FAIL no bloco de métricas.

- [ ] **Step 3: Implementar `getMetrics`**

Substituir o método `getMetrics` (o import de `EBotMessageType` deixa de ser usado — remover; `EBotMessageRole` continua). As consultas rodam em 4 grupos pequenos por causa do pool:

```ts
  private static readonly ESTAGIOS_PRONTOS = ['FECHAMENTO_INICIADO', 'COMPROVANTE_RECEBIDO'];
  private static readonly STATUS_COM_HUMANO = ['PAUSADO', 'PAUSADO_HUMANO'];

  async getMetrics(clientId: string, from: Date, to: Date) {
    const tenantId = await this.resolveTenantId(clientId);
    if (!tenantId) return this.emptyMetrics();

    const { prevFrom, prevTo } = this.periodComparison.previousPeriod(from, to);
    const periodo = { gte: from, lte: to };

    const [conversasAtual, conversasAnterior, contatosComResposta] = await Promise.all([
      this.prisma.botContact.count({ where: { tenant_id: tenantId, iniciado_em: periodo } }),
      this.prisma.botContact.count({
        where: { tenant_id: tenantId, iniciado_em: { gte: prevFrom, lte: prevTo } },
      }),
      this.prisma.botMessage.findMany({
        where: { tenant_id: tenantId, role: EBotMessageRole.assistant, ocorrido_em: periodo },
        select: { numero_contato: true },
        distinct: ['numero_contato'],
      }),
    ]);

    const [tempoPrimeiraResposta, tempoMedioPorEstagio, conversaoPorEtapa] = await Promise.all([
      this.avgFirstResponseSeconds(tenantId, from, to),
      this.avgTimePerStage(tenantId, from, to),
      this.conversionByStage(tenantId, from, to, conversasAtual),
    ]);

    const [distribuicaoFunil, qualificados, leadsProntos] = await Promise.all([
      this.prisma.botLead.groupBy({
        by: ['current_stage'],
        where: { tenant_id: tenantId },
        _count: { _all: true },
      }),
      this.prisma.funnelEvent.findMany({
        where: { tenant_id: tenantId, ocorrido_em: periodo, para_estagio: { in: QUALIFIED_OR_BEYOND_STAGES } },
        select: { numero_contato: true },
        distinct: ['numero_contato'],
      }),
      this.prisma.botLead.count({
        where: { tenant_id: tenantId, current_stage: { in: FunnelMetricsService.ESTAGIOS_PRONTOS as any } },
      }),
    ]);

    const [followupRows, volumePorOrigem, conversasPorAnuncio] = await Promise.all([
      this.prisma.followupAttempt.groupBy({
        by: ['regua', 'status'],
        where: { tenant_id: tenantId, ocorrido_em: periodo },
        _count: { _all: true },
      }),
      this.prisma.botContact.groupBy({
        by: ['origem'],
        where: { tenant_id: tenantId, iniciado_em: periodo },
        _count: { _all: true },
      }),
      this.prisma.botContact.groupBy({
        by: ['source_id'],
        where: { tenant_id: tenantId, iniciado_em: periodo, source_id: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const [contatosPausados, audiosTranscritos, handoff] = await Promise.all([
      this.prisma.botContact.count({
        where: { tenant_id: tenantId, status_bot: { in: FunnelMetricsService.STATUS_COM_HUMANO as any } },
      }),
      this.prisma.botIngestionEvent.count({
        where: { tenant_id: tenantId, event_type: 'audio.transcrito', occurred_at: periodo },
      }),
      this.handoffMetrics(tenantId, from, to),
    ]);

    return {
      conversasIniciadas: this.periodComparison.metric(conversasAtual, conversasAnterior, 'auto'),
      taxaRespostaBot: this.periodComparison.round2(
        this.periodComparison.ratio(contatosComResposta.length, conversasAtual),
      ),
      tempoMedioPrimeiraRespostaSegundos: tempoPrimeiraResposta,
      distribuicaoFunil: distribuicaoFunil.map((g) => ({ stage: g.current_stage, count: g._count._all })),
      tempoMedioPorEstagioSegundos: tempoMedioPorEstagio,
      taxaQualificacao: this.periodComparison.round2(
        this.periodComparison.ratio(qualificados.length, conversasAtual),
      ),
      leadsProntos,
      taxaConversaoPorEtapa: conversaoPorEtapa,
      efetividadeFollowup: followupRows.map((r) => ({
        regua: r.regua ?? 'desconhecida',
        status: r.status,
        count: r._count._all,
      })),
      volumePorOrigem: volumePorOrigem.map((r) => ({ origem: r.origem ?? 'desconhecido', count: r._count._all })),
      conversasPorAnuncio: conversasPorAnuncio
        .map((r) => ({ sourceId: r.source_id as string, count: r._count._all }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      contatosPausados,
      audiosTranscritos,
      handoff: {
        ...handoff,
        taxaHandover: this.periodComparison.round2(this.periodComparison.ratio(handoff.total, conversasAtual)),
      },
    };
  }
```

- [ ] **Step 4: Ajustar os auxiliares**

`avgFirstResponseSeconds` — a primeira resposta do bot conta a partir do início do contato:

```ts
  private async avgFirstResponseSeconds(tenantId: string, from: Date, to: Date): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<{ avg_seconds: number | null }[]>`
      WITH first_assistant AS (
        SELECT numero_contato, MIN(ocorrido_em) AS first_assistant_at
        FROM bot_messages
        WHERE tenant_id = ${tenantId} AND role = 'assistant'
        GROUP BY numero_contato
      )
      SELECT AVG(EXTRACT(EPOCH FROM (fa.first_assistant_at - c.iniciado_em))) AS avg_seconds
      FROM bot_contacts c
      JOIN first_assistant fa ON fa.numero_contato = c.numero_contato
      WHERE c.tenant_id = ${tenantId}
        AND c.iniciado_em BETWEEN ${from} AND ${to}
        AND fa.first_assistant_at >= c.iniciado_em
    `;
    const value = rows[0]?.avg_seconds;
    return value === null || value === undefined ? null : Number(value);
  }
```

`handoffMetrics` — trocar a leitura de `created_at` por `iniciado_em` (com `created_at` de reserva para contatos antigos):

```ts
    const contatos = await this.prisma.botContact.findMany({
      where: { tenant_id: tenantId, numero_contato: { in: [...primeiroHandoff.keys()] } },
      select: { numero_contato: true, iniciado_em: true, created_at: true },
    });
    const duracoes: number[] = [];
    for (const c of contatos) {
      const h = primeiroHandoff.get(c.numero_contato);
      if (!h) continue;
      const inicio = c.iniciado_em ?? c.created_at;
      const seg = (h.getTime() - inicio.getTime()) / 1000;
      if (seg >= 0) duracoes.push(seg);
    }
```

`conversionByStage` — contatos distintos, sobre as conversas iniciadas:

```ts
  private async conversionByStage(
    tenantId: string,
    from: Date,
    to: Date,
    conversasIniciadas: number,
  ): Promise<{ stage: string; count: number; rate: number }[]> {
    const rows = await this.prisma.$queryRaw<{ para_estagio: string; contatos: bigint }[]>`
      SELECT para_estagio, COUNT(DISTINCT numero_contato) AS contatos
      FROM funil_eventos
      WHERE tenant_id = ${tenantId}
        AND ocorrido_em BETWEEN ${from} AND ${to}
        AND de_estagio IS DISTINCT FROM para_estagio
        AND (motivo IS NULL OR motivo NOT LIKE 'HANDOFF:%')
      GROUP BY para_estagio
    `;
    const byStage = new Map(rows.map((r) => [r.para_estagio, Number(r.contatos)]));

    // PERDIDO fica de fora: e saida do funil, nao um degrau da escada.
    return ALL_STAGES.filter((s) => s !== FUNNEL_LOST_STAGE).map((stage) => {
      const count = byStage.get(stage) ?? 0;
      return { stage, count, rate: this.periodComparison.ratio(count, conversasIniciadas) };
    });
  }
```

(O import de `FUNNEL_ENTRY_STAGE` deixa de ser usado neste arquivo — remover.)

`emptyMetrics` — acrescentar `conversasPorAnuncio: [],`.

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- "funnel-metrics|home.service"` — Expected: PASS (o spec do `home` só repassa o que `getMetrics` devolve).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(funil): metricas calculadas conforme a secao 4.4 do contrato v2"
```

---

## Task 7: Canal B — outbox assinado por HMAC

**Files:**
- Create: `CP/infrastructure/providers/bot-panel-action.provider.ts`
- Create: `CP/infrastructure/providers/bot-panel-action.provider.spec.ts`
- Modify: `CP/infrastructure/providers/bot-reconciliation-cron.provider.ts`
- Modify: `CP/application/dtos/bot-integration-config.dto.ts`
- Modify: `CP/application/services/bot-integration-config.service.ts`
- Modify: `CP/reserve-client-portal.module.ts` (providers += `BotPanelActionProvider`)

**Interfaces:**
- Consumes: `AesEncryptionProvider.encrypt(plaintext): string` / `decrypt(data): string` (`CP/infrastructure/providers/aes-encryption.provider.ts`, já registrado no módulo); `prisma.botPanelAction`.
- Produces (Tasks 8 e 9 consomem):

```ts
export type PanelAction =
  | 'move_stage' | 'return_to_bot' | 'pause_bot' | 'extend_hold'
  | 'mark_lost' | 'send_message' | 'apply_config';

export interface PanelActionInput {
  phone?: string | null;
  actorId?: string | null;
  payload?: Record<string, unknown>;
}
export interface PanelActionResult { ok: boolean; state: string | null }

class BotPanelActionProvider {
  dispatch(tenantId: string, action: PanelAction, input?: PanelActionInput): Promise<PanelActionResult>;
  retry(actionId: string): Promise<PanelActionResult>;
}
```

`dispatch` nunca lança. Grava a linha em `bot_panel_actions` antes de chamar o bot (contrato §5.3).

- [ ] **Step 1: Testes que falham**

`bot-panel-action.provider.spec.ts`:

```ts
import axios from 'axios';
import * as crypto from 'crypto';
import { BotPanelActionProvider } from './bot-panel-action.provider';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BotPanelActionProvider (contrato v2 §5)', () => {
  const config = {
    tenant_id: 'tenant_1', bot_tenant_ref: 'cli_dona_tereza',
    n8n_panel_webhook_url: 'https://n8n.example/webhook/painel', panel_webhook_secret_enc: 'cifrado',
  };
  let prisma: any;
  let aes: { decrypt: jest.Mock };
  let provider: BotPanelActionProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      botPanelAction: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'act_1', ...data })),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      botIntegrationConfig: { findUnique: jest.fn().mockResolvedValue(config) },
      botContact: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    aes = { decrypt: jest.fn().mockReturnValue('segredo-do-tenant') };
    provider = new BotPanelActionProvider(prisma, aes as any);
  });

  it('grava a acao antes de chamar o bot', async () => {
    const ordem: string[] = [];
    prisma.botPanelAction.create.mockImplementation(({ data }: any) => {
      ordem.push('gravou');
      return Promise.resolve({ id: 'act_1', ...data });
    });
    mockedAxios.post.mockImplementation(() => {
      ordem.push('chamou');
      return Promise.resolve({ data: { ok: true, state: 'ATIVO' } });
    });
    await provider.dispatch('tenant_1', 'return_to_bot', { phone: '5535999', actorId: 'usr_1' });
    expect(ordem).toEqual(['gravou', 'chamou']);
  });

  it('assina o corpo bruto com HMAC-SHA256 e manda o identificador do bot', async () => {
    mockedAxios.post.mockResolvedValue({ data: { ok: true, state: 'ATIVO' } });
    await provider.dispatch('tenant_1', 'move_stage', {
      phone: '5535999', actorId: 'usr_1', payload: { stage: 'OFERTA_FEITA', reason: null },
    });

    const [url, body, options] = mockedAxios.post.mock.calls[0] as [string, string, any];
    expect(url).toBe('https://n8n.example/webhook/painel');
    expect(JSON.parse(body)).toEqual({
      action: 'move_stage', tenant_id: 'cli_dona_tereza', phone: '5535999',
      actor_id: 'usr_1', payload: { stage: 'OFERTA_FEITA', reason: null },
    });
    const esperado = crypto.createHmac('sha256', 'segredo-do-tenant').update(body).digest('hex');
    expect(options.headers['X-Reserve-Signature']).toBe(esperado);
  });

  it('sucesso: marca SENT, guarda o estado e aplica no contato', async () => {
    mockedAxios.post.mockResolvedValue({ data: { ok: true, state: 'PAUSADO' } });
    const result = await provider.dispatch('tenant_1', 'pause_bot', { phone: '5535999' });
    expect(result).toEqual({ ok: true, state: 'PAUSADO' });
    expect(prisma.botPanelAction.update).toHaveBeenCalledWith({
      where: { id: 'act_1' },
      data: expect.objectContaining({ status: 'SENT', response_state: 'PAUSADO' }),
    });
    expect(prisma.botContact.updateMany).toHaveBeenCalledWith({
      where: { tenant_id: 'tenant_1', numero_contato: '5535999' },
      data: { status_bot: 'PAUSADO' },
    });
  });

  it('falha de rede: marca FAILED, conta a tentativa e nao lanca', async () => {
    mockedAxios.post.mockRejectedValue(new Error('timeout'));
    const result = await provider.dispatch('tenant_1', 'return_to_bot', { phone: '5535999' });
    expect(result).toEqual({ ok: false, state: null });
    expect(prisma.botPanelAction.update).toHaveBeenCalledWith({
      where: { id: 'act_1' },
      data: expect.objectContaining({ status: 'FAILED', attempts: { increment: 1 }, last_error: 'timeout' }),
    });
  });

  it('canal nao configurado: FAILED sem chamar ninguem', async () => {
    prisma.botIntegrationConfig.findUnique.mockResolvedValue({ ...config, n8n_panel_webhook_url: null });
    const result = await provider.dispatch('tenant_1', 'return_to_bot', { phone: '5535999' });
    expect(result.ok).toBe(false);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('estado desconhecido na resposta nao e gravado no contato', async () => {
    mockedAxios.post.mockResolvedValue({ data: { ok: true, state: 'INVENTADO' } });
    await provider.dispatch('tenant_1', 'pause_bot', { phone: '5535999' });
    expect(prisma.botContact.updateMany).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- bot-panel-action` — Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar o provider**

`bot-panel-action.provider.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { AesEncryptionProvider } from './aes-encryption.provider';
import { EBotContactStatus } from '../../../../generated/prisma/enums';

const WEBHOOK_TIMEOUT_MS = 5000;

export type PanelAction =
  | 'move_stage'
  | 'return_to_bot'
  | 'pause_bot'
  | 'extend_hold'
  | 'mark_lost'
  | 'send_message'
  | 'apply_config';

export interface PanelActionInput {
  phone?: string | null;
  actorId?: string | null;
  payload?: Record<string, unknown>;
}

export interface PanelActionResult {
  ok: boolean;
  state: string | null;
}

/**
 * Canal B do contrato v2 (§5): acoes do humano no painel -> bot. A acao vira
 * uma linha em bot_panel_actions ANTES da chamada (outbox): se o bot estiver
 * fora do ar, a acao do humano ja valeu no painel e o cron reconcilia.
 * Nunca lanca — quem chama decide o que fazer com `ok: false`.
 */
@Injectable()
export class BotPanelActionProvider {
  private readonly logger = new Logger(BotPanelActionProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aes: AesEncryptionProvider,
  ) {}

  async dispatch(tenantId: string, action: PanelAction, input: PanelActionInput = {}): Promise<PanelActionResult> {
    let row: { id: string };
    try {
      row = await this.prisma.botPanelAction.create({
        data: {
          tenant_id: tenantId,
          action,
          phone: input.phone ?? null,
          actor_id: input.actorId ?? null,
          payload: (input.payload ?? {}) as object,
          status: 'PENDING',
        },
      });
    } catch (error) {
      this.logger.warn(`Nao foi possivel registrar a acao ${action} (tenant=${tenantId}): ${error}`);
      return { ok: false, state: null };
    }
    return this.attempt(row.id, tenantId, action, input);
  }

  /** Reenvio de uma acao que falhou — usado pelo cron de reconciliacao. */
  async retry(actionId: string): Promise<PanelActionResult> {
    const row = await this.prisma.botPanelAction.findUnique({ where: { id: actionId } });
    if (!row) return { ok: false, state: null };
    return this.attempt(row.id, row.tenant_id, row.action as PanelAction, {
      phone: row.phone,
      actorId: row.actor_id,
      payload: (row.payload ?? {}) as Record<string, unknown>,
    });
  }

  private async attempt(
    actionId: string,
    tenantId: string,
    action: PanelAction,
    input: PanelActionInput,
  ): Promise<PanelActionResult> {
    try {
      const config = await this.prisma.botIntegrationConfig.findUnique({ where: { tenant_id: tenantId } });
      if (!config?.n8n_panel_webhook_url || !config.panel_webhook_secret_enc) {
        throw new Error('canal reverso nao configurado (url ou segredo ausente)');
      }

      // O corpo e serializado UMA vez: a assinatura e do texto exato que trafega.
      const body = JSON.stringify({
        action,
        tenant_id: config.bot_tenant_ref ?? tenantId,
        phone: input.phone ?? null,
        actor_id: input.actorId ?? null,
        payload: input.payload ?? {},
      });
      const signature = crypto
        .createHmac('sha256', this.aes.decrypt(config.panel_webhook_secret_enc))
        .update(body)
        .digest('hex');

      const response = await axios.post(config.n8n_panel_webhook_url, body, {
        timeout: WEBHOOK_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json', 'X-Reserve-Signature': signature },
        // Sem isto o axios re-serializaria a string e a assinatura deixaria de bater.
        transformRequest: [(data) => data],
      });

      const state = typeof response.data?.state === 'string' ? response.data.state : null;
      await this.prisma.botPanelAction.update({
        where: { id: actionId },
        data: { status: 'SENT', response_state: state, last_error: null, last_attempt_at: new Date() },
      });

      // O bot devolve o estado do contato depois da acao (§5.2): aplica na hora,
      // sem esperar o evento de eco chegar pelo Canal A.
      if (input.phone && state && state in EBotContactStatus) {
        await this.prisma.botContact.updateMany({
          where: { tenant_id: tenantId, numero_contato: input.phone },
          data: { status_bot: state as EBotContactStatus },
        });
      }
      return { ok: true, state };
    } catch (error) {
      const message = String((error as Error)?.message ?? error);
      this.logger.warn(`Acao ${action} nao entregue ao bot (tenant=${tenantId}, acao=${actionId}): ${message}`);
      await this.prisma.botPanelAction
        .update({
          where: { id: actionId },
          data: { status: 'FAILED', attempts: { increment: 1 }, last_error: message, last_attempt_at: new Date() },
        })
        .catch(() => undefined);
      return { ok: false, state: null };
    }
  }
}
```

Registrar em `providers` do módulo.

- [ ] **Step 4: Cron de reconciliação**

Em `bot-reconciliation-cron.provider.ts`, injetar `BotPanelActionProvider` (terceiro parâmetro do construtor) e acrescentar ao final do `reconcile()` — o bloco de `botStageWebhookDispatch` fica como está até a Task 12:

```ts
    // Canal B do contrato v2. send_message fica de fora: reenviar uma mensagem
    // minutos depois, fora de contexto, e pior do que perde-la.
    const acoes = await this.prisma.botPanelAction.findMany({
      where: { status: 'FAILED', attempts: { lt: MAX_ATTEMPTS }, action: { not: 'send_message' } },
      select: { id: true },
      orderBy: { created_at: 'asc' },
    });
    for (const acao of acoes) {
      await this.botPanelActions.retry(acao.id);
    }
```

O `if (failedDispatches.length === 0) return;` precisa virar um `if` que só pula o laço dos dispatches antigos, para o bloco novo sempre rodar.

- [ ] **Step 5: Configuração da integração**

Em `bot-integration-config.dto.ts`, acrescentar aos DTOs de create e update:

```ts
  @IsOptional() @IsString() @MaxLength(60)
  bot_tenant_ref?: string;

  @IsOptional() @IsUrl({ require_tld: false })
  n8n_panel_webhook_url?: string;

  /** Write-only: o segredo HMAC do canal reverso. Nunca volta em resposta. */
  @IsOptional() @IsString() @MinLength(16) @MaxLength(200)
  panel_webhook_secret?: string;
```

Em `bot-integration-config.service.ts`: injetar `AesEncryptionProvider`; em `create()` e `update()` mapear os três campos:

```ts
      ...(dto.bot_tenant_ref !== undefined ? { bot_tenant_ref: dto.bot_tenant_ref || null } : {}),
      ...(dto.n8n_panel_webhook_url !== undefined ? { n8n_panel_webhook_url: dto.n8n_panel_webhook_url || null } : {}),
      ...(dto.panel_webhook_secret
        ? { panel_webhook_secret_enc: this.aes.encrypt(dto.panel_webhook_secret) }
        : {}),
```

Na função que monta a resposta do `GET` (a que hoje omite `tenant_key_hash`/`tenant_key_salt`), omitir também `panel_webhook_secret_enc` e expor no lugar `panel_webhook_secret_set: Boolean(config.panel_webhook_secret_enc)`.

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test -- "bot-panel-action|reserve-client-portal"` — Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(bot): canal reverso com outbox e assinatura hmac"
```

---

## Task 8: Ações humanas — mover, perder, devolver, assumir, estender, enviar

**Files:**
- Modify: `CP/application/services/funnel.service.ts`
- Modify: `CP/application/services/funnel.service.spec.ts`
- Create: `CP/application/dtos/funnel-action.dto.ts`
- Modify: `CP/infrastructure/controllers/admin-whatsapp-funnel.controller.ts`
- Modify: `CP/application/dtos/whatsapp.dto.ts`, `CP/application/services/whatsapp.service.ts`, `CP/infrastructure/controllers/whatsapp.controller.ts:65-73`

**Interfaces:**
- Consumes: `BotPanelActionProvider.dispatch` (Task 7).
- Produces:
  - `FunnelService.moveStage(...)` (mesma assinatura) → despacha `mark_lost` quando o destino é `PERDIDO`, senão `move_stage`.
  - `FunnelService.resumeConversation(...)` (mesma assinatura) → despacha `return_to_bot` (+ `move_stage` se o estágio mudar).
  - `FunnelService.pauseConversation(tenantId, numeroContato, adminId, motivo?): Promise<PanelActionResult>`.
  - `FunnelService.extendHold(tenantId, numeroContato, adminId, minutos?, codigo?): Promise<PanelActionResult>`.
  - `export const MOTIVOS_PERDA = ['caro', 'data', 'pesquisando', 'sumiu', 'outro'] as const`.
  - Rotas `POST :contactId/pause` e `POST :contactId/extend-hold`; `POST admin/hotel-portal/whatsapp/:clientId/send` aceitando `{ to_phone, to_name?, body }`.

- [ ] **Step 1: Testes que falham**

No `funnel.service.spec.ts`: em todos os `beforeEach`, trocar `webhook = { dispatch: jest.fn().mockResolvedValue(undefined) }` por `actions = { dispatch: jest.fn().mockResolvedValue({ ok: true, state: 'ATIVO' }) }` e passar `actions` como segundo argumento do construtor. Trocar, nos testes existentes, os motivos de PERDIDO em texto livre (`'achou caro'`, `'  achou caro  '`) por `'caro'` / `'  caro  '` (esperando `motivo: 'caro'`), e as asserções `webhook.dispatch` por `actions.dispatch`. Acrescentar:

```ts
describe('FunnelService — canal reverso (contrato v2 §5)', () => {
  const tenantId = 'tenant_123';
  const numero = '5511999999999';
  let prisma: any;
  let actions: { dispatch: jest.Mock };
  let service: FunnelService;

  beforeEach(() => {
    prisma = {
      botLead: { findUnique: jest.fn().mockResolvedValue({ current_stage: 'OFERTA_FEITA' }), upsert: jest.fn() },
      botContact: {
        findUnique: jest.fn().mockResolvedValue({ id: 'c_1', status_bot: 'ATIVO' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      funnelEvent: { create: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([{ id: 'evt_1' }, { id: 'evt_2' }]),
    };
    actions = { dispatch: jest.fn().mockResolvedValue({ ok: true, state: 'PAUSADO' }) };
    service = new FunnelService(prisma, actions as any);
  });

  it('mover para outro estagio despacha move_stage', async () => {
    await service.moveStage(tenantId, numero, EFunnelStage.FECHAMENTO_INICIADO, 'admin_1');
    expect(actions.dispatch).toHaveBeenCalledWith(tenantId, 'move_stage', {
      phone: numero, actorId: 'admin_1', payload: { stage: 'FECHAMENTO_INICIADO', reason: null },
    });
  });

  it('mover para PERDIDO despacha mark_lost e guarda o motivo no lead', async () => {
    await service.moveStage(tenantId, numero, EFunnelStage.PERDIDO, 'admin_1', 'caro');
    expect(actions.dispatch).toHaveBeenCalledWith(tenantId, 'mark_lost', {
      phone: numero, actorId: 'admin_1', payload: { reason: 'caro' },
    });
    expect(prisma.botLead.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ current_stage: 'PERDIDO', motivo_perda: 'caro' }) }),
    );
  });

  it('PERDIDO com motivo fora da lista e recusado', async () => {
    await expect(
      service.moveStage(tenantId, numero, EFunnelStage.PERDIDO, 'admin_1', 'nao gostou'),
    ).rejects.toThrow(/motivo/i);
    expect(actions.dispatch).not.toHaveBeenCalled();
  });

  it('retomar despacha return_to_bot', async () => {
    prisma.$transaction.mockResolvedValue([{ count: 1 }, { id: 'evt_resume' }]);
    await service.resumeConversation(tenantId, numero, 'admin_1');
    expect(actions.dispatch).toHaveBeenCalledWith(tenantId, 'return_to_bot', { phone: numero, actorId: 'admin_1' });
  });

  it('assumir a conversa pausa localmente e despacha pause_bot', async () => {
    const result = await service.pauseConversation(tenantId, numero, 'admin_1', 'cliente pediu desconto');
    expect(prisma.botContact.updateMany).toHaveBeenCalledWith({
      where: { tenant_id: tenantId, numero_contato: numero },
      data: { status_bot: 'PAUSADO', motivo_pausa: 'cliente pediu desconto' },
    });
    expect(actions.dispatch).toHaveBeenCalledWith(tenantId, 'pause_bot', {
      phone: numero, actorId: 'admin_1', payload: { reason: 'cliente pediu desconto' },
    });
    expect(result).toEqual({ ok: true, state: 'PAUSADO' });
  });

  it('assumir conversa de contato inexistente da 404', async () => {
    prisma.botContact.findUnique.mockResolvedValue(null);
    await expect(service.pauseConversation(tenantId, numero, 'admin_1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('estender prazo usa 60 minutos por padrao', async () => {
    await service.extendHold(tenantId, numero, 'admin_1');
    expect(actions.dispatch).toHaveBeenCalledWith(tenantId, 'extend_hold', {
      phone: numero, actorId: 'admin_1', payload: { minutes: 60 },
    });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- funnel.service` — Expected: FAIL.

- [ ] **Step 3: Implementar o service**

Em `funnel.service.ts`:

1. Trocar o import e o construtor:

```ts
import { BotPanelActionProvider, PanelActionResult } from '../../infrastructure/providers/bot-panel-action.provider';

/** Motivos de perda do contrato v2 (§3.5, evento `perdido`). */
export const MOTIVOS_PERDA = ['caro', 'data', 'pesquisando', 'sumiu', 'outro'] as const;
```

```ts
  constructor(
    private readonly prisma: PrismaService,
    private readonly panelActions: BotPanelActionProvider,
  ) {}
```

2. Em `moveStage`, logo depois da checagem de motivo vazio, acrescentar:

```ts
    if (paraEstagio === FUNNEL_LOST_STAGE && !(MOTIVOS_PERDA as readonly string[]).includes(motivoLimpo!)) {
      throw new BadRequestException(`motivo de perda invalido: use um de ${MOTIVOS_PERDA.join(', ')}.`);
    }
```

3. No `botLead.upsert` do `moveStage`, gravar o carimbo e o motivo (o carimbo é o que faz o eco `painel.estagio` do bot virar no-op no projetor):

```ts
      this.prisma.botLead.upsert({
        where: { tenant_id_numero_contato: { tenant_id: tenantId, numero_contato: numeroContato } },
        create: {
          tenant_id: tenantId, numero_contato: numeroContato, current_stage: paraEstagio,
          stage_em: new Date(),
          ...(paraEstagio === FUNNEL_LOST_STAGE ? { motivo_perda: motivoLimpo } : {}),
        },
        update: {
          current_stage: paraEstagio,
          stage_em: new Date(),
          ...(paraEstagio === FUNNEL_LOST_STAGE ? { motivo_perda: motivoLimpo } : {}),
        },
      }),
```

4. Substituir a linha `this.botStageWebhookProvider.dispatch(...)` do `moveStage` por:

```ts
    // Fire-and-forget: a acao do humano ja valeu no painel. O provider grava
    // a linha no outbox e o cron reconcilia se o bot estiver fora do ar.
    const dispatch =
      paraEstagio === FUNNEL_LOST_STAGE
        ? this.panelActions.dispatch(tenantId, 'mark_lost', {
            phone: numeroContato, actorId: adminId, payload: { reason: motivoLimpo },
          })
        : this.panelActions.dispatch(tenantId, 'move_stage', {
            phone: numeroContato, actorId: adminId, payload: { stage: paraEstagio, reason: motivoLimpo ?? null },
          });
    dispatch.catch(() => undefined);
```

5. Em `resumeConversation`, incluir `stage_em: new Date()` no `botLead.upsert` (create e update) e substituir o dispatch final por:

```ts
    this.panelActions
      .dispatch(tenantId, 'return_to_bot', { phone: numeroContato, actorId: adminId })
      .then(() =>
        paraEstagio !== currentStage
          ? this.panelActions.dispatch(tenantId, 'move_stage', {
              phone: numeroContato, actorId: adminId,
              payload: { stage: paraEstagio, reason: RETOMADA_HUMANA_MOTIVO },
            })
          : undefined,
      )
      .catch(() => undefined);
```

6. Acrescentar os dois métodos novos (antes do fechamento da classe):

```ts
  /**
   * "Assumir conversa": o humano pausa o bot para aquele contato. Aqui a
   * resposta do bot interessa a quem clicou, entao o dispatch e aguardado.
   */
  async pauseConversation(
    tenantId: string,
    numeroContato: string,
    adminId: string,
    motivo?: string,
  ): Promise<PanelActionResult> {
    const contact = await this.prisma.botContact.findUnique({
      where: { tenant_id_numero_contato: { tenant_id: tenantId, numero_contato: numeroContato } },
    });
    if (!contact) throw new NotFoundException('contato nao encontrado.');

    const motivoLimpo = motivo?.trim().slice(0, 255) || null;
    await this.prisma.botContact.updateMany({
      where: { tenant_id: tenantId, numero_contato: numeroContato },
      data: { status_bot: 'PAUSADO', motivo_pausa: motivoLimpo },
    });
    return this.panelActions.dispatch(tenantId, 'pause_bot', {
      phone: numeroContato, actorId: adminId, payload: { reason: motivoLimpo },
    });
  }

  /** Soma minutos ao prazo do hold que esta AGUARDANDO (contrato v2 §5.1). */
  async extendHold(
    tenantId: string,
    numeroContato: string,
    adminId: string,
    minutos = 60,
    codigo?: string,
  ): Promise<PanelActionResult> {
    return this.panelActions.dispatch(tenantId, 'extend_hold', {
      phone: numeroContato,
      actorId: adminId,
      payload: { minutes: minutos, ...(codigo ? { codigo } : {}) },
    });
  }
```

- [ ] **Step 4: DTO e rotas**

`CP/application/dtos/funnel-action.dto.ts`:

```ts
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class PauseConversationDto {
  @IsOptional() @IsString() @MaxLength(255)
  motivo?: string;
}

export class ExtendHoldDto {
  /** Padrao do contrato: 60 minutos. Teto de 24h para barrar erro de digitacao. */
  @IsOptional() @IsInt() @Min(5) @Max(1440)
  minutos?: number;

  @IsOptional() @IsString() @MaxLength(20)
  codigo?: string;
}
```

Em `admin-whatsapp-funnel.controller.ts` (mesma classe, mesmos guards e permissão), acrescentar:

```ts
  /** "Assumir conversa": pausa o bot para o contato (contrato v2 §5.1, pause_bot). */
  @Post(':contactId/pause')
  async pauseConversation(
    @Param('tenantId') tenantId: string,
    @Param('contactId') contactId: string,
    @Body() dto: PauseConversationDto,
    @CurrentAdmin() admin: CurrentAdminPayload,
  ) {
    return this.funnelService.pauseConversation(tenantId, contactId, admin.admin_id, dto.motivo);
  }

  /** Estende o prazo do hold que esta aguardando pagamento (extend_hold). */
  @Post(':contactId/extend-hold')
  async extendHold(
    @Param('tenantId') tenantId: string,
    @Param('contactId') contactId: string,
    @Body() dto: ExtendHoldDto,
    @CurrentAdmin() admin: CurrentAdminPayload,
  ) {
    return this.funnelService.extendHold(tenantId, contactId, admin.admin_id, dto.minutos, dto.codigo);
  }
```

- [ ] **Step 5: `send_message` na rota de envio existente**

O contrato aponta `POST /admin/.../whatsapp/{clientId}/send` como o disparo de `send_message`, e o formulário do painel já manda `{ to_phone, to_name, body }`. Em `whatsapp.dto.ts`, acrescentar:

```ts
/** Mensagem livre do humano pelo painel -> Canal B `send_message` (contrato v2 §5.1). */
export class SendBotMessageDto {
  @IsString() @Length(8, 20)
  to_phone: string;

  @IsOptional() @IsString() @MaxLength(150)
  to_name?: string;

  @IsString() @Length(1, 1000)
  body: string;
}
```

Em `whatsapp.service.ts`, injetar `BotPanelActionProvider` e acrescentar:

```ts
  /** Janela de atendimento da Meta: so e possivel mensagem livre ate 24h apos a ultima mensagem do hospede. */
  private static readonly JANELA_META_MS = 24 * 60 * 60 * 1000;

  async sendBotMessage(clientId: string, adminId: string, dto: SendBotMessageDto) {
    const client = await this.prisma.hotelClient.findUnique({
      where: { id: clientId },
      select: { tenant_id: true },
    });
    if (!client?.tenant_id) return errorResponse('400:HOTEL_CLIENT_WITHOUT_TENANT', 400);

    const contato = await this.prisma.botContact.findUnique({
      where: { tenant_id_numero_contato: { tenant_id: client.tenant_id, numero_contato: dto.to_phone } },
      select: { last_user_message_at: true },
    });
    const ultima = contato?.last_user_message_at?.getTime() ?? 0;
    // Fora da janela a Meta pode recusar; o bot responde 200 mesmo assim (§5.3),
    // entao quem avisa o usuario e o painel.
    const foraDaJanela = Date.now() - ultima > WhatsAppService.JANELA_META_MS;

    const result = await this.panelActions.dispatch(client.tenant_id, 'send_message', {
      phone: dto.to_phone,
      actorId: adminId,
      payload: { text: dto.body },
    });
    return successResponse({ ...result, foraDaJanela }, result.ok ? 200 : 502);
  }
```

Conferir os nomes reais dos helpers de resposta e do `prisma` no arquivo (`successResponse`/`errorResponse` de `src/shared/helpers`) e seguir o padrão dos métodos vizinhos.

Em `whatsapp.controller.ts:65-73`, o handler de `send` passa a rotear pelo formato do corpo:

```ts
  @Post(':clientId/send')
  async sendMessage(
    @Param('clientId') clientId: string,
    @Body() body: Record<string, unknown>,
    @CurrentAdmin() admin: CurrentAdminPayload,
    @Res() res: Response,
  ) {
    // Texto livre (formulario do painel) vai ao bot pelo Canal B; o envio por
    // template continua no fluxo antigo.
    const result =
      typeof body.body === 'string'
        ? await this.whatsappService.sendBotMessage(clientId, admin.admin_id, body as unknown as SendBotMessageDto)
        : await this.whatsappService.sendMessage(clientId, body as unknown as SendWhatsAppMessageDto);
    return res.status(result.status).json(result.data);
  }
```

Como o corpo deixa de ser um DTO único, validar o ramo de texto livre no service: se `to_phone` não for string de 8–20 caracteres ou `body` estiver vazio/maior que 1000, devolver `errorResponse('400:INVALID_MESSAGE', 400)` antes de qualquer consulta. Importar `CurrentAdmin`/`CurrentAdminPayload` de `src/shared/auth/decorators/current-admin.decorator`.

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test -- "funnel.service|reserve-client-portal"` — Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(bot): acoes humanas do painel pelo canal reverso (mover, perder, assumir, estender, enviar)"
```

---

## Task 9: Propostas de configuração → `apply_config`

**Files:**
- Modify: `CP/application/dtos/bot-config-proposal.dto.ts`
- Modify: `CP/application/services/bot-config-proposal.service.ts`
- Create: `CP/application/services/bot-config-proposal.service.spec.ts`

**Interfaces:**
- Consumes: `BotPanelActionProvider.dispatch(tenantId, 'apply_config', { actorId, payload: { key, value } })`.
- Produces: `submit` grava `justificativa_cliente`; `approve` despacha `apply_config` (contrato §6, passo 3). As rotas não mudam.

- [ ] **Step 1: Testes que falham**

`bot-config-proposal.service.spec.ts`:

```ts
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BotConfigProposalService } from './bot-config-proposal.service';
import { CreateBotConfigProposalDto } from '../dtos/bot-config-proposal.dto';

describe('BotConfigProposalService (contrato v2 §6)', () => {
  let prisma: any;
  let actions: { dispatch: jest.Mock };
  let service: BotConfigProposalService;

  beforeEach(() => {
    prisma = {
      botConfigProposal: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'p_1', ...data })),
        findFirst: jest.fn().mockResolvedValue({ id: 'p_1', tenant_id: 'tenant_1', status: 'PENDENTE' }),
        update: jest.fn().mockResolvedValue({ id: 'p_1', campo: 'tarifa:361057:A', valor_proposto: 33900, status: 'APROVADA' }),
      },
    };
    actions = { dispatch: jest.fn().mockResolvedValue({ ok: true, state: null }) };
    service = new BotConfigProposalService(prisma, { record: jest.fn() } as any, actions as any);
  });

  it('aprovar despacha apply_config com chave e valor', async () => {
    await service.approve('tenant_1', 'p_1', 'revisor_1');
    expect(actions.dispatch).toHaveBeenCalledWith('tenant_1', 'apply_config', {
      actorId: 'revisor_1', payload: { key: 'tarifa:361057:A', value: 33900 },
    });
  });

  it('proposta que nao esta pendente nao e reaplicada', async () => {
    prisma.botConfigProposal.findFirst.mockResolvedValue({ id: 'p_1', status: 'APROVADA' });
    const result = await service.approve('tenant_1', 'p_1', 'revisor_1');
    expect(result.status).toBe(409);
    expect(actions.dispatch).not.toHaveBeenCalled();
  });

  it('guarda a justificativa do cliente separada do retorno da agencia', async () => {
    await service.submit('tenant_1', 'autor_1', {
      campo: 'hold_min_pix_manual', categoria: 'policies', valor_proposto: 90, justificativa: 'hospedes pedem mais prazo',
    } as any);
    expect(prisma.botConfigProposal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ justificativa_cliente: 'hospedes pedem mais prazo' }),
    });
  });
});

describe('CreateBotConfigProposalDto', () => {
  const build = (payload: Record<string, unknown>) =>
    validate(plainToInstance(CreateBotConfigProposalDto, payload), { whitelist: true });

  it('valor_proposto sobrevive ao whitelist e e obrigatorio', async () => {
    const dto = plainToInstance(CreateBotConfigProposalDto, { campo: 'x', categoria: 'pricing', valor_proposto: 33900 });
    expect(await validate(dto, { whitelist: true })).toHaveLength(0);
    expect(dto.valor_proposto).toBe(33900);

    const faltando = await build({ campo: 'x', categoria: 'pricing' });
    expect(faltando.some((e) => e.property === 'valor_proposto')).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- bot-config-proposal` — Expected: FAIL.

- [ ] **Step 3: Implementar**

Em `bot-config-proposal.dto.ts`, no `CreateBotConfigProposalDto`:

```ts
  // Sem decorator o whitelist do ValidationPipe descartaria estes campos.
  @IsOptional()
  valor_atual?: unknown;

  @IsDefined()
  valor_proposto: unknown;

  /** Por que o cliente quer a mudanca (contrato v2 §6, passo 1). */
  @IsOptional() @IsString() @MaxLength(1000)
  justificativa?: string;
```

(imports de `class-validator`: acrescentar `IsDefined`, `IsOptional`, `IsString`, `MaxLength` se faltarem).

Em `bot-config-proposal.service.ts`:

1. Construtor ganha o terceiro parâmetro: `private readonly panelActions: BotPanelActionProvider,` (import de `../../infrastructure/providers/bot-panel-action.provider`). Remover o import do `axios`.
2. Em `submit`, acrescentar ao `data`: `justificativa_cliente: dto.justificativa?.trim() || null,`.
3. Em `approve`, substituir `await this.publishToN8n(tenantId, updated.campo, updated.valor_proposto);` por:

```ts
      // Contrato v2 §6 passo 3: a aprovacao aplica a chave no bot pelo Canal B.
      // A proposta aprovada e a verdade; se o bot estiver fora do ar, o cron
      // de reconciliacao reenvia o apply_config.
      await this.panelActions.dispatch(tenantId, 'apply_config', {
        actorId: revisorId,
        payload: { key: updated.campo, value: updated.valor_proposto },
      });
```

4. Remover o método `publishToN8n` e atualizar o comentário do `approve` (a publicação agora tem outbox e retry).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- bot-config-proposal` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(bot): aprovacao de proposta aplica a configuracao no bot via apply_config"
```

---

## Task 10: Canal C — `POST /api/webhooks/booking/:clientId`

A rota que o contrato cita não existe; o que há é `/webhooks/booking-engine/:tenantId` com outro corpo e segredo em texto plano. Esta task cria a rota do contrato sem mexer na antiga.

**Files:**
- Create: `CP/application/services/pms-booking-webhook.service.ts`
- Create: `CP/application/services/pms-booking-webhook.service.spec.ts`
- Create: `CP/infrastructure/controllers/pms-booking-webhook.controller.ts`
- Modify: `CP/reserve-client-portal.module.ts` (controllers += `PmsBookingWebhookController`; providers += `PmsBookingWebhookService`)
- Modify: `CP/infrastructure/controllers/client-portal-module-access-wiring.spec.ts` (`PUBLIC_CONTROLLERS` += `PmsBookingWebhookController`)

**Interfaces:**
- Consumes: `hotel_clients.webhook_secret` (segredo HMAC por cliente, já existe); `req.rawBody` (já preservado em `main.ts`; `/api/webhooks/` já tem limite de 5mb).
- Produces: `PmsBookingWebhookService.receive(clientId, rawBody: Buffer | undefined, signature: string | undefined, payload): Promise<{ status: number; data: unknown }>`.

Corpo (contrato v2 §4.7 + `docs/02_CONTRATO_API_HOTEL_PORTAL.md` §8):

```jsonc
{
  "externalId": "r_30644146",
  "engine": "hospedin",
  "status": "confirmed",          // confirmed | cancelled | modified
  "channel": "direct",            // direct | ota | ota:booking | ota:expedia | ota:airbnb
  "amount": 104900,               // centavos
  "checkIn": "2026-11-20", "checkOut": "2026-11-22",
  "bookedAt": "2026-10-01T01:37:11.000Z",
  "guest": { "emailHash": "<sha256>", "phoneHash": "<sha256>" }
}
```

Não cria `hotel_guests`: o contato chega com hash (LGPD), e nome/telefone em claro vêm pelo Canal A.

- [ ] **Step 1: Testes que falham**

`pms-booking-webhook.service.spec.ts`:

```ts
import * as crypto from 'crypto';
import { PmsBookingWebhookService } from './pms-booking-webhook.service';

const SECRET = 'segredo-do-cliente';
const payload = {
  externalId: 'r_30644146', engine: 'hospedin', status: 'confirmed', channel: 'direct',
  amount: 104900, checkIn: '2026-11-20', checkOut: '2026-11-22', bookedAt: '2026-10-01T01:37:11.000Z',
  guest: { emailHash: 'abc', phoneHash: 'def' },
};
const raw = Buffer.from(JSON.stringify(payload));
const assinatura = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');

describe('PmsBookingWebhookService (contrato v2 §4.7)', () => {
  let prisma: any;
  let service: PmsBookingWebhookService;

  beforeEach(() => {
    prisma = {
      hotelClient: { findUnique: jest.fn().mockResolvedValue({ tenant_id: 'tenant_1', webhook_secret: SECRET }) },
      hotelReservation: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'res_1' }),
        update: jest.fn().mockResolvedValue({ id: 'res_1' }),
      },
    };
    service = new PmsBookingWebhookService(prisma);
  });

  it('assinatura valida: cria a reserva convertendo centavos em reais', async () => {
    const result = await service.receive('client_1', raw, assinatura, payload);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ received: true, reservationId: 'res_1', conversionDispatched: false });
    expect(prisma.hotelReservation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenant_id: 'tenant_1', external_id: 'r_30644146', engine_type: 'HOSPEDIN',
        source: 'DIRECT', status: 'CONFIRMED', total_amount: 1049,
        check_in: new Date('2026-11-20'), check_out: new Date('2026-11-22'),
      }),
    });
  });

  it('assinatura errada: 401 e nada gravado', async () => {
    const result = await service.receive('client_1', raw, 'deadbeef', payload);
    expect(result.status).toBe(401);
    expect(prisma.hotelReservation.create).not.toHaveBeenCalled();
  });

  it('cliente sem segredo configurado: 401', async () => {
    prisma.hotelClient.findUnique.mockResolvedValue({ tenant_id: 'tenant_1', webhook_secret: null });
    const result = await service.receive('client_1', raw, assinatura, payload);
    expect(result.status).toBe(401);
  });

  it('reserva ja conhecida e atualizada, nao duplicada', async () => {
    prisma.hotelReservation.findFirst.mockResolvedValue({ id: 'res_1' });
    const cancelada = { ...payload, status: 'cancelled' };
    const rawCancelada = Buffer.from(JSON.stringify(cancelada));
    const sig = crypto.createHmac('sha256', SECRET).update(rawCancelada).digest('hex');
    await service.receive('client_1', rawCancelada, sig, cancelada);
    expect(prisma.hotelReservation.create).not.toHaveBeenCalled();
    expect(prisma.hotelReservation.update).toHaveBeenCalledWith({
      where: { id: 'res_1' },
      data: expect.objectContaining({ status: 'CANCELLED' }),
    });
  });

  it('canal ota vira OTHER_OTA; ota:booking vira BOOKING_COM', async () => {
    for (const [channel, source] of [['ota', 'OTHER_OTA'], ['ota:booking', 'BOOKING_COM']]) {
      const p = { ...payload, channel };
      const r = Buffer.from(JSON.stringify(p));
      const sig = crypto.createHmac('sha256', SECRET).update(r).digest('hex');
      prisma.hotelReservation.create.mockClear();
      await service.receive('client_1', r, sig, p);
      expect(prisma.hotelReservation.create.mock.calls[0][0].data.source).toBe(source);
    }
  });

  it('corpo sem externalId ou datas: 400', async () => {
    const p = { ...payload, externalId: undefined };
    const r = Buffer.from(JSON.stringify(p));
    const sig = crypto.createHmac('sha256', SECRET).update(r).digest('hex');
    const result = await service.receive('client_1', r, sig, p as any);
    expect(result.status).toBe(400);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- pms-booking-webhook` — Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar o service**

`pms-booking-webhook.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { errorResponse, successResponse } from '../../../../shared/helpers';

interface PmsBookingPayload {
  externalId?: unknown; engine?: unknown; status?: unknown; channel?: unknown;
  amount?: unknown; checkIn?: unknown; checkOut?: unknown; bookedAt?: unknown;
}

const STATUS_MAP: Record<string, 'CONFIRMED' | 'CANCELLED'> = {
  confirmed: 'CONFIRMED',
  modified: 'CONFIRMED',
  cancelled: 'CANCELLED',
};

const OTA_SOURCE: Record<string, string> = {
  booking: 'BOOKING_COM',
  expedia: 'EXPEDIA',
  airbnb: 'AIRBNB',
  tripadvisor: 'TRIPADVISOR',
};

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Canal C do contrato v2 (§4.7): reservas detectadas pelo bot no PMS (site,
 * OTA, balcao e as do proprio bot). Autenticado por HMAC-SHA256 do corpo bruto
 * com o segredo do cliente. Contato chega com hash (LGPD): nao cria hospede.
 */
@Injectable()
export class PmsBookingWebhookService {
  private readonly logger = new Logger(PmsBookingWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async receive(
    clientId: string,
    rawBody: Buffer | undefined,
    signature: string | undefined,
    payload: PmsBookingPayload,
  ) {
    const client = await this.prisma.hotelClient.findUnique({
      where: { id: clientId },
      select: { tenant_id: true, webhook_secret: true },
    });
    // Cliente inexistente, sem tenant ou sem segredo falham igual: nunca
    // revelar a um chamador nao autenticado se o cliente existe.
    if (!client?.tenant_id || !client.webhook_secret || !rawBody || !this.assinaturaValida(rawBody, signature, client.webhook_secret)) {
      return errorResponse('401:INVALID_SIGNATURE', 401);
    }

    const externalId = typeof payload.externalId === 'string' ? payload.externalId.slice(0, 100) : '';
    const checkIn = typeof payload.checkIn === 'string' && DATA_ISO.test(payload.checkIn) ? payload.checkIn : '';
    const checkOut = typeof payload.checkOut === 'string' && DATA_ISO.test(payload.checkOut) ? payload.checkOut : '';
    const status = STATUS_MAP[String(payload.status ?? '').toLowerCase()];
    if (!externalId || !checkIn || !checkOut || !status) {
      return errorResponse('400:INVALID_BOOKING_PAYLOAD', 400);
    }

    const amount = Number(payload.amount);
    const dados = {
      engine_type: 'HOSPEDIN' as const,
      source: this.sourceFor(String(payload.channel ?? 'direct')) as any,
      status: status as any,
      check_in: new Date(checkIn),
      check_out: new Date(checkOut),
      // Contrato: amount em centavos; a coluna total_amount e em reais.
      total_amount: Number.isFinite(amount) ? Math.round(amount) / 100 : 0,
      raw_payload: payload as object,
      processed: true,
    };

    const existente = await this.prisma.hotelReservation.findFirst({
      where: { tenant_id: client.tenant_id, external_id: externalId },
      select: { id: true },
    });
    const reserva = existente
      ? await this.prisma.hotelReservation.update({ where: { id: existente.id }, data: dados })
      : await this.prisma.hotelReservation.create({
          data: {
            ...dados,
            tenant_id: client.tenant_id,
            external_id: externalId,
            // guest_name e obrigatorio na tabela; o nome real nao trafega aqui.
            guest_name: 'Hóspede (PMS)',
            booking_date: typeof payload.bookedAt === 'string' ? new Date(payload.bookedAt) : new Date(),
          },
        });

    return successResponse({ received: true, reservationId: reserva.id, conversionDispatched: false }, 200);
  }

  private assinaturaValida(rawBody: Buffer, signature: string | undefined, secret: string): boolean {
    if (!signature) return false;
    const esperado = crypto.createHmac('sha256', secret).update(rawBody).digest();
    const recebido = Buffer.from(signature, 'hex');
    return recebido.length === esperado.length && crypto.timingSafeEqual(recebido, esperado);
  }

  private sourceFor(channel: string): string {
    const canal = channel.toLowerCase();
    if (canal === 'direct') return 'DIRECT';
    const [, ota] = canal.split(':');
    return OTA_SOURCE[ota ?? ''] ?? 'OTHER_OTA';
  }
}
```

- [ ] **Step 4: Controller**

`pms-booking-webhook.controller.ts`:

```ts
import { Body, Controller, Headers, Param, Post, Req, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../../../../shared/auth/decorators/public.decorator';
import { PmsBookingWebhookService } from '../../application/services/pms-booking-webhook.service';

/**
 * Canal C do contrato Bot <-> Painel v2. Trafego de terceiro (o bot, via N8N),
 * autenticado por assinatura HMAC do corpo — por isso @Public e sem rate limit,
 * como os demais webhooks.
 */
@SkipThrottle()
@Controller('webhooks/booking')
@Public()
export class PmsBookingWebhookController {
  constructor(private readonly service: PmsBookingWebhookService) {}

  @Post(':clientId')
  async receive(
    @Param('clientId') clientId: string,
    @Headers('x-reserve-signature') signature: string | undefined,
    @Req() request: Request & { rawBody?: Buffer },
    @Body() payload: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const result = await this.service.receive(clientId, request.rawBody, signature, payload);
    return res.status(result.status).json(result.data);
  }
}
```

Registrar controller e service no módulo; acrescentar `PmsBookingWebhookController` ao array `PUBLIC_CONTROLLERS` do spec de wiring (import no topo do spec).

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- "pms-booking-webhook|module-access-wiring"` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(reservas): webhook de reservas do pms assinado por hmac (canal c)"
```

---

## Task 11: Home, ciclo dos links e aposentadoria do `GuestStatusService`

**Files:**
- Modify: `CP/application/services/home.service.ts` e `home.service.spec.ts`
- Modify: `CP/application/services/leads-overview.service.ts` e `leads-overview.service.spec.ts`
- Delete: `CP/application/services/guest-status.service.ts`, `guest-status.service.spec.ts`, `CP/infrastructure/providers/guest-status-cron.provider.ts`
- Modify: `CP/reserve-client-portal.module.ts` (remover `GuestStatusService` e `GuestStatusCronProvider` de imports e providers)

**Interfaces:**
- Produces: `home.bot = { receitaConfirmada, reservas, aRecuperar: { quantidade, valor } }` (reais) e `leadsOverview.ciclo = { cliques, conversas, reservas }`.

Por que a home entra aqui: hoje "Gerado pelo bot" e "A recuperar" vêm de `motor_*`. Com a pré-reserva no Hospedin, esses dois números ficariam zerados sem aviso.

- [ ] **Step 1: Testes que falham**

Em `home.service.spec.ts`, acrescentar ao mock do Prisma `botLead: { aggregate: jest.fn(), count: jest.fn() }` e `funnelEvent: { findMany: jest.fn() }`, e o teste:

```ts
  it('bloco bot: receita confirmada e a recuperar vem das projecoes, em reais', async () => {
    prisma.funnelEvent.findMany.mockResolvedValue([{ numero_contato: 'a' }, { numero_contato: 'b' }]);
    prisma.botLead.aggregate
      .mockResolvedValueOnce({ _sum: { valor_confirmado_cents: 254900 } })   // confirmadas no periodo
      .mockResolvedValueOnce({ _sum: { hold_valor_cents: 104900 }, _count: { _all: 3 } }); // a recuperar
    const result = await service.getHome('client_1', from, to);
    expect(result.data.bot).toEqual({
      receitaConfirmada: 2549, reservas: 2, aRecuperar: { quantidade: 3, valor: 1049 },
    });
    expect(prisma.botLead.aggregate).toHaveBeenNthCalledWith(1, {
      where: { tenant_id: 'tenant_1', numero_contato: { in: ['a', 'b'] } },
      _sum: { valor_confirmado_cents: true },
    });
  });
```

(usar os nomes de variável — `prisma`, `service`, `from`, `to` — que o spec já define no `beforeEach`).

Em `leads-overview.service.spec.ts`, acrescentar ao mock `whatsAppTrackingLink: { findMany }`, `botContact: { findMany }`, `botLead: { count }` e:

```ts
  it('ciclo: cliques -> conversas pelo link -> reservas', async () => {
    prisma.whatsAppTrackingLink.findMany.mockResolvedValue([{ short_code: 'inv26' }]);
    prisma.botContact.findMany.mockResolvedValue([{ numero_contato: 'a' }, { numero_contato: 'b' }]);
    prisma.botLead.count.mockResolvedValue(1);
    const overview = await service.getOverview('client_1', from, to);
    expect(overview.ciclo).toEqual({ cliques: overview.clicks.value, conversas: 2, reservas: 1 });
    expect(prisma.botContact.findMany).toHaveBeenCalledWith({
      where: { tenant_id: 'tenant_1', link_code: { in: ['inv26'] }, iniciado_em: { gte: from, lte: to } },
      select: { numero_contato: true },
    });
  });
```

e garantir que o mock tenha `hotelClient: { findUnique: jest.fn().mockResolvedValue({ tenant_id: 'tenant_1' }) }`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- "home.service|leads-overview"` — Expected: FAIL.

- [ ] **Step 3: Implementar a home**

Em `home.service.ts`, trocar o `Promise.all` e o retorno:

```ts
    const [funil, motor] = await Promise.all([
      this.funnelMetrics.getMetrics(clientId, from, to),
      this.motorMetrics.metrics(client.tenant_id, from, to),
    ]);
    const bot = await this.botResumo(client.tenant_id, from, to);
    return successResponse({
      period: { from: from.toISOString(), to: to.toISOString() },
      funil,
      motor,
      bot,
    });
```

e acrescentar o método:

```ts
  /**
   * Dinheiro que passou pelo bot, lido das projecoes dos eventos (contrato v2):
   * a pre-reserva vive no PMS, entao o motor de reservas nao enxerga esses valores.
   */
  private async botResumo(tenantId: string, from: Date, to: Date) {
    const confirmados = await this.prisma.funnelEvent.findMany({
      where: { tenant_id: tenantId, para_estagio: 'RESERVA_CONFIRMADA', ocorrido_em: { gte: from, lte: to } },
      select: { numero_contato: true },
      distinct: ['numero_contato'],
    });
    const numeros = confirmados.map((c) => c.numero_contato);

    const receita = await this.prisma.botLead.aggregate({
      where: { tenant_id: tenantId, numero_contato: { in: numeros } },
      _sum: { valor_confirmado_cents: true },
    });
    const recuperar = await this.prisma.botLead.aggregate({
      where: { tenant_id: tenantId, recuperar: true },
      _sum: { hold_valor_cents: true },
      _count: { _all: true },
    });

    return {
      receitaConfirmada: (receita._sum.valor_confirmado_cents ?? 0) / 100,
      reservas: numeros.length,
      aRecuperar: {
        quantidade: recuperar._count._all,
        valor: (recuperar._sum.hold_valor_cents ?? 0) / 100,
      },
    };
  }
```

- [ ] **Step 4: Implementar o ciclo dos links**

Em `leads-overview.service.ts`: acrescentar `ciclo: { cliques: number; conversas: number; reservas: number };` à interface `ILeadsOverview`; no fim de `getOverview`, antes do `return`:

```ts
    const ciclo = await this.cicloDoLink(clientId, from, to, currentClicks);
```

incluir `ciclo` no objeto retornado, e acrescentar o método:

```ts
  /**
   * Contrato v2 §4.6: fecha o ciclo clique -> conversa -> reserva cruzando o
   * short_code dos links rastreaveis com o link_code do contato.iniciado.
   */
  private async cicloDoLink(clientId: string, from: Date, to: Date, cliques: number) {
    const client = await this.prisma.hotelClient.findUnique({
      where: { id: clientId },
      select: { tenant_id: true },
    });
    const links = await this.prisma.whatsAppTrackingLink.findMany({
      where: { client_id: clientId },
      select: { short_code: true },
    });
    if (!client?.tenant_id || links.length === 0) return { cliques, conversas: 0, reservas: 0 };

    const contatos = await this.prisma.botContact.findMany({
      where: {
        tenant_id: client.tenant_id,
        link_code: { in: links.map((l) => l.short_code) },
        iniciado_em: { gte: from, lte: to },
      },
      select: { numero_contato: true },
    });
    const numeros = contatos.map((c) => c.numero_contato);
    const reservas = numeros.length
      ? await this.prisma.botLead.count({
          where: { tenant_id: client.tenant_id, numero_contato: { in: numeros }, current_stage: 'RESERVA_CONFIRMADA' },
        })
      : 0;

    return { cliques, conversas: numeros.length, reservas };
  }
```

- [ ] **Step 5: Aposentar o `GuestStatusService`**

Run: `Grep "GuestStatus" src` — confirmar que só o módulo, o service, o spec e o cron o referenciam. Deletar os três arquivos e remover os dois imports/registros do módulo.

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test -- reserve-client-portal` — Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(home): numeros do bot lidos dos eventos e ciclo clique-conversa-reserva"
```

---

## Task 12: Limpeza — Chatwoot, webhooks antigos e migração de drops

**Files:**
- Create: `prisma/migrations/20260930000002_bot_contract_v2_cleanup/migration.sql`
- Modify: `prisma/schema.prisma` (remover 3 colunas de `BotIntegrationConfig` e o model `BotStageWebhookDispatch`)
- Modify: `src/shared/database/migrations.spec.ts`
- Delete: `CP/infrastructure/providers/bot-stage-webhook.provider.ts`
- Modify: `CP/infrastructure/providers/bot-reconciliation-cron.provider.ts`
- Modify: `CP/application/dtos/bot-integration-config.dto.ts`, `CP/application/services/bot-integration-config.service.ts`
- Modify: `CP/reserve-client-portal.module.ts`
- Modify (só comentários): `CP/application/services/handoff-summary.service.ts:36`, `CP/infrastructure/controllers/bot-event-ingestion.controller.ts`

- [ ] **Step 1: Teste que falha**

Em `migrations.spec.ts`:

```ts
describe('20260930000002_bot_contract_v2_cleanup', () => {
  const sql = readMigration('20260930000002_bot_contract_v2_cleanup');

  it('remove o que o contrato v2 substituiu', () => {
    expect(sql).toContain('DROP COLUMN "chatwoot_base_url"');
    expect(sql).toContain('DROP COLUMN "n8n_stage_webhook_url"');
    expect(sql).toContain('DROP COLUMN "n8n_config_publish_webhook_url"');
    expect(sql).toContain('DROP TABLE "bot_stage_webhook_dispatches"');
  });

  it('nao toca no webhook do motor de reservas', () => {
    expect(sql).not.toContain('n8n_motor_webhook_url');
  });
});
```

Run: `npm test -- migrations.spec` — Expected: FAIL (arquivo inexistente).

- [ ] **Step 2: Migration**

```sql
-- Contrato Bot <-> Painel v2 (limpeza). O Chatwoot saiu (§1.1) e os dois
-- webhooks antigos foram substituidos pelo canal reverso unico (§5).

ALTER TABLE "bot_integration_configs"
  DROP COLUMN "chatwoot_base_url",
  DROP COLUMN "n8n_stage_webhook_url",
  DROP COLUMN "n8n_config_publish_webhook_url";

-- Substituida por bot_panel_actions.
DROP TABLE "bot_stage_webhook_dispatches";
```

- [ ] **Step 3: Remover do código**

1. `schema.prisma`: apagar as 3 colunas e o model `BotStageWebhookDispatch`. `npx prisma generate`.
2. Deletar `bot-stage-webhook.provider.ts`; remover o import e o registro no módulo.
3. `bot-reconciliation-cron.provider.ts`: remover a injeção de `BotStageWebhookProvider` e o bloco de `botStageWebhookDispatch`; o cron fica só com o laço de `botPanelAction` da Task 7. Atualizar o comentário de classe (reconcilia as ações do Canal B).
4. `bot-integration-config.dto.ts` e `.service.ts`: remover `chatwoot_base_url`, `n8n_stage_webhook_url` e `n8n_config_publish_webhook_url` dos DTOs, do `create`, do `update` e da resposta.
5. Comentários: em `handoff-summary.service.ts:36` e no controller de ingestão, trocar a menção a "nota privada no Chatwoot" por "resumo enviado à equipe pelo WhatsApp".

- [ ] **Step 4: Verificar que nada sobrou**

Run: `Grep -i "chatwoot" src --glob "!**/generated/**"` — Expected: nenhuma ocorrência.
Run: `Grep "n8n_stage_webhook_url|n8n_config_publish_webhook_url|BotStageWebhook" src --glob "!**/generated/**"` — Expected: nenhuma ocorrência.

- [ ] **Step 5: Suíte completa**

Run: `npm test` — Expected: PASS.
Run: `npm run build` — Expected: sem erros de tipo.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(bot): remove chatwoot e os webhooks substituidos pelo canal reverso"
```

---

## Verificação final

- [ ] `npm test` e `npm run build` verdes.
- [ ] Teste de fumaça do Canal A sem o bot (contrato §9) — com o backend local de pé e uma integração criada com `bot_tenant_ref = "cli_dona_tereza"`:

```bash
curl -i -X POST http://localhost:3000/api/ingest/bot-events \
  -H "Authorization: Bearer <tenant_key>" -H "Content-Type: application/json" \
  -d '{"tenant_id":"cli_dona_tereza","events":[{"event_id":"8022b725-6f7b-4d94-a2a3-c5f0f2cb9014","occurred_at":"2026-10-01T01:37:11.891Z","type":"reserva.confirmada","actor":{"type":"bot","id":null},"contact":{"phone":"553598067432","name":"Gabriel Caliari","audience":"LEAD","origin":"anuncio","bot_status":"FECHADO","occasion":"romantica"},"stage":"RESERVA_CONFIRMADA","hold":{"code":"M57","status":"CONFIRMADA","accommodation":"Suíte Master","check_in":"2026-11-20","check_out":"2026-11-22","amount_cents":104900,"pms_reservation_id":"r_30644146"},"data":{"codigo":"M57","acomodacao":"Suíte Master","valor_cents":104900}}]}'
```

Expected: `HTTP/1.1 202` com `{"received":1,"duplicated":0}`; repetir o comando devolve `{"received":1,"duplicated":1}`.

- [ ] Depois do merge, rodar no front `npm run codegen:diff` (ver `AGENTS.md` do front) e revisar as mudanças de contrato antes de `npm run codegen`.

## Fora deste plano (registrado)

- **Nome da campanha por anúncio.** O `source_id` do contrato é o id do anúncio da Meta; `campaign_metrics` só guarda `campaign_name`, sem id externo. Este plano entrega `conversasPorAnuncio` por `source_id`; resolver o nome exige que o sync da Meta passe a gravar o id do anúncio — trabalho separado.
- **Conversão server-side** no webhook de reservas (`conversionDispatched`) continua `false`: é a Fase 2 do contrato da API do hotel-portal.
- **Reprocessamento de eventos `FAILED`** do ledger: ficam visíveis por status, sem cron de reprocesso.
- **Pendências do lado do bot** (contrato §10): WF9a chamando o Canal C, evento `audio.transcrito`, `apply_config` para `tarifa:*` e `calendario:*`.
