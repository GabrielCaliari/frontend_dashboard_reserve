# Motor v2 (Frentes 1–3) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar as frentes ativas do design macro `docs/superpowers/specs/2026-08-19-motor-v2-macro-design.md`: navegação "Motor de Reservas", barra de período, grade de tarifas com edição pontual, atualização em massa, home unificada (funil do bot + métricas do motor + canais) com aposentadoria dos dashboards duplicados, e passe de design nas telas do motor.

**Architecture:** Backend NestJS ganha 3 capacidades no bounded context `reserve-motor` (calendário por range, grade de tarifas, bulk de daily inventory) + 1 serviço de métricas exportado para o `reserve-client-portal`, que ganha o endpoint agregador `/hotel-portal/:clientId/home`. Frontend Next.js reorganiza a rota `/dashboard/motor/calendario` em 3 abas (Ocupação / Grade de tarifas / Atualização em massa) servidas por uma barra de período compartilhada, e a home `/dashboard` (branch manager) vira a visão única de desempenho, com redirects nas telas aposentadas.

**Tech Stack:** Backend: NestJS 11, Prisma 7, Jest (Prisma mockado como objeto literal, sem banco de teste). Frontend: Next.js 16 App Router, TS estrito, React Query v5, HeroUI + shadcn, date-fns 4, vitest + Testing Library (mock do barrel de hooks).

**Repositórios:**
- `BACK` = `C:\Users\gabri\OneDrive\Documents\GitHub\backend_reserve`
- `FRONT` = `C:\Users\gabri\OneDrive\Documents\GitHub\frontend_dashboard_reserve`

Tasks 1–5 rodam no `BACK`; Tasks 6–12 no `FRONT`. Caminhos relativos são relativos ao repo da task.

## Global Constraints

- **Checkout exclusivo**: `noites = checkout - checkin`. Helpers canônicos em `src/modules/reserve-motor/domain/constants/motor.constants.ts`: `utcDate()`, `addDaysUtc()`, `nightsBetween()`, `isoDate()`, `dowBit()` (seg=1 … dom=64).
- **Multi-tenant**: toda query filtra `tenant_id` explicitamente.
- **Pool pg `max: 3`**: nunca `Promise.all` com N queries — no máximo 2–3 paralelas; loops de room_type são sequenciais de propósito.
- **Cadeia de guards admin canônica** (travada por `src/modules/reserve-motor/infrastructure/controllers/motor-wiring.spec.ts`): `@UseGuards(AdminJwtGuard, TenantGuard, ModuleAccessGuard, PermissionsGuard)` + `@RequiresModule('motor')` na classe; permissões por handler (`motor.read` para leitura, `motor.settings.manage` para escrita de tarifas/inventário). Controllers novos do motor entram no array `ADMIN_CONTROLLERS` desse spec (este plano NÃO cria controllers novos no motor — só handlers em controllers existentes).
- **Override do daily inventory**: toda escrita manual grava `override: true`; o job de materialização (`DailyInventoryService.materializeTenant`) deleta apenas `override: false` — nunca quebrar esse invariante.
- **Push Beds24**: após escrita no inventário, `void this.channelPush?.enqueue(tenantId, roomTypeId, rangeInicio, rangeFim)` — uma chamada por room_type com o range completo (o enqueue coalesce; nunca uma chamada por dia).
- **Dinheiro no motor**: `Decimal(12,2)` em REAIS. O frontend do motor converte com `Number()` no adapter e formata com `fmtBRL` local (`Intl.NumberFormat("pt-BR", {style:"currency",currency:"BRL"})`) — NÃO usar `hotel-format.formatMoney` (que divide por 100/centavos) em dados do motor.
- **Backend testes**: Jest, spec irmão (`*.spec.ts`), services instanciados direto com Prisma mockado como objeto literal + `jest.fn()`; `$transaction: jest.fn().mockImplementation((ops) => Promise.all(ops))`. Comando: `npm test -- <padrão>`.
- **Frontend testes**: vitest (`npm run test:run -- <padrão>`); testes de página mockam o barrel inteiro (`vi.mock("@/src/shared/hooks/motor", ...)` etc.) + `tenant-capabilities-provider`; sem QueryClientProvider/router mock.
- **Frontend arquitetura**: `src/app/**` só re-exporta (`export { default } from "@/src/presentation/components/pages/..."`); hooks React Query em `src/shared/hooks/<domain>/` com barrel `index.ts`; adapters HTTP em `src/modules/<domain>/infrastructure/adapters.ts`; organisms de domínio em `src/presentation/components/organisms/<domain>/`; tipos em `src/shared/domain/types/@<domain>.ts`.
- **Rotas admin do motor no front**: chaveadas por path `:tenantId` com header `x-skip-tenant` (`const adminConfig = { headers: { 'x-skip-tenant': 'true' } }` já existe em `src/modules/motor/infrastructure/adapters.ts`).
- **Sidebar/gating**: todo id novo de nav item DEVE entrar em `MODULE_NAV_IDS` (`src/modules/settings/domain/navigation.ts`) senão vaza para tenant sem o módulo; containers com `subItems` só sobrevivem se sobrar filho.
- **Idioma**: identificadores de domínio em português `snake_case`; comentários em português sem acento; strings de UI das telas do motor hardcoded pt-BR (padrão atual — só sidebar é i18n, namespace `sidebar` em `src/presentation/i18n/messages/pt.json` e `en.json`).
- **Commits**: conventional em português sem acento, um (ou mais) por task, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- **Não rediscutir**: decisões do design macro (abas internas em vez de sub-menu; home única no `/dashboard`; sem tela de promoções/marketing).

---

## Task 1 (BACK): Calendário por range — `CalendarService.range` + `GET /calendar/range`

A Ocupação passa a aceitar qualquer janela de datas (Mês | 14 dias | 7 dias | Personalizado), não só mês fechado.

**Files:**
- Modify: `src/modules/reserve-motor/application/services/calendar.service.ts`
- Modify: `src/modules/reserve-motor/infrastructure/controllers/motor-calendar.controller.ts`
- Test: `src/modules/reserve-motor/application/services/calendar.service.spec.ts`

**Interfaces:**
- Consumes: helpers de `motor.constants.ts`; queries Prisma já existentes no `month()`.
- Produces: `CalendarService.range(tenantId: string, from: string, to: string): Promise<{ from: string; to: string; unidades: CalendarUnidade[] }>` (`to` INCLUSIVO; `unidades` no mesmo shape do `month()`), e rota `GET /api/motor/:tenantId/calendar/range?from=YYYY-MM-DD&to=YYYY-MM-DD` (perm `motor.read`). Task 8 consome.

- [ ] **Step 1: Escrever os testes que falham**

Em `calendar.service.spec.ts`, adicionar (reusando o `buildPrisma()` existente do arquivo):

```ts
describe('range', () => {
  it('retorna unidades no mesmo shape do month para a janela pedida', async () => {
    const service = new CalendarService(buildPrisma() as any);
    const result = await service.range('tenant_1', '2026-09-05', '2026-09-07');
    expect(result.from).toBe('2026-09-05');
    expect(result.to).toBe('2026-09-07');
    // to inclusivo => 3 dias
    expect(result.unidades[0].dias).toHaveLength(3);
    expect(result.unidades[0].dias[0]).toMatchObject({ data: '2026-09-05' });
  });

  it('rejeita datas invalidas e janela invertida', async () => {
    const service = new CalendarService(buildPrisma() as any);
    await expect(service.range('tenant_1', 'x', '2026-09-07')).rejects.toThrow(MotorValidationError);
    await expect(service.range('tenant_1', '2026-09-08', '2026-09-07')).rejects.toThrow(MotorValidationError);
  });

  it('rejeita janela maior que 62 dias', async () => {
    const service = new CalendarService(buildPrisma() as any);
    await expect(service.range('tenant_1', '2026-01-01', '2026-04-01')).rejects.toThrow(MotorValidationError);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- calendar.service` — Expected: FAIL (`range is not a function`).

- [ ] **Step 3: Implementar**

Em `calendar.service.ts`: extrair o corpo do `month()` (da montagem de `start/end` em diante) para um método privado `private async unidadesForWindow(tenantId: string, start: Date, endExclusive: Date)` que retorna o array `unidades`. `month()` vira validação de `mes` + chamada ao privado. Adicionar:

```ts
async range(tenantId: string, from: string, to: string) {
  const isoRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRe.test(from) || !isoRe.test(to)) {
    throw new MotorValidationError('from/to devem ser YYYY-MM-DD');
  }
  const start = utcDate(from);
  const endExclusive = addDaysUtc(utcDate(to), 1); // to inclusivo
  const dias = nightsBetween(start, endExclusive);
  if (dias < 1) throw new MotorValidationError('to deve ser maior ou igual a from');
  if (dias > 62) throw new MotorValidationError('janela maxima de 62 dias');
  const unidades = await this.unidadesForWindow(tenantId, start, endExclusive);
  return { from, to, unidades };
}
```

Em `motor-calendar.controller.ts` (mesma classe, guards herdados da classe):

```ts
@Get('range')
@RequirePermissions('motor.read')
range(
  @Param('tenantId') tenantId: string,
  @Query('from') from: string,
  @Query('to') to: string,
) {
  return this.calendarService.range(tenantId, from, to);
}
```

Atenção NestJS: se o `@Get()` sem path do `month` vier ANTES do `@Get('range')` na classe, mover `range` (e o `grade` da Task 2) para cima do `month` para as rotas estáticas casarem primeiro.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- calendar.service` — Expected: PASS (novos + existentes do `month`).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(motor): calendario de ocupacao por range de datas"
```

---

## Task 2 (BACK): Grade de tarifas — `RateGridService` + `GET /calendar/grade`

