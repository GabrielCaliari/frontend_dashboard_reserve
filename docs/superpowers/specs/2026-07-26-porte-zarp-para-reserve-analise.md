# Porte Zarp → Reserve — Análise de Gap e Roadmap

**Data:** 2026-07-26
**Escopo:** 4 repositórios
**Objetivo:** trazer para o Reserve (backend + painel) tudo que a Zarp evoluiu em segurança, tenant, arquitetura e UX, deixando o Reserve alinhado e pronto para receber o `PLANO_PAINEL_RESERVE_1.md`.

| Papel | Repositório | Caminho |
|---|---|---|
| Origem (referência) | `backend_api_zarp-admin` | `C:\Users\gabri\Git\backend_api_zarp-admin` |
| Origem (referência) | `frontend_dashboard_zarp-admin` | `C:\Users\gabri\Git\frontend_dashboard_zarp-admin` |
| Destino | `backend_reserve` | `C:\Users\gabri\OneDrive\Documents\GitHub\backend_reserve` |
| Destino | `frontend_dashboard_reserve` | `C:\Users\gabri\OneDrive\Documents\GitHub\frontend_dashboard_reserve` |

---

## 0. Resumo executivo

Os dois projetos são forks do mesmo tronco. As **dependências do frontend são idênticas** (mesmo `package.json`, mesmo HeroUI, mesmo Next 16.1.6, mesmo React 19.2.4) — o que divergiu não foi a stack, foi **arquitetura, segurança e plataforma de UI**. O backend divergiu mais: a Zarp tem 151 modelos Prisma contra 97 do Reserve, e uma camada de autorização inteira que o Reserve não possui.

O que a Zarp ganhou e o Reserve não tem, em ordem de gravidade:

1. **Autorização por permissão (RBAC)** — a Zarp decide acesso por `recurso.ação`; o Reserve ainda compara nome de papel (`@Roles`). Não existe `Permission`, `RolePermission`, `PermissionsGuard`, override por admin, nem matriz documentada.
2. **Deny-by-default** — a Zarp tem `SecurityPostureGuard` global: rota sem guard nenhum é 403. O Reserve **não registra guard global algum**; hoje 12 controllers não têm `@UseGuards`, e dois deles não parecem ser públicos de propósito.
3. **Credenciais** — o Reserve usa PBKDF2 com **856 iterações** (a recomendação OWASP para PBKDF2-SHA512 é 210.000 — está 246× abaixo) e compara hash com `===`, que vaza tempo. Não há lockout de conta. `POST /admin/authenticate` **não tem rate limit nenhum**.
4. **Bootstrap** — sem `helmet`, sem `ThrottlerGuard` global, `ValidationPipe` sem `whitelist` (mass assignment), Swagger sempre público em produção, middleware de timeout de upload casando por substring (`req.path.includes('/upload')`).
5. **Identidade de tenant** — o Reserve tem `Tenant.domain` como coluna única de string; a Zarp tem tabela `TenantDomain` (N domínios + regex) alimentando um **CORS dinâmico com cache**. O Reserve tem CORS estático de env.
6. **Módulos e settings por tenant** — a Zarp tem `TenantSetting`, `TenantTypeModulePolicy`, `ETenantType` (MASTER/COMMON/EDUCATIONAL), `ModuleAccessGuard` e um hub de configurações. O Reserve não tem nada disso.
7. **Frontend — cache por tenant** — o Reserve instancia o `QueryClient` como singleton de módulo em `src/app/providers.tsx`. Trocar de tenant **não limpa o cache**: dados do tenant A ficam visíveis para o tenant B até expirar o `staleTime`. A Zarp resolve com `TenantQueryProvider`, que rotaciona o client por tenant.
8. **Frontend — arquitetura** — a Zarp migrou para Clean/Hexagonal + DDD (`app/modules/presentation/shared/infraestructure`, cada pasta com seu `.md` de regras) e gera a camada de transporte a partir do OpenAPI (`nextjs-openapi-codegen`). O Reserve mantém `common/` + `components/` planos e serviços escritos à mão.
9. **Frontend — plataforma de listas** — a Zarp tem `entity-list` (33 arquivos, com testes), `entity-actions` e `resource-list`: paginação, filtros, seleção, ações em massa, mutação otimista, estados vazio/erro/proibido e variantes card/tabela, tudo com alvo de toque validado. O Reserve refaz tabela na mão em cada página.
10. **Frontend — capabilities** — a Zarp tem `createAccessPolicy` + `tenant-capabilities-provider`, alimentados por `GET /api/tenant-capabilities`, que apagam do menu e dos botões o que o admin não pode fazer. O Reserve usa um `usePermissions()` com booleanos fixos por papel e que **lê cookie durante render** (hydration mismatch).

