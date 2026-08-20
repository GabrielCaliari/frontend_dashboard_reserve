# Funil que se move sozinho + recuperação ativa + handoff instrumentado — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar os 4 gaps P0 do benchmark `docs/BENCHMARK_ATENDIMENTO_WHATSAPP_2026-08.md`: (1) base de dados da esteira de recuperação de cotação não fechada, (2) kanban com R$ por coluna e tempo de espera no card, (3) card que se move sozinho por evento do motor (hold criado / hold expirado), (4) handoff padrão-ouro (motivo de escalação logado, resumo para nota interna, métricas do ciclo bot→humano).

**Architecture:** Backend NestJS (`backend_reserve`) ganha: sync de funil no `HoldService` para hold criado/expirado (mesmo padrão já usado no pagamento confirmado); `FunnelMetricsService.getBoard` enriquecido com dinheiro e espera por coluna/card; `bot.pausado` passa a gravar evento de anotação `HANDOFF:<motivo>` no log append-only `funil_eventos`; novo bloco `handoff` nas métricas do funil e `recuperadas` nas métricas do motor; endpoint de resumo de handoff para o N8N postar como nota interna no Chatwoot. Frontend Next (`frontend_dashboard_reserve`) consome os contratos novos no kanban, na página do funil e na home. Todo o painel continua leitura + deep link (Decisão 11): nada de escrita de mensagens aqui.

**Tech Stack:** NestJS 10 + Prisma (Postgres) + Jest no backend; Next.js App Router + React Query + HeroUI + dnd-kit + Vitest/Testing Library no frontend.

## Global Constraints

- Dois repositórios: backend em `C:\Users\gabri\OneDrive\Documents\GitHub\backend_reserve`, frontend em `C:\Users\gabri\OneDrive\Documents\GitHub\frontend_dashboard_reserve`. Cada task diz em qual repo está. Commits em cada repo separadamente, na branch `main`, mensagens em português sem acento no prefixo (`feat(funil): ...`), terminando com `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` e `Claude-Session: https://claude.ai/code/session_01QJfuXx1K29b9tzBvhGfSy6`.
- **Sem migração de banco.** Tudo é derivado de `funil_eventos`, `bot_leads`, `bot_contacts`, `bot_messages`, `motor_holds`, `motor_reservations` que já existem. Não alterar `prisma/schema.prisma`.
- `numero_contato` (bot) e `contato_whatsapp` (motor) são o mesmo identificador — `HoldService.syncBotAfterConfirm` já os trata como iguais; seguir essa premissa.
- Valores monetários do motor são **reais em Decimal** (não centavos). No frontend usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` — `formatMoney` de `hotel-format.ts` espera centavos e NÃO serve aqui.
- Convenção do log append-only: evento de **anotação** (não muda estágio) tem `de_estagio: null` e `para_estagio: <estágio atual>` — mesmo padrão de `handleProntoParaFechar` (motivo `TRANSFERIR`). Marcadores de motivo existentes: `TRANSFERIR`, `RETOMADA_HUMANA`, `pagamento confirmado no motor`. Novos neste plano: `HOLD_CRIADO`, `HOLD_EXPIRADO`, `HANDOFF:<motivo>`.
- Sync do funil disparado pelo motor é **melhor esforço**: nunca pode derrubar `create`/`expireDue`/`confirm` (try/catch + `logger.warn`).
- Testes: backend `npx jest <caminho>`; frontend `npx vitest run <caminho>`. Baseline do frontend tem 77 falhas pré-existentes em CMS/access-management/editor — só investigar falha fora dessas áreas.
- Não rodar revisão de qualidade/spec por task (memória `defer-quality-review-to-end`).
- Modelo dos subagentes executores: **qualquer um exceto Fable 5** (Sonnet por padrão; Haiku onde a task for só plumbing de tipos). No máximo 2 subagentes simultâneos: um para o grupo Backend (Tasks 1–6), outro para o grupo Frontend (Tasks 7–10). Os contratos de API estão fixados nas seções **Interfaces** e permitem paralelismo.

---

## Contratos compartilhados (fonte da verdade para os dois subagentes)

### Board (`GET /hotel-portal/:clientId/whatsapp/funnel`)

```ts
// por lead (campos NOVOS marcados)
{
  numeroContato: string;
  nome: string | null;
  acomodacaoInteresse: string | null;
  datasInteresse: string | null;
  tipoPublico: BotContactAudience | null;
  statusBot: 'ATIVO' | 'PAUSADO';              // NOVO
  aguardandoDesde: string | null;               // NOVO — ISO de bot_contacts.last_message_at
  valorCotacao: number | null;                  // NOVO — reais; valor_total do hold mais recente do contato
  etiqueta: 'RECUPERAR' | null;                 // NOVO — hold mais recente está EXPIRADO
}
// por coluna
{
  stage: FunnelStage;
  count: number;
  valorAberto: number;        // NOVO — soma valor_total dos holds ATIVO+EXPIRADO (mais recente por contato) dos leads da coluna
  valorConfirmado: number;    // NOVO — soma valor_total das reservas vendidas origem BOT_WHATSAPP dos leads da coluna
  leads: Lead[];
}
```

### Métricas do funil (`GET /hotel-portal/:clientId/whatsapp/funnel/metrics`) — bloco novo

```ts
handoff: {
  total: number;                          // eventos motivo LIKE 'HANDOFF:%' no período
  taxaHandover: number;                   // total / conversasIniciadas (2 casas)
  motivos: { motivo: string; count: number }[];   // motivo sem o prefixo 'HANDOFF:'
  tempoMedioComBotSegundos: number | null;        // média(handoff.ocorrido_em - bot_contacts.created_at)
}
```

### Métricas do motor (`home.motor`) — campo novo

```ts
recuperadas: { quantidade: number; valor: number }  // reservas vendidas BOT_WHATSAPP no período cujo telefone teve hold EXPIRADO criado ANTES da reserva
```

### Resumo de handoff (`GET /ingest/bot-events/handoff-summary/:numeroContato`, guard `BotEventKeyGuard`)

```ts
{
  numeroContato: string;
  nome: string | null;
  estagio: FunnelStage;
  tipoPublico: BotContactAudience | null;
  motivoPausa: string | null;
  acomodacaoInteresse: string | null;
  datasInteresse: string | null;
  holdAtivo: { holdId: string; valorTotal: number; valorAntecipado: number; checkin: string; checkout: string; expiresAt: string } | null;
  ultimasMensagens: { role: string; contentPreview: string | null; ocorridoEm: string }[];  // 5 mais recentes, ordem cronológica
  resumoTexto: string;   // pronto para virar nota privada no Chatwoot
}
```

---

# GRUPO BACKEND (`backend_reserve`)

### Task 1: `HoldService` — hold criado move para FECHAMENTO_INICIADO, hold expirado volta para OFERTA_FEITA

**Files:**
- Modify: `src/modules/reserve-motor/application/services/hold.service.ts`
- Test: `src/modules/reserve-motor/application/services/hold.service.spec.ts`

**Interfaces:**
- Consumes: `prisma.botLead.findUnique/upsert`, `prisma.funnelEvent.create` (já usados em `syncBotAfterConfirm`).
- Produces: eventos em `funil_eventos` com `motivo: 'HOLD_CRIADO'` (para `FECHAMENTO_INICIADO`) e `motivo: 'HOLD_EXPIRADO'` (para `OFERTA_FEITA`), `autor_tipo: 'bot'`. Task 2 lê holds para etiqueta `RECUPERAR`; não depende destes eventos.

- [ ] **Step 1: Escrever os testes que falham**

Em `hold.service.spec.ts`, alterar `buildDeps` para ter `botLead`/`funnelEvent` e `$transaction` que aceita array (como já faz `buildConfirmDeps` no teste de confirm):

```ts
function buildDeps(freeUnits: string[], currentStage: string | null = 'OFERTA_FEITA') {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    motorHold: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'h_1', ...data })),
    },
  };
  const prisma = {
    // create/confirm usam callback; o sync do funil usa ARRAY de ops
    $transaction: jest
      .fn()
      .mockImplementation((arg) => (Array.isArray(arg) ? Promise.all(arg) : arg(tx))),
    motorHold: {
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'h_1', status: 'CANCELADO' }),
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    botLead: {
      findUnique: jest.fn().mockResolvedValue(currentStage ? { current_stage: currentStage } : null),
      upsert: jest.fn().mockResolvedValue({}),
    },
    funnelEvent: { create: jest.fn().mockResolvedValue({ id: 'evt_1' }) },
  };
  const availability = {
    quote: jest.fn().mockResolvedValue({ valor_total: 678, min_stay: 2 }),
    freeUnitIds: jest.fn().mockResolvedValue(freeUnits),
  };
  const events = { dispatch: jest.fn().mockResolvedValue(undefined) };
  return { prisma, tx, availability, events };
}
```

Adicionar ao final de `describe('HoldService.create', ...)`:

```ts
  it('hold criado move o funil do contato para FECHAMENTO_INICIADO (autor bot, motivo HOLD_CRIADO)', async () => {
    const { prisma, availability, events } = buildDeps(['u_1'], 'OFERTA_FEITA');
    const service = new HoldService(prisma as any, availability as any, events as any);
    await service.create(tenantId, dto as any);
    await new Promise((resolve) => setImmediate(resolve));
    expect(prisma.funnelEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          numero_contato: dto.contato_whatsapp,
          de_estagio: 'OFERTA_FEITA',
          para_estagio: 'FECHAMENTO_INICIADO',
          autor_tipo: 'bot',
          motivo: 'HOLD_CRIADO',
        }),
      }),
    );
    expect(prisma.botLead.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { current_stage: 'FECHAMENTO_INICIADO' } }),
    );
  });

  it.each(['FECHAMENTO_INICIADO', 'COMPROVANTE_RECEBIDO', 'RESERVA_CONFIRMADA', 'PERDIDO'])(
    'hold criado NAO rebaixa lead ja em %s',
    async (stage) => {
      const { prisma, availability, events } = buildDeps(['u_1'], stage);
      const service = new HoldService(prisma as any, availability as any, events as any);
      await service.create(tenantId, dto as any);
      await new Promise((resolve) => setImmediate(resolve));
      expect(prisma.funnelEvent.create).not.toHaveBeenCalled();
    },
  );

  it('falha no sync do funil nao derruba a criacao do hold', async () => {
    const { prisma, availability, events } = buildDeps(['u_1']);
    prisma.botLead.findUnique.mockRejectedValue(new Error('db fora'));
    const service = new HoldService(prisma as any, availability as any, events as any);
    const result = await service.create(tenantId, dto as any);
    expect(result.hold_id).toBe('h_1');
  });