**Files:**
- Create: `src/modules/reserve-motor/application/services/rate-grid.service.ts`
- Create: `src/modules/reserve-motor/application/services/rate-grid.service.spec.ts`
- Modify: `src/modules/reserve-motor/infrastructure/controllers/motor-calendar.controller.ts`
- Modify: `src/modules/reserve-motor/reserve-motor.module.ts` (providers += `RateGridService`)

**Interfaces:**
- Consumes: `AvailabilityService.freeCountByNight(tenantId, roomTypeId, checkin: Date, checkout: Date): Promise<Map<string, number>>` (chave = `isoDate`); `MotorDailyInventory`, `MotorRoomType` (com `units` ativas).
- Produces: `RateGridService.grade(tenantId, from, to)` retornando
  `{ from, to, room_types: [{ room_type_id, nome, capacidade_base, capacidade_max, valor_pessoa_adicional, total_units, dias: [{ data, preco (Decimal|null), min_stay (number|null), stop_sell, closed_arrival, closed_departure, override, unidades_livres }] }] }`
  e rota `GET /api/motor/:tenantId/calendar/grade?from&to` (perm `motor.read`). Tasks 7/9 consomem.

- [ ] **Step 1: Escrever os testes que falham**

`rate-grid.service.spec.ts`:

```ts
import { RateGridService } from './rate-grid.service';
import { MotorValidationError } from '../../domain/errors/motor.errors';
import { utcDate } from '../../domain/constants/motor.constants';

function buildPrisma() {
  return {
    motorRoomType: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'rt1', nome: 'Suite Casal', capacidade_base: 2, capacidade_max: 3,
          valor_pessoa_adicional: '50.00', ordem: 1,
          units: [{ id: 'u1' }, { id: 'u2' }],
        },
      ]),
    },
    motorDailyInventory: {
      findMany: jest.fn().mockResolvedValue([
        {
          room_type_id: 'rt1', data: utcDate('2026-09-05'), preco: '320.00',
          min_stay: 2, stop_sell: false, closed_arrival: false,
          closed_departure: false, override: true,
        },
      ]),
    },
  };
}

const availability = {
  freeCountByNight: jest.fn().mockResolvedValue(new Map([
    ['2026-09-05', 1], ['2026-09-06', 2],
  ])),
};

describe('RateGridService.grade', () => {
  it('cruza inventario com unidades livres por dia', async () => {
    const service = new RateGridService(buildPrisma() as any, availability as any);
    const result = await service.grade('tenant_1', '2026-09-05', '2026-09-06');
    expect(result.room_types).toHaveLength(1);
    const rt = result.room_types[0];
    expect(rt.total_units).toBe(2);
    expect(rt.dias).toHaveLength(2);
    expect(rt.dias[0]).toMatchObject({
      data: '2026-09-05', min_stay: 2, unidades_livres: 1, override: true,
    });
    // dia sem linha de inventario => preco null, nao vendavel
    expect(rt.dias[1]).toMatchObject({ data: '2026-09-06', preco: null, unidades_livres: 2 });
  });

  it('valida janela como o range do calendario', async () => {
    const service = new RateGridService(buildPrisma() as any, availability as any);
    await expect(service.grade('t', '2026-01-01', '2026-04-01')).rejects.toThrow(MotorValidationError);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- rate-grid` — Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

`rate-grid.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service'; // conferir path usado pelos vizinhos (ex.: calendar.service.ts) e copiar
import { AvailabilityService } from './availability.service';
import { MotorValidationError } from '../../domain/errors/motor.errors';
import { addDaysUtc, isoDate, nightsBetween, utcDate } from '../../domain/constants/motor.constants';

@Injectable()
export class RateGridService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
  ) {}

  async grade(tenantId: string, from: string, to: string) {
    const isoRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRe.test(from) || !isoRe.test(to)) {
      throw new MotorValidationError('from/to devem ser YYYY-MM-DD');
    }
    const start = utcDate(from);
    const endExclusive = addDaysUtc(utcDate(to), 1);
    const span = nightsBetween(start, endExclusive);
    if (span < 1) throw new MotorValidationError('to deve ser maior ou igual a from');
    if (span > 62) throw new MotorValidationError('janela maxima de 62 dias');

    const roomTypes = await this.prisma.motorRoomType.findMany({
      where: { tenant_id: tenantId, ativo: true },
      include: { units: { where: { ativo: true }, select: { id: true } } },
      orderBy: { ordem: 'asc' },
    });
    const inventory = await this.prisma.motorDailyInventory.findMany({
      where: { tenant_id: tenantId, data: { gte: start, lt: endExclusive } },
    });
    const invByKey = new Map<string, (typeof inventory)[number]>();
    for (const row of inventory) invByKey.set(`${row.room_type_id}:${isoDate(row.data)}`, row);

    const result = [];
    for (const rt of roomTypes) {
      // sequencial de proposito: pool pg max 3
      const freeMap = await this.availability.freeCountByNight(tenantId, rt.id, start, endExclusive);
      const dias = [];
      for (let d = start; d < endExclusive; d = addDaysUtc(d, 1)) {
        const iso = isoDate(d);
        const inv = invByKey.get(`${rt.id}:${iso}`);
        dias.push({
          data: iso,
          preco: inv ? inv.preco : null,
          min_stay: inv ? inv.min_stay : null,
          stop_sell: inv?.stop_sell ?? false,
          closed_arrival: inv?.closed_arrival ?? false,
          closed_departure: inv?.closed_departure ?? false,
          override: inv?.override ?? false,
          unidades_livres: freeMap.get(iso) ?? 0,
        });
      }
      result.push({
        room_type_id: rt.id,
        nome: rt.nome,
        capacidade_base: rt.capacidade_base,
        capacidade_max: rt.capacidade_max,
        valor_pessoa_adicional: rt.valor_pessoa_adicional,
        total_units: rt.units.length,
        dias,
      });
    }
    return { from, to, room_types: result };
  }
}
```

Controller (`motor-calendar.controller.ts`, ANTES do `@Get()` do month — ver nota da Task 1):

```ts
@Get('grade')
@RequirePermissions('motor.read')
grade(
  @Param('tenantId') tenantId: string,
  @Query('from') from: string,
  @Query('to') to: string,
) {
  return this.rateGridService.grade(tenantId, from, to);
}
```

Injetar `RateGridService` no construtor do controller e registrar em `providers` de `reserve-motor.module.ts`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- rate-grid` e `npm test -- motor-wiring` — Expected: PASS (wiring não muda: nenhum controller novo).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(motor): endpoint da grade de tarifas por tipo e dia"
```

---

## Task 3 (BACK): Bulk de daily inventory com dry-run

**Files:**
- Modify: `src/modules/reserve-motor/application/dtos/daily-inventory.dto.ts`
- Modify: `src/modules/reserve-motor/application/services/daily-inventory.service.ts`
- Modify: `src/modules/reserve-motor/infrastructure/controllers/motor-daily-inventory.controller.ts`
- Test: `src/modules/reserve-motor/application/services/daily-inventory.service.spec.ts`

**Interfaces:**
- Consumes: invariante de override, `channelPush.enqueue`, helpers de datas.
- Produces: `DailyInventoryService.bulkOverride(tenantId, dto: BulkDailyInventoryDto): Promise<{ total_datas, atualizar, criar, ignoradas_sem_preco, aplicado }>` e rota `POST /api/motor/:tenantId/daily-inventory/bulk` (perm `motor.settings.manage`). `dry_run: true` só retorna o resumo. Task 10 consome.

- [ ] **Step 1: DTO**

Em `daily-inventory.dto.ts` (imports de class-validator já presentes no arquivo; acrescentar os que faltarem — `IsArray`, `ArrayNotEmpty`, `Max`):

```ts
export class BulkDailyInventoryDto {
  @IsArray() @ArrayNotEmpty() @IsString({ each: true })
  room_type_ids!: string[];

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsInt() @Min(1) @Max(127)
  dow_mask!: number;

  @IsOptional() @IsNumber() @Min(0)
  preco?: number;

  @IsOptional() @IsInt() @Min(1)
  min_stay?: number;

  @IsOptional() @IsBoolean()
  stop_sell?: boolean;

  @IsOptional() @IsBoolean()
  closed_arrival?: boolean;

  @IsOptional() @IsBoolean()
  closed_departure?: boolean;

  @IsOptional() @IsBoolean()
  dry_run?: boolean;
}
```

- [ ] **Step 2: Escrever os testes que falham**

Em `daily-inventory.service.spec.ts`, no padrão do arquivo (`$transaction: jest.fn().mockImplementation((ops) => Promise.all(ops))`; `channelPush` mockado com `{ enqueue: jest.fn() }`):

```ts
describe('bulkOverride', () => {
  const dtoBase = {
    room_type_ids: ['rt1'], from: '2026-09-01', to: '2026-09-07',
    dow_mask: 96, // sex(32) + sab(64) — conferir convencao do dowBit; ajustar se sex/sab tiverem outros bits
    preco: 400,
  };

  it('dry_run retorna resumo sem escrever', async () => {
    const prisma = buildPrismaBulk({ existentes: [{ room_type_id: 'rt1', data: utcDate('2026-09-04') }] });
    const service = new DailyInventoryService(prisma as any, channelPush as any);
    const resumo = await service.bulkOverride('tenant_1', { ...dtoBase, dry_run: true } as any);
    expect(resumo.aplicado).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(channelPush.enqueue).not.toHaveBeenCalled();
  });

  it('aplica update + create com override true e enfileira push por room_type', async () => {
    const prisma = buildPrismaBulk({ existentes: [{ room_type_id: 'rt1', data: utcDate('2026-09-04') }] });
    const service = new DailyInventoryService(prisma as any, channelPush as any);
    const resumo = await service.bulkOverride('tenant_1', dtoBase as any);
    expect(resumo.aplicado).toBe(true);
    expect(prisma.motorDailyInventory.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ override: true, preco: 400 }) }),
    );
    expect(prisma.motorDailyInventory.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
    expect(channelPush.enqueue).toHaveBeenCalledTimes(1);
  });

  it('sem nenhum campo a aplicar lanca validacao', async () => {
    const service = new DailyInventoryService(buildPrismaBulk({ existentes: [] }) as any, channelPush as any);
    await expect(
      service.bulkOverride('tenant_1', { room_type_ids: ['rt1'], from: '2026-09-01', to: '2026-09-02', dow_mask: 127 } as any),
    ).rejects.toThrow(MotorValidationError);
  });
});
```