---

## 1. Backend — inventário de gaps

### 1.1 Bootstrap (`src/main.ts`, `src/app.module.ts`)

| Item | Zarp | Reserve | Impacto |
|---|---|---|---|
| `helmet` | ativo, CSP off + `crossOriginResourcePolicy: cross-origin` | **ausente** (nem está no `package.json`) | headers de segurança |
| `ThrottlerGuard` global | `APP_GUARD` + `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])` | **nenhum `APP_GUARD` registrado** | brute force |
| `@Throttle` em rotas de auth | 10 usos | 2 usos, **nenhum no login** | brute force |
| `trust proxy` | `set('trust proxy', 1)` | ausente | throttle atrás do nginx limita o proxy, não o cliente |
| `ValidationPipe` | `{ transform: true, whitelist: true }` | `{ transform: true }` | mass assignment |
| Limite de body | `json/urlencoded limit: '5mb'` + `rawBodySaver` | `bodyParser: true` default | DoS por payload |
| Swagger | `setupSwagger()` gated por `SWAGGER_ENABLED` fora de dev | sempre montado em `/api/docs` | expõe superfície da API |
| Timeout de upload | regex **ancorada** (`/^\/api\/cms\//`) só em POST/PUT/PATCH | `req.path.includes('/upload')` — substring, qualquer método | qualquer rota com "upload" no caminho ganha 5 min |
| `PrismaExceptionFilter` | existe | **ausente** | erro do Prisma vaza para a resposta |
| Graceful shutdown | SIGINT/SIGTERM + `process.send('ready')` | ausente | deploy derruba requisição em voo |
| `/health` | rota dedicada antes dos guards | ausente | |

### 1.2 Credenciais (`src/shared/providers/`)

`hash.provider.ts` — Reserve:

```ts
private readonly ITERATIONS = 856;
// ...
return hash === passwordHash;   // comparação não constante no tempo
```

Zarp: `ITERATIONS_V1 = 856` (legado, só para validar hashes antigos), `ITERATIONS_V2 = 210_000`, `compare(value, salt, hash, version = 2)` terminando em `crypto.timingSafeEqual`, e `hash()` sempre emitindo v2. O versionamento (`hash_version` na tabela) é o que permite subir as iterações **sem invalidar as senhas existentes** — cada login bem-sucedido contra um hash v1 re-hasheia para v2.

`jwt.provider.ts` — Reserve trata assinatura forjada como token expirado:

```ts
if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
  return { jwt: token, expired: true };
}
```

Zarp separa: `TokenExpiredError` → `expired: true`; `JsonWebTokenError`/`NotBeforeError` → `invalid: true`.

Ausentes no Reserve:
- `shared/auth/account-lockout.policy.ts` — lockout progressivo persistido (5 falhas → 15 min, dobrando por ciclo, teto 24 h).
- Colunas `hash_version`, `failed_attempts`, `locked_until` em `AdminCredential` e `UserCredential`.
- `shared/validators/is-strong-password.validator.ts` — 10+ caracteres com maiúscula, minúscula, dígito e símbolo. Hoje o Reserve tem `@MinLength(6)` em 4 DTOs (`auth-admin.dto.ts:13`, `admin-management.dto.ts:54`, `create-user.dto.ts:33`, `create-client.dto.ts:23`).

> Nota: o Reserve **não tem** `CustomerCredential` (a Zarp tem três stores de credencial; o Reserve tem duas: `AdminCredential` e `UserCredential`). O porte cobre só as duas que existem.

### 1.3 Autorização

Zarp `src/shared/auth/` tem 40+ arquivos; o Reserve tem 16. Falta inteiro:

| Arquivo | O que faz |
|---|---|
| `rbac/permission-matrix.ts` | fonte única de verdade: lista de permissões `recurso.ação` + concessão cumulativa por papel. Alimenta o seed e o `RBAC-MATRIX.md` |
| `rbac/permissions.service.ts` | resolve permissões do papel, cache `Map` com TTL de 5 min + invalidação explícita |
| `rbac/permission-overrides.service.ts`, `rbac/apply-overrides.ts` | `allow`/`deny` por admin dentro de um tenant |
| `rbac/tenant-permission-policy.service.ts` | política por tipo de tenant |
| `decorators/require-permissions.decorator.ts` | `@RequirePermissions('leads.update')` |
| `decorators/public.decorator.ts` | `@Public()` — classificação explícita de rota aberta |
| `decorators/requires-module.decorator.ts` | `@RequiresModule('cms')` |
| `guards/permissions.guard.ts` | decisão final; `super_admin` faz bypass, `company_admin` normaliza para `manager` |
| `guards/security-posture.guard.ts` | deny-by-default; kill-switch `SECURITY_POSTURE_ENFORCE=false` |
| `guards/module-access.guard.ts` | 403 se o módulo está desligado para o tenant |
| `guards/master-tenant.guard.ts` | rotas exclusivas do tenant MASTER |
| `constants/gateable-modules.ts` | quais módulos podem ser ligados/desligados |
| `module-access.util.ts` | `isModuleEnabled` com cache |
| `internal-secret.util.ts` | comparação constante para segredo interno de seed |
| `access/active-access.where.ts` | filtro reutilizável de acesso ativo |

Ordem da cadeia na Zarp: `AdminJwtGuard → TenantGuard → ModuleAccessGuard → PermissionsGuard`.

**Controllers do Reserve hoje sem `@UseGuards` (12 de 63)** — a auditoria de deny-by-default precisa classificar cada um:

| Controller | Classificação esperada |
|---|---|
| `src/app.controller.ts` | `@Public()` |
| `reserve-b2b-payments/.../b2b-webhook.controller.ts` | `@Public()` (assinatura Stripe) |
| `reserve-b2c-subscriptions/.../b2c-stripe-webhook.controller.ts` | `@Public()` (assinatura Stripe) |
| `reserve-subscriptions/.../stripe-webhook.controller.ts` | `@Public()` (assinatura Stripe) |
| `reserve-unified-webhooks/.../unified-stripe-webhook.controller.ts` | `@Public()` (assinatura Stripe) |
| `reserve-client-portal/.../booking-webhook.controller.ts` | `@Public()` — **verificar se valida assinatura** |
| `reserve-client-portal/.../whatsapp-redirect.controller.ts` | `@Public()` (redirect de link rastreado) |
| `reserve-b2c-products/.../public-b2c-products.controller.ts` | `@Public()` |
| `reserve-coupons/.../public-coupons.controller.ts` | `@Public()` |
| `reserve-reports/.../public-analytics-report.controller.ts` | `@Public()` (checar se há chave por coleção) |
| `reserve-auth/.../admin-email.controller.ts` | ⚠️ **precisa de guard** — rota administrativa sem autenticação |
| `reserve-mailer/.../email-campaign-batch.controller.ts` | ⚠️ **precisa de guard ou segredo interno** — dispara lote de campanha |

Os dois marcados com ⚠️ são achados de segurança independentes do porte e devem ser tratados na Fase 2 Task 1, não deixados para o fim.

### 1.4 Modelos Prisma ausentes no Reserve (recorte de segurança/tenant)

```
Permission                        RBAC: catálogo de permissões
RolePermission                    RBAC: concessão papel → permissão
AdminPermissionOverride           allow/deny por admin dentro do tenant
TenantPermissionOverride          allow/deny por papel dentro do tenant
TenantTypeRolePermissionPolicy    política de permissão por tipo de tenant
TenantTypeModulePolicy            política de módulo por tipo de tenant
TenantSetting                     settings por tenant (module/key/value JSON)
TenantDomain                      N domínios por tenant (+ regex) → CORS dinâmico
AccessAuditLog                    auditoria de grant/revoke
AdminPasswordResetToken           reset de senha de admin
ActivationToken                   ativação de conta
TenantEmailBranding               branding de e-mail por tenant
EmailSuppression                  lista de supressão de e-mail
APIToken                          token de API
```