```

Adicionar ao `describe('HoldService.expireDue', ...)`:

```ts
  it('hold expirado com lead em FECHAMENTO_INICIADO volta para OFERTA_FEITA com motivo HOLD_EXPIRADO', async () => {
    const { prisma, availability, events } = buildDeps([], 'FECHAMENTO_INICIADO');
    prisma.motorHold.findMany.mockResolvedValue([
      { id: 'h_9', tenant_id: tenantId, contato_whatsapp: '5535999990000' },
    ]);
    prisma.motorHold.updateMany.mockResolvedValue({ count: 1 });
    const service = new HoldService(prisma as any, availability as any, events as any);
    await service.expireDue();
    expect(prisma.funnelEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          de_estagio: 'FECHAMENTO_INICIADO',
          para_estagio: 'OFERTA_FEITA',
          motivo: 'HOLD_EXPIRADO',
        }),
      }),
    );
  });

  it('hold expirado com lead em outro estagio (ex.: RESERVA_CONFIRMADA por pagamento tardio) nao mexe no funil', async () => {
    const { prisma, availability, events } = buildDeps([], 'RESERVA_CONFIRMADA');
    prisma.motorHold.findMany.mockResolvedValue([
      { id: 'h_9', tenant_id: tenantId, contato_whatsapp: '5535999990000' },
    ]);
    prisma.motorHold.updateMany.mockResolvedValue({ count: 1 });
    const service = new HoldService(prisma as any, availability as any, events as any);
    await service.expireDue();
    expect(prisma.funnelEvent.create).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx jest src/modules/reserve-motor/application/services/hold.service.spec.ts`
Expected: os 5 testes novos FALHAM (`funnelEvent.create` não chamado / chamado com motivo errado). Os antigos continuam passando.

- [ ] **Step 3: Implementar o helper genérico e usá-lo nos 3 pontos**

Em `hold.service.ts`, adicionar logo após o construtor:

```ts
  /**
   * Estagios onde um hold novo NAO deve rebaixar o lead: ja esta fechando,
   * ja pagou, ou foi dado como perdido pelo humano (o humano manda).
   */
  private static readonly NAO_REBAIXAR_EM_HOLD: string[] = [
    'FECHAMENTO_INICIADO',
    'COMPROVANTE_RECEBIDO',
    'RESERVA_CONFIRMADA',
    'PERDIDO',
  ];

  /**
   * Move o lead do contato no funil do bot direto no banco (autor bot), no
   * mesmo log append-only que o painel le. `quando` decide, a partir do
   * estagio atual, se o movimento se aplica — o motor so empurra o funil
   * quando o evento e informacao nova. Melhor esforco: nunca lanca.
   */
  private async syncFunnelStage(
    tenantId: string,
    numeroContato: string,
    paraEstagio: string,
    motivo: string,
    quando: (estagioAtual: string) => boolean,
  ): Promise<void> {
    try {
      const lead = await this.prisma.botLead.findUnique({
        where: { tenant_id_numero_contato: { tenant_id: tenantId, numero_contato: numeroContato } },
      });
      const atual = lead?.current_stage ?? 'CONTATO_INICIADO';
      if (atual === paraEstagio || !quando(atual)) return;
      await this.prisma.$transaction([
        this.prisma.funnelEvent.create({
          data: {
            tenant_id: tenantId,
            numero_contato: numeroContato,
            de_estagio: atual as any,
            para_estagio: paraEstagio as any,
            autor_tipo: 'bot',
            motivo,
            ocorrido_em: new Date(),
          },
        }),
        this.prisma.botLead.upsert({
          where: { tenant_id_numero_contato: { tenant_id: tenantId, numero_contato: numeroContato } },
          create: { tenant_id: tenantId, numero_contato: numeroContato, current_stage: paraEstagio as any },
          update: { current_stage: paraEstagio as any },
        }),
      ]);
    } catch (error) {
      this.logger.warn(`sync do funil (${motivo}) falhou: ${String((error as Error)?.message)}`);
    }
  }
```

Em `create`, logo após `void this.channelPush?.enqueue(...)` e antes do `return`:

```ts
    // Hold criado = fechamento iniciado no funil do painel, sem esperar o N8N.
    void this.syncFunnelStage(
      tenantId,
      dto.contato_whatsapp,
      'FECHAMENTO_INICIADO',
      'HOLD_CRIADO',
      (atual) => !HoldService.NAO_REBAIXAR_EM_HOLD.includes(atual),
    );
```

Em `expireDue`, dentro do `for (const hold of due)`, antes do `await this.botEvents.dispatch(...)`:

```ts
      // Hold expirado = oferta continua de pe, mas o fechamento caiu: volta
      // para OFERTA_FEITA com etiqueta de recuperacao (so se ainda estava
      // em FECHAMENTO_INICIADO — pagamento tardio ja pode ter confirmado).
      await this.syncFunnelStage(
        hold.tenant_id,
        hold.contato_whatsapp,
        'OFERTA_FEITA',
        'HOLD_EXPIRADO',
        (atual) => atual === 'FECHAMENTO_INICIADO',
      );
```

Substituir o primeiro bloco `try { ... } catch` de `syncBotAfterConfirm` (o que faz `findUnique` + transaction) por:

```ts
    await this.syncFunnelStage(
      tenantId,
      hold.contato_whatsapp,
      'RESERVA_CONFIRMADA',
      'pagamento confirmado no motor',
      () => true,
    );
```

(mantém o segundo `try` que dispara `reserva.confirmada`).

- [ ] **Step 4: Rodar para ver passar**

Run: `npx jest src/modules/reserve-motor/application/services/hold.service.spec.ts`
Expected: PASS em todos (inclusive os 2 testes antigos de confirm que checam `motivo`/`de_estagio` — o helper preserva `de_estagio` e `motivo`).

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-motor/application/services/hold.service.ts src/modules/reserve-motor/application/services/hold.service.spec.ts
git commit -m "feat(motor,funil): hold criado e expirado movem o card do funil sozinhos"
```

---

### Task 2: `FunnelMetricsService.getBoard` — R$ por coluna, valor/etiqueta/espera por card

**Files:**
- Modify: `src/modules/reserve-client-portal/application/services/funnel-metrics.service.ts:52-93`
- Test: `src/modules/reserve-client-portal/application/services/funnel-metrics.service.spec.ts`

**Interfaces:**
- Produces: contrato "Board" da seção *Contratos compartilhados* (campos `statusBot`, `aguardandoDesde`, `valorCotacao`, `etiqueta`, `valorAberto`, `valorConfirmado`). Frontend Task 7 depende disso.

- [ ] **Step 1: Escrever o teste que falha**

Substituir o `describe('FunnelMetricsService.getBoard', ...)` existente por:

```ts
describe('FunnelMetricsService.getBoard', () => {
  function buildPrisma() {
    return {
      hotelClient: { findUnique: jest.fn().mockResolvedValue({ tenant_id: 'tenant_1' }) },
      botLead: {
        groupBy: jest.fn().mockResolvedValue([{ current_stage: 'OFERTA_FEITA', _count: { _all: 2 } }]),
        // 1a chamada: todos os leads (so numero + estagio) para os totais;
        // demais: leads da coluna (cap 50)
        findMany: jest.fn().mockImplementation(({ where }: any) =>
          Promise.resolve(
            where.current_stage === undefined
              ? [
                  { numero_contato: '+5511999', current_stage: 'OFERTA_FEITA' },
                  { numero_contato: '+5511888', current_stage: 'OFERTA_FEITA' },
                ]
              : where.current_stage === 'OFERTA_FEITA'
                ? [
                    { numero_contato: '+5511999', acomodacao_interesse: null, datas_interesse: { checkin: '2026-09-12', checkout: '2026-09-15' } },
                    { numero_contato: '+5511888', acomodacao_interesse: 'Chalé', datas_interesse: null },
                  ]
                : [],
          ),
        ),
      },
      botContact: {
        findMany: jest.fn().mockResolvedValue([
          { numero_contato: '+5511999', nome: 'Ana', tipo_publico: null, status_bot: 'PAUSADO', last_message_at: new Date('2026-08-20T10:00:00Z') },
          { numero_contato: '+5511888', nome: null, tipo_publico: 'LEAD', status_bot: 'ATIVO', last_message_at: null },
        ]),
      },
      motorHold: {
        // ordenados por created_at desc: o primeiro de cada contato e o "mais recente"
        findMany: jest.fn().mockResolvedValue([
          { contato_whatsapp: '+5511999', status: 'EXPIRADO', valor_total: '500.00' },
          { contato_whatsapp: '+5511999', status: 'CANCELADO', valor_total: '100.00' },
          { contato_whatsapp: '+5511888', status: 'ATIVO', valor_total: '320.50' },
        ]),
      },
      motorReservation: {
        findMany: jest.fn().mockResolvedValue([
          { hospede_telefone: '+5511888', valor_total: '320.50' },
          { hospede_telefone: '+5500000', valor_total: '999.00' }, // contato sem lead: ignorado
        ]),
      },
    } as any;
  }

  it('normaliza datasInteresse para string | null', async () => {
    const service = new FunnelMetricsService(buildPrisma(), {} as any);
    const board = await service.getBoard('client_1');
    const coluna = board.find((c) => c.stage === 'OFERTA_FEITA')!;
    expect(coluna.leads[0].datasInteresse).toBe('12/09/2026 – 15/09/2026');
  });

  it('enriquece cada card com status do bot, espera, valor da cotacao e etiqueta de recuperacao', async () => {
    const service = new FunnelMetricsService(buildPrisma(), {} as any);
    const board = await service.getBoard('client_1');
    const coluna = board.find((c) => c.stage === 'OFERTA_FEITA')!;
    expect(coluna.leads[0]).toMatchObject({
      numeroContato: '+5511999',
      nome: 'Ana',
      statusBot: 'PAUSADO',
      aguardandoDesde: '2026-08-20T10:00:00.000Z',
      valorCotacao: 500,
      etiqueta: 'RECUPERAR',
    });
    expect(coluna.leads[1]).toMatchObject({
      numeroContato: '+5511888',
      statusBot: 'ATIVO',
      aguardandoDesde: null,
      valorCotacao: 320.5,
      etiqueta: null,
    });
  });

  it('soma R$ aberto (holds ATIVO+EXPIRADO) e confirmado (reservas) por coluna', async () => {
    const service = new FunnelMetricsService(buildPrisma(), {} as any);
    const board = await service.getBoard('client_1');
    const coluna = board.find((c) => c.stage === 'OFERTA_FEITA')!;
    expect(coluna.valorAberto).toBe(820.5);
    expect(coluna.valorConfirmado).toBe(320.5);
    const vazia = board.find((c) => c.stage === 'PERDIDO')!;
    expect(vazia).toMatchObject({ count: 0, valorAberto: 0, valorConfirmado: 0 });
  });

  it('holds sao buscados do mais novo para o mais velho e so nos status que contam', () => {
    const prisma = buildPrisma();
    const service = new FunnelMetricsService(prisma, {} as any);
    return service.getBoard('client_1').then(() => {
      expect(prisma.motorHold.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { created_at: 'desc' } }),
      );
      expect(prisma.motorReservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ origem: 'BOT_WHATSAPP' }),
        }),
      );
    });
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx jest src/modules/reserve-client-portal/application/services/funnel-metrics.service.spec.ts`
Expected: 3 testes novos FALHAM (campos `undefined`).

- [ ] **Step 3: Implementar**

Substituir o método `getBoard` inteiro por:

```ts
  /** Reservas que contam como venda — mesmo conjunto do MotorMetricsService. */
  private static readonly STATUS_VENDA = ['CONFIRMADA', 'CHECKIN_FEITO', 'CONCLUIDA'] as const;

  async getBoard(clientId: string) {
    const tenantId = await this.resolveTenantId(clientId);
    if (!tenantId) return [];

    const [counts, todosLeads, holds, reservas] = await Promise.all([
      this.prisma.botLead.groupBy({
        by: ['current_stage'],
        where: { tenant_id: tenantId },
        _count: { _all: true },
      }),
      // Totais de R$ por coluna precisam de TODOS os leads da coluna, nao
      // so dos 50 exibidos — por isso uma leitura leve (numero + estagio).
      this.prisma.botLead.findMany({
        where: { tenant_id: tenantId },
        select: { numero_contato: true, current_stage: true },
      }),
      // Do mais novo para o mais velho: o primeiro de cada contato e a
      // cotacao vigente. CANCELADO e desistencia explicita: nao conta.
      this.prisma.motorHold.findMany({
        where: { tenant_id: tenantId, status: { in: ['ATIVO', 'EXPIRADO', 'CONVERTIDO'] } },
        select: { contato_whatsapp: true, status: true, valor_total: true },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.motorReservation.findMany({
        where: {
          tenant_id: tenantId,
          origem: 'BOT_WHATSAPP',
          status: { in: [...FunnelMetricsService.STATUS_VENDA] as any },
        },
        select: { hospede_telefone: true, valor_total: true },
      }),
    ]);
    const countByStage = new Map(counts.map((c) => [c.current_stage, c._count._all]));
    const stageByNumero = new Map(todosLeads.map((l) => [l.numero_contato, l.current_stage]));

    // Hold vigente por contato (primeiro na ordem desc).
    const holdVigente = new Map<string, { status: string; valor: number }>();
    for (const h of holds) {
      if (!holdVigente.has(h.contato_whatsapp)) {
        holdVigente.set(h.contato_whatsapp, { status: h.status, valor: Number(h.valor_total) });
      }
    }

    const valorAbertoByStage = new Map<string, number>();
    for (const [numero, hold] of holdVigente) {
      const stage = stageByNumero.get(numero);
      if (!stage || (hold.status !== 'ATIVO' && hold.status !== 'EXPIRADO')) continue;
      valorAbertoByStage.set(stage, (valorAbertoByStage.get(stage) ?? 0) + hold.valor);
    }
    const valorConfirmadoByStage = new Map<string, number>();
    for (const r of reservas) {
      const stage = r.hospede_telefone ? stageByNumero.get(r.hospede_telefone) : undefined;
      if (!stage) continue;
      valorConfirmadoByStage.set(stage, (valorConfirmadoByStage.get(stage) ?? 0) + Number(r.valor_total));
    }
    const arredonda = (v: number) => Math.round(v * 100) / 100;

    const board = await Promise.all(
      ALL_STAGES.map(async (stage) => {
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
                numero_contato: true,
                nome: true,
                tipo_publico: true,
                status_bot: true,
                last_message_at: true,
              },
            })
          : [];
        const contatoByNumero = new Map(contacts.map((c) => [c.numero_contato, c]));

        return {
          stage,
          count: countByStage.get(stage) ?? 0,
          valorAberto: arredonda(valorAbertoByStage.get(stage) ?? 0),
          valorConfirmado: arredonda(valorConfirmadoByStage.get(stage) ?? 0),
          leads: leads.map((l) => {
            const contato = contatoByNumero.get(l.numero_contato);
            const hold = holdVigente.get(l.numero_contato);
            return {
              numeroContato: l.numero_contato,
              nome: contato?.nome ?? null,
              tipoPublico: contato?.tipo_publico ?? null,
              acomodacaoInteresse: l.acomodacao_interesse,
              datasInteresse: formatDatasInteresse(l.datas_interesse),
              statusBot: contato?.status_bot ?? 'ATIVO',
              aguardandoDesde: contato?.last_message_at?.toISOString() ?? null,
              valorCotacao: hold ? hold.valor : null,
              etiqueta: hold?.status === 'EXPIRADO' ? ('RECUPERAR' as const) : null,
            };
          }),
        };
      }),
    );

    return board;
  }
```

- [ ] **Step 4: Rodar para ver passar**

Run: `npx jest src/modules/reserve-client-portal/application/services/funnel-metrics.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-client-portal/application/services/funnel-metrics.service.ts src/modules/reserve-client-portal/application/services/funnel-metrics.service.spec.ts
git commit -m "feat(funil): board com R\$ por coluna, valor da cotacao, espera e etiqueta de recuperacao no card"
```

---

### Task 3: `bot.pausado` grava motivo de escalação no log do funil (`HANDOFF:<motivo>`)

**Files:**
- Modify: `src/modules/reserve-client-portal/application/services/bot-event-processor.service.ts:89-90` e `:275-288`
- Test: `src/modules/reserve-client-portal/application/services/bot-event-processor.service.spec.ts`

**Interfaces:**
- Produces: `funil_eventos` com `de_estagio: null`, `para_estagio: <atual>`, `autor_tipo: 'bot'`, `motivo: 'HANDOFF:' + (payload.motivo ?? 'nao_informado')`. Task 4 agrega por esse prefixo.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar novo `describe` no fim do spec (dentro do `describe` principal, para reaproveitar `prisma`/`service`/`event`):

```ts
  describe('bot.pausado (handoff)', () => {
    it('pausa o contato e grava anotacao HANDOFF:<motivo> no log do funil', async () => {
      currentStageIs(EFunnelStage.OFERTA_FEITA);
      await service.process(
        tenantId,
        event('bot.pausado', { contato: numeroContato, motivo: 'pediu_humano' }),
      );
      expect(prisma.botContact.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status_bot: 'PAUSADO', motivo_pausa: 'pediu_humano' },
        }),
      );
      expect(prisma.funnelEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          numero_contato: numeroContato,
          de_estagio: null,
          para_estagio: EFunnelStage.OFERTA_FEITA,
          autor_tipo: 'bot',
          motivo: 'HANDOFF:pediu_humano',
          ocorrido_em: new Date('2026-08-07T12:00:00.000Z'),
        }),
      });
    });

    it('sem motivo no payload grava HANDOFF:nao_informado', async () => {
      await service.process(tenantId, event('bot.pausado', { contato: numeroContato }));
      expect(eventData().motivo).toBe('HANDOFF:nao_informado');
      expect(eventData().para_estagio).toBe(EFunnelStage.CONTATO_INICIADO);
    });

    it('bot.reativado nao gera anotacao (a retomada humana ja tem o proprio evento)', async () => {
      await service.process(tenantId, event('bot.reativado', { contato: numeroContato }));
      expect(prisma.funnelEvent.create).not.toHaveBeenCalled();
    });
  });
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx jest src/modules/reserve-client-portal/application/services/bot-event-processor.service.spec.ts`
Expected: os 2 primeiros FALHAM (`funnelEvent.create` não chamado); o terceiro passa.

- [ ] **Step 3: Implementar**

No `switch`, trocar o case:

```ts
      case 'bot.pausado':
        return this.handleBotPause(tenantId, payload, true, occurredAt);
      case 'bot.reativado':
        return this.handleBotPause(tenantId, payload, false, occurredAt);
```

Substituir `handleBotPause` por:

```ts
  /** Prefixo do motivo de escalacao no log do funil; as metricas agregam por ele. */
  static readonly HANDOFF_MOTIVO_PREFIX = 'HANDOFF:';

  /**
   * Pausa/retoma o contato. Na PAUSA tambem grava uma anotacao no log do
   * funil (de_estagio: null, mesma convencao de handleProntoParaFechar)
   * com o motivo da escalacao — e o "exit reason" do handoff, que o painel
   * agrega (taxa de handover, motivos, tempo-com-bot). Reativar nao gera
   * anotacao: a retomada humana pelo painel ja grava RETOMADA_HUMANA.
   */
  private async handleBotPause(
    tenantId: string,
    payload: Record<string, unknown>,
    paused: boolean,
    occurredAt: Date,
  ): Promise<void> {
    const numeroContato = String(payload.contato ?? '');
    const motivo = typeof payload.motivo === 'string' && payload.motivo.trim() ? payload.motivo.trim() : null;
    await this.prisma.botContact.updateMany({
      where: { tenant_id: tenantId, numero_contato: numeroContato },
      data: {
        status_bot: paused ? EBotContactStatus.PAUSADO : EBotContactStatus.ATIVO,
        motivo_pausa: paused ? motivo : null,
      },
    });
    if (!paused) return;

    const currentLead = await this.prisma.botLead.findUnique({
      where: { tenant_id_numero_contato: { tenant_id: tenantId, numero_contato: numeroContato } },
    });
    const currentStage = currentLead?.current_stage ?? FUNNEL_ENTRY_STAGE;
    await this.prisma.funnelEvent.create({
      data: {
        tenant_id: tenantId,
        numero_contato: numeroContato,
        de_estagio: null,
        para_estagio: currentStage,
        autor_tipo: 'bot',
        // VarChar(255): motivo longo do bot e truncado para caber.
        motivo: `${BotEventProcessorService.HANDOFF_MOTIVO_PREFIX}${motivo ?? 'nao_informado'}`.slice(0, 255),
        ocorrido_em: occurredAt,
      },
    });
  }
```

- [ ] **Step 4: Rodar para ver passar**

Run: `npx jest src/modules/reserve-client-portal/application/services/bot-event-processor.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-client-portal/application/services/bot-event-processor.service.ts src/modules/reserve-client-portal/application/services/bot-event-processor.service.spec.ts
git commit -m "feat(funil): motivo de escalacao do bot logado como anotacao HANDOFF no funil"
```

---

### Task 4: Métricas do handoff (`handoff` em `getMetrics`)

**Files:**
- Modify: `src/modules/reserve-client-portal/application/services/funnel-metrics.service.ts` (`getMetrics`, `emptyMetrics`, novo método privado)
- Test: `src/modules/reserve-client-portal/application/services/funnel-metrics.service.spec.ts`

**Interfaces:**
- Consumes: eventos `HANDOFF:*` da Task 3.
- Produces: bloco `handoff` do contrato. Frontend Task 8 depende.

- [ ] **Step 1: Escrever o teste que falha**

Adicionar no spec:

```ts
describe('FunnelMetricsService.getMetrics — handoff', () => {
  const from = new Date('2026-08-01T00:00:00Z');
  const to = new Date('2026-08-31T23:59:59Z');

  function buildPrisma() {
    const zero = jest.fn().mockResolvedValue(0);
    const vazio = jest.fn().mockResolvedValue([]);
    return {
      hotelClient: { findUnique: jest.fn().mockResolvedValue({ tenant_id: 'tenant_1' }) },
      botContact: {
        // 1a: conversas atual (4); 2a: anterior; 3a: pausados
        count: jest.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(2).mockResolvedValue(1),
        groupBy: vazio,
        findMany: jest.fn().mockResolvedValue([
          { numero_contato: 'a', created_at: new Date('2026-08-10T10:00:00Z') },
          { numero_contato: 'b', created_at: new Date('2026-08-11T10:00:00Z') },
        ]),
      },
      botMessage: { count: zero },
      botLead: { groupBy: vazio },
      funnelEvent: {
        findMany: jest.fn().mockImplementation(({ where }: any) =>
          Promise.resolve(
            where?.motivo?.startsWith === 'HANDOFF:'
              ? [
                  { numero_contato: 'a', motivo: 'HANDOFF:pediu_humano', ocorrido_em: new Date('2026-08-10T10:10:00Z') },
                  { numero_contato: 'b', motivo: 'HANDOFF:pediu_humano', ocorrido_em: new Date('2026-08-11T10:30:00Z') },
                  { numero_contato: 'b', motivo: 'HANDOFF:nao_soube', ocorrido_em: new Date('2026-08-12T10:00:00Z') },
                ]
              : [],
          ),
        ),
        count: zero,
      },
      followupAttempt: { groupBy: vazio },
      $queryRaw: vazio,
    } as any;
  }
  const periodComparison = {
    previousPeriod: () => ({ prevFrom: from, prevTo: to }),
    metric: (v: number) => ({ value: v, source: 'auto' }),
    ratio: (a: number, b: number) => (b ? a / b : 0),
    round2: (v: number) => Math.round(v * 100) / 100,
  } as any;

  it('agrega total, taxa, motivos e tempo medio com o bot', async () => {
    const service = new FunnelMetricsService(buildPrisma(), periodComparison);
    const m = await service.getMetrics('client_1', from, to);
    expect(m.handoff.total).toBe(3);
    expect(m.handoff.taxaHandover).toBe(0.75); // 3 / 4 conversas
    expect(m.handoff.motivos).toEqual([
      { motivo: 'pediu_humano', count: 2 },
      { motivo: 'nao_soube', count: 1 },
    ]);
    // a: 10min; b: 30min (primeiro handoff de b) -> media 20min = 1200s
    expect(m.handoff.tempoMedioComBotSegundos).toBe(1200);
  });

  it('sem handoffs devolve zeros e null', async () => {
    const prisma = buildPrisma();
    prisma.funnelEvent.findMany = jest.fn().mockResolvedValue([]);
    const service = new FunnelMetricsService(prisma, periodComparison);
    const m = await service.getMetrics('client_1', from, to);
    expect(m.handoff).toEqual({ total: 0, taxaHandover: 0, motivos: [], tempoMedioComBotSegundos: null });
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx jest src/modules/reserve-client-portal/application/services/funnel-metrics.service.spec.ts`
Expected: FALHA (`m.handoff` undefined). Se algum mock faltar para o resto do `getMetrics` (ex.: `$queryRaw` em `avgFirstResponseSeconds`/`avgTimePerStage`/`conversionByStage`), adicionar ao `buildPrisma` o que o erro pedir devolvendo `[]`/`0` — o teste só afirma sobre `handoff`.

- [ ] **Step 3: Implementar**

Em `getMetrics`, adicionar `handoff` ao destructuring do `Promise.all` (último item) e à lista de promessas:

```ts
      this.handoffMetrics(tenantId, from, to),
```

e no objeto retornado:

```ts
      handoff: {
        ...handoff,
        taxaHandover: this.periodComparison.round2(this.periodComparison.ratio(handoff.total, conversasAtual)),
      },
```

Novo método privado (abaixo de `avgFirstResponseSeconds`):

```ts
  /**
   * Ciclo bot -> humano (benchmark P0-4c). Cada anotacao HANDOFF:<motivo> e
   * uma escalacao; "tempo com o bot" = do inicio do contato ate a PRIMEIRA
   * escalacao daquele numero (segunda escalacao do mesmo contato conta no
   * total e nos motivos, mas nao distorce o tempo).
   */
  private async handoffMetrics(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<{ total: number; motivos: { motivo: string; count: number }[]; tempoMedioComBotSegundos: number | null }> {
    const eventos = await this.prisma.funnelEvent.findMany({
      where: { tenant_id: tenantId, motivo: { startsWith: 'HANDOFF:' }, ocorrido_em: { gte: from, lte: to } },
      select: { numero_contato: true, motivo: true, ocorrido_em: true },
      orderBy: { ocorrido_em: 'asc' },
    });
    if (eventos.length === 0) return { total: 0, motivos: [], tempoMedioComBotSegundos: null };

    const porMotivo = new Map<string, number>();
    const primeiroHandoff = new Map<string, Date>();
    for (const e of eventos) {
      const motivo = (e.motivo ?? '').slice('HANDOFF:'.length) || 'nao_informado';
      porMotivo.set(motivo, (porMotivo.get(motivo) ?? 0) + 1);
      if (!primeiroHandoff.has(e.numero_contato)) primeiroHandoff.set(e.numero_contato, e.ocorrido_em);
    }

    const contatos = await this.prisma.botContact.findMany({
      where: { tenant_id: tenantId, numero_contato: { in: [...primeiroHandoff.keys()] } },
      select: { numero_contato: true, created_at: true },
    });
    const duracoes: number[] = [];
    for (const c of contatos) {
      const h = primeiroHandoff.get(c.numero_contato);
      if (!h) continue;
      const seg = (h.getTime() - c.created_at.getTime()) / 1000;
      if (seg >= 0) duracoes.push(seg);
    }
    const media = duracoes.length
      ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length)
      : null;

    return {
      total: eventos.length,
      motivos: [...porMotivo.entries()]
        .map(([motivo, count]) => ({ motivo, count }))
        .sort((a, b) => b.count - a.count),
      tempoMedioComBotSegundos: media,
    };
  }
```

Em `emptyMetrics()` adicionar:

```ts
      handoff: { total: 0, taxaHandover: 0, motivos: [], tempoMedioComBotSegundos: null },
```

- [ ] **Step 4: Rodar para ver passar**

Run: `npx jest src/modules/reserve-client-portal/application/services/funnel-metrics.service.spec.ts src/modules/reserve-client-portal/application/services/home.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-client-portal/application/services/funnel-metrics.service.ts src/modules/reserve-client-portal/application/services/funnel-metrics.service.spec.ts
git commit -m "feat(funil): metricas do ciclo de handoff - taxa, motivos e tempo com o bot"
```

---

### Task 5: `MotorMetricsService` — `recuperadas` (relatório de recuperação)

**Files:**
- Modify: `src/modules/reserve-motor/application/services/motor-metrics.service.ts`
- Test: `src/modules/reserve-motor/application/services/motor-metrics.service.spec.ts`

**Interfaces:**
- Produces: `recuperadas: { quantidade, valor }` em `metrics()` (chega ao front via `home.motor`). Frontend Task 9 depende.

- [ ] **Step 1: Escrever o teste que falha**

Atualizar `buildPrisma()` do spec para que reservas tenham telefone/criação e holds tenham contato/criação; `motorHold.findMany` passa a ser chamado 2 vezes (expirados no período; expirados de qualquer data para a recuperação) — usar `mockImplementation` por `where`:

```ts
function buildPrisma() {
  return {
    motorReservation: {
      findMany: jest.fn().mockResolvedValue([
        { valor_total: '600.00', checkin: utcDate('2026-09-05'), checkout: utcDate('2026-09-07'), origem: 'BOT_WHATSAPP', hospede_telefone: '5535999990000', created_at: new Date('2026-09-02T12:00:00Z') },
        { valor_total: '400.00', checkin: utcDate('2026-09-10'), checkout: utcDate('2026-09-11'), origem: 'OTA_BOOKING', hospede_telefone: null, created_at: new Date('2026-09-03T12:00:00Z') },
      ]),
    },
    motorReservationEvent: {
      findMany: jest.fn().mockResolvedValue([
        { reservation: { valor_total: '250.00' } },
      ]),
    },
    motorHold: {
      findMany: jest.fn().mockImplementation(({ where }: any) =>
        Promise.resolve(
          where.updated_at
            ? [{ valor_total: '320.00' }, { valor_total: '180.00' }] // a_recuperar no periodo
            : [
                // expirados de qualquer epoca, para cruzar com reservas vendidas
                { contato_whatsapp: '5535999990000', created_at: new Date('2026-09-01T12:00:00Z') }, // antes da reserva: recuperada
                { contato_whatsapp: '5535999990000', created_at: new Date('2026-09-04T12:00:00Z') }, // depois: nao conta
                { contato_whatsapp: '5535000000000', created_at: new Date('2026-09-01T12:00:00Z') }, // sem reserva
              ],
        ),
      ),
    },
  };
}
```

E no primeiro `it`, após `expect(m.a_recuperar)...`:

```ts
    expect(m.recuperadas).toEqual({ quantidade: 1, valor: 600 });
```

No `it('zero-safe sem dados')`, o `mockResolvedValue([])` em `motorHold.findMany` já cobre; adicionar:

```ts
    expect(m.recuperadas).toEqual({ quantidade: 0, valor: 0 });
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx jest src/modules/reserve-motor/application/services/motor-metrics.service.spec.ts`
Expected: FALHA (`recuperadas` undefined).

- [ ] **Step 3: Implementar**

Em `metrics()`: adicionar `hospede_telefone: true, created_at: true` ao `select` de `vendidas`. Após a consulta de `expirados`, adicionar:

```ts
    // Recuperacao (benchmark P0-1): venda do bot cujo telefone tinha um hold
    // EXPIRADO criado ANTES da reserva = cotacao que caiu e depois fechou.
    const telefonesVendidos = vendidas
      .filter((r) => r.origem === 'BOT_WHATSAPP' && r.hospede_telefone)
      .map((r) => r.hospede_telefone as string);
    const expiradosAntigos = telefonesVendidos.length
      ? await this.prisma.motorHold.findMany({
          where: { tenant_id: tenantId, status: 'EXPIRADO', contato_whatsapp: { in: telefonesVendidos } },
          select: { contato_whatsapp: true, created_at: true },
        })
      : [];
    const primeiroExpiradoPorContato = new Map<string, Date>();
    for (const h of expiradosAntigos) {
      const atual = primeiroExpiradoPorContato.get(h.contato_whatsapp);
      if (!atual || h.created_at < atual) primeiroExpiradoPorContato.set(h.contato_whatsapp, h.created_at);
    }
    const recuperadas = vendidas.filter((r) => {
      if (r.origem !== 'BOT_WHATSAPP' || !r.hospede_telefone) return false;
      const exp = primeiroExpiradoPorContato.get(r.hospede_telefone);
      return !!exp && exp < r.created_at;
    });
```

No objeto retornado, após `a_recuperar`:

```ts
      recuperadas: { quantidade: recuperadas.length, valor: soma(recuperadas.map((r) => r.valor_total)) },
```

- [ ] **Step 4: Rodar para ver passar**

Run: `npx jest src/modules/reserve-motor/application/services/motor-metrics.service.spec.ts src/modules/reserve-client-portal/application/services/home.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/reserve-motor/application/services/motor-metrics.service.ts src/modules/reserve-motor/application/services/motor-metrics.service.spec.ts
git commit -m "feat(motor): metrica de cotacoes recuperadas apos hold expirado"
```

---

### Task 6: Resumo de handoff para nota interna (`GET /ingest/bot-events/handoff-summary/:numeroContato`)

**Files:**
- Create: `src/modules/reserve-client-portal/application/services/handoff-summary.service.ts`
- Create: `src/modules/reserve-client-portal/application/services/handoff-summary.service.spec.ts`
- Modify: `src/modules/reserve-client-portal/infrastructure/controllers/bot-event-ingestion.controller.ts`
- Modify: `src/modules/reserve-client-portal/reserve-client-portal.module.ts` (registrar `HandoffSummaryService` em `providers`)

**Interfaces:**
- Produces: contrato "Resumo de handoff". Consumido pelo N8N (fluxo de escalação posta `resumoTexto` como nota privada no Chatwoot antes de transferir) — pendência já registrada em `retomada-humana-hospede-sync`. Nenhuma task do frontend depende.

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { NotFoundException } from '@nestjs/common';
import { HandoffSummaryService } from './handoff-summary.service';

describe('HandoffSummaryService.build', () => {
  const tenantId = 'tenant_1';
  const numero = '5535999990000';

  function buildPrisma(overrides: Record<string, unknown> = {}) {
    return {
      botContact: {
        findUnique: jest.fn().mockResolvedValue({
          numero_contato: numero, nome: 'Ana', tipo_publico: 'LEAD', motivo_pausa: 'pediu_humano',
        }),
      },
      botLead: {
        findUnique: jest.fn().mockResolvedValue({
          current_stage: 'FECHAMENTO_INICIADO', acomodacao_interesse: 'Chalé Lago',
          datas_interesse: { checkin: '2026-09-12', checkout: '2026-09-15' },
        }),
      },
      motorHold: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'h_1', valor_total: '1200.00', valor_antecipado: '600.00',
          checkin: new Date('2026-09-12T00:00:00Z'), checkout: new Date('2026-09-15T00:00:00Z'),
          expires_at: new Date('2026-08-20T12:00:00Z'),
        }),
      },
      botMessage: {
        findMany: jest.fn().mockResolvedValue([
          { role: 'assistant', content_preview: 'Segue o Pix', ocorrido_em: new Date('2026-08-20T11:05:00Z') },
          { role: 'user', content_preview: 'Quero falar com alguém', ocorrido_em: new Date('2026-08-20T11:00:00Z') },
        ]),
      },
      ...overrides,
    } as any;
  }

  it('monta o resumo estruturado e o texto pronto para nota interna', async () => {
    const service = new HandoffSummaryService(buildPrisma());
    const r = await service.build(tenantId, numero);
    expect(r).toMatchObject({
      numeroContato: numero,
      nome: 'Ana',
      estagio: 'FECHAMENTO_INICIADO',
      tipoPublico: 'LEAD',
      motivoPausa: 'pediu_humano',
      acomodacaoInteresse: 'Chalé Lago',
      datasInteresse: '12/09/2026 – 15/09/2026',
      holdAtivo: { holdId: 'h_1', valorTotal: 1200, valorAntecipado: 600, checkin: '2026-09-12', checkout: '2026-09-15' },
    });
    // cronologico (mais antiga primeiro), embora o banco devolva desc
    expect(r.ultimasMensagens.map((m) => m.contentPreview)).toEqual(['Quero falar com alguém', 'Segue o Pix']);
    expect(r.resumoTexto).toContain('Ana');
    expect(r.resumoTexto).toContain('Fechamento iniciado');
    expect(r.resumoTexto).toContain('pediu_humano');
    expect(r.resumoTexto).toContain('R$ 1.200,00');
    expect(r.resumoTexto).toContain('Quero falar com alguém');
  });

  it('sem lead nem hold devolve nulos e texto ainda util', async () => {
    const service = new HandoffSummaryService(
      buildPrisma({
        botLead: { findUnique: jest.fn().mockResolvedValue(null) },
        motorHold: { findFirst: jest.fn().mockResolvedValue(null) },
        botMessage: { findMany: jest.fn().mockResolvedValue([]) },
      }),
    );
    const r = await service.build(tenantId, numero);
    expect(r.estagio).toBe('CONTATO_INICIADO');
    expect(r.holdAtivo).toBeNull();
    expect(r.datasInteresse).toBeNull();
    expect(r.resumoTexto).toContain('Contato iniciado');
  });

  it('contato inexistente -> 404', async () => {
    const service = new HandoffSummaryService(
      buildPrisma({ botContact: { findUnique: jest.fn().mockResolvedValue(null) } }),
    );
    await expect(service.build(tenantId, numero)).rejects.toBeInstanceOf(NotFoundException);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `npx jest src/modules/reserve-client-portal/application/services/handoff-summary.service.spec.ts`
Expected: FALHA (módulo não existe).

- [ ] **Step 3: Implementar o service**

`handoff-summary.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { FUNNEL_ENTRY_STAGE } from '../../domain/enums/funnel-stage-groups';
import { formatDatasInteresse } from './funnel-metrics.service';

const ULTIMAS_MENSAGENS = 5;

const ESTAGIO_LABEL: Record<string, string> = {
  CONTATO_INICIADO: 'Contato iniciado',
  PUBLICO_IDENTIFICADO: 'Público identificado',
  QUALIFICADO: 'Qualificado',
  ACOMODACAO_APRESENTADA: 'Acomodação apresentada',
  OFERTA_FEITA: 'Oferta feita',
  FECHAMENTO_INICIADO: 'Fechamento iniciado',
  COMPROVANTE_RECEBIDO: 'Comprovante recebido',
  RESERVA_CONFIRMADA: 'Reserva confirmada',
  PERDIDO: 'Perdido',
};

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function dataBr(d: Date): string {
  const [y, m, dd] = isoDate(d).split('-');
  return `${dd}/${m}/${y}`;
}

/**
 * Resumo da conversa para o humano que vai assumir (benchmark P0-4a: "bot
 * posta resumo + contexto como nota interna antes de escalar"). O N8N chama
 * no momento da escalacao e posta `resumoTexto` como nota privada no
 * Chatwoot. Le o que o painel ja sabe — lead, contato, hold vigente e as
 * ultimas mensagens — sem escrever nada.
 */
@Injectable()
export class HandoffSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async build(tenantId: string, numeroContato: string) {
    const contato = await this.prisma.botContact.findUnique({
      where: { tenant_id_numero_contato: { tenant_id: tenantId, numero_contato: numeroContato } },
    });
    if (!contato) throw new NotFoundException('contato nao encontrado.');

    const [lead, hold, mensagensDesc] = await Promise.all([
      this.prisma.botLead.findUnique({
        where: { tenant_id_numero_contato: { tenant_id: tenantId, numero_contato: numeroContato } },
      }),
      this.prisma.motorHold.findFirst({
        where: { tenant_id: tenantId, contato_whatsapp: numeroContato, status: 'ATIVO' },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.botMessage.findMany({
        where: { tenant_id: tenantId, numero_contato: numeroContato },
        orderBy: { ocorrido_em: 'desc' },
        take: ULTIMAS_MENSAGENS,
        select: { role: true, content_preview: true, ocorrido_em: true },
      }),
    ]);

    const estagio = lead?.current_stage ?? FUNNEL_ENTRY_STAGE;
    const datasInteresse = formatDatasInteresse(lead?.datas_interesse);
    const holdAtivo = hold
      ? {
          holdId: hold.id,
          valorTotal: Number(hold.valor_total),
          valorAntecipado: Number(hold.valor_antecipado),
          checkin: isoDate(hold.checkin),
          checkout: isoDate(hold.checkout),
          expiresAt: hold.expires_at.toISOString(),
        }
      : null;
    const ultimasMensagens = [...mensagensDesc].reverse().map((m) => ({
      role: m.role,
      contentPreview: m.content_preview,
      ocorridoEm: m.ocorrido_em.toISOString(),
    }));

    const linhas: string[] = [
      `Resumo do bot — ${contato.nome ?? numeroContato}`,
      `Estágio: ${ESTAGIO_LABEL[estagio] ?? estagio}`,
    ];
    if (contato.tipo_publico) linhas.push(`Público: ${contato.tipo_publico}`);
    if (contato.motivo_pausa) linhas.push(`Motivo da transferência: ${contato.motivo_pausa}`);
    if (lead?.acomodacao_interesse) linhas.push(`Acomodação de interesse: ${lead.acomodacao_interesse}`);
    if (datasInteresse) linhas.push(`Datas: ${datasInteresse}`);
    if (hold) {
      linhas.push(
        `Hold ativo: ${dataBr(hold.checkin)} → ${dataBr(hold.checkout)} · total ${BRL.format(Number(hold.valor_total))} · antecipado ${BRL.format(Number(hold.valor_antecipado))} · expira ${hold.expires_at.toISOString()}`,
      );
    }
    if (ultimasMensagens.length) {
      linhas.push('Últimas mensagens:');
      for (const m of ultimasMensagens) {
        linhas.push(`- ${m.role === 'user' ? 'Hóspede' : 'Bot'}: ${m.contentPreview ?? '(sem prévia)'}`);
      }
    }

    return {
      numeroContato,
      nome: contato.nome,
      estagio,
      tipoPublico: contato.tipo_publico,
      motivoPausa: contato.motivo_pausa,
      acomodacaoInteresse: lead?.acomodacao_interesse ?? null,
      datasInteresse,
      holdAtivo,
      ultimasMensagens,
      resumoTexto: linhas.join('\n'),
    };
  }
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `npx jest src/modules/reserve-client-portal/application/services/handoff-summary.service.spec.ts`
Expected: PASS.

- [ ] **Step 5: Expor no controller e registrar no módulo**

`bot-event-ingestion.controller.ts`:

```ts
import { Body, Controller, Get, Headers, Param, Post, Res, UseGuards } from '@nestjs/common';
// ... imports existentes
import { HandoffSummaryService } from '../../application/services/handoff-summary.service';

// no construtor:
  constructor(
    private readonly ingestionService: BotEventIngestionService,
    private readonly handoffSummary: HandoffSummaryService,
  ) {}

// novo handler, abaixo de ingest():
  /**
   * Resumo para nota interna no handoff (benchmark P0-4a). Mesma chave de
   * bot do ingest: o N8N chama no momento de escalar e posta `resumoTexto`
   * como nota privada no Chatwoot.
   */
  @Get('handoff-summary/:numeroContato')
  async handoffSummaryFor(
    @Headers('x-tenant-id') tenantId: string,
    @Param('numeroContato') numeroContato: string,
  ) {
    return this.handoffSummary.build(tenantId, numeroContato);
  }
```

`reserve-client-portal.module.ts`: importar `HandoffSummaryService` e adicioná-lo a `providers` (logo após `FunnelMetricsService`).

- [ ] **Step 6: Verificar compilação e wiring**

Run: `npx tsc --noEmit -p tsconfig.json && npx jest src/modules/reserve-client-portal/infrastructure/controllers/client-portal-module-access-wiring.spec.ts src/modules/reserve-motor/infrastructure/controllers/motor-wiring.spec.ts`
Expected: sem erros de tipo; wiring specs PASS (o controller já existia fora do gate; só ganhou uma rota).

- [ ] **Step 7: Commit**

```bash
git add src/modules/reserve-client-portal/application/services/handoff-summary.service.ts src/modules/reserve-client-portal/application/services/handoff-summary.service.spec.ts src/modules/reserve-client-portal/infrastructure/controllers/bot-event-ingestion.controller.ts src/modules/reserve-client-portal/reserve-client-portal.module.ts
git commit -m "feat(funil): resumo de handoff para nota interna no chatwoot via n8n"
```

- [ ] **Step 8: Suite completa do backend**

Run: `npx jest`
Expected: todos PASS (ou só falhas pré-existentes não relacionadas — reportar quais).

---

# GRUPO FRONTEND (`frontend_dashboard_reserve`)

### Task 7: Tipos + kanban com totais por coluna, valor, espera, etiqueta e indicador bot/humano no card

**Files:**
- Modify: `src/shared/domain/types/@hotel-painel.ts:184-196`
- Modify: `src/presentation/components/organisms/hotel-portal/funil/funnel-stages.ts` (novos helpers puros)
- Modify: `src/presentation/components/organisms/hotel-portal/funil/funnel-board.tsx`
- Test: `src/presentation/components/organisms/hotel-portal/funil/__tests__/funnel-stages.test.ts`
- Test: `src/presentation/components/organisms/hotel-portal/funil/__tests__/funnel-board.test.tsx`

**Interfaces:**
- Consumes: contrato "Board" (Task 2).
- Produces: `formatBRL(value: number): string`, `waitingLabel(iso: string | null, now?: Date): string | null` em `funnel-stages.ts`; `FunnelBoardLead` e `FunnelBoardColumn` com os campos novos.

- [ ] **Step 1: Atualizar os tipos**

Em `@hotel-painel.ts`:

```ts
export type FunnelLeadTag = 'RECUPERAR';

export interface FunnelBoardLead {
  numeroContato: string;
  nome: string | null;
  acomodacaoInteresse: string | null;
  datasInteresse: string | null;
  tipoPublico: BotContactAudience | null;
  statusBot: BotContactStatus;
  /** ISO da ultima mensagem do contato; base do "aguardando ha X". */
  aguardandoDesde: string | null;
  /** Reais (nao centavos): valor_total do hold mais recente do contato. */
  valorCotacao: number | null;
  etiqueta: FunnelLeadTag | null;
}

export interface FunnelBoardColumn {
  stage: FunnelStage;
  count: number;
  /** Reais: holds ativos/expirados dos leads da coluna. */
  valorAberto: number;
  /** Reais: reservas confirmadas (origem bot) dos leads da coluna. */
  valorConfirmado: number;
  leads: FunnelBoardLead[];
}
```

- [ ] **Step 2: Testes dos helpers puros (falham)**

Adicionar em `funnel-stages.test.ts`:

```ts
import { formatBRL, waitingLabel } from "../funnel-stages";

describe("formatBRL", () => {
  it("formata reais no padrao pt-BR", () => {
    expect(formatBRL(1250)).toBe("R$ 1.250,00");
    expect(formatBRL(320.5)).toBe("R$ 320,50");
  });
});

describe("waitingLabel", () => {
  const now = new Date("2026-08-20T12:00:00Z");
  it("null sem data", () => {
    expect(waitingLabel(null, now)).toBeNull();
  });
  it("minutos, horas e dias", () => {
    expect(waitingLabel("2026-08-20T11:58:00Z", now)).toBe("há 2 min");
    expect(waitingLabel("2026-08-20T09:00:00Z", now)).toBe("há 3 h");
    expect(waitingLabel("2026-08-17T12:00:00Z", now)).toBe("há 3 d");
  });
  it("menos de 1 minuto e 'agora'", () => {
    expect(waitingLabel("2026-08-20T11:59:40Z", now)).toBe("agora");
  });
});
```

(Os asserts de `formatBRL` usam espaço normal; se o `Intl` do Node emitir NBSP (`\u00a0`), normalizar no helper com `.replace(/\u00a0/g, " ")` — o helper abaixo já faz isso.)

Run: `npx vitest run src/presentation/components/organisms/hotel-portal/funil/__tests__/funnel-stages.test.ts`
Expected: FALHA (exports inexistentes).

- [ ] **Step 3: Implementar os helpers**

Em `funnel-stages.ts`, no final:

```ts
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Reais → "R$ 1.250,00". O motor manda reais (Decimal), nao centavos. */
export function formatBRL(value: number): string {
  return BRL.format(value).replace(/\u00a0/g, " ");
}

/** "há 2 min" / "há 3 h" / "há 3 d" desde a ultima mensagem; null sem data. */
export function waitingLabel(iso: string | null, now: Date = new Date()): string | null {
  if (!iso) return null;
  const diffMs = now.getTime() - new Date(iso).getTime();
  if (Number.isNaN(diffMs)) return null;
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

export const TAG_LABELS: Record<FunnelLeadTag, string> = {
  RECUPERAR: "Recuperar",
};
```

e importar `FunnelLeadTag` do tipo. Também atualizar `moveLeadInBoard` — ao mover um lead, levar o `valorCotacao` junto nos totais da coluna (otimista):

```ts
  return board.map((c) => {
    const valor = lead.valorCotacao ?? 0;
    if (c.stage === origem.stage) {
      return {
        ...c,
        count: Math.max(0, c.count - 1),
        valorAberto: Math.max(0, c.valorAberto - valor),
        leads: c.leads.filter((l) => l.numeroContato !== numeroContato),
      };
    }
    if (c.stage === paraEstagio) {
      return { ...c, count: c.count + 1, valorAberto: c.valorAberto + valor, leads: [lead, ...c.leads] };
    }
    return c;
  });
```

Run: `npx vitest run src/presentation/components/organisms/hotel-portal/funil/__tests__/funnel-stages.test.ts`
Expected: PASS (ajustar fixtures existentes de `moveLeadInBoard` no teste para incluir `valorAberto: 0, valorConfirmado: 0` nas colunas e os campos novos nos leads).

- [ ] **Step 4: Testes do board (falham)**

Em `funnel-board.test.tsx`, atualizar a fixture `columns`:

```ts
const lead = {
  numeroContato: "+5511999", nome: "Ana", acomodacaoInteresse: null, datasInteresse: null,
  tipoPublico: "MENSALISTA" as const, statusBot: "PAUSADO" as const,
  aguardandoDesde: new Date(Date.now() - 5 * 60_000).toISOString(),
  valorCotacao: 1250, etiqueta: "RECUPERAR" as const,
};
const columns: FunnelBoardColumn[] = [
  { stage: "CONTATO_INICIADO", count: 1, valorAberto: 1250, valorConfirmado: 0, leads: [lead] },
  ...[
    "PUBLICO_IDENTIFICADO", "QUALIFICADO", "ACOMODACAO_APRESENTADA", "OFERTA_FEITA",
    "FECHAMENTO_INICIADO", "COMPROVANTE_RECEBIDO", "RESERVA_CONFIRMADA", "PERDIDO",
  ].map((stage) => ({ stage: stage as FunnelBoardColumn["stage"], count: 0, valorAberto: 0, valorConfirmado: 0, leads: [] })),
];
```

(e no teste "legado", espalhar `...lead`). Adicionar testes:

```ts
  it("cabecalho da coluna mostra R$ aberto e confirmado quando ha valor", () => {
    const comConfirmado = [
      { ...columns[0], valorConfirmado: 600 },
      ...columns.slice(1),
    ];
    render(<FunnelBoard columns={comConfirmado} canManage onMove={vi.fn()} />);
    const header = screen.getAllByTestId("coluna-header")[0];
    expect(header).toHaveTextContent("R$ 1.250,00 em aberto");
    expect(header).toHaveTextContent("R$ 600,00 confirmado");
    // coluna vazia nao polui com "R$ 0,00"
    expect(screen.getAllByTestId("coluna-header")[1]).not.toHaveTextContent("R$");
  });

  it("card mostra valor da cotacao, espera, etiqueta de recuperacao e quem esta com a bola", () => {
    render(<FunnelBoard columns={columns} canManage onMove={vi.fn()} />);
    expect(screen.getByText("R$ 1.250,00")).toBeInTheDocument();
    expect(screen.getByText("há 5 min")).toBeInTheDocument();
    expect(screen.getByText("Recuperar")).toBeInTheDocument();
    expect(screen.getByLabelText("Com humano")).toBeInTheDocument();
  });

  it("card com bot ativo mostra indicador do bot", () => {
    const ativo = [
      { ...columns[0], leads: [{ ...lead, statusBot: "ATIVO" as const, etiqueta: null }] },
      ...columns.slice(1),
    ];
    render(<FunnelBoard columns={ativo} canManage onMove={vi.fn()} />);
    expect(screen.getByLabelText("Com o bot")).toBeInTheDocument();
    expect(screen.queryByText("Recuperar")).not.toBeInTheDocument();
  });
```

Run: `npx vitest run src/presentation/components/organisms/hotel-portal/funil/__tests__/funnel-board.test.tsx`
Expected: 3 novos FALHAM; antigos PASS.

- [ ] **Step 5: Implementar no `funnel-board.tsx`**

Imports: adicionar `Bot, Clock, UserRound` a `lucide-react`; `TAG_LABELS, formatBRL, waitingLabel` ao import de `funnel-stages`.

Cabeçalho da coluna (dentro de `FunnelColumnView`, substituir o `<div data-testid="coluna-header" ...>` inteiro):

```tsx
      <div
        data-testid="coluna-header"
        className="flex flex-col gap-1 rounded-2xl border border-border bg-default-50 px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${STAGE_ACCENTS[column.stage]}`} />
          {/* Rotulo e contagem num unico no de texto: se o rotulo ficar sozinho
              num no de texto (mesmo com um <span> vizinho) ele bate igual ao
              item "mover para X" do menu do card e o teste acha 2 matches. */}
          <p className="truncate text-sm font-semibold text-foreground">{`${stageLabel(column.stage)} · ${column.count}`}</p>
        </div>
        {/* Dinheiro visivel no topo da coluna (benchmark P0-2 / Asksuite Auto
            Kanban). Zero nao aparece: coluna vazia fica limpa. */}
        {(column.valorAberto > 0 || column.valorConfirmado > 0) && (
          <p className="flex flex-wrap gap-x-2 pl-[18px] text-[11px] text-muted-foreground">
            {column.valorAberto > 0 && <span>{`${formatBRL(column.valorAberto)} em aberto`}</span>}
            {column.valorConfirmado > 0 && (
              <span className="text-success-600">{`${formatBRL(column.valorConfirmado)} confirmado`}</span>
            )}
          </p>
        )}
      </div>
```

No card (`FunnelLeadCard`), substituir o bloco `<div className="min-w-0 space-y-0.5">...</div>` por:

```tsx
        <div className="min-w-0 space-y-0.5">
          <p className="flex items-center gap-1.5 truncate font-semibold">
            {/* Quem esta com a bola (benchmark §5 passo 6): bot ou humano. */}
            {lead.statusBot === "PAUSADO" ? (
              <UserRound aria-label="Com humano" className="h-3.5 w-3.5 shrink-0 text-warning-600" />
            ) : (
              <Bot aria-label="Com o bot" className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
            <span className="truncate">{lead.nome ?? lead.numeroContato}</span>
          </p>
          {lead.acomodacaoInteresse && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <BedDouble aria-hidden className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.acomodacaoInteresse}</span>
            </p>
          )}
          {/* datas_interesse e Json do bot: cache antigo pode trazer objeto em vez de string */}
          {typeof lead.datasInteresse === "string" && lead.datasInteresse && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarRange aria-hidden className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.datasInteresse}</span>
            </p>
          )}
          {(lead.valorCotacao != null || lead.aguardandoDesde) && (
            <p className="flex items-center gap-2 text-xs">
              {lead.valorCotacao != null && (
                <span className="font-semibold text-foreground">{formatBRL(lead.valorCotacao)}</span>
              )}
              {waitingLabel(lead.aguardandoDesde) && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock aria-hidden className="h-3 w-3" />
                  {waitingLabel(lead.aguardandoDesde)}
                </span>
              )}
            </p>
          )}
          <span className="flex flex-wrap gap-1">
            {lead.etiqueta && (
              <span className="mt-1 inline-block rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                {TAG_LABELS[lead.etiqueta]}
              </span>
            )}
            {lead.tipoPublico != null && (
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  AUDIENCE_TONES[lead.tipoPublico] ?? "bg-default-100 text-foreground/70"
                }`}
              >
                {AUDIENCE_LABELS[lead.tipoPublico]}
              </span>
            )}
          </span>
        </div>
```

- [ ] **Step 6: Rodar os testes**

Run: `npx vitest run src/presentation/components/organisms/hotel-portal/funil src/presentation/components/pages/dashboard/hotel/funil src/shared`
Expected: PASS. Se `page.test.tsx` do funil tiver fixture de board sem os campos novos, completar a fixture (`valorAberto: 0, valorConfirmado: 0`, e nos leads `statusBot: "ATIVO", aguardandoDesde: null, valorCotacao: null, etiqueta: null`).

- [ ] **Step 7: Typecheck e commit**

Run: `npx tsc --noEmit`
Expected: sem erros (corrigir qualquer fixture/mocks que instanciem `FunnelBoardLead`/`FunnelBoardColumn` — ex.: testes em `src/shared/hooks/hotel-portal`).

```bash
git add src/shared/domain/types/@hotel-painel.ts src/presentation/components/organisms/hotel-portal/funil
git commit -m "feat(funil): kanban com R\$ por coluna, valor da cotacao, espera, etiqueta recuperar e indicador bot/humano"
```

---

### Task 8: Página do funil — bloco "Handoff bot → humano"

**Files:**
- Modify: `src/shared/domain/types/@hotel-painel.ts:198-215` (`FunnelMetricsResponse`)
- Create: `src/presentation/components/organisms/hotel-portal/painel/attendance/handoff-metrics.tsx`
- Create: `src/presentation/components/organisms/hotel-portal/painel/attendance/__tests__/handoff-metrics.test.tsx`
- Modify: `src/presentation/components/pages/dashboard/hotel/funil/page.tsx`

**Interfaces:**
- Consumes: bloco `handoff` (Task 4).
- Produces: `<HandoffMetrics handoff={metrics.handoff} />`.

- [ ] **Step 1: Tipo**

Em `FunnelMetricsResponse` adicionar:

```ts
  handoff: {
    total: number;
    taxaHandover: number;
    motivos: { motivo: string; count: number }[];
    tempoMedioComBotSegundos: number | null;
  };
```

- [ ] **Step 2: Teste do componente (falha)**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HandoffMetrics } from "../handoff-metrics";

describe("HandoffMetrics", () => {
  it("mostra taxa, tempo com o bot e motivos ranqueados", () => {
    render(
      <HandoffMetrics
        handoff={{
          total: 3,
          taxaHandover: 0.75,
          tempoMedioComBotSegundos: 1200,
          motivos: [
            { motivo: "pediu_humano", count: 2 },
            { motivo: "nao_soube", count: 1 },
          ],
        }}
      />,
    );
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("20 min")).toBeInTheDocument();
    expect(screen.getByText("pediu humano")).toBeInTheDocument();
    expect(screen.getByText("nao soube")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("sem handoff no periodo mostra estado vazio", () => {
    render(<HandoffMetrics handoff={{ total: 0, taxaHandover: 0, tempoMedioComBotSegundos: null, motivos: [] }} />);
    expect(screen.getByText(/nenhuma transferência/i)).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/presentation/components/organisms/hotel-portal/painel/attendance/__tests__/handoff-metrics.test.tsx`
Expected: FALHA.

- [ ] **Step 3: Componente**

`handoff-metrics.tsx`:

```tsx
"use client";

import { MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui";
import { formatNumber, formatPercent } from "@/src/shared/utils/hotel-format";
import type { FunnelMetricsResponse } from "@/src/shared/domain/types/@hotel-painel";

function formatSeconds(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1).replace(".", ",")} h`;
}

/** "pediu_humano" -> "pediu humano": o motivo vem do bot em snake_case. */
function motivoLabel(motivo: string): string {
  return motivo.replace(/_/g, " ");
}

/**
 * Ciclo bot -> humano (benchmark §5 passo 8): quantas conversas o bot
 * escalou, por que, e quanto tempo segurou antes. Leitura pura: os dados vem
 * das anotacoes HANDOFF do log do funil.
 */
export function HandoffMetrics({ handoff }: { handoff: FunnelMetricsResponse["handoff"] }) {
  if (handoff.total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma transferência para humano no período — o bot resolveu tudo sozinho.
      </p>
    );
  }
  const maior = handoff.motivos[0]?.count ?? 1;
  return (
    <div className="grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_1.4fr]">
      <MetricCard label="Transferências" value={formatNumber(handoff.total)} />
      <MetricCard
        label="Taxa de handover"
        value={formatPercent(handoff.taxaHandover * 100)}
        hint="transferências ÷ conversas iniciadas"
      />
      <MetricCard
        label="Tempo com o bot"
        value={formatSeconds(handoff.tempoMedioComBotSegundos)}
        hint="do 1º contato até a transferência"
      />
      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Motivos</p>
        <ul className="space-y-1.5">
          {handoff.motivos.map((m) => (
            <li key={m.motivo} className="text-sm">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate capitalize">{motivoLabel(m.motivo)}</span>
                <span className="text-xs text-muted-foreground">{formatNumber(m.count)}</span>
              </span>
              <span className="mt-0.5 block h-1 rounded-full bg-default-100">
                <span
                  className="block h-1 rounded-full bg-warning"
                  style={{ width: `${Math.max(6, Math.round((m.count / maior) * 100))}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

Run: `npx vitest run src/presentation/components/organisms/hotel-portal/painel/attendance/__tests__/handoff-metrics.test.tsx`
Expected: PASS.

- [ ] **Step 4: Ligar na página do funil**

Em `page.tsx` do funil, importar `HandoffMetrics` e, após a `PainelSection` "Efetividade do follow-up", adicionar:

```tsx
      {metrics && (
        <PainelSection title="Handoff bot → humano">
          <HandoffMetrics handoff={metrics.handoff} />
        </PainelSection>
      )}
```

Atualizar fixtures de `FunnelMetricsResponse` em testes que existirem (`page.test.tsx` do funil, `manager-home.test.tsx`, hooks) com `handoff: { total: 0, taxaHandover: 0, motivos: [], tempoMedioComBotSegundos: null }`.

- [ ] **Step 5: Testes + typecheck + commit**

Run: `npx vitest run src/presentation/components/pages/dashboard/hotel/funil src/presentation/components/organisms/hotel-portal/painel src/presentation/components/organisms/home && npx tsc --noEmit`
Expected: PASS / sem erros.

```bash
git add src/shared/domain/types/@hotel-painel.ts src/presentation/components/organisms/hotel-portal/painel/attendance/handoff-metrics.tsx src/presentation/components/organisms/hotel-portal/painel/attendance/__tests__/handoff-metrics.test.tsx src/presentation/components/pages/dashboard/hotel/funil/page.tsx
git add -u
git commit -m "feat(funil): bloco de metricas do handoff bot para humano na pagina do funil"
```

---

### Task 9: Home — tile "Recuperadas" ao lado de "A recuperar"

**Files:**
- Modify: `src/shared/domain/types/@hotel-painel.ts:372-381` (`MotorHomeMetrics`)
- Modify: `src/presentation/components/organisms/home/manager-home.tsx:171-175`
- Test: `src/presentation/components/organisms/home/__tests__/manager-home.test.tsx`

**Interfaces:**
- Consumes: `recuperadas` (Task 5).

- [ ] **Step 1: Tipo**

Em `MotorHomeMetrics`, após `a_recuperar`:

```ts
  recuperadas: { quantidade: number; valor: number };
```

- [ ] **Step 2: Teste (falha)**

Em `manager-home.test.tsx`, na fixture do motor, adicionar `recuperadas: { quantidade: 2, valor: 900 }` e um teste:

```tsx
  it("mostra quanto foi recuperado depois de hold expirado", () => {
    renderHome(); // usar o helper de render ja existente no arquivo
    expect(screen.getByText(/2 reservas · R\$ 900,00/)).toBeInTheDocument();
  });
```

(Se o arquivo não tiver helper de render, repetir o `render(...)` usado pelos outros `it`s.)

Run: `npx vitest run src/presentation/components/organisms/home`
Expected: FALHA.

- [ ] **Step 3: Implementar**

Em `manager-home.tsx`, após o `MetricCard` "A recuperar":

```tsx
              <MetricCard
                label="Recuperadas"
                value={`${formatNumber(home.motor.recuperadas.quantidade)} reserva${home.motor.recuperadas.quantidade === 1 ? "" : "s"} · ${fmtBRL(home.motor.recuperadas.valor)}`}
                hint="fecharam depois de um hold expirado — o follow-up funcionou"
                accent
              />
```

Run: `npx vitest run src/presentation/components/organisms/home && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/shared/domain/types/@hotel-painel.ts src/presentation/components/organisms/home
git commit -m "feat(home): tile de cotacoes recuperadas apos hold expirado"
```

---

### Task 10: Inbox — indicador bot/humano e etiqueta de contagem (P1-7 barato)

**Files:**
- Modify: `src/presentation/components/organisms/hotel-portal/painel/attendance/whatsapp-inbox.tsx:97-100`
- Test: o teste existente do inbox em `src/presentation/components/organisms/hotel-portal/painel/attendance/__tests__/` (se não existir, criar `whatsapp-inbox.test.tsx` com o caso abaixo usando a mesma fixture `ConversationListItem` de `stageLabel`)

**Interfaces:**
- Consumes: `ConversationListItem.statusBot` (já existe).

- [ ] **Step 1: Teste (falha)**

```tsx
  it("lista sinaliza quem esta com a bola em cada conversa", () => {
    // fixture: 1 conversa PAUSADO e 1 ATIVO
    render(<WhatsappInbox ... />); // mesmos props dos testes existentes
    expect(screen.getByLabelText("Com humano")).toBeInTheDocument();
    expect(screen.getByLabelText("Com o bot")).toBeInTheDocument();
  });
```

Run: `npx vitest run src/presentation/components/organisms/hotel-portal/painel/attendance`
Expected: FALHA (`Com o bot` não existe).

- [ ] **Step 2: Implementar**

Em `whatsapp-inbox.tsx`, substituir o bloco:

```tsx
          {conv.statusBot === "PAUSADO" ? (
            <PauseCircle aria-label="Pausado — aguardando humano" className="h-3.5 w-3.5 text-warning-600" />
          ) : null}
```

por:

```tsx
          {conv.statusBot === "PAUSADO" ? (
            <UserRound aria-label="Com humano" className="h-3.5 w-3.5 text-warning-600" />
          ) : (
            <Bot aria-label="Com o bot" className="h-3.5 w-3.5 text-primary/60" />
          )}
```

e ajustar o import de `lucide-react` (`Bot`, `UserRound`; remover `PauseCircle` se ficar sem uso — verificar a linha ~256 que também usa `PauseCircle` no cabeçalho da conversa: ali manter).

- [ ] **Step 3: Testes + typecheck + commit**

Run: `npx vitest run src/presentation/components/organisms/hotel-portal/painel/attendance && npx tsc --noEmit`
Expected: PASS.

```bash
git add src/presentation/components/organisms/hotel-portal/painel/attendance
git commit -m "feat(atendimento): indicador bot/humano em cada conversa do inbox"
```

- [ ] **Step 4: Suite do frontend**

Run: `npx vitest run`
Expected: só as 77 falhas pré-existentes (CMS/access-management/editor). Qualquer falha fora dessas áreas deve ser corrigida antes de fechar.

---

## Fora deste plano (registrado para não perder)

- **Esteira N8N** do follow-up de cotação não fechada (P0-1): o backend já emite `hold.expirado` e agora expõe `recuperadas`; a sequência de mensagens é fluxo N8N (pendência junto de RETOMADA_HUMANA + `reserva.confirmada`). O N8N também deve passar a chamar `GET /ingest/bot-events/handoff-summary/:numero` e postar `resumoTexto` como nota privada no Chatwoot antes de escalar, e enviar `motivo` no `bot.pausado`.
- **P1-5/6** (campanhas por etiqueta, jornada pós-conversão) = Frente 5 do doc de futuro, plano próprio.
- **P1-8, P2** = backlog.
- Smoke manual no painel depois de mesclar (memória `bot-funnel-stages-redesign`).

## Self-review

- **Cobertura do spec P0**: P0-1 → Tasks 5, 9 (+ N8N fora); P0-2 → Tasks 2, 7; P0-3 → Task 1; P0-4a → Task 6; P0-4b → Task 3; P0-4c → Tasks 4, 8; §5 passo 6 (sinalização) → Tasks 7, 10. ✔
- **Placeholders**: nenhum "TBD"; Task 10 step 1 referencia "mesmos props dos testes existentes" porque o arquivo de teste pode já existir — o executor deve copiar a fixture real do arquivo. ✔
- **Consistência de nomes**: `valorAberto`/`valorConfirmado`/`valorCotacao`/`etiqueta`/`statusBot`/`aguardandoDesde` iguais em Task 2 (back), contrato e Task 7 (front); `handoff.{total,taxaHandover,motivos,tempoMedioComBotSegundos}` iguais em Tasks 4 e 8; `recuperadas.{quantidade,valor}` em Tasks 5 e 9; `HANDOFF:` prefixo em Tasks 3 e 4; `formatBRL`/`waitingLabel`/`TAG_LABELS` definidos em Task 7 step 3 e usados em step 5. ✔