Helper `buildPrismaBulk({ existentes })` no spec: objeto literal com `motorRoomType.findMany` → `[{ id: 'rt1' }]`, `motorDailyInventory.findMany` → `existentes`, `updateMany`/`createMany` → `jest.fn().mockResolvedValue({ count: 0 })`, `$transaction` como acima.

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- daily-inventory` — Expected: FAIL (`bulkOverride is not a function`).

- [ ] **Step 4: Implementar**

Em `daily-inventory.service.ts`:

```ts
async bulkOverride(tenantId: string, dto: BulkDailyInventoryDto) {
  const temCampo =
    dto.preco != null || dto.min_stay != null || dto.stop_sell != null ||
    dto.closed_arrival != null || dto.closed_departure != null;
  if (!temCampo) throw new MotorValidationError('informe ao menos um campo para aplicar');

  const start = utcDate(dto.from);
  const endExclusive = addDaysUtc(utcDate(dto.to), 1);
  const span = nightsBetween(start, endExclusive);
  if (span < 1) throw new MotorValidationError('to deve ser maior ou igual a from');
  if (span > 366) throw new MotorValidationError('periodo maximo de 366 dias');

  const owned = await this.prisma.motorRoomType.findMany({
    where: { tenant_id: tenantId, id: { in: dto.room_type_ids } },
    select: { id: true },
  });
  if (owned.length !== dto.room_type_ids.length) {
    throw new MotorValidationError('room_type invalido para o tenant');
  }

  const datas: Date[] = [];
  for (let d = start; d < endExclusive; d = addDaysUtc(d, 1)) {
    if (dto.dow_mask & dowBit(d)) datas.push(d);
  }

  const existentes = await this.prisma.motorDailyInventory.findMany({
    where: { tenant_id: tenantId, room_type_id: { in: dto.room_type_ids }, data: { in: datas } },
    select: { room_type_id: true, data: true },
  });
  const existSet = new Set(existentes.map((r) => `${r.room_type_id}:${isoDate(r.data)}`));

  const criar: { room_type_id: string; data: Date }[] = [];
  let ignoradasSemPreco = 0;
  for (const rt of dto.room_type_ids) {
    for (const d of datas) {
      if (existSet.has(`${rt}:${isoDate(d)}`)) continue;
      if (dto.preco == null) { ignoradasSemPreco += 1; continue; }
      criar.push({ room_type_id: rt, data: d });
    }
  }

  const resumo = {
    total_datas: datas.length * dto.room_type_ids.length,
    atualizar: existSet.size,
    criar: criar.length,
    ignoradas_sem_preco: ignoradasSemPreco,
    aplicado: false,
  };
  if (dto.dry_run) return resumo;

  const campos = {
    ...(dto.preco != null ? { preco: dto.preco } : {}),
    ...(dto.min_stay != null ? { min_stay: dto.min_stay } : {}),
    ...(dto.stop_sell != null ? { stop_sell: dto.stop_sell } : {}),
    ...(dto.closed_arrival != null ? { closed_arrival: dto.closed_arrival } : {}),
    ...(dto.closed_departure != null ? { closed_departure: dto.closed_departure } : {}),
  };
  const ops: any[] = [
    this.prisma.motorDailyInventory.updateMany({
      where: { tenant_id: tenantId, room_type_id: { in: dto.room_type_ids }, data: { in: datas } },
      data: { ...campos, override: true },
    }),
  ];
  if (criar.length) {
    ops.push(this.prisma.motorDailyInventory.createMany({
      data: criar.map((c) => ({
        tenant_id: tenantId, room_type_id: c.room_type_id, data: c.data,
        preco: dto.preco!, min_stay: dto.min_stay ?? 1,
        stop_sell: dto.stop_sell ?? false,
        closed_arrival: dto.closed_arrival ?? false,
        closed_departure: dto.closed_departure ?? false,
        override: true,
      })),
      skipDuplicates: true,
    }));
  }
  await this.prisma.$transaction(ops);
  for (const rt of dto.room_type_ids) {
    void this.channelPush?.enqueue(tenantId, rt, start, endExclusive);
  }
  return { ...resumo, aplicado: true };
}
```

Controller (`motor-daily-inventory.controller.ts`):

```ts
@Post('bulk')
@RequirePermissions('motor.settings.manage')
bulk(@Param('tenantId') tenantId: string, @Body() dto: BulkDailyInventoryDto) {
  return this.dailyInventoryService.bulkOverride(tenantId, dto);
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- daily-inventory` — Expected: PASS (novos + existentes de `upsertOverride`/`materializeTenant`).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(motor): atualizacao em massa de precos e restricoes com dry-run"
```

---

## Task 4 (BACK): `MotorMetricsService` (métricas do motor por período)

**Files:**
- Create: `src/modules/reserve-motor/application/services/motor-metrics.service.ts`
- Create: `src/modules/reserve-motor/application/services/motor-metrics.service.spec.ts`
- Modify: `src/modules/reserve-motor/reserve-motor.module.ts` (providers += e **exports += `MotorMetricsService`**)

**Interfaces:**
- Consumes: `MotorReservation` (venda = `created_at` no período, status em CONFIRMADA/CHECKIN_FEITO/CONCLUIDA), `MotorReservationEvent` (`tipo: 'CANCELADA'`, `created_at` no período), `MotorHold` (`status: 'EXPIRADO'`, `updated_at` no período — carimbo do `expireDue()` em lote), `nightsBetween`.
- Produces: `MotorMetricsService.metrics(tenantId: string, from: Date, to: Date)` retornando
  `{ receita, reservas, ticket_medio, room_nights, canceladas: { quantidade, valor }, a_recuperar: { quantidade, valor }, receita_bot, por_origem: [{ origem, reservas, receita }] }` — **números em REAIS**. Task 5 consome.

- [ ] **Step 1: Escrever os testes que falham**

`motor-metrics.service.spec.ts`:

```ts
import { MotorMetricsService } from './motor-metrics.service';
import { utcDate } from '../../domain/constants/motor.constants';

function buildPrisma() {
  return {
    motorReservation: {
      findMany: jest.fn().mockResolvedValue([
        { valor_total: '600.00', checkin: utcDate('2026-09-05'), checkout: utcDate('2026-09-07'), origem: 'BOT_WHATSAPP' },
        { valor_total: '400.00', checkin: utcDate('2026-09-10'), checkout: utcDate('2026-09-11'), origem: 'OTA_BOOKING' },
      ]),
    },
    motorReservationEvent: {
      findMany: jest.fn().mockResolvedValue([
        { reservation: { valor_total: '250.00' } },
      ]),
    },
    motorHold: {
      findMany: jest.fn().mockResolvedValue([
        { valor_total: '320.00' }, { valor_total: '180.00' },
      ]),
    },
  };
}

describe('MotorMetricsService.metrics', () => {
  it('agrega receita, room nights, canceladas e a recuperar', async () => {
    const service = new MotorMetricsService(buildPrisma() as any);
    const m = await service.metrics('tenant_1', new Date('2026-09-01'), new Date('2026-09-30'));
    expect(m.receita).toBe(1000);
    expect(m.reservas).toBe(2);
    expect(m.ticket_medio).toBe(500);
    expect(m.room_nights).toBe(3); // 2 noites + 1 noite
    expect(m.canceladas).toEqual({ quantidade: 1, valor: 250 });
    expect(m.a_recuperar).toEqual({ quantidade: 2, valor: 500 });
    expect(m.receita_bot).toBe(600);
    expect(m.por_origem).toContainEqual({ origem: 'OTA_BOOKING', reservas: 1, receita: 400 });
  });

  it('zero-safe sem dados', async () => {
    const prisma = buildPrisma();
    prisma.motorReservation.findMany.mockResolvedValue([]);
    prisma.motorReservationEvent.findMany.mockResolvedValue([]);
    prisma.motorHold.findMany.mockResolvedValue([]);
    const service = new MotorMetricsService(prisma as any);
    const m = await service.metrics('tenant_1', new Date(), new Date());
    expect(m.ticket_medio).toBe(0);
    expect(m.receita).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- motor-metrics` — Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service'; // copiar o import dos services vizinhos
import { nightsBetween } from '../../domain/constants/motor.constants';

const STATUS_VENDA = ['CONFIRMADA', 'CHECKIN_FEITO', 'CONCLUIDA'] as const;

@Injectable()
export class MotorMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics(tenantId: string, from: Date, to: Date) {
    const vendidas = await this.prisma.motorReservation.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: STATUS_VENDA as any },
        created_at: { gte: from, lte: to },
      },
      select: { valor_total: true, checkin: true, checkout: true, origem: true },
    });
    const canceladasEventos = await this.prisma.motorReservationEvent.findMany({
      where: {
        tipo: 'CANCELADA',
        created_at: { gte: from, lte: to },
        reservation: { tenant_id: tenantId },
      },
      select: { reservation: { select: { valor_total: true } } },
    });
    const expirados = await this.prisma.motorHold.findMany({
      where: { tenant_id: tenantId, status: 'EXPIRADO', updated_at: { gte: from, lte: to } },
      select: { valor_total: true },
    });

    const soma = (valores: unknown[]) => valores.reduce<number>((acc, v) => acc + Number(v), 0);
    const receita = soma(vendidas.map((r) => r.valor_total));
    const roomNights = vendidas.reduce((acc, r) => acc + nightsBetween(r.checkin, r.checkout), 0);

    const porOrigem = new Map<string, { reservas: number; receita: number }>();
    for (const r of vendidas) {
      const atual = porOrigem.get(r.origem) ?? { reservas: 0, receita: 0 };
      atual.reservas += 1;
      atual.receita += Number(r.valor_total);
      porOrigem.set(r.origem, atual);
    }

    return {
      receita,
      reservas: vendidas.length,
      ticket_medio: vendidas.length ? receita / vendidas.length : 0,
      room_nights: roomNights,
      canceladas: {
        quantidade: canceladasEventos.length,
        valor: soma(canceladasEventos.map((e) => e.reservation.valor_total)),
      },
      a_recuperar: { quantidade: expirados.length, valor: soma(expirados.map((h) => h.valor_total)) },
      receita_bot: porOrigem.get('BOT_WHATSAPP')?.receita ?? 0,
      por_origem: [...porOrigem.entries()].map(([origem, v]) => ({ origem, ...v })),
    };
  }
}
```

Registrar em `providers` E `exports` do `ReserveMotorModule`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- motor-metrics` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(motor): servico de metricas do motor por periodo"
```

---

## Task 5 (BACK): Endpoint agregador da home — `GET /hotel-portal/:clientId/home`

Agrega **funil + motor** em uma chamada. Canais/ocupação continuam vindo do endpoint `/dashboard` existente (decisão: não acoplar mais um contrato legado no agregador; a home faz 2 queries React Query, ambas já cacheadas).

**Files:**
- Create: `src/modules/reserve-client-portal/application/services/home.service.ts`
- Create: `src/modules/reserve-client-portal/application/services/home.service.spec.ts`
- Modify: `src/modules/reserve-client-portal/infrastructure/controllers/client-portal.controller.ts`
- Modify: módulo do client-portal (arquivo `*.module.ts` em `src/modules/reserve-client-portal/` — localizar com `Glob src/modules/reserve-client-portal/*.module.ts`): `imports += ReserveMotorModule`, `providers += HomeService`

**Interfaces:**
- Consumes: `FunnelMetricsService.getMetrics(clientId, from, to)` (mesmo tipo de from/to usado pelo handler `getWhatsAppFunnelMetrics` — copiar a convenção do controller); `MotorMetricsService.metrics(tenantId, from, to)` (Task 4); `successResponse`/`errorResponse` de `src/shared/helpers` (códigos `'404:HOTEL_CLIENT_NOT_FOUND'`, `'400:HOTEL_CLIENT_WITHOUT_TENANT'`).
- Produces: `GET /api/hotel-portal/:clientId/home?from&to` → `{ period: { from, to }, funil: <FunnelMetricsResponse>, motor: <retorno da Task 4> }`. Task 11 consome.

- [ ] **Step 1: Escrever os testes que falham**

`home.service.spec.ts` (padrão dos specs vizinhos do client-portal — instanciação direta):

```ts
import { HomeService } from './home.service';

const prisma = {
  hotelClient: { findUnique: jest.fn() },
} as any;
const funnel = { getMetrics: jest.fn().mockResolvedValue({ conversasIniciadas: { value: 10 } }) } as any;
const motorMetrics = { metrics: jest.fn().mockResolvedValue({ receita: 1000 }) } as any;

describe('HomeService.getHome', () => {
  beforeEach(() => jest.clearAllMocks());

  it('agrega funil e motor para o tenant do client', async () => {
    prisma.hotelClient.findUnique.mockResolvedValue({ tenant_id: 'tenant_1' });
    const service = new HomeService(prisma, funnel, motorMetrics);
    const result = await service.getHome('client_1', new Date('2026-08-01'), new Date('2026-08-31'));
    expect(result.status).toBe(200);
    expect(result.data.funil.conversasIniciadas.value).toBe(10);
    expect(result.data.motor.receita).toBe(1000);
    expect(motorMetrics.metrics).toHaveBeenCalledWith('tenant_1', expect.any(Date), expect.any(Date));
  });

  it('404 quando client nao existe', async () => {
    prisma.hotelClient.findUnique.mockResolvedValue(null);
    const service = new HomeService(prisma, funnel, motorMetrics);
    const result = await service.getHome('nope', new Date(), new Date());
    expect(result.status).toBe(404);
  });

  it('400 quando client sem tenant', async () => {
    prisma.hotelClient.findUnique.mockResolvedValue({ tenant_id: null });
    const service = new HomeService(prisma, funnel, motorMetrics);
    const result = await service.getHome('client_1', new Date(), new Date());
    expect(result.status).toBe(400);
  });
});
```

Atenção: conferir o shape exato de `successResponse` (se `{ status, data }` ou outro) lendo `src/shared/helpers/response.helper.ts` e ajustar os asserts para o real.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- home.service` — Expected: FAIL.

- [ ] **Step 3: Implementar**

`home.service.ts` (imports de Prisma/helpers copiados de um service vizinho, ex.: `dashboard.service.ts` do mesmo diretório):

```ts
@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly funnelMetrics: FunnelMetricsService,
    private readonly motorMetrics: MotorMetricsService,
  ) {}

  async getHome(clientId: string, from: Date, to: Date) {
    const client = await this.prisma.hotelClient.findUnique({
      where: { id: clientId },
      select: { tenant_id: true },
    });
    if (!client) return errorResponse('404:HOTEL_CLIENT_NOT_FOUND', 404);
    if (!client.tenant_id) return errorResponse('400:HOTEL_CLIENT_WITHOUT_TENANT', 400);

    const [funil, motor] = await Promise.all([
      this.funnelMetrics.getMetrics(clientId, from, to),
      this.motorMetrics.metrics(client.tenant_id, from, to),
    ]);
    return successResponse({
      period: { from: from.toISOString(), to: to.toISOString() },
      funil,
      motor,
    });
  }
}
```

Handler no `client-portal.controller.ts` (copiar a convenção EXATA do handler `getRoi` do mesmo arquivo — `@Query('from')/@Query('to')` com fallback `this.defaultFrom()` / `new Date()`, resposta via `@Res() res` + `res.status(result.status).json(result.data)`):

```ts
@Get(':clientId/home')
async getHome(
  @Param('clientId') clientId: string,
  @Res() res: Response,
  @Query('from') from?: string,
  @Query('to') to?: string,
) {
  const result = await this.homeService.getHome(
    clientId,
    from ? new Date(from) : this.defaultFrom(),
    to ? new Date(to) : new Date(),
  );
  return res.status(result.status).json(result.data);
}
```

Se `FunnelMetricsService.getMetrics` receber strings em vez de Date no controller atual, seguir a convenção do arquivo (o spec da Task 5 ajusta junto).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- home.service` — Expected: PASS. Depois `npm test` completo do repo para garantir que o import cruzado de módulos não quebrou nada — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(portal): endpoint agregador da home com funil e metricas do motor"
```

---

## Task 6 (FRONT): Navegação, i18n, redirects e aposentadorias

**Files:**
- Modify: `src/presentation/components/atoms/reserve/hotel-nav-items.tsx` (remover itens `hotel-overview` e `hotel-ota`)
- Modify: `src/modules/settings/domain/navigation.ts` (`MODULE_NAV_IDS.hotel`: remover `"hotel-overview"`, `"hotel-ota"`)
- Modify: `src/presentation/i18n/messages/pt.json` e `en.json`
- Modify: `src/presentation/components/pages/dashboard/hotel/overview/page.tsx` (vira redirect)
- Modify: `src/presentation/components/pages/dashboard/hotel/ota/page.tsx` (vira redirect)
- Delete: `src/app/dashboard/stats/page.tsx` e `src/presentation/components/pages/dashboard/stats/page.tsx` (**manter** `src/app/dashboard/stats/integrations/` intacto)

**Interfaces:**
- Produces: sidebar com grupo "Motor de Reservas" e item "Calendário"; `/dashboard/hotel/overview` e `/dashboard/hotel/ota` redirecionando para `/dashboard`; `/dashboard/stats` inexistente (404). Nenhum id de nav novo (as abas da Task 9 vivem dentro da rota `motor-calendario`).

- [ ] **Step 1: i18n**

Em `pt.json`, bloco `sidebar`: `"hotelMotor": "Calendário"` → `"Motor de Reservas"`; `"motorCalendario": "Mapa de ocupação"` → `"Calendário"`. Em `en.json`: `"hotelMotor"` → `"Booking Engine"`; `"motorCalendario"` → `"Calendar"`. Renomear o rótulo do item "Relatórios" do superadmin: localizar a chave usada pelo item de nav (`Grep "reports" src/presentation/i18n/messages/pt.json` + conferir qual chave o aside usa) e trocar o VALOR para `"Links de relatórios"` (en: `"Report links"`) **somente se** a chave for exclusiva do sidebar; se for compartilhada com o título da página, criar chave nova `sidebar.reportLinks` e apontar o item para ela.

- [ ] **Step 2: Remover itens aposentados da sidebar**

Em `hotel-nav-items.tsx`: deletar o item com `path: "/dashboard/hotel/overview"` e o item com `path: "/dashboard/hotel/ota"` (e seus ícones se ficarem órfãos no import). Em `navigation.ts`, remover `"hotel-overview"` e `"hotel-ota"` de `MODULE_NAV_IDS.hotel` e de qualquer entrada em `NAV_READ_PERMISSIONS`.

- [ ] **Step 3: Redirects e deleção**

Substituir o CONTEÚDO INTEIRO de `pages/dashboard/hotel/overview/page.tsx` por:

```tsx
import { redirect } from "next/navigation";

export default function HotelOverviewPage() {
  redirect("/dashboard");
}
```

Idem para `pages/dashboard/hotel/ota/page.tsx` (função `HotelOtaPage`). Os wrappers em `src/app/dashboard/hotel/{overview,ota}/page.tsx` permanecem como estão (one-liner). Deletar `src/app/dashboard/stats/page.tsx` e `src/presentation/components/pages/dashboard/stats/page.tsx`.

- [ ] **Step 4: Verificar**

Run: `npm run test:run` — Expected: PASS (nenhum teste referencia as telas removidas). Run: `npx tsc --noEmit` (ou `npm run build` se for o script canônico) — Expected: sem erros de import órfão. `Grep "hotel/overview" src` e `Grep "hotel/ota" src` — Expected: nenhuma referência de navegação restante (links em outras telas, se surgirem, apontar para `/dashboard`).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(nav): grupo motor de reservas e aposentadoria de overview, ota e stats"
```

---

## Task 7 (FRONT): Tipos + adapters + hooks novos do motor e da home

**Files:**
- Modify: `src/shared/domain/types/@motor.ts`
- Modify: `src/modules/motor/infrastructure/adapters.ts`
- Create: `src/shared/hooks/motor/use-motor-grade.ts`
- Modify: `src/shared/hooks/motor/use-motor-calendar.ts` (+`useMotorCalendarRange`)
- Modify: `src/shared/hooks/motor/use-motor-config.ts` (invalidação da grade no `useUpsertDailyInventory`)
- Modify: `src/shared/hooks/motor/index.ts` (barrel)
- Modify: `src/shared/domain/types/@hotel-painel.ts` (tipos da home)
- Modify: `src/modules/hotel-portal/infrastructure/adapters.ts` (+`getHome`)
- Create: `src/shared/hooks/hotel-portal/use-hotel-home.ts` + export no barrel `src/shared/hooks/hotel-portal/index.ts`

**Interfaces:**
- Consumes: rotas das Tasks 1–3 e 5; `adminConfig` e helper `num()` do adapters do motor.
- Produces (consumidos pelas Tasks 8–11):

```ts
// @motor.ts
export interface MotorGradeDia {
  data: string; preco: number | null; min_stay: number | null;
  stop_sell: boolean; closed_arrival: boolean; closed_departure: boolean;
  override: boolean; unidades_livres: number;
}
export interface MotorGradeRoomType {
  room_type_id: string; nome: string; capacidade_base: number; capacidade_max: number;
  valor_pessoa_adicional: number; total_units: number; dias: MotorGradeDia[];
}
export interface MotorGrade { from: string; to: string; room_types: MotorGradeRoomType[] }
export interface MotorCalendarRange { from: string; to: string; unidades: MotorCalendarUnidade[] }
export interface BulkMotorDailyInventoryDto {
  room_type_ids: string[]; from: string; to: string; dow_mask: number;
  preco?: number; min_stay?: number; stop_sell?: boolean;
  closed_arrival?: boolean; closed_departure?: boolean; dry_run?: boolean;
}
export interface MotorBulkResumo {
  total_datas: number; atualizar: number; criar: number;
  ignoradas_sem_preco: number; aplicado: boolean;
}

// @hotel-painel.ts
export interface MotorHomeMetrics {
  receita: number; reservas: number; ticket_medio: number; room_nights: number;
  canceladas: { quantidade: number; valor: number };
  a_recuperar: { quantidade: number; valor: number };
  receita_bot: number;
  por_origem: { origem: string; reservas: number; receita: number }[];
}
export interface HotelHomeResponse {
  period: { from: string; to: string };
  funil: FunnelMetricsResponse;
  motor: MotorHomeMetrics;
}
```

Hooks: `useMotorCalendarRange(tenantId: string | null, from: string, to: string)` (key `['motor','calendar-range',tenantId,from,to]`), `useMotorGrade(tenantId | null, from, to)` (key `['motor','grade',tenantId,from,to]`), `useBulkDailyInventory(tenantId: string)` (mutation; invalida `['motor','grade']`, `['motor','daily-inventory']`, `['motor','calendar-range']`), `useHotelHome(clientId: string | null, period: { from: string; to: string })` (key `['hotel-portal','home',clientId,period.from,period.to]`, `enabled: !!clientId`, `retry: false`, `staleTime` 5 min como os vizinhos).

- [ ] **Step 1: Tipos** — adicionar os blocos acima nos dois arquivos de tipos.

- [ ] **Step 2: Adapters**

Em `src/modules/motor/infrastructure/adapters.ts`, dentro de `motorService` (seguindo o estilo dos métodos vizinhos, com normalização `num()`/datas):

```ts
async getCalendarRange(tenantId: string, from: string, to: string): Promise<MotorCalendarRange> {
  const { data } = await api.get(`/motor/${tenantId}/calendar/range`, { params: { from, to }, ...adminConfig });
  return data;
},
async getGrade(tenantId: string, from: string, to: string): Promise<MotorGrade> {
  const { data } = await api.get(`/motor/${tenantId}/calendar/grade`, { params: { from, to }, ...adminConfig });
  return {
    ...data,
    room_types: (data.room_types ?? []).map((rt: any) => ({
      ...rt,
      valor_pessoa_adicional: num(rt.valor_pessoa_adicional),
      dias: (rt.dias ?? []).map((d: any) => ({ ...d, preco: d.preco == null ? null : num(d.preco) })),
    })),
  };
},
async bulkDailyInventory(tenantId: string, dto: BulkMotorDailyInventoryDto): Promise<MotorBulkResumo> {
  const { data } = await api.post(`/motor/${tenantId}/daily-inventory/bulk`, dto, adminConfig);
  return data;
},
```

Em `src/modules/hotel-portal/infrastructure/adapters.ts` (seguindo o estilo do método do overview):

```ts
export async function getHome(clientId: string, period: { from: string; to: string }): Promise<HotelHomeResponse> {
  const { data } = await api.get(`/hotel-portal/${clientId}/home`, { params: { from: period.from, to: period.to } });
  return data;
}
```

(Se o arquivo expõe um objeto service em vez de funções soltas, seguir o padrão local — conferir como `getOverview` é exportado e imitá-lo.)

- [ ] **Step 3: Hooks**

`use-motor-grade.ts`:

```ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motorService } from "@/src/modules/motor/infrastructure/adapters";
import type { BulkMotorDailyInventoryDto } from "@/src/shared/domain/types/@motor";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function useMotorGrade(tenantId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["motor", "grade", tenantId, from, to],
    queryFn: () => motorService.getGrade(tenantId!, from, to),
    enabled: !!tenantId && ISO.test(from) && ISO.test(to),
  });
}

export function useBulkDailyInventory(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkMotorDailyInventoryDto) => motorService.bulkDailyInventory(tenantId, dto),
    onSuccess: (_data, dto) => {
      if (dto.dry_run) return;
      queryClient.invalidateQueries({ queryKey: ["motor", "grade", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["motor", "daily-inventory", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["motor", "calendar-range", tenantId] });
    },
  });
}
```

Em `use-motor-calendar.ts`, adicionar `useMotorCalendarRange` (mesmo padrão do `useMotorCalendar`, key `calendar-range`, `enabled` com o regex ISO nas duas datas). Em `use-motor-config.ts`, no `onSuccess` do `useUpsertDailyInventory`, acrescentar `queryClient.invalidateQueries({ queryKey: ["motor", "grade", tenantId] })` e o mesmo para `calendar-range`. `use-hotel-home.ts` no padrão de `use-hotel-portal-overview.ts`. Exportar tudo nos barrels.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit` — Expected: sem erros. Run: `npm run test:run` — Expected: PASS (os testes existentes mockam o barrel; hooks novos não os afetam).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(motor): adapters e hooks de grade, range, bulk e home"
```

---

## Task 8 (FRONT): `PeriodBar` — barra de período unificada

**Files:**
- Create: `src/presentation/components/organisms/motor/period-bar.tsx`
- Test: `src/presentation/components/organisms/motor/__tests__/period-bar.test.tsx`

**Interfaces:**
- Produces (Tasks 9–10 consomem):

```ts
export type PeriodWindow = "month" | "d14" | "d7" | "custom";
export interface PeriodValue { window: PeriodWindow; from: string; to: string } // YYYY-MM-DD, to inclusivo
export function periodForMonth(anchor: Date): PeriodValue;
export function PeriodBar({ value, onChange }: { value: PeriodValue; onChange: (v: PeriodValue) => void }): JSX.Element;
```

- [ ] **Step 1: Escrever os testes que falham**

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PeriodBar, periodForMonth } from "../period-bar";

describe("PeriodBar", () => {
  it("mostra o rotulo do mes e navega com as setas", () => {
    const onChange = vi.fn();
    render(<PeriodBar value={{ window: "month", from: "2026-08-01", to: "2026-08-31" }} onChange={onChange} />);
    expect(screen.getByText(/agosto de 2026/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /proximo periodo/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ from: "2026-09-01", to: "2026-09-30" }));
  });

  it("troca para janela de 7 dias a partir do from atual", () => {
    const onChange = vi.fn();
    render(<PeriodBar value={{ window: "month", from: "2026-08-01", to: "2026-08-31" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "7 dias" }));
    expect(onChange).toHaveBeenCalledWith({ window: "d7", from: "2026-08-01", to: "2026-08-07" });
  });

  it("janela personalizada expoe inputs de data", () => {
    const onChange = vi.fn();
    render(<PeriodBar value={{ window: "custom", from: "2026-08-05", to: "2026-08-09" }} onChange={onChange} />);
    const inputs = screen.getAllByLabelText(/data (inicial|final)/i);
    expect(inputs).toHaveLength(2);
    fireEvent.change(inputs[1], { target: { value: "2026-08-12" } });
    expect(onChange).toHaveBeenCalledWith({ window: "custom", from: "2026-08-05", to: "2026-08-12" });
  });

  it("periodForMonth cobre o mes inteiro", () => {
    expect(periodForMonth(new Date(2026, 7, 15))).toEqual({ window: "month", from: "2026-08-01", to: "2026-08-31" });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm run test:run -- period-bar` — Expected: FAIL.

- [ ] **Step 3: Implementar**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PeriodWindow = "month" | "d14" | "d7" | "custom";
export interface PeriodValue { window: PeriodWindow; from: string; to: string }

const ISO = "yyyy-MM-dd";
const WINDOW_DAYS: Record<Exclude<PeriodWindow, "month" | "custom">, number> = { d14: 14, d7: 7 };

export function periodForMonth(anchor: Date): PeriodValue {
  return { window: "month", from: format(startOfMonth(anchor), ISO), to: format(endOfMonth(anchor), ISO) };
}

function shift(value: PeriodValue, direction: 1 | -1): PeriodValue {
  const from = parseISO(value.from);
  if (value.window === "month") return periodForMonth(addMonths(from, direction));
  const days = value.window === "custom"
    ? Math.max(1, Math.round((parseISO(value.to).getTime() - from.getTime()) / 86400000) + 1)
    : WINDOW_DAYS[value.window];
  const novoFrom = addDays(from, direction * days);
  return { ...value, from: format(novoFrom, ISO), to: format(addDays(novoFrom, days - 1), ISO) };
}

function applyWindow(value: PeriodValue, window: PeriodWindow): PeriodValue {
  const from = parseISO(value.from);
  if (window === "month") return periodForMonth(from);
  if (window === "custom") return { ...value, window };
  return { window, from: value.from, to: format(addDays(from, WINDOW_DAYS[window] - 1), ISO) };
}

function label(value: PeriodValue): string {
  const from = parseISO(value.from);
  if (value.window === "month") return format(from, "MMMM 'de' yyyy", { locale: ptBR });
  return `${format(from, "dd MMM", { locale: ptBR })} – ${format(parseISO(value.to), "dd MMM yyyy", { locale: ptBR })}`;
}

const WINDOWS: { key: PeriodWindow; label: string }[] = [
  { key: "month", label: "Mês" },
  { key: "d14", label: "14 dias" },
  { key: "d7", label: "7 dias" },
  { key: "custom", label: "Personalizado" },
];

export function PeriodBar({ value, onChange }: { value: PeriodValue; onChange: (v: PeriodValue) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const anchorYear = parseISO(value.from).getFullYear();
  const [pickerYear, setPickerYear] = useState(anchorYear);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-default-50 p-1">
        <Button isIconOnly size="sm" variant="light" aria-label="Periodo anterior"
          onPress={() => onChange(shift(value, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="relative">
          <button type="button" className="min-w-40 px-2 text-sm font-semibold capitalize"
            onClick={() => { setPickerYear(anchorYear); setPickerOpen((o) => !o); }}>
            {label(value)}
          </button>
          {pickerOpen && (
            <div className="absolute left-0 top-9 z-50 w-64 rounded-2xl border border-border bg-background p-3 shadow-none">
              <div className="mb-2 flex items-center justify-between">
                <Button isIconOnly size="sm" variant="light" aria-label="Ano anterior"
                  onPress={() => setPickerYear((y) => y - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm font-semibold">{pickerYear}</span>
                <Button isIconOnly size="sm" variant="light" aria-label="Proximo ano"
                  onPress={() => setPickerYear((y) => y + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }, (_, m) => (
                  <button key={m} type="button"
                    className="rounded-xl px-2 py-1.5 text-xs capitalize hover:bg-default-100"
                    onClick={() => { onChange(periodForMonth(new Date(pickerYear, m, 1))); setPickerOpen(false); }}>
                    {format(new Date(pickerYear, m, 1), "MMM", { locale: ptBR })}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button isIconOnly size="sm" variant="light" aria-label="Proximo periodo"
          onPress={() => onChange(shift(value, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button size="sm" variant="flat" onPress={() => onChange(periodForMonth(new Date()))}>Hoje</Button>
      <div className="flex items-center gap-1">
        {WINDOWS.map((w) => (
          <Button key={w.key} size="sm" variant={value.window === w.key ? "solid" : "flat"}
            onPress={() => onChange(applyWindow(value, w.key))}>
            {w.label}
          </Button>
        ))}
      </div>
      {value.window === "custom" && (
        <div className="flex items-center gap-2">
          <input type="date" aria-label="Data inicial" value={value.from}
            className="rounded-xl border border-border bg-default-50 px-2 py-1 text-sm"
            onChange={(e) => onChange({ ...value, from: e.target.value })} />
          <span className="text-sm text-foreground/60">até</span>
          <input type="date" aria-label="Data final" value={value.to}
            className="rounded-xl border border-border bg-default-50 px-2 py-1 text-sm"
            onChange={(e) => onChange({ ...value, to: e.target.value })} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rodar e ver passar** — `npm run test:run -- period-bar` — Expected: PASS. Ajustar acentos dos aria-labels nos testes se divergirem (testes usam regex case-insensitive sem acento — manter aria-labels sem acento no componente, como acima).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(motor): barra de periodo unificada com janelas e seletor de mes"
```

---

## Task 9 (FRONT): Calendário em 3 abas — Ocupação por range + Grade de tarifas

**Files:**
- Modify: `src/presentation/components/pages/dashboard/motor/calendario/page.tsx`
- Modify: `src/presentation/components/organisms/motor/occupancy-grid.tsx` (afrouxar prop)
- Create: `src/presentation/components/organisms/motor/rate-grid.tsx`
- Create: `src/presentation/components/organisms/motor/grade-cell-modal.tsx`
- Test: `src/presentation/components/pages/dashboard/motor/calendario/__tests__/page.test.tsx` (novo — lacuna existente)
- Test: `src/presentation/components/organisms/motor/__tests__/rate-grid.test.tsx`

**Interfaces:**
- Consumes: `useMotorCalendarRange`, `useMotorGrade`, `useUpsertDailyInventory` (Task 7); `PeriodBar`/`periodForMonth` (Task 8); `CellActionModal`, `ESTADO_STYLES`, `PainelPageShell`, `PortalEmptyState`, `useTenantCapabilities`.
- Produces: página `/dashboard/motor/calendario` com HeroUI `Tabs` — `key="ocupacao"` "Ocupação", `key="grade"` "Grade de tarifas", `key="massa"` "Atualização em massa" (conteúdo da aba massa entra na Task 10; nesta task renderiza `PortalEmptyState` com título "Em construção nesta entrega").
  - `RateGrid({ grade, canManage, onCellClick }: { grade: MotorGrade; canManage: boolean; onCellClick: (rt: MotorGradeRoomType, dia: MotorGradeDia) => void })`
  - `GradeCellModal({ tenantId, roomType, dia, canManage, onClose })` — edita preço/mín. noites/fechar venda via `useUpsertDailyInventory`.

- [ ] **Step 1: Afrouxar `OccupancyGrid`**

Em `occupancy-grid.tsx`, trocar `calendar: MotorCalendar` por `calendar: { unidades: MotorCalendarUnidade[] }` (o componente só usa `unidades`). Nada mais muda; testes existentes continuam passando.

- [ ] **Step 2: Escrever os testes que falham**

`__tests__/rate-grid.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RateGrid } from "../rate-grid";
import type { MotorGrade } from "@/src/shared/domain/types/@motor";

const grade: MotorGrade = {
  from: "2026-09-05", to: "2026-09-06",
  room_types: [{
    room_type_id: "rt1", nome: "Suite Casal", capacidade_base: 2, capacidade_max: 3,
    valor_pessoa_adicional: 50, total_units: 2,
    dias: [
      { data: "2026-09-05", preco: 320, min_stay: 2, stop_sell: false, closed_arrival: false, closed_departure: false, override: false, unidades_livres: 1 },
      { data: "2026-09-06", preco: 320, min_stay: 1, stop_sell: true, closed_arrival: false, closed_departure: false, override: false, unidades_livres: 0 },
    ],
  }],
};

describe("RateGrid", () => {
  it("mostra tipo, livres por dia e precos por ocupacao", () => {
    render(<RateGrid grade={grade} canManage onCellClick={vi.fn()} />);
    expect(screen.getByText("Suite Casal")).toBeInTheDocument();
    expect(screen.getByText("2 pessoas")).toBeInTheDocument();
    expect(screen.getByText("3 pessoas")).toBeInTheDocument(); // base + 1
  });

  it("clique na celula de disponibilidade dispara onCellClick", () => {
    const onCellClick = vi.fn();
    render(<RateGrid grade={grade} canManage onCellClick={onCellClick} />);
    fireEvent.click(screen.getByRole("button", { name: /suite casal 2026-09-05/i }));
    expect(onCellClick).toHaveBeenCalledWith(grade.room_types[0], grade.room_types[0].dias[0]);
  });

  it("dia com stop de vendas fica marcado", () => {
    render(<RateGrid grade={grade} canManage onCellClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: /suite casal 2026-09-06.*fechado/i })).toBeInTheDocument();
  });
});
```

`__tests__/page.test.tsx` (padrão dos testes de página do motor — mock do barrel INTEIRO de `@/src/shared/hooks/motor` com todos os hooks que a página importa, + `tenant-capabilities-provider`):

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import MotorCalendarioPage from "../page";

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "tenant_1", hasPermission: () => true }),
}));

const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/src/shared/hooks/motor", () => ({
  useMotorCalendarRange: () => ({
    data: { from: "2026-08-01", to: "2026-08-31", unidades: [{ unit_id: "u1", identificador: "Casal 1", room_type_id: "rt1", room_type_nome: "Suite Casal", dias: [{ data: "2026-08-01", estado: "LIVRE" }] }] },
    isLoading: false, isError: false,
  }),
  useMotorGrade: () => ({ data: { from: "2026-08-01", to: "2026-08-31", room_types: [] }, isLoading: false, isError: false }),
  useCreateBlock: () => mutation,
  useCreateManualReservation: () => mutation,
  useUpsertDailyInventory: () => mutation,
  useBulkDailyInventory: () => mutation,
  useMotorRoomTypes: () => ({ data: [], isLoading: false, isError: false }),
}));

describe("MotorCalendarioPage", () => {
  it("renderiza as tres abas e a ocupacao por padrao", () => {
    render(<MotorCalendarioPage />);
    expect(screen.getByRole("tab", { name: "Ocupação" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Grade de tarifas" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Atualização em massa" })).toBeInTheDocument();
    expect(screen.getByText("Casal 1")).toBeInTheDocument();
  });

  it("troca para a grade de tarifas", () => {
    render(<MotorCalendarioPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Grade de tarifas" }));
    // grade vazia => empty state
    expect(screen.getByText(/nenhuma acomodacao|nenhum tipo/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar** — `npm run test:run -- motor/calendario` e `-- rate-grid` — Expected: FAIL.

- [ ] **Step 4: Implementar `RateGrid`**

`rate-grid.tsx` — tabela com primeira coluna sticky (mesmo padrão do `OccupancyGrid` desktop), header de dias com dia da semana + número; por room_type um bloco de linhas: (1) "Livres" — botão por dia com o número de `unidades_livres`, vermelho (`bg-danger/20 text-danger`) quando `0` ou `stop_sell`, aria-label `${rt.nome} ${dia.data}: ${livres} livres[, fechado]`; (2) linha `"{capacidade_base} pessoas"` com `fmtBRL(dia.preco)` (traço quando `null`), riscado (`line-through`) quando `stop_sell`, badge pequeno com `min_stay` quando `> 1`, ponto indicador quando `override`; (3) linha `"{capacidade_max} pessoas"` apenas se `capacidade_max > capacidade_base`, com `fmtBRL(preco + valor_pessoa_adicional)`. `fmtBRL` local (reais). Room type sem `dias` ou grade sem `room_types` → `PortalEmptyState` com título "Nenhuma acomodação com tarifa no período" e descrição apontando para a tela Tarifas. Clique em qualquer célula do bloco chama `onCellClick(rt, dia)` (somente quando `canManage`; senão células não são botões).

- [ ] **Step 5: Implementar `GradeCellModal`**

No molde do `CellActionModal` (HeroUI Modal, `apiErrorMessage` copiado/importado, `toast`): campos `Input type="number"` "Preço/noite" (default `dia.preco ?? ""`), `Input type="number"` "Mín. noites" (default `dia.min_stay ?? 1`), `Checkbox` "Fechar venda" (default `dia.stop_sell`). Submit → `useUpsertDailyInventory(tenantId).mutateAsync({ room_type_id: roomType.room_type_id, data: dia.data, preco: Number(preco), min_stay: Number(minStay), stop_sell })` → toast sucesso → `onClose()`. Aviso fixo no rodapé: "Edição pontual grava um override que a materialização de tarifas não sobrescreve.". Sem `canManage` → texto explicativo no lugar do form.

- [ ] **Step 6: Recompor a página**

`calendario/page.tsx`: estado `const [period, setPeriod] = useState(() => periodForMonth(new Date()))`; `PainelPageShell` com `actions={<PeriodBar value={period} onChange={setPeriod} />}`; `Tabs` com as 3 abas. Aba Ocupação: legenda `ESTADO_STYLES` + `useMotorCalendarRange(tenantId, period.from, period.to)` + `OccupancyGrid` + `CellActionModal` (fluxo atual preservado). Aba Grade: `useMotorGrade(tenantId, period.from, period.to)` + `RateGrid` + `GradeCellModal` em estado `selected`. Aba Massa: `PortalEmptyState` provisório. `canManage` da grade = `hasPermission("motor.settings.manage")`; da ocupação = regra atual (`motor.blocks.manage || motor.reservations.manage`).

- [ ] **Step 7: Rodar e ver passar** — `npm run test:run -- motor` — Expected: PASS (incluindo occupancy-grid e páginas existentes).

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(motor): calendario em abas com grade de tarifas editavel"
```

---

## Task 10 (FRONT): Aba "Atualização em massa" com preview

**Files:**
- Create: `src/presentation/components/organisms/motor/bulk-update-form.tsx`
- Modify: `src/presentation/components/pages/dashboard/motor/calendario/page.tsx` (substituir o empty state provisório)
- Test: `src/presentation/components/organisms/motor/__tests__/bulk-update-form.test.tsx`

**Interfaces:**
- Consumes: `useBulkDailyInventory`, `useMotorRoomTypes` (Task 7); `DOW_OPTIONS`/`dowLabel` — copiar o bloco de `pages/dashboard/motor/tarifas/page.tsx` para um util compartilhado `src/presentation/components/organisms/motor/dow.ts` e importar nos dois lugares (DRY).
- Produces: `BulkUpdateForm({ tenantId, canManage }: { tenantId: string; canManage: boolean })`.

- [ ] **Step 1: Extrair `dow.ts`**

Criar `organisms/motor/dow.ts` exportando `DOW_OPTIONS` (array `{ bit, label }` seg=1…dom=64) e `dowLabel(mask)` copiados de `tarifas/page.tsx`; atualizar `tarifas/page.tsx` para importar de lá. `npm run test:run -- motor/tarifas` — Expected: PASS.

- [ ] **Step 2: Escrever os testes que falham**

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BulkUpdateForm } from "../bulk-update-form";

const mutateAsync = vi.fn();
vi.mock("@/src/shared/hooks/motor", () => ({
  useBulkDailyInventory: () => ({ mutateAsync, isPending: false }),
  useMotorRoomTypes: () => ({
    data: [{ id: "rt1", nome: "Suite Casal", units: [] }, { id: "rt2", nome: "Teste", units: [] }],
    isLoading: false, isError: false,
  }),
}));

describe("BulkUpdateForm", () => {
  it("preview chama a mutation com dry_run e mostra o resumo", async () => {
    mutateAsync.mockResolvedValue({ total_datas: 10, atualizar: 8, criar: 2, ignoradas_sem_preco: 0, aplicado: false });
    render(<BulkUpdateForm tenantId="tenant_1" canManage />);
    fireEvent.click(screen.getByLabelText("Suite Casal"));
    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Fim"), { target: { value: "2026-09-30" } });
    fireEvent.change(screen.getByLabelText(/preco\/noite/i), { target: { value: "400" } });
    fireEvent.click(screen.getByRole("button", { name: /pre-visualizar/i }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ dry_run: true, preco: 400 })));
    expect(await screen.findByText(/8 datas atualizadas/i)).toBeInTheDocument();
  });

  it("aplicar so habilita depois do preview e envia sem dry_run", async () => {
    mutateAsync.mockResolvedValue({ total_datas: 10, atualizar: 8, criar: 2, ignoradas_sem_preco: 0, aplicado: true });
    render(<BulkUpdateForm tenantId="tenant_1" canManage />);
    expect(screen.getByRole("button", { name: /aplicar/i })).toBeDisabled();
  });

  it("sem permissao mostra aviso e nenhum form", () => {
    render(<BulkUpdateForm tenantId="tenant_1" canManage={false} />);
    expect(screen.getByText(/permissao/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar** — `npm run test:run -- bulk-update` — Expected: FAIL.

- [ ] **Step 4: Implementar**

`bulk-update-form.tsx` — estado: `roomTypeIds: Set<string>` (checkbox por tipo, com "Marcar todos"/"Desmarcar"), `from`/`to` (`Input type="date"` com `label="Início"`/`label="Fim"`), `dowMask` (checkbox por `DOW_OPTIONS`, default 127), campos opcionais `preco`, `minStay`, `stopSell` (`Select` com "— não alterar —"/"Fechar venda"/"Abrir venda" → `undefined | true | false`), idem `closedArrival`/`closedDeparture`; `resumo: MotorBulkResumo | null`. Montagem do DTO: campos vazios ficam `undefined` (não alterar). Botão "Pré-visualizar" → `mutateAsync({ ...dto, dry_run: true })` → `setResumo`. Card de resumo: "`{atualizar}` datas atualizadas · `{criar}` criadas · `{ignoradas_sem_preco}` ignoradas (sem preço base — informe um preço para criá-las)". Botão "Aplicar" (`isDisabled={!resumo}`) → confirmação HeroUI Modal ("Aplicar alterações em N datas? Esta ação grava overrides.") → `mutateAsync(dto)` → toast sucesso + `setResumo(null)`. QUALQUER mudança nos campos após preview → `setResumo(null)` (preview obrigatório de novo). `canManage=false` → `PortalEmptyState` "Você não tem permissão para editar tarifas.". Na página, substituir o empty provisório da aba massa por `<BulkUpdateForm tenantId={tenantId} canManage={hasPermission("motor.settings.manage")} />`.

- [ ] **Step 5: Rodar e ver passar** — `npm run test:run -- motor` — Expected: PASS (atualizar o mock do barrel no page.test.tsx da Task 9 se faltar hook).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(motor): atualizacao em massa de tarifas com preview"
```

---

## Task 11 (FRONT): Home unificada

**Files:**
- Create: `src/presentation/components/pages/dashboard/admin-dashboard.tsx` (mover o branch admin atual)
- Create: `src/presentation/components/organisms/home/manager-home.tsx`
- Modify: `src/presentation/components/pages/dashboard/page.tsx` (vira seletor de branch sem hooks condicionais)
- Delete: `src/presentation/components/organisms/hotel-portal/hotel-dashboard-view.tsx` (após `Grep "HotelDashboardView" src` confirmar que só a home usa)
- Test: `src/presentation/components/organisms/home/__tests__/manager-home.test.tsx`

**Interfaces:**
- Consumes: `useActiveHotelClient`, `useHotelHome` (Task 7), `useHotelPortalDashboard` (existente — canais/ocupação), `PainelPageShell`/`PainelSection`, `MetricCard` (mesmo import da página do funil), `PeriodPicker` + `resolvePreset`/`PeriodPreset` (mesmos imports e uso da página `hotel/overview` ANTES da Task 6 — copiar do histórico git: `git show HEAD~N:src/presentation/components/pages/dashboard/hotel/overview/page.tsx`, ou do componente `PeriodPicker` direto), `LineChart` recharts (copiar o bloco do gráfico "Diretas vs OTA" de `hotel-dashboard-view.tsx` antes de deletá-lo), formatador local `fmt` em reais (copiar de `hotel-dashboard-view.tsx`).
- Produces: `/dashboard` renderizando `ManagerHome` para manager e `AdminDashboard` para os demais.

- [ ] **Step 1: Escrever os testes que falham**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ManagerHome } from "../manager-home";

vi.mock("@/src/shared/hooks/hotel-portal", () => ({
  useActiveHotelClient: () => ({ data: { id: "client_1", hotel_name: "Pousada Dona Tereza" }, isLoading: false, isError: false }),
  useHotelHome: () => ({
    data: {
      period: { from: "2026-08-01", to: "2026-08-31" },
      funil: {
        conversasIniciadas: { value: 42, previous: null, delta: null, source: "auto" },
        distribuicaoFunil: [{ stage: "RESERVA_CONFIRMADA", count: 5 }],
        leadsProntos: 7, taxaQualificacao: 0.5, contatosPausados: 0,
      },
      motor: {
        receita: 10170, reservas: 5, ticket_medio: 2034, room_nights: 12,
        canceladas: { quantidade: 1, valor: 320 },
        a_recuperar: { quantidade: 4, valor: 1280 },
        receita_bot: 8000,
        por_origem: [{ origem: "BOT_WHATSAPP", reservas: 4, receita: 8000 }],
      },
    },
    isLoading: false, isError: false,
  }),
  useHotelPortalDashboard: () => ({
    data: {
      kpi: { direct_bookings: 3, ota_bookings: 2, direct_revenue: 6000, ota_revenue: 4000, commission_recovered_month: 500, commission_recovered_total: 2000, commission_projected_annual: 6000, occupancy_rate: 62, target_occupancy: 70, target_direct_pct: 60, site_visitors: 0, site_conversion_rate: 0 },
      timeseries: [], contract_start: "2026-01-01", ota_data_missing: false,
    },
    isLoading: false, isError: false,
  }),
}));

describe("ManagerHome", () => {
  it("mostra funil, motor, canais e ocupacao numa tela so", () => {
    render(<ManagerHome />);
    expect(screen.getByText(/conversas iniciadas/i)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(/a recuperar/i)).toBeInTheDocument();
    expect(screen.getByText(/gerado pelo bot/i)).toBeInTheDocument();
    expect(screen.getByText(/ocupa/i)).toBeInTheDocument();
  });
});
```

Se `PeriodPicker` for import direto na `ManagerHome`, adicionar `vi.mock` dele retornando `() => null` para não arrastar dependências.

- [ ] **Step 2: Rodar e ver falhar** — `npm run test:run -- manager-home` — Expected: FAIL.

- [ ] **Step 3: Implementar**

1. `admin-dashboard.tsx`: recortar TODO o conteúdo do branch admin de `pages/dashboard/page.tsx` (hooks `useStatsDashboard`/`useStatsTimeseriesModules`, hero, `CmsOverviewCards`, grids) para o novo arquivo como `export default function AdminDashboard()`. Não mudar comportamento.
2. `manager-home.tsx` — `export function ManagerHome()`:
   - `useActiveHotelClient()`; `useState<PeriodPreset>("current-month")` + `resolvePreset`; `useHotelHome(client?.id ?? null, period)`; `useHotelPortalDashboard(client?.id ?? null)`.
   - `PainelPageShell title={client?.hotel_name ?? "Visão geral"} description="Desempenho do bot, do motor de reservas e dos canais." actions={<PeriodPicker .../>}` com `isLoading`/`isError` combinando os hooks (`!client` sem loading → `PortalEmptyState` "Nenhum hotel configurado para este workspace").
   - `PainelSection "Funil do bot"`: MetricCards — Conversas iniciadas (`funil.conversasIniciadas.value`), Fechamentos (`distribuicaoFunil` stage `RESERVA_CONFIRMADA`), Taxa de conversão (`fechamentos / conversasIniciadas.value`, zero-safe, `formatPercent`-like local), Gerado pelo bot (`fmtBRL(motor.receita_bot)`). Link "Ver funil completo →" para `/dashboard/hotel/funil`.
   - `PainelSection "Motor de reservas"`: Receita (`fmtBRL(motor.receita)`), Ticket médio, Room nights, Canceladas (`{quantidade} · fmtBRL(valor)`), **A recuperar** (`{quantidade} holds expirados · fmtBRL(valor)`) com sublabel "hóspedes que não concluíram o pagamento — o bot faz o follow-up".
   - `PainelSection "Canais"`: Comissão recuperada no mês / total / projeção anual (`dashboard.kpi`), gráfico "Diretas vs OTA — últimos 6 meses" (bloco `LineChart` copiado de `hotel-dashboard-view.tsx`), banner se `ota_data_missing`.
   - `PainelSection "Ocupação"`: `occupancy_rate` vs `target_occupancy` (card com barra de progresso simples).
   - Valores do motor em REAIS (`fmtBRL` local); valores do `dashboard.kpi` em reais também (o legado formata sem dividir por 100 — copiar `fmt` do `hotel-dashboard-view.tsx`).
3. `pages/dashboard/page.tsx` vira:

```tsx
"use client";

import usePermissions from "@/src/shared/hooks/use-permissions";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { ManagerHome } from "@/src/presentation/components/organisms/home/manager-home";
import AdminDashboard from "./admin-dashboard";

export default function DashboardPage() {
  const { isManager } = usePermissions();
  if (isManager) {
    return (
      <LayoutScopeRoot>
        <ManagerHome />
      </LayoutScopeRoot>
    );
  }
  return <AdminDashboard />;
}
```

(Conferir se `usePermissions` é export default ou nomeado e copiar o import atual da página.) 4. `Grep "HotelDashboardView" src` → se só a home referenciava, deletar o arquivo.

- [ ] **Step 4: Rodar e ver passar** — `npm run test:run` (suite completa) e `npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(home): visao unica com funil do bot, motor e canais"
```

---

## Task 12 (FRONT): Passe de design nas telas do motor

Antes de editar, **invocar o skill `frontend-design:frontend-design`** e verificar cada tela no navegador (skill `run`) — este passe é visual e iterativo; os itens abaixo são o contrato mínimo verificável.

**Files:**
- Modify: `src/presentation/components/pages/dashboard/motor/tarifas/page.tsx`
- Modify: `src/presentation/components/pages/dashboard/motor/reservas/page.tsx`
- Modify: `src/presentation/components/pages/dashboard/motor/acomodacoes/page.tsx`
- Modify: `src/presentation/components/pages/dashboard/motor/canais/page.tsx`
- Modify: `src/presentation/components/organisms/motor/occupancy-grid.tsx`
- Tests: os `__tests__/page.test.tsx` existentes dessas telas (ajustar asserts que quebrarem por texto/markup)

**Interfaces:**
- Consumes: `PortalDataTable`/`PortalDataTableColumn` (`organisms/hotel-portal/painel/data-table.tsx`), `PortalEmptyState`, tokens do tema (cards `rounded-3xl border border-border bg-default-50 shadow-none`, design flat sem sombra).

- [ ] **Step 1: Tarifas** — substituir a `<table className="w-full text-sm">` manual de "Regras de preço" por `PortalDataTable` (colunas: Acomodação, Temporada, Dias — `dowLabel(mask)`, Preço/noite — `fmtBRL`, Mín. noites, Ações — botão excluir com confirmação). Estados vazios de Temporadas e Regras viram `PortalEmptyState` com `actionLabel` focando o form correspondente. Hierarquia: títulos de seção `text-lg font-semibold`, descrições `text-sm text-foreground/60`.
- [ ] **Step 2: Reservas/Acomodações/Canais** — mesma régua: tabelas manuais → `PortalDataTable` onde houver; empty states com ação; espaçamentos `space-y-8` do shell (sem `space-y` gigantes ad hoc); toda ação destrutiva (excluir regra/temporada/bloqueio) com Modal de confirmação padronizado (título "Confirmar exclusão", corpo descrevendo o alvo).
- [ ] **Step 3: OccupancyGrid** — densidade: células `h-8` (hoje maiores), colunas de fim de semana com fundo `bg-default-100/60` no header, coluna do dia atual com anel `ring-1 ring-primary/40`, primeira coluna sticky mantida.
- [ ] **Step 4: Verificação visual** — subir o front (skill `run` / preview) e conferir as 5 telas do motor + home em desktop e mobile (grid vira lista). Ajustar o que destoar.
- [ ] **Step 5: Rodar suite** — `npm run test:run` — Expected: PASS (ajustar asserts de texto que o redesign mudou, sem afrouxar as verificações de comportamento).
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "style(motor): passe de design nas telas do motor e mapa de ocupacao"
```

---

## Verificação final (após todas as tasks)

- [ ] `BACK`: `npm test` completo — PASS.
- [ ] `FRONT`: `npm run test:run` + `npx tsc --noEmit` — PASS.
- [ ] Smoke manual com os dois servidores: navegar `/dashboard` (manager e superadmin), `/dashboard/motor/calendario` (3 abas, período Mês/14/7/Personalizado, edição pontual, bulk com preview), `/dashboard/hotel/overview` e `/dashboard/hotel/ota` redirecionando, `/dashboard/stats` retornando 404.
- [ ] NÃO rodar revisão de qualidade/spec por task (decisão registrada: revisão única no final de tudo).