Enum ausente: `ETenantType { MASTER COMMON EDUCATIONAL }` e `EPermissionEffect`.
Campo ausente: `Tenant.tenantType`.

> **Restrição de nomenclatura.** A Zarp normalizou o schema para **camelCase** (`adminId`, `createdAt`) na migração `2026-07-22-tenant-identity-policy-and-prisma-normalization`. O Reserve continua em **snake_case** (`admin_id`, `created_at`). Código portado da Zarp **não compila** sem adaptar os nomes de campo. Decisão do porte: **manter snake_case no Reserve** e adaptar na cópia. Normalizar o schema do Reserve é um refactor de alto risco que não pertence a este porte — fica registrado como dívida.

### 1.5 Módulos de backend ausentes

| Módulo Zarp | Traz para o Reserve? |
|---|---|
| `zarp-settings` | **sim** — base do hub de configurações e do gating de módulos |
| `zarp-tenant-branding` | **sim** — o `PLANO_PAINEL_RESERVE_1.md` §2.4 exige identidade RÉSERVE por tenant |
| `zarp-automations` | avaliar — o Reserve tem automação de WhatsApp própria no plano (§5), pode conflitar |
| `zarp-metrics` | avaliar — o Reserve tem `StatsIntegration` + `reserve-stats` próprios |
| `zarp-prospecting`, `zarp-courses`, `zarp-events` | **não** — domínio exclusivo da Zarp |
| `zarp-provisioning`, `zarp-webhooks` | avaliar depois |

### 1.6 Documentação e tipagem

- `docs/RBAC-MATRIX.md` — matriz gerada, não existe no Reserve.
- `src/swagger.config.ts` — extraído e testado (`swagger.config.spec.ts`); no Reserve o Swagger está inline no `main.ts`.
- `src/app.di-boundaries.spec.ts` — teste que trava violação de fronteira de DI. Não existe no Reserve.
- Tipagem completa de resposta no Swagger (plano `2026-07-26-complete-swagger-response-typing`) — pré-requisito para o codegen do frontend gerar tipos úteis.

---

## 2. Frontend — inventário de gaps

### 2.1 Arquitetura

Zarp (`src/SRC.md`, com `.md` de regras por pasta):

```
src/
  app/              rotas Next — só composição, re-exporta de presentation/
  modules/          domínios de negócio, camadas DDD (domain/application/infrastructure/presentation)
  presentation/     UI e orquestração compartilhada entre módulos (atoms/organisms/layouts/pages)
  shared/           cross-module sem React (tipos, http, utils, stores, query)
  infraestructure/  adaptadores de saída para o backend (HTTP), sem regra de negócio
```

Reserve: `src/{app,common,components,i18n,layout,messages}` — sem fronteira documentada, sem barrel por domínio, serviços e hooks agrupados por tipo de arquivo em vez de por domínio.

Módulos já existentes na Zarp: `access-management`, `automations`, `cms`, `mailer`, `notifications`, `prospecting`, `settings`.

### 2.2 Camada de transporte gerada

Zarp: `nextjs-openapi-codegen` 1.0.2 + `nextjs-codegen.config.mjs` gera **81 pacotes de serviço** em `src/infraestructure/server/services/` a partir de `/api/docs-json`. Scripts `codegen` e `codegen:diff`. Regra do `AGENTS.md`: a pasta gerada nunca é editada à mão; o mapeamento estável fica em `modules/<domain>/infrastructure/`.

Reserve: 40+ serviços escritos à mão em `src/common/services/`, cada um repetindo montagem de URL e tipos.

### 2.3 Cache por tenant — vazamento de dados entre tenants

Reserve, `src/app/providers.tsx`:

```ts
const queryClient = new QueryClient({ /* ... */ });   // singleton de módulo

export function Providers({ children, themeProps }: ProvidersProps) {
  return <QueryClientProvider client={queryClient}>{/* ... */}</QueryClientProvider>;
}
```

O client vive fora do componente e nunca é recriado. Ao trocar de tenant no `TenantSelector`, as entradas do tenant anterior continuam no cache e são servidas como *fresh* pelo `staleTime` de 60 s.

Zarp, `src/shared/query/tenant-query-provider.tsx`: o `QueryClientProvider` recebe `key={`tenant:${tenantId}`}`, então trocar de tenant desmonta a árvore e cria um client novo; o `useEffect` de cleanup faz `cancelQueries()` + `clear()` no client antigo.

### 2.4 Capabilities e permissões

| Item | Zarp | Reserve |
|---|---|---|
| Leitura do papel | `useSyncExternalStore` — hidratação consistente | `getCookie()` direto no render → mismatch SSR/client |
| Política de acesso | `shared/domain/access-management/access-policy.ts` (`createAccessPolicy`, `can()`, `canActOnAdmin()`, hierarquia, proteção contra auto-ação destrutiva) + testes | ausente |
| Capabilities do tenant | `modules/settings/domain/tenant-capabilities.ts` + `tenant-capabilities-provider.tsx`, normalizando `GET /api/tenant-capabilities` (tenantType, isMasterTenant, role, módulos com fonte de herança, permissões) | ausente |
| Navegação filtrada | `modules/settings/domain/navigation.ts` + `dashboard-visibility.ts` | menu fixo em `aside.tsx` |

Detalhe do `tenant-store` do Reserve: ainda carrega `dashboardScope: 'tenant' | 'global'`. A Zarp **removeu** esse conceito com uma migração versionada do store (`version: 3` + `migrate` que descarta o campo), substituindo por `isMasterTenant` vindo das capabilities. O Reserve precisa da mesma migração para não carregar campo morto em cookie de sessão existente.

### 2.5 Plataforma de listas e ações

Ausente por completo no Reserve:

- `presentation/components/organisms/entity-list/` — 33 arquivos: `use-entity-list-controller`, `query-state`, `selection`, `optimistic`, `local-query`, `capabilities`, `entity-list-table`, `entity-list-filters`, `entity-list-pagination`, `entity-list-states`, `entity-row-actions`, `entity-list-layout`, mais `entity-list-touch-targets.test.tsx` e `types.test-d.ts`.
- `organisms/entity-actions/` — provider + reducer + `bulk-executor` para ações em massa com progresso.
- `organisms/resource-list/` — variante operacional mais leve.
- `shared/query/create-optimistic-mutation.ts` — helper de mutação otimista.
- `shared/hooks/use-list-query-state.ts` — estado de lista sincronizado com a URL.

Planos de origem: `2026-07-20-entity-list-foundation`, `2026-07-20-entity-actions-platform`, `2026-07-20-primary-entity-list-migration`, `2026-07-23-entity-list-card-and-table-variant`.

### 2.6 Design e UX

O `docs/DESIGN.md` da Zarp (193 linhas) é o design system canônico e **não existe no Reserve**. Diferenças concretas de token (`globals.css`, 447 vs 440 linhas):

| Token / regra | Zarp | Reserve |
|---|---|---|
| `--header-height` / `--sidebar-width` | `80px` / `310px` | **ausentes** — medidas hard-coded nos componentes |
| raio do card | `16px` (densidade de admin) | `30px` (raio da landing page, largo demais para admin) |
| classe do card | `.card-zarp` | `.card-reserve` |
| fonte | `var(--font-sans)` | `var(--font-nunito)` |
| input `time` | força 24 h escondendo o campo AM/PM | ausente |

O `DESIGN.md` §5 registra duas regras que valem para o Reserve: **admin não usa azul** como cor informativa/link (usa a família verde da marca) e **admin não usa `blur-3xl` glow** — decoração de landing page em UI densa.

Reserve tem também **dano de formatação** de scripts de manipulação em massa que ainda estão versionados na raiz (`fix_spacing.js`, `remove_shadows.js`): imports saíram como `from"react"` (sem espaço) em `providers.tsx`, `aside.tsx` e outros. Deve ser revertido com Prettier e os scripts removidos.

Planos de UX na Zarp que valem porte: `2026-07-24-dashboard-grid-redesign` + `2026-07-24-dashboard-bento-real-data`, `2026-07-23-stats-visual-consistency`, `2026-07-25-tenant-settings-hub`, `2026-07-25-access-management-workspaces`, `2026-07-22-crm-experience-redesign`, `2026-07-23-lead-pipeline-kanban`, `2026-07-23-lead-card-list`.

### 2.7 Notificações

Aqui o Reserve está **na frente** em parte: já tem `notification-scheduler.service.ts`, `NotificationSettingsController`, `notification-settings.repository.ts` e o modelo `TenantNotificationSettings` — que a Zarp não tem.

O que falta trazer:
- `notification-view.tsx` — visão somente leitura para o tenant (commit `f43133a`).
- Persistência do estado de leitura + inbox em React Query (commit `5584869`).
- `notification-event-labels.ts` + exibir evento disparador e tenant na notificação (commit `dd835a8`).
- `notification-list-definition.tsx` / `notification-list-adapter.ts` — a lista de notificações sobre a plataforma `entity-list`.
- DTOs de resposta tipados (`notification-response.dto.ts`, `list-tenant-notifications-query.dto.ts`).

### 2.8 Testes e acessibilidade

Ambos têm `vitest` + `vitest-axe` + `fast-check` no `package.json`. A Zarp **usa**: testes colocados ao lado de quase todo arquivo de plataforma (`*.test.tsx`, `types.test-d.ts` para tipos, `entity-list-touch-targets.test.tsx` para alvo de toque). O Reserve tem 5 arquivos de teste no total. `fast-check` e `vitest-axe` estão instalados e não usados.

---

## 3. Roadmap — 5 fases

Cada fase entrega software funcionando e testável por si. A ordem é por **dependência técnica**, não por valor percebido.

### Fase 1 — Backend: hardening de bootstrap e credenciais
`backend_reserve/docs/superpowers/plans/2026-07-26-fase1-backend-hardening.md`

helmet · `whitelist` no ValidationPipe · `trust proxy` · limites de body · Swagger gated · `PrismaExceptionFilter` · timeout de upload ancorado · graceful shutdown · `/health` · ThrottlerGuard global + `@Throttle` no login · PBKDF2 v2 com `hash_version` · `timingSafeEqual` · lockout progressivo · `IsStrongPassword` · `JwtProvider` separando forjado de expirado.

**Por que primeiro:** nenhuma dependência das outras fases, corrige os achados mais graves, e a migração de `hash_version` precisa estar aplicada antes de qualquer outra migração tocar as tabelas de credencial.
**Coordenação com o frontend:** a política de senha forte muda a mensagem de erro do formulário de login/cadastro. Trocar a cópia no painel no fim da fase.

### Fase 2 — Backend: RBAC por permissão e deny-by-default
Modelos `Permission`/`RolePermission`/`EPermissionEffect` · `permission-matrix.ts` + spec · `PermissionsService` com cache · `@RequirePermissions` + `PermissionsGuard` · `@Public()` + `SecurityPostureGuard` (log-only → enforce) · migração `@Roles` → `@RequirePermissions` por módulo · `AdminPermissionOverride` · `GET /api/tenant-capabilities` · seed idempotente + `docs/RBAC-MATRIX.md`.

**Task 1 desta fase trata os dois controllers sem guard marcados com ⚠️ em §1.3** — antes de qualquer migração de decorator.
**Regra herdada da Zarp:** a migração `@Roles` → `@RequirePermissions` preserva o acesso efetivo **1:1**. Anomalia encontrada é preservada e documentada, não "corrigida" no mesmo commit.

### Fase 3 — Backend: identidade de tenant, módulos e settings
`TenantDomain` + `CorsOriginService` + CORS dinâmico · `ETenantType` + `Tenant.tenantType` · `TenantSetting` + módulo `reserve-settings` (registry, `module-flags.service`) · `GATEABLE_MODULES` + `@RequiresModule` + `ModuleAccessGuard` · `TenantTypeModulePolicy` · `MasterTenantGuard` · tipagem completa de resposta no Swagger.

**Por que depois da Fase 2:** `ModuleAccessGuard` entra na cadeia entre `TenantGuard` e `PermissionsGuard`; `tenant-capabilities` só fica completo quando `TenantSetting` e as políticas existem.
**Por que antes da Fase 4:** o codegen do frontend consome o OpenAPI — a tipagem de resposta precisa estar pronta primeiro, senão o cliente gerado vem com `any`.

### Fase 4 — Frontend: arquitetura e transporte gerado
Adotar `src/{app,modules,presentation,shared,infraestructure}` com os `.md` de regras · instalar e configurar `nextjs-openapi-codegen` · gerar `src/infraestructure/server/services/` · migrar serviços à mão para adaptadores em `modules/<domain>/infrastructure/` · reverter o dano de `fix_spacing.js`/`remove_shadows.js` e remover os scripts.

**Nota de sequenciamento:** é a fase mais invasiva do painel (move quase todo arquivo). Deve rodar em worktree isolada e ser mesclada de uma vez.

### Fase 5 — Frontend: plataforma de UX e segurança de sessão
`TenantQueryProvider` (rotação de cache por tenant) · `usePermissions` com `useSyncExternalStore` + `access-policy` + `tenant-capabilities-provider` + migração versionada do `tenant-store` · plataforma `entity-list` / `entity-actions` / `resource-list` + `create-optimistic-mutation` + `use-list-query-state` · hub de configurações do tenant · dashboard bento com dados reais · consistência visual de stats · `notification-view` + estado de leitura persistido · alinhamento de tokens (`--header-height`, `--sidebar-width`, raio de card 16px) + `docs/DESIGN.md` próprio do Reserve · acessibilidade com `vitest-axe` e alvos de toque.

**Exceção de ordem:** o `TenantQueryProvider` (§2.3) é uma correção de vazamento de dados entre tenants que **não depende de nenhuma outra fase**. Pode e deve ser feito como primeiro item, em paralelo à Fase 1, sem esperar a Fase 4.

### Depois: `PLANO_PAINEL_RESERVE_1.md`
Com as 5 fases no lugar, o plano do Portal de Resultados encontra o terreno que ele assume: RBAC reaproveitável (decisão #2 do plano), sistema de notificações extensível (#5), mobile-first sobre uma plataforma de listas testada (#10), branding RÉSERVE por tenant (#4) e ingestão de eventos com rota classificada e rate-limited (#14).

---

## 4. Decisões travadas para o porte

| # | Decisão | Razão |
|---|---|---|
| 1 | Reserve mantém **snake_case** no Prisma | normalizar 97 modelos é refactor de alto risco fora do escopo; adapta-se o código portado |
| 2 | Reserve mantém **`prisma migrate`** (tem `prisma/migrations/` com 6 migrações e `migration_lock.toml`) | a Zarp usa `db push` em dev; o Reserve já é migrado, não regride |
| 3 | Gerenciador de pacotes do Reserve: verificar por repo antes de cada fase | o backend tem `package-lock.json` **e** `pnpm-lock.yaml`; resolver a ambiguidade na Fase 1 Task 1 |
| 4 | `SecurityPostureGuard` entra **log-only** primeiro (`SECURITY_POSTURE_ENFORCE=false`), depois enforce | 12 controllers sem guard; enforce direto derruba webhooks em produção |
| 5 | Raio de card do Reserve vai para **16px** em superfícies de admin | `DESIGN.md` §2: 30px é raio de landing page; admin é denso |
| 6 | Não portar `zarp-courses`, `zarp-events`, `zarp-prospecting` | domínio exclusivo da Zarp |
| 7 | Notificações: porte é **aditivo** | o Reserve já está à frente em scheduler e settings; não sobrescrever |

---

## 5. Dívida registrada (não neste porte)

- Normalização snake_case → camelCase do schema do Reserve.
- `src/app.di-boundaries.spec.ts` (teste de fronteira de DI) — portar quando a Fase 4 estabilizar as fronteiras.
- Avaliação de `zarp-automations` vs. a automação de WhatsApp do `PLANO_PAINEL_RESERVE_1.md` §5.
- Avaliação de `zarp-metrics` vs. `reserve-stats` + `StatsIntegration`.
- Ambiguidade de lockfile no backend (`package-lock.json` + `pnpm-lock.yaml` coexistindo).
