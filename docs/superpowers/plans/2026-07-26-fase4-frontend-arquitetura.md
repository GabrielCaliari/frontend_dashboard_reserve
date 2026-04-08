# Fase 4 — Frontend: Arquitetura DDD e Camada de Transporte Gerada Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar a arquitetura Clean/Hexagonal + DDD (`app/modules/presentation/shared/infraestructure`) da Zarp para o Reserve, instalar `nextjs-openapi-codegen` para gerar a camada de transporte a partir do OpenAPI do `backend_reserve`, migrar os 79 arquivos de serviço escritos à mão em `src/common/services/` para adaptadores estáveis em `src/modules/<domain>/infrastructure/`, e reverter o dano de formatação de `fix_spacing.js`/`remove_shadows.js` antes de qualquer outro passo.

**Architecture:** O Reserve hoje é `src/{app,common,components,i18n,layout,messages}` sem fronteira documentada. Este plano introduz `src/{app,modules,presentation,shared,infraestructure}`: `app/` vira rota-fina que reexporta de `presentation/components/pages/`; `presentation/` concentra UI e orquestração compartilhada (atoms/organisms/layouts/pages); `shared/` é código cross-module sem JSX; `infraestructure/` é a camada de transporte (axios + serviços gerados). Cada domínio de backend (`reserve-cms`, `reserve-leads`, `reserve-auth`, etc.) ganha `src/modules/<domain>/infrastructure/` com adaptadores que preservam a assinatura das funções hoje exportadas por `common/services/`, para que hooks não precisem mudar de comportamento — só de import.

**Tech Stack:** Next.js 16.1.6 (App Router), React 19.2.4, HeroUI 2.8.10, Tailwind 4.3.0, next-intl 4.8.3, TanStack Query 5.90, Zustand 5.0, axios 1.13, Vitest 4.0 + Testing Library, `nextjs-openapi-codegen` 1.0.2 (nova devDependency), Prettier 3.3.3, TypeScript 5.9.

## Global Constraints

- Reserve e Zarp têm `package.json` de dependências **idêntico**, exceto `nextjs-openapi-codegen` (só na Zarp). Não altere versão de nenhuma outra dependência nesta fase.
- Next 16.1.6, React 19.2.4, HeroUI 2.8.10, Tailwind 4.3.0, next-intl 4.8.3 — versões travadas, não mexer.
- Testes: Vitest (`vitest.config.ts` + `vitest.setup.ts` na raiz), testes colocados como `*.test.ts` / `*.test.tsx`. Rodar com `npm run test:run -- <padrão>`.
- Gerenciador de pacotes: o repo tem **ambos** `package-lock.json` (mtime 2026-05-26 18:38, commit `58db301`) e `pnpm-lock.yaml` (mtime 2026-05-26 17:52, commit `6b97dd5`, mais antigo). `node_modules/.package-lock.json` existe (marca do npm); não existe `node_modules/.modules.yaml` (marca do pnpm). **Decisão desta fase: usar `npm`** em todos os comandos deste plano; `pnpm-lock.yaml` fica registrado como ambiguidade não resolvida (dívida, fora de escopo desta fase — não apagar sem confirmação do usuário).
- Esta fase move quase todo arquivo do `src/`. **Ela roda em worktree git isolada** (`git worktree add ../frontend_dashboard_reserve-fase4 -b fase4-frontend-arquitetura`) e é mesclada de uma vez ao final (Task 28).
- Cada task de migração de domínio (Tasks 12–25) termina com `npm run build` passando E `npm run test:run` verde. Commit por task.
- Nomenclatura: a pasta é `infraestructure` (grafia da Zarp, com "e"), e "application" nunca é abreviado para "app" — `app` é só o App Router.
- **Não** renomeie módulos para nomes de área de UI: o módulo do frontend leva o nome do módulo de backend que consome (`modules/cms` consome `reserve-cms`). Quando um módulo do frontend abrange mais de um módulo de backend (ex.: `modules/payments` consome `reserve-subscriptions`), isso é documentado explicitamente em `MODULES.md`, nunca escondido atrás de um nome vago.
- `tsconfig.json` usa o alias `@/*` → `./*` (não `@/src/...` como um alias próprio) — todo import `@/src/common/X` hoje resolve para `./src/common/X`. Isso **não muda** nesta fase: o alias continua `@/*`, só o caminho depois de `@/src/` muda conforme os arquivos se movem.
- `npx prettier --write` reverte apenas dano de **espaçamento** (`from"react"` → `from "react"`, `import"x"` → `import "x"`). O `remove_shadows.js` também **apagou classes Tailwind** (`shadow-lg`, `shadow-xl`, `drop-shadow-*`) — isso é perda de conteúdo, não formatação, e Prettier não restaura. Ver Task 2, nota de risco.

## File Structure

Tabela de correspondência completa. `<domain>` nas linhas de serviço/hook é resolvido nas Tasks 12–25.

| Origem (Reserve hoje) | Destino (novo) | Task |
|---|---|---|
| `fix_spacing.js`, `remove_shadows.js` (raiz) | apagados | 2 |
| `src/common/lib/*` | `src/shared/lib/*` | 4 |
| `src/common/utils/*` | `src/shared/utils/*` | 4 |
| `src/common/enums/*` | `src/shared/enums/*` | 4 |
| `src/common/interfaces/*` | `src/shared/interfaces/*` | 4 |
| `src/common/schemas/*` | `src/shared/schemas/*` | 4 |
| `src/common/stores/*` | `src/shared/stores/*` | 4 |
| `src/common/styles/globals.css` | `src/shared/styles/globals.css` | 4 |
| `src/common/@types/*` | `src/shared/domain/types/*` (mantém prefixo `@`) | 4 |
| `src/common/config/api.ts`, `api-email.ts`, `cms-public-api-client.ts`, `build-api-base-url.ts`, `get-auth-headers.ts`, `error-types.ts` | `src/infraestructure/axios/*` (+ novo `normalize-api-request-url.ts`) | 5 |
| `src/i18n/*` | `src/presentation/i18n/*` | 6 |
| `src/messages/*.json` | `src/presentation/i18n/messages/*.json` | 6 |
| `src/layout/root-layout.tsx` | `src/presentation/components/layouts/root-layout.tsx` | 6 |
| `src/common/actions/*` | `src/presentation/actions/*` (mesma subestrutura) | 7 |
| `src/components/ui/{accordion,alert,button,card,checkbox,dialog,dropdown-menu,input,label,radio-group,scroll-area,select,sheet,switch,table,tabs,textarea,toast,tooltip}.tsx` + `components/ui/{editor,editor-static}.tsx` (raiz do repo) | `src/presentation/components/atoms/shadcn-ui/*` | 8 |
| `src/components/ui/{aside,campaign-setup-status,currency-input,custom-pagination,header,language-switcher,loading,menu,modal,password-input,pi-bot,theme-switcher,toggle-switch,toggle-switch-group}.tsx` | `src/presentation/components/atoms/reserve/*` | 8 |
| `components/` (pasta raiz do repo, fora de `src/`) | apagada após migrar `editor.tsx`/`editor-static.tsx` | 8 |
| `src/components/{access-management,appointments,b2b,b2c,cms,coupons,email-builder,email-editor,forms,hotel-portal,kanban,leads,modals,notifications,payments,reports,stats,tables,tabs}/*` | `src/presentation/components/organisms/<mesmo-nome>/*` | 9 |
| `src/components/campaign-actions.tsx` | `src/presentation/components/organisms/leads/campaign-actions.tsx` | 9 |
| `src/components/tenant-selector.tsx` | `src/presentation/components/organisms/access-management/tenant-selector.tsx` | 9 |
| `src/common/services/access-management/*`, `admin-login.ts`, `admin-profile.ts` | `src/modules/access-management/infrastructure/*` | 12 |
| `src/common/hooks/access-management/*` | `src/shared/hooks/access-management/*` | 12 |
| `src/common/services/leads/*`, `list-leads-service.ts`, `list-lead-qualification-service.ts`, `update-lead-qualification-service.ts`, `complete-screening-service.ts`, `temperature-analysis-by-message-id-service.ts`, `brand-analytics-service.ts`, `brand-analytics-detail-service.ts`, `create-brand-analytics.ts` | `src/modules/leads/infrastructure/*` (órfãos isolados, ver Task 13) | 13 |
| `src/common/hooks/leads/*` | `src/shared/hooks/leads/*` | 13 |
| `src/common/services/appointments/*` | `src/modules/appointments/infrastructure/*` | 14 |
| `src/common/hooks/appointments/*` | `src/shared/hooks/appointments/*` | 14 |
| `src/common/services/{cms-article,cms-author,cms-blog,blog,cms-image,cms-media,cms-public}-service.ts` | `src/modules/cms/infrastructure/*` | 15 |
| `src/common/hooks/cms/*` | `src/shared/hooks/cms/*` | 15 |
| `src/common/services/coupons-service.ts` | `src/modules/coupons/infrastructure/*` | 16 |
| `src/common/hooks/useCoupons.ts` | `src/shared/hooks/coupons/use-coupons.ts` | 16 |
| `src/common/services/email-campaign/*`, `campaign-batch/*`, `smtp-server/*` | `src/modules/mailer/infrastructure/*` | 17 |
| `src/common/hooks` (não há pasta `email-campaign/`; hooks residem em componentes) | n/a | 17 |
| `src/common/services/payments/{billing-config,plans,subscriptions,payment-movements}-service.ts` | `src/modules/payments/infrastructure/*` | 18 |
| `src/common/hooks/payments/*` | `src/shared/hooks/payments/*` | 18 |
| `src/common/services/b2b-payments-service.ts` | `src/modules/b2b-payments/infrastructure/*` | 19 |
| `src/common/hooks/useB2BPayments.ts` | `src/shared/hooks/b2b-payments/use-b2b-payments.ts` | 19 |
| `src/common/services/b2c-products-service.ts` | `src/modules/b2c-products/infrastructure/*` | 20 |
| `src/common/hooks/useB2CProducts.ts` | `src/shared/hooks/b2c-products/use-b2c-products.ts` | 20 |
| `src/common/services/b2c-subscriptions-service.ts` | `src/modules/b2c-subscriptions/infrastructure/*` | 21 |
| `src/common/hooks/useB2CSubscriptions.ts` | `src/shared/hooks/b2c-subscriptions/use-b2c-subscriptions.ts` | 21 |
| `src/common/services/hotel-portal-service.ts` | `src/modules/hotel-portal/infrastructure/*` | 22 |
| `src/common/hooks/hotel-portal/*` | `src/shared/hooks/hotel-portal/*` | 22 |
| (nenhum — hooks chamam `apiClient` direto) | `src/modules/notifications/infrastructure/*` (novo) | 23 |
| `src/common/hooks/notifications/*` | `src/shared/hooks/notifications/*` | 23 |
| `src/common/services/report-service.ts` | `src/modules/reports/infrastructure/*` | 24 |
| `src/common/hooks/reports/*` | `src/shared/hooks/reports/*` | 24 |
| `src/common/services/stats-service.ts` | `src/modules/stats/infrastructure/*` | 25 |
| `src/common/hooks/stats/*` | `src/shared/hooks/stats/*` | 25 |
| `src/common/services/states-service.ts` (chama IBGE, API externa) | `src/shared/services/states-service.ts` (inalterado) | 4 |
| `src/common/hooks/{use-debounce,use-toast,use-permissions,use-tenants,use-admin-profile,use-current-admin,use-user-authentication,useUserDatails,useLocation,use-list-leads}.ts` | `src/shared/hooks/*` (genéricos, não movem para módulo) | 4 |
| `src/common/interfaces/*` já coberto acima | | |
| `src/app/**/page.tsx`, `layout.tsx` (exceto raiz e exceções listadas na Task 26) | `src/presentation/components/pages/**/page.tsx` / `layouts/**/layout.tsx` + stub fino em `src/app/**` | 26 |
| `src/app/layout.tsx` (root), `src/app/providers.tsx`, `src/app/not-found.tsx`, `src/app/favicon.ico`, `src/proxy.ts` | ficam em `src/app/` (exceções do App Router) — `not-found.tsx` também espelhado em `presentation/components/pages/not-found/page.tsx` | 26 |
| (novo) `AGENTS.md` | raiz do repo | 27 |

---

### Task 1: Preparar worktree isolada e confirmar baseline

**Files:**
- Create: nenhum arquivo de código (worktree + verificação)

**Interfaces:**
- Consumes: repositório atual em `main`
- Produces: worktree `../frontend_dashboard_reserve-fase4` na branch `fase4-frontend-arquitetura`, baseline de build/test registrado

- [ ] **Step 1: Criar a worktree isolada**

```bash
cd "C:/Users/gabri/OneDrive/Documents/GitHub/frontend_dashboard_reserve"
git worktree add ../frontend_dashboard_reserve-fase4 -b fase4-frontend-arquitetura
cd ../frontend_dashboard_reserve-fase4
```

Todas as tasks seguintes (2–27) rodam dentro desta worktree.

- [ ] **Step 2: Instalar dependências com npm (decisão de gerenciador de pacotes)**

```bash
npm ci
```

- [ ] **Step 3: Registrar baseline antes de qualquer mudança**

```bash
npm run build > ../fase4-baseline-build.log 2>&1; echo "build exit: $?"
npm run test:run > ../fase4-baseline-test.log 2>&1; echo "test exit: $?"
```

Guarde os dois logs — Tasks 2 a 27 comparam contra este baseline, não contra "zero erros" (o Reserve já roda com `typescript.ignoreBuildErrors: true` em `next.config.mjs`, então `npm run build` pode passar mesmo com erros de tipo; `tsc --noEmit` não faz parte deste baseline porque não há script dedicado hoje).

- [ ] **Step 4: Commit (nenhuma mudança de arquivo, apenas checkpoint)**

Não há commit nesta task — ela só estabelece o ambiente. Prossiga para a Task 2.

---

### Task 2: Reverter dano de formatação e remover os scripts de manipulação em massa

**Files:**
- Delete: `fix_spacing.js`
- Delete: `remove_shadows.js`
- Modify: todo `*.ts`/`*.tsx` sob `src/` com import colado (234 arquivos, 1567 ocorrências de `from"`)

**Interfaces:**
- Consumes: nenhuma
- Produces: árvore `src/` formatada por Prettier 3.3.3, sem os dois scripts na raiz

- [ ] **Step 1: Confirmar que não existe `.prettierrc`/`prettier.config.*` no repo (nem no Reserve nem na Zarp — ambos usam só o `prettier` do `package.json` via `eslint-plugin-prettier`)**

```bash
ls .prettierrc* .prettierignore prettier.config* 2>/dev/null; echo "exit: $?"
```

Se o comando não listar nada (exit ≠ 0 em todos), não há config custom — Prettier roda com as defaults, que é o mesmo comportamento da Zarp.

- [ ] **Step 2: Rodar Prettier em toda a árvore `src/`**

```bash
npx prettier@3.3.3 --write "src/**/*.{ts,tsx}"
```

Isso corrige os 1567 casos de `from"x"` → `from "x"` (e o caso isolado de `import"x"`) produzidos por `fix_spacing.js` e pela regra `\s+(["'\`])/g → $1` de `remove_shadows.js` (que também colapsa espaço antes de aspas).

- [ ] **Step 3: Verificar que nenhum `from"` sobrou**

```bash
grep -rl 'from"' src --include='*.ts' --include='*.tsx' | wc -l
```

Deve retornar `0`. Se não retornar, abra os arquivos remanescentes manualmente — são casos em que a aspas está dentro de uma string/comentário e Prettier não reformata conteúdo de string.

- [ ] **Step 4: Registrar a perda de conteúdo do `remove_shadows.js` como dívida (não reverter agora)**

`remove_shadows.js` também executou `c.replace(/\b(shadow(-sm|-md|-lg|-xl|-2xl|-inner|-none)?)\b/g, '')` e o mesmo para `drop-shadow-*` — isso **apagou** classes Tailwind de `className`, não é dano de espaçamento. Prettier não restaura texto apagado. Exemplo real encontrado em `src/app/not-found.tsx`, no botão "Voltar para o Dashboard": a classe ficou `hover: hover:-purple-500/25` (antes provavelmente `hover:shadow-xl hover:shadow-purple-500/25`). Não tente reconstruir essas classes nesta fase — não há como recuperar o texto original de forma confiável sem o histórico de design, e o `docs/DESIGN.md` da Zarp (§5, portado na Task 3) já recomenda **não** usar `blur-3xl`/glow em UI densa de admin, então a perda é parcialmente aceitável. Deixe uma dívida documentada:

```bash
mkdir -p docs/superpowers/plans
```

Adicione ao final deste mesmo arquivo de plano (não crie um novo doc) — pule para o Step 5, o registro já está feito acima nesta nota; nenhuma ação de código é necessária aqui além de não tentar "adivinhar" classes de sombra.

- [ ] **Step 5: Apagar os dois scripts**

```bash
git rm fix_spacing.js remove_shadows.js
```

- [ ] **Step 6: Confirmar que o build continua passando**

```bash
npm run build
npm run test:run
```

Compare a saída com `../fase4-baseline-build.log` / `../fase4-baseline-test.log` da Task 1 — não deve haver nenhuma falha nova.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix: revert fix_spacing.js/remove_shadows.js formatting damage and remove the scripts

Prettier restores the glued imports (from\"x\" -> from \"x\") introduced by
both mass-edit scripts. The shadow-class removal from remove_shadows.js is
content loss, not formatting, and is not reverted here — tracked as debt."
```

---

### Task 3: Portar arquivos de regra `.md` e criar o esqueleto de pastas

**Files:**
- Create: `src/SRC.md`
- Create: `src/app/APP.md`
- Create: `src/modules/MODULES.md`
- Create: `src/presentation/PRESENTATION.md`
- Create: `src/shared/SHARED.md`
- Create: `src/shared/domain/DOMAIN.md`
- Create: `src/shared/hooks/HOOKS.md`
- Create: `src/shared/lib/LIB.md`
- Create: `src/shared/query/QUERY.md`
- Create: `src/shared/stores/STORES.md`
- Create: `src/shared/styles/STYLES.md`
- Create: `src/infraestructure/INFRAESTRUCTURE.md`
- Create: `src/infraestructure/server/SERVICES.md`

**Interfaces:**
- Consumes: nenhuma (arquivos de documentação, não código)
- Produces: esqueleto vazio de `src/{modules,presentation,shared,infraestructure}` com regras documentadas, consumido por todas as tasks seguintes

- [ ] **Step 1: Criar `src/SRC.md`**

```markdown
# src/ — Clean/Hexagonal + DDD module architecture

This project is a Next.js (App Router) frontend organized to mirror the backend's
domain boundaries (`backend_reserve`, `reserve-*` modules), optimized so a coding
agent always knows, without ambiguity, where a new file should be created and where an
existing file should be read from.

## The 5 folders under `src/`

```
src/
  app/             Next.js routes (App Router) — composition only, no business logic
  modules/         business domains, one per module, full DDD layers
  presentation/    UI and presentation orchestration SHARED across modules
  shared/          genuinely cross-module code without UI logic
  infraestructure/ outbound adapters to the backend (HTTP), no business logic
```

Each one has its own `<NAME>.md` at the root of the folder with the specific rules.
This file only covers the general decision tree and naming pitfalls.

## Decision tree — "where does this file go?"

1. **Is it a Next.js route, layout, loading/error boundary, or route handler?**
   → `src/app/**` is routing-only: it re-exports the real page/layout from
   `presentation/components/pages/` / `presentation/components/layouts/` (mirroring
   the route path). See [app/APP.md](./app/APP.md) for the few framework-mandated
   exceptions (root layout, `generateMetadata`, async `params` destructured directly
   in the route file). Page/layout JSX and logic itself is presentation code and
   follows rule 3 below.

2. **Is it logic specific to ONE business domain** (leads, coupons, cms, access-management,
   payments, appointments, hotel-portal, mailer, notifications, reports, stats...)?
   → `src/modules/<domain>/<layer>/`, see [modules/MODULES.md](./modules/MODULES.md)
   for which layer (domain/application/infrastructure/presentation).
   If the domain doesn't have a folder in `modules/` yet, evaluate whether the volume
   of code already justifies creating one (see the criterion in MODULES.md) — until it
   does, UI components for that domain live in `presentation/components/organisms/<domain>/`
   and hooks live in `shared/hooks/<domain>/`.

3. **Is it generic enough to serve MULTIPLE modules, but still presentation**
   (a UI component, a server action, a React hook)?
   → `src/presentation/**`.

4. **Is it genuinely cross-module and does NOT depend on React/JSX** (shared domain
   types, a generic HTTP client, pure utils, a global store)?
   → `src/shared/**`.

5. **Is it the raw HTTP call to a backend endpoint** (request/response contract, no
   business decision)?
   → `src/infraestructure/server/services/<name>/`.

When more than one answer seems valid, the order above is the priority: a react-query
hook that only serves the `leads` module goes to `shared/hooks/leads/` (until `leads`
gets a `modules/leads/presentation/` layer), not invented ad hoc elsewhere.

## Naming pitfall: `app` vs `application`

- **`app`** (no suffix) always refers to `src/app/`, the Next.js routes.
- **`application`** (spelled out, never abbreviated) always refers to the DDD layer
  inside a module (`src/modules/<domain>/application/`) — use cases, business
  orchestration, no dependency on React.

Never abbreviate "application" to "app" in folders, imports, or comments — that
abbreviation collides lexically with the App Router and confuses both humans and
agents doing a text search.

## Module naming convention vs. the backend

The backend (`backend_reserve/src/modules/reserve-*`) uses one module per bounded
context, prefixed with `reserve-` (e.g. `reserve-coupons`, `reserve-leads`, `reserve-mailer`,
`reserve-cms`). The frontend uses modules under `src/modules/*` **without** the
`reserve-` prefix (e.g. `modules/cms`, not `modules/reserve-cms`), but the module
**name itself must match the backend domain it consumes** (e.g. `modules/mailer`
consumes `reserve-mailer`, `modules/hotel-portal` consumes `reserve-client-portal`,
`modules/notifications` consumes `reserve-notifications`). Do not invent a broader
UI-area name — grep the backend module list first, and name the frontend module after
the specific backend module(s) it talks to. If a frontend module genuinely spans more
than one backend module because they're always consumed together behind a single UI
surface, document that explicitly in MODULES.md with the mapping (e.g. `modules/payments`
consumes `reserve-subscriptions`, kept as `payments` because that's the pre-existing
UI-wide name across 130+ files — see MODULES.md), rather than picking an unrelated name
silently.

## Layers inside a module (`src/modules/<domain>/`)

```
modules/<domain>/
  domain/           types, pure business rules, normalizers — zero I/O, zero React
  application/      use cases: multi-step orchestration with no dependency on React
  infrastructure/   module-specific outbound adapters (HTTP calls, DTO mapping) —
                    used when the module needs something beyond the generic services
                    in infraestructure/server/services/
  presentation/     components, hooks (react-query included), domain-specific actions
  index.ts          the module's public barrel — what other modules/routes may import
```

Not every module has all 4 folders from the start — create a layer when the first file
of that kind exists, not ahead of time. As of this migration (Fase 4), every domain
listed in MODULES.md has only `infrastructure/` — `domain/`, `application/`, and
`presentation/` stay as `shared/domain/types/`, `shared/hooks/<domain>/`, and
`presentation/components/organisms/<domain>/` until a later phase promotes them (see
the criterion in [modules/MODULES.md](./modules/MODULES.md)).

## Documented technical debt

Mark known architecture debt with a `TODO(arquitetura): ...` comment in the relevant
file (not only in this `.md`), so it shows up when opening the file, not only when
reading separate documentation.
```

- [ ] **Step 2: Criar `src/app/APP.md`**

```markdown
# app/ — Next.js App Router: routing layer only

`src/app/**` is the Next.js App Router's routing and file-convention surface. Its
only job is to declare routes, wire them to the actual page/layout implementation,
and hold whatever the framework strictly requires to live at that exact path
(`route.ts` handlers, `generateMetadata`, the root `<html>` shell, `proxy.ts`). It is
**not** where page logic, JSX, or business orchestration lives.

## The rule

- `src/app/**/page.tsx` — a route file that either directly renders the real page
  component, or, for the common case, re-exports it:
  ```ts
  export { default } from "@/src/presentation/components/pages/dashboard/leads/page";
  ```
  The actual JSX, hooks, and page logic live in
  `src/presentation/components/pages/<same-route-path>/page.tsx` — a 1:1 mirror of
  the route's path under `src/app/`.
- `src/app/**/layout.tsx` — same pattern, re-exporting from
  `src/presentation/components/layouts/<same-route-path>/layout.tsx`.
- `src/app/**/route.ts` (route handlers), `proxy.ts` — stay in `src/app/` or the repo
  root as the framework requires; these are inherently routing, not page content.

## Exceptions — files that must stay in `src/app/` as real implementations

- **`src/app/layout.tsx` (root layout)** — contains `<html>`/`<body>`, global fonts,
  and top-level providers (`Providers`, `NextIntlClientProvider`, `Header`,
  `NextTopLoader`, `Toaster`). This is the one layout that stays fully implemented
  here; don't try to extract it into `presentation/components/layouts/`.
- **`src/app/providers.tsx`** — the `QueryClientProvider`/`HeroUIProvider` composition
  consumed directly by the root layout above; stays next to it.
- **A route with `generateMetadata`** — e.g. `src/app/public-blog/[slug]/layout.tsx`.
  Next.js resolves `generateMetadata` from the route segment's own file; keep it
  there in full (it also has a trivial `default` export just rendering `children` —
  not worth splitting one export in and one export out for a 6-line component).
- **A dynamic route where the page is an `async function` Server Component that
  destructures `params: Promise<{...}>` directly in its signature** (not via React's
  `use()`) — the extracted component's signature changes to accept the *resolved*
  value instead, and the thin `page.tsx` becomes a small `async` function that awaits
  `params` and passes the plain object down. In this codebase this applies to exactly
  one route: `src/app/dashboard/email-campaign/[id]/page.tsx` (see Task 26, Step 4).
  ```tsx
  // src/app/dashboard/email-campaign/[id]/page.tsx
  import EmailCampaignPage from "@/src/presentation/components/pages/dashboard/email-campaign/[id]/page";

  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <EmailCampaignPage id={id} />;
  }
  ```
  A page/layout that instead reads `params` via React's `use(params)` hook, or via
  the client-side `useParams()` hook, does **not** need this treatment — both work
  identically regardless of which file the component lives in, so a plain
  `export { default } from '...'` is enough. This covers every other dynamic route in
  this codebase (`dashboard/access-management/{admins,tenants,users}/[id]`,
  `dashboard/cms/{articles,collections,media}/[id]`, `dashboard/cms/blogs/[blogId]`,
  `dashboard/coupons/[id]`, `dashboard/global/notifications/[id]`,
  `dashboard/global/notifications/settings/[tenantId]`,
  `dashboard/global/tenants/[tenantId]`, `dashboard/hotel-portal/[clientId]`,
  `dashboard/leads/collections/[collectionId]`, `public-blog/[slug]/page.tsx`).

## Route groups

```
app/
  auth/          public authentication routes
  dashboard/     the authenticated admin app (majority of routes)
  public-blog/   public-facing blog rendering, no auth
```

Each maps to the same path under `presentation/components/pages/` and
`presentation/components/layouts/`.
```

- [ ] **Step 3: Criar `src/modules/MODULES.md`**

```markdown
# modules/ — business domains

One module per UI bounded context. See the decision tree in [../SRC.md](../SRC.md)
before deciding whether a new file belongs here or in global `presentation/`/`shared/`.

## Existing modules (Fase 4)

| Module | Consumes (backend) | Layers present |
|---|---|---|
| `access-management` | `reserve-auth` | infrastructure |
| `leads` | `reserve-leads` | infrastructure |
| `appointments` | `reserve-leads` (appointment sub-resources) | infrastructure |
| `cms` | `reserve-cms` | infrastructure |
| `coupons` | `reserve-coupons` | infrastructure |
| `mailer` | `reserve-mailer` | infrastructure |
| `payments` | `reserve-subscriptions` (Plans, Subscriptions, Payments - Billing Config tags) | infrastructure |
| `b2b-payments` | `reserve-b2b-payments` | infrastructure |
| `b2c-products` | `reserve-b2c-products` | infrastructure |
| `b2c-subscriptions` | `reserve-b2c-subscriptions` | infrastructure |
| `hotel-portal` | `reserve-client-portal` | infrastructure |
| `notifications` | `reserve-notifications` | infrastructure |
| `reports` | `reserve-reports` | infrastructure |
| `stats` | `reserve-stats` | infrastructure |

Every module above starts with **only** `infrastructure/` (the adapter wrapping the
generated service, preserving the exported function names/signatures `common/services/`
already had) — this is Fase 4's scope. `domain/`, `application/`, and `presentation/`
layers are **not** created yet: domain types stay in `shared/domain/types/`, hooks stay
in `shared/hooks/<domain>/`, and UI stays in
`presentation/components/organisms/<domain>/`. Promoting a domain to the full 4-layer
structure is a later-phase decision (see the criterion below), matching how the Zarp
codebase itself still has `access-management`, `leads`, `payments`, `appointments`,
`reports`, `stats` UI living in `presentation/components/<domain>/` rather than fully
promoted — this is the intentional, documented steady state, not a TODO to rush.

`payments` is named after the pre-existing UI-wide label (130+ files reference
`components/payments`, `hooks/payments`, `actions/payments`) rather than
`subscriptions`, to avoid a second, unrelated rename on top of an already large
migration — and because `subscriptions` would collide with the separate
`b2c-subscriptions` module. This is the explicit, documented exception the naming rule
in [../SRC.md](../SRC.md) calls for when a frontend module spans more than one
backend-module-shaped name.

## When to create a new module (beyond `infrastructure/`)

Promote a domain to a full `domain/`, `application/`, `presentation/` module when the
domain already has, scattered across `shared/` and `presentation/components/`, at
least: its own domain type, a service/data adapter, and a presentation component — i.e.
when the 3 pieces already exist but are loose. Don't create the module folder (or any
of the 4 layers) just because a new component "might grow" — that's premature
over-engineering.

## Naming: mirror the backend module, not a UI-area label

Name a frontend module after the specific `reserve-*` backend module it consumes (see
[../SRC.md](../SRC.md) for the full rule). Do not group unrelated backend modules under
one vague label (a mistake documented and corrected in the Zarp codebase: a module was
once named `communications` when it only served `zarp-notifications`, and another named
`marketing` grouped automations + mailer under one UI-area label instead of mirroring
the backend's actual module split).
```

- [ ] **Step 4: Criar `src/presentation/PRESENTATION.md`**

```markdown
# presentation/ — presentation shared across modules

Everything here is UI/presentation code generic enough to serve **more than one**
business module, or that hasn't been promoted into a specific module yet (see the
criterion in [../modules/MODULES.md](../modules/MODULES.md)). Nothing here should hold
business logic for a single domain that already has its own module under
`src/modules/`.

```
presentation/
  actions/        Next.js Server Actions (shared, or not yet promoted)
  components/     React components (shared ones, not-yet-modularized domain ones,
                   and the design system in atoms)
  i18n/           next-intl configuration (routing, request, navigation, messages)
```

## `actions/`

Server Actions (`"use server"`). An action exists here for one reason only: Next.js
requires a Server Action (not a plain function) as the RPC boundary a Client Component
can call to run code on the server without exposing a public API route. That's a
framework constraint, not an architectural preference — it does **not** mean actions
are a place to design new business logic.

An action should call a service that already exists in
`infraestructure/server/services/` (or, for domains not yet backed by a generated
adapter, the module's `infrastructure/` adapter), and may additionally handle
**Server-Action-specific concerns**: shaping the return value for the caller,
`revalidatePath`/`revalidateTag`, `redirect`, and form-level error formatting. What
does NOT belong in an action: a business decision that has nothing to do with being a
Server Action, or the HTTP call itself.

## `components/`

Four folders, each with exactly one responsibility. When adding a new component, ask
"which of these four is it?" — there is no fifth category and no loose file at the
root of `components/`.

```
components/
  atoms/       smallest reusable UI primitives — no route/domain awareness
  organisms/   domain-aware components composed from atoms — one subfolder per domain
  layouts/     Next.js layout implementations + generic cross-route shells
  pages/       Next.js page implementations, mirrors src/app/**/page.tsx 1:1
```

- **`atoms/shadcn-ui/`** — components vendored by the shadcn CLI. Never hand-edit their
  internal behavior beyond import fixes.
- **`atoms/reserve/`** — product-authored primitives that are not vendored but still
  domain-agnostic and reused across many organisms (`aside`, `campaign-setup-status`,
  `currency-input`, `custom-pagination`, `header`, `language-switcher`, `loading`,
  `menu`, `modal`, `password-input`, `pi-bot`, `theme-switcher`, `toggle-switch`,
  `toggle-switch-group`). If a component here starts referencing one specific domain's
  data shape, it has stopped being an atom — move it into `organisms/<domain>/`.
- **`organisms/`** — every domain-aware component, one subfolder per domain
  (`organisms/access-management/`, `organisms/leads/`, `organisms/cms/`, etc).
- **`layouts/`** — Next.js layout implementations, mirroring `src/app/**/layout.tsx`
  1:1, plus generic cross-route layout shells (`root-layout.tsx` — `LayoutScopeRoot`).
- **`pages/`** — Next.js page implementations, mirroring `src/app/**/page.tsx` 1:1.
  This is where a route's actual JSX and logic live; `src/app/**/page.tsx` only
  re-exports from here.

## `i18n/`

`next-intl` configuration: `routing.ts` (supported locales), `navigation.ts`,
`request.ts` (loads the active locale's message JSON), `messages/{pt,en}.json`. This
folder's path is hardcoded as a string in `next.config.mjs`
(`createNextIntlPlugin('./src/presentation/i18n/request.ts')`) — if you move this
folder again, update that argument and `next-intl.config.ts`
(`import { routing } from './src/presentation/i18n/routing'`) together, or the build
breaks silently with no TypeScript error (it's a string path, not a static import).
```

- [ ] **Step 5: Criar `src/shared/SHARED.md`**

```markdown
# shared/ — genuinely cross-module code

Single entry rule: a file belongs in `shared/` only if it serves **more than one**
`modules/*` or `presentation/` area, and does **not** depend on JSX/React components
(plain React hooks are the one tolerated exception, see `shared/hooks/`). If a hook,
service, or type serves only one business domain, it belongs in
`shared/hooks/<domain>/` / `shared/domain/types/` today (or `modules/<domain>/` once
that domain is promoted) — don't create it in the generic root of `shared/` ahead of
time "just in case".

| Folder | Role |
|---|---|
| `domain/types/` | domain types shared across multiple modules (API contracts) |
| `enums/` | cross-module business enums |
| `hooks/` | generic React hooks (not specific to one module) + per-domain holdover subfolders |
| `interfaces/` | cross-module TypeScript contracts that aren't "domain types" |
| `lib/` | low-level, stateless utilities (e.g. `cn()`) |
| `query/` | shared TanStack Query providers/config |
| `schemas/` | cross-module zod validation schemas |
| `services/` | HTTP calls to endpoints without a dedicated generated adapter (e.g. `states-service.ts`, which calls the external IBGE API, not `backend_reserve`) |
| `stores/` | cross-module global state (zustand) |
| `styles/` | global CSS |
| `utils/` | general-purpose pure functions |

## When to promote something out of `shared/` into a module

If, while opening a file in `shared/hooks/<domain>/`, you notice the domain now also
has its own `modules/<domain>/domain/` and `modules/<domain>/presentation/`, move the
hook into `modules/<domain>/presentation/hooks/` — don't leave it in `shared/` out of
inertia.
```

- [ ] **Step 6: Criar `src/shared/domain/DOMAIN.md`**

```markdown
# shared/domain/types/

Domain types (request/response contracts, entities) currently consumed by more than
one place in the app that haven't been promoted yet into a proper
`modules/<domain>/domain/` folder.

The `@` prefix in the filename (`@lead.ts`, `@coupons.ts`, `@cms-article.ts`...) is
inherited from the pre-migration `common/@types/` structure — don't create new files
with that prefix; it's kept only on existing files to minimize diffs. A new domain
type that serves several modules goes in `domain-name.ts` without `@`; if it serves
only one module, it goes straight into `modules/<domain>/domain/` once that domain is
promoted.

## Promotion rule

Whenever a domain listed here gets its own full folder under `src/modules/`, move the
corresponding types file into `modules/<domain>/domain/` and stop referencing it from
here — don't duplicate it.
```

- [ ] **Step 7: Criar `src/shared/hooks/HOOKS.md`**

```markdown
# shared/hooks/

Generic React hooks used by more than one place in the `presentation/` tree (e.g.
`use-debounce`, `use-toast`, `use-permissions`).

## Note on the domain subfolders

`access-management/`, `appointments/`, `b2b-payments/`, `b2c-products/`,
`b2c-subscriptions/`, `cms/`, `coupons/`, `hotel-portal/`, `leads/`, `mailer/`,
`notifications/`, `payments/`, `reports/`, `stats/` are business domains whose hooks
have **not** yet been promoted into their own module under `src/modules/` — they live
here as the current, intentional steady state (see the promotion criterion in
[../../modules/MODULES.md](../../modules/MODULES.md)), not as an exception. A hook
specific to a single business domain is born in `shared/hooks/<domain>/` (if the
domain hasn't been promoted to a full module) or in
`modules/<domain>/presentation/hooks/` (once it has) — never directly loose in
`shared/hooks/`.
```

- [ ] **Step 8: Criar `src/shared/lib/LIB.md`**

```markdown
# shared/lib/

Low-level utilities with no state and no business rule — the "dumbest" possible
category (e.g. `utils.ts` with `cn()`, `html-to-markdown.ts`). If a function here
starts carrying a business decision (not just formatting/data transformation), it
belongs in `shared/utils/` or `modules/<domain>/domain/`, not here.

`components.json` (repo root) points shadcn's `utils` alias to `shared/lib/utils` —
don't move this file without updating `components.json` at the same time.
```

- [ ] **Step 9: Criar `src/shared/query/QUERY.md`**

```markdown
# shared/query/

TanStack Query configuration and providers shared across modules. Domain-specific
query keys live inside the module/domain (`modules/<domain>/infrastructure/query-keys.ts`
once promoted, or colocated with the hook otherwise), not here — this folder is only
the provider wiring itself (`QueryClient` instantiation consumed by
`src/app/providers.tsx`). Per-tenant cache rotation (`TenantQueryProvider`) is Fase 5
scope — not part of this migration.
```

- [ ] **Step 10: Criar `src/shared/stores/STORES.md`**

```markdown
# shared/stores/

Global state (zustand) that needs to survive navigation across different modules
(`tenant-store.ts` — selected tenant, used app-wide; `mobile-drawer.store.ts`,
`widget.store.ts` — shared UI state). A store whose state only matters within a
single module belongs in `modules/<domain>/presentation/` (or `modules/<domain>/domain/`
if it's business state, not UI state), not here.
```

- [ ] **Step 11: Criar `src/shared/styles/STYLES.md`**

```markdown
# shared/styles/

Global CSS (`globals.css`) — Tailwind base, theme tokens, CSS variables. Nothing
component/module-specific goes here; a component's style stays co-located with it via
className/Tailwind.

`components.json` (repo root) references this file — don't move it without updating
`components.json` at the same time.
```

- [ ] **Step 12: Criar `src/infraestructure/INFRAESTRUCTURE.md`**

```markdown
# infraestructure/ — outbound adapters to the backend

Single responsibility: transport data between the frontend and the backend API
(`backend_reserve`). Zero business rule, zero JSX, zero React state.

```
infraestructure/
  axios/           the generic HTTP client (axios instance, base URL, auth headers,
                    URL normalization, backend error-code catalog) — no business logic
  server/
    services/
      <endpoint-name>/
        index.ts    function(s) that call the endpoint via infraestructure/axios
        types.ts    request/response types for that endpoint
```

`server/services/` is **generated** by `npm run codegen` from the backend's OpenAPI
document (see [server/SERVICES.md](./server/SERVICES.md) for the full sync workflow)
— do not hand-edit generated files to work around a contract issue; fix the backend
contract first. `axios/` is hand-written and stable; the generator points at it via
`apiClientPath` in `nextjs-codegen.config.mjs`.

## Naming rule

`<endpoint-name>` mirrors the backend resource (the slug of its OpenAPI tag), not the
name of the frontend module that will consume it.

## When to create a new adapter

Whenever a module under `modules/<domain>/infrastructure/` needs to wrap an endpoint
that doesn't have a generated service dir yet. The module imports from here
(`@/src/infraestructure/server/services/<name>`); never call `fetch`/axios directly
from inside `modules/<domain>/infrastructure/` or `presentation/`.

## What does NOT go here

- The decision of when/why to call the endpoint → the module's adapter or the hook.
- Normalizing the payload into the shape the UI consumes → the module's adapter (this
  migration keeps normalization inside `modules/<domain>/infrastructure/adapters.ts`
  until a `domain/` layer exists).
- A new HTTP client for a *different* external API (not the `backend_reserve`
  backend) — e.g. the IBGE states/cities lookup in `shared/services/states-service.ts`
  stays there, it never gets a generated adapter.
```

- [ ] **Step 13: Criar `src/infraestructure/server/SERVICES.md`**

```markdown
## Backend API integration

The typed backend clients are generated from the Swagger/OpenAPI JSON into
`src/infraestructure/server/services`. They are committed to the repository and must
not be edited manually. Module code encapsulates transport details behind stable
adapters in `src/modules/<domain>/infrastructure/` whenever the generated shape is not
itself the intended module interface (which is the case for every domain in this
migration — see [MODULES.md](../../modules/MODULES.md)).

The generator reads its source in this order:

1. `OPENAPI_SPEC_URL`
2. `NEXT_PUBLIC_RESERVE_API_URL`
3. `NEXT_PUBLIC_API_URL`
4. `NEXT_PUBLIC_LOCAL_API_URL`
5. `NEXT_LOCAL_API_URL`
6. `http://localhost:3002`

The default Swagger document is `<backend-url>/api/docs-json`.

### Update after a backend change

```bash
npm run codegen:diff
npm run codegen
npm run test:run
npm run build
```

Always inspect `npm run codegen:diff` before regenerating. Review removed or renamed
operations, request fields that became required, response-shape changes, and
authentication changes. Then update affected adapters in `modules/<domain>/infrastructure/`.

Do not edit `src/infraestructure/server/services` to repair an invalid contract. If
the generator reports duplicate or missing operation IDs, unresolved schemas, or an
invalid/unreachable Swagger document, fix the backend contract first — flag it to the
backend repo (`backend_reserve`), don't hand-patch generated output.

The client generator is
[nextjs-openapi-codegen](https://github.com/Last-Code-MgL/nextjs-openapi-codegen).

### Troubleshooting

- Override the contract source with `OPENAPI_SPEC_URL` when the local backend is not
  running.
- Run `npm run codegen:diff` to determine whether a backend deployment actually
  changes generated output.
- Keep generated route handlers out of the application: this project intentionally
  writes them to an ignored cache directory (`node_modules/.cache/`) because it calls
  the backend directly, not through a Next.js API proxy.
```

- [ ] **Step 14: Criar os diretórios vazios necessários (git precisa de um arquivo para rastrear a pasta)**

```bash
mkdir -p src/modules src/presentation/actions src/presentation/components/atoms/shadcn-ui \
  src/presentation/components/atoms/reserve src/presentation/components/organisms \
  src/presentation/components/layouts src/presentation/components/pages src/presentation/i18n \
  src/shared/domain/types src/shared/enums src/shared/hooks src/shared/interfaces src/shared/lib \
  src/shared/query src/shared/schemas src/shared/services src/shared/stores src/shared/styles \
  src/shared/utils src/infraestructure/axios src/infraestructure/server/services
```

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "docs: port Zarp DDD architecture rule files, adapted for Reserve

Adds src/SRC.md and the per-folder .md rule files (app, modules, presentation,
shared, infraestructure, shared/domain, shared/hooks, shared/lib, shared/query,
shared/stores, shared/styles) that document the target structure before any file
is moved. Module names and env vars are Reserve-specific throughout."
```

---

### Task 4: Mover `shared/` — pastas simples sem split de domínio

**Files:**
- Move (diretório inteiro): `src/common/lib` → `src/shared/lib`
- Move (diretório inteiro): `src/common/utils` → `src/shared/utils`
- Move (diretório inteiro): `src/common/enums` → `src/shared/enums`
- Move (diretório inteiro): `src/common/interfaces` → `src/shared/interfaces`
- Move (diretório inteiro): `src/common/schemas` → `src/shared/schemas`
- Move (diretório inteiro): `src/common/stores` → `src/shared/stores`
- Move: `src/common/styles/globals.css` → `src/shared/styles/globals.css`
- Move (diretório inteiro): `src/common/@types` → `src/shared/domain/types`
- Move: `src/common/services/states-service.ts` → `src/shared/services/states-service.ts`
- Move: `src/common/hooks/{use-debounce,use-toast,use-permissions,use-tenants,use-admin-profile,use-current-admin,use-user-authentication,useUserDatails,useLocation,use-list-leads}.ts` → `src/shared/hooks/`

**Interfaces:**
- Consumes: nenhuma (não depende de código gerado)
- Produces: `@/src/shared/{lib,utils,enums,interfaces,schemas,stores,styles,domain/types,services,hooks}/*` consumido por todas as tasks seguintes

- [ ] **Step 1: Mover diretórios inteiros com `git mv`**

```bash
git mv src/common/lib src/shared/lib
git mv src/common/utils src/shared/utils
git mv src/common/enums src/shared/enums
git mv src/common/interfaces src/shared/interfaces
git mv src/common/schemas src/shared/schemas
git mv src/common/stores src/shared/stores
mkdir -p src/shared/styles
git mv src/common/styles/globals.css src/shared/styles/globals.css
git mv src/common/@types src/shared/domain/types
mkdir -p src/shared/services
git mv src/common/services/states-service.ts src/shared/services/states-service.ts
```

- [ ] **Step 2: Mover os hooks genéricos (não específicos de domínio) para `shared/hooks/`**

```bash
git mv src/common/hooks/use-debounce.ts src/shared/hooks/use-debounce.ts
git mv src/common/hooks/use-toast.ts src/shared/hooks/use-toast.ts
git mv src/common/hooks/use-permissions.ts src/shared/hooks/use-permissions.ts
git mv src/common/hooks/use-tenants.ts src/shared/hooks/use-tenants.ts
git mv src/common/hooks/use-admin-profile.ts src/shared/hooks/use-admin-profile.ts
git mv src/common/hooks/use-current-admin.ts src/shared/hooks/use-current-admin.ts
git mv src/common/hooks/use-user-authentication.ts src/shared/hooks/use-user-authentication.ts
git mv src/common/hooks/useUserDatails.ts src/shared/hooks/useUserDatails.ts
git mv src/common/hooks/useLocation.ts src/shared/hooks/useLocation.ts
git mv src/common/hooks/use-list-leads.ts src/shared/hooks/use-list-leads.ts
```

- [ ] **Step 3: Corrigir todos os imports que apontavam para os caminhos antigos**

```bash
grep -rl '@/src/common/lib' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/lib|@/src/shared/lib|g'
grep -rl '@/src/common/utils' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/utils|@/src/shared/utils|g'
grep -rl '@/src/common/enums' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/enums|@/src/shared/enums|g'
grep -rl '@/src/common/interfaces' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/interfaces|@/src/shared/interfaces|g'
grep -rl '@/src/common/schemas' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/schemas|@/src/shared/schemas|g'
grep -rl '@/src/common/stores' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/stores|@/src/shared/stores|g'
grep -rl '@/src/common/styles' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/styles|@/src/shared/styles|g'
grep -rl '@/src/common/@types' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/@types|@/src/shared/domain/types|g'
grep -rl '@/src/common/services/states-service' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/services/states-service|@/src/shared/services/states-service|g'
grep -rl '@/src/common/hooks/use-debounce\|@/src/common/hooks/use-toast\|@/src/common/hooks/use-permissions\|@/src/common/hooks/use-tenants\b\|@/src/common/hooks/use-admin-profile\|@/src/common/hooks/use-current-admin\|@/src/common/hooks/use-user-authentication\|@/src/common/hooks/useUserDatails\|@/src/common/hooks/useLocation\|@/src/common/hooks/use-list-leads' src --include='*.ts' --include='*.tsx' -E | xargs -r sed -i -E 's|@/src/common/hooks/(use-debounce|use-toast|use-permissions|use-tenants|use-admin-profile|use-current-admin|use-user-authentication|useUserDatails|useLocation|use-list-leads)|@/src/shared/hooks/\1|g'
```

- [ ] **Step 4: Corrigir `components.json` (alias `utils`/`ui`/`css`)**

Leia `components.json` e edite:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/shared/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/src/presentation/components",
    "utils": "@/src/shared/lib/utils",
    "ui": "@/src/presentation/components/atoms/shadcn-ui",
    "lib": "@/src/shared/lib",
    "hooks": "@/src/shared/hooks"
  },
  "registries": {
    "@plate": "https://platejs.org/r/{name}.json"
  }
}
```

(O alias `ui`/`components` aponta para o destino final da Task 8/9 — o build não falha por isso agora porque nada lê `components.json` em runtime, só o `shadcn` CLI.)

- [ ] **Step 5: Build e teste**

```bash
npm run build
npm run test:run
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: move common/{lib,utils,enums,interfaces,schemas,stores,styles,@types} to shared/

Whole-directory moves into the new shared/ tree per src/SHARED.md. states-service.ts
(calls the external IBGE API, not backend_reserve) moves to shared/services/ instead
of a module, per infraestructure/INFRAESTRUCTURE.md's external-API carve-out."
```

---

### Task 5: Mover `common/config` para `infraestructure/axios` e adicionar `normalize-api-request-url`

**Files:**
- Move: `src/common/config/api.ts` → `src/infraestructure/axios/api.ts`
- Move: `src/common/config/api-email.ts` → `src/infraestructure/axios/api-email.ts`
- Move: `src/common/config/cms-public-api-client.ts` → `src/infraestructure/axios/cms-public-api-client.ts`
- Move: `src/common/config/build-api-base-url.ts` → `src/infraestructure/axios/build-api-base-url.ts`
- Move: `src/common/config/get-auth-headers.ts` → `src/infraestructure/axios/get-auth-headers.ts`
- Move: `src/common/config/error-types.ts` → `src/infraestructure/axios/error-types.ts`
- Create: `src/infraestructure/axios/normalize-api-request-url.ts`
- Create: `src/infraestructure/axios/AXIOS.md`
- Test: `src/infraestructure/axios/normalize-api-request-url.test.ts`

**Interfaces:**
- Consumes: nenhuma
- Produces: `apiClient`/`cmsApiClient` de `@/src/infraestructure/axios/api`, `normalizeApiRequestUrl(baseURL, requestUrl): string | undefined` — consumido pelo `apiClientPath` do `nextjs-codegen.config.mjs` (Task 10) e por todo `modules/<domain>/infrastructure/*` das Tasks 12–25

- [ ] **Step 1: Mover os arquivos**

```bash
git mv src/common/config/api.ts src/infraestructure/axios/api.ts
git mv src/common/config/api-email.ts src/infraestructure/axios/api-email.ts
git mv src/common/config/cms-public-api-client.ts src/infraestructure/axios/cms-public-api-client.ts
git mv src/common/config/build-api-base-url.ts src/infraestructure/axios/build-api-base-url.ts
git mv src/common/config/get-auth-headers.ts src/infraestructure/axios/get-auth-headers.ts
git mv src/common/config/error-types.ts src/infraestructure/axios/error-types.ts
rmdir src/common/config 2>/dev/null || true
```

- [ ] **Step 2: Criar `src/infraestructure/axios/normalize-api-request-url.ts`**

Isso evita um bug real: a `baseURL` do axios (`buildApiBaseUrl`) já termina em `/api`, mas os serviços gerados pelo `nextjs-openapi-codegen` chamam caminhos que também começam com `/api/...` (visto no exemplo de referência da Zarp, `leadCollectionsService.leadCollectionCreate` chama `apiClient.post('/api/leads/collections', ...)`). Sem essa normalização, a requisição final duplica o prefixo (`.../api/api/leads/collections`).

```ts
const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;

export function normalizeApiRequestUrl(
  baseURL: string | undefined,
  requestUrl: string | undefined,
): string | undefined {
  if (!baseURL || !requestUrl || ABSOLUTE_URL.test(requestUrl)) return requestUrl;

  const basePath = new URL(baseURL, "http://local.invalid").pathname.replace(/\/+$/, "");
  if (!basePath.endsWith("/api")) return requestUrl;

  return requestUrl.replace(/^\/api(?=[/?#]|$)/, "") || "/";
}
```

- [ ] **Step 3: Test `src/infraestructure/axios/normalize-api-request-url.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { normalizeApiRequestUrl } from "./normalize-api-request-url";

describe("normalizeApiRequestUrl", () => {
  it("removes a duplicated /api prefix from relative requests", () => {
    expect(normalizeApiRequestUrl("https://api.example.com/api", "/api/leads")).toBe("/leads");
    expect(normalizeApiRequestUrl("https://api.example.com/api", "/health")).toBe("/health");
    expect(normalizeApiRequestUrl("https://api.example.com/api", "/api?ready=1")).toBe("?ready=1");
  });

  it("leaves requests untouched when baseURL does not end in /api", () => {
    expect(normalizeApiRequestUrl("https://api.example.com", "/api/leads")).toBe("/api/leads");
  });

  it("leaves absolute URLs untouched", () => {
    expect(
      normalizeApiRequestUrl("https://api.example.com/api", "https://cdn.example.com/api/x"),
    ).toBe("https://cdn.example.com/api/x");
  });

  it("returns undefined/empty inputs unchanged", () => {
    expect(normalizeApiRequestUrl(undefined, "/api/leads")).toBe("/api/leads");
    expect(normalizeApiRequestUrl("https://api.example.com/api", undefined)).toBeUndefined();
  });
});
```

- [ ] **Step 4: Editar `src/infraestructure/axios/api.ts` para chamar a normalização nos dois interceptors**

Abra o arquivo (já movido) e adicione o import e a linha de normalização no início de cada request interceptor:

```ts
import axios from "axios";
import { handleUnauthorizedError, isUnauthorizedError } from "@/src/shared/utils/auth-error-handler";
import { buildApiBaseUrl } from "./build-api-base-url";
import { injectAuthHeaders } from "./get-auth-headers";
import { normalizeApiRequestUrl } from "./normalize-api-request-url";

// In browser (client-side), only NEXT_PUBLIC_ variables are available
const API_URL = typeof window !== 'undefined'
  ? (process.env.NODE_ENV === 'development'
    ? (process.env.NEXT_PUBLIC_LOCAL_API_URL ?? 'http://localhost:3002')
    : (process.env.NEXT_PUBLIC_RESERVE_API_URL ?? process.env.NEXT_PUBLIC_API_URL))
  : (process.env.NODE_ENV === 'development'
    ? (process.env.NEXT_PUBLIC_LOCAL_API_URL ?? process.env.NEXT_LOCAL_API_URL)
    : (process.env.NEXT_PUBLIC_RESERVE_API_URL ?? process.env.NEXT_PUBLIC_API_URL));

const api = axios.create({
  baseURL: buildApiBaseUrl(API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    config.url = normalizeApiRequestUrl(config.baseURL, config.url);
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const skipTenant = config.headers['x-skip-tenant'] === 'true';
    delete config.headers['x-skip-tenant'];

    const result = await injectAuthHeaders(config);

    if (skipTenant) {
      delete result.headers['x-tenant-id'];
    }

    return result;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isUnauthorizedError(error)) {
      handleUnauthorizedError();
    }
    return Promise.reject(error);
  }
);

export default api;
export { api as apiClient };

const cmsApi = axios.create({
  baseURL: buildApiBaseUrl(API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
});

cmsApi.interceptors.request.use(
  async (config) => {
    config.url = normalizeApiRequestUrl(config.baseURL, config.url);
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return injectAuthHeaders(config);
  },
  (error) => Promise.reject(error),
);

cmsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export { cmsApi as cmsApiClient };
```

- [ ] **Step 5: Criar `src/infraestructure/axios/AXIOS.md`**

```markdown
# infraestructure/axios/

The generic HTTP client and the low-level wiring to talk to the backend: axios
instance (`api.ts`, `api-email.ts`, `cms-public-api-client.ts`), base URL assembly
(`build-api-base-url.ts`), auth headers (`get-auth-headers.ts`), request URL
normalization (`normalize-api-request-url.ts`), and the backend's error-code catalog
(`error-types.ts`).

## Rule

Only genuine transport belongs here — don't model business rules about when/how to
call an endpoint (that's the module's `infrastructure/` adapter). A new HTTP client
for a different external API also belongs here, as long as more than one module
consumes it; otherwise it goes inside the module that uses it (or `shared/services/`
if the module hasn't been promoted yet, as with `states-service.ts`).

`nextjs-codegen.config.mjs` (`apiClientPath`) points the generated services in
`infraestructure/server/services/` at `api.ts` here — if you rename or move this
folder again, update that config too, or `npm run codegen` silently regenerates
services pointing at a stale path with no TypeScript error (it's a string, not a
static import).
```

- [ ] **Step 6: Corrigir todos os imports**

```bash
grep -rl "@/src/common/config/api-email" src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/config/api-email|@/src/infraestructure/axios/api-email|g'
grep -rl "@/src/common/config/cms-public-api-client" src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/config/cms-public-api-client|@/src/infraestructure/axios/cms-public-api-client|g'
grep -rl "@/src/common/config/build-api-base-url" src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/config/build-api-base-url|@/src/infraestructure/axios/build-api-base-url|g'
grep -rl "@/src/common/config/get-auth-headers" src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/config/get-auth-headers|@/src/infraestructure/axios/get-auth-headers|g'
grep -rl "@/src/common/config/error-types" src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/config/error-types|@/src/infraestructure/axios/error-types|g'
grep -rl "@/src/common/config/api'" src --include='*.ts' --include='*.tsx' | xargs sed -i "s|@/src/common/config/api'|@/src/infraestructure/axios/api'|g"
grep -rl '@/src/common/config/api"' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/config/api"|@/src/infraestructure/axios/api"|g'
rmdir src/common/config 2>/dev/null || true
```

- [ ] **Step 7: Build e teste**

```bash
npm run build
npm run test:run
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: move common/config to infraestructure/axios, add /api dedup guard

Adds normalize-api-request-url.ts, wired into both axios instances' request
interceptors, so generated services calling paths with a leading /api don't
double up against a baseURL that already ends in /api."
```

---

### Task 6: Mover i18n, messages e layout para `presentation/`

**Files:**
- Move (diretório inteiro): `src/i18n` → `src/presentation/i18n`
- Move (diretório inteiro): `src/messages` → `src/presentation/i18n/messages`
- Move: `src/layout/root-layout.tsx` → `src/presentation/components/layouts/root-layout.tsx`
- Modify: `next.config.mjs`
- Modify: `next-intl.config.ts`
- Modify: `src/presentation/i18n/request.ts`

**Interfaces:**
- Consumes: nenhuma
- Produces: `@/src/presentation/i18n/{routing,navigation,request}`, `@/src/presentation/components/layouts/root-layout` (exporta `LayoutScopeRoot`) — consumido pela Task 26

- [ ] **Step 1: Mover os diretórios**

```bash
git mv src/i18n src/presentation/i18n
mkdir -p src/presentation/i18n
git mv src/messages src/presentation/i18n/messages
mkdir -p src/presentation/components/layouts
git mv src/layout/root-layout.tsx src/presentation/components/layouts/root-layout.tsx
rmdir src/layout 2>/dev/null || true
```

- [ ] **Step 2: Ajustar o import do JSON de mensagens em `src/presentation/i18n/request.ts`**

O arquivo original importa `../messages/${locale}.json` relativo a `src/i18n/`; como `messages/` agora é `src/presentation/i18n/messages/`, o caminho relativo continua `../messages/` **a partir de** `src/presentation/i18n/request.ts` — mas como movemos `messages` para dentro de `i18n/`, o caminho relativo correto agora é `./messages/${locale}.json`:

```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { cookies } from 'next/headers';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const store = await cookies();
  const cookieLocale = store.get('NEXT_LOCALE')?.value;
  const requested = cookieLocale || (await requestLocale);
  const locale =
    requested && hasLocale(routing.locales, requested)
      ? requested
      : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Editar `next.config.mjs`**

```js
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/presentation/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      '@heroui/react',
      'lucide-react',
      'react-icons',
      'recharts',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'framer-motion',
    ],
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 4: Editar `next-intl.config.ts`**

```ts
import { routing } from './src/presentation/i18n/routing';

export default routing;
```

- [ ] **Step 5: Corrigir todos os imports de `@/src/i18n`, `@/src/layout` e `@/src/messages`**

```bash
grep -rl '@/src/i18n' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/i18n|@/src/presentation/i18n|g'
grep -rl '@/src/layout/root-layout' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/layout/root-layout|@/src/presentation/components/layouts/root-layout|g'
grep -rl '@/src/messages' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/messages|@/src/presentation/i18n/messages|g'
grep -rl '"../components/ui/header"' src/app --include='*.tsx' 2>/dev/null | true
```

- [ ] **Step 6: Build e teste**

```bash
npm run build
npm run test:run
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: move i18n, messages, and root-layout under presentation/"
```

---

### Task 7: Mover `common/actions` para `presentation/actions`

**Files:**
- Move (diretório inteiro): `src/common/actions` → `src/presentation/actions`

**Interfaces:**
- Consumes: nenhuma
- Produces: `@/src/presentation/actions/*` — consumido pelas pages movidas na Task 26

- [ ] **Step 1: Mover o diretório inteiro (preserva a subestrutura `email-campaign/`, `leads/`, `payments/`, `smtp-server/`)**

```bash
git mv src/common/actions src/presentation/actions
```

- [ ] **Step 2: Corrigir todos os imports**

```bash
grep -rl '@/src/common/actions' src --include='*.ts' --include='*.tsx' | xargs sed -i 's|@/src/common/actions|@/src/presentation/actions|g'
```

- [ ] **Step 3: Build e teste**

```bash
npm run build
npm run test:run
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move common/actions to presentation/actions"
```

---

### Task 8: Separar `components/ui` em `atoms/shadcn-ui` e `atoms/reserve`

**Files:**
- Move: 19 arquivos de `src/components/ui/*` → `src/presentation/components/atoms/shadcn-ui/*`
- Move: 14 arquivos de `src/components/ui/*` → `src/presentation/components/atoms/reserve/*`
- Move: `components/ui/editor.tsx`, `components/ui/editor-static.tsx` (pasta raiz do repo) → `src/presentation/components/atoms/shadcn-ui/*`
- Delete: pasta raiz `components/` (fora de `src/`)

**Interfaces:**
- Consumes: nenhuma
- Produces: `@/src/presentation/components/atoms/shadcn-ui/*`, `@/src/presentation/components/atoms/reserve/*` — consumido por toda a Task 9 e pelas pages da Task 26

- [ ] **Step 1: Mover os componentes vendorizados pelo shadcn CLI para `atoms/shadcn-ui/`**

```bash
for f in accordion alert button card checkbox dialog dropdown-menu input label radio-group scroll-area select sheet switch table tabs textarea toast tooltip; do
  git mv "src/components/ui/$f.tsx" "src/presentation/components/atoms/shadcn-ui/$f.tsx"
done
```

- [ ] **Step 2: Mover os arquivos `editor`/`editor-static` da pasta raiz `components/` (fora de `src/`) para `atoms/shadcn-ui/`**

```bash
git mv components/ui/editor.tsx src/presentation/components/atoms/shadcn-ui/editor.tsx
git mv components/ui/editor-static.tsx src/presentation/components/atoms/shadcn-ui/editor-static.tsx
rmdir components/ui components 2>/dev/null || true
```

- [ ] **Step 3: Mover os primitivos autorais (não vendorizados) para `atoms/reserve/`**

```bash
for f in aside campaign-setup-status currency-input custom-pagination header language-switcher loading menu modal password-input pi-bot theme-switcher toggle-switch toggle-switch-group; do
  git mv "src/components/ui/$f.tsx" "src/presentation/components/atoms/reserve/$f.tsx"
done
rmdir src/components/ui 2>/dev/null || true
```

- [ ] **Step 4: Corrigir todos os imports — os 19 nomes de `shadcn-ui/` primeiro (mais específico), depois os 14 de `reserve/`**

```bash
for f in accordion alert button card checkbox dialog dropdown-menu input label radio-group scroll-area select sheet switch table tabs textarea toast tooltip editor editor-static; do
  grep -rl "@/src/components/ui/$f\b" src --include='*.ts' --include='*.tsx' -E | xargs -r sed -i -E "s|@/src/components/ui/$f\b|@/src/presentation/components/atoms/shadcn-ui/$f|g"
done
for f in aside campaign-setup-status currency-input custom-pagination header language-switcher loading menu modal password-input pi-bot theme-switcher toggle-switch toggle-switch-group; do
  grep -rl "@/src/components/ui/$f\b" src --include='*.ts' --include='*.tsx' -E | xargs -r sed -i -E "s|@/src/components/ui/$f\b|@/src/presentation/components/atoms/reserve/$f|g"
done
grep -rl '"../components/ui/header"' src/app --include='*.tsx' | xargs -r sed -i 's|"../components/ui/header"|"@/src/presentation/components/atoms/reserve/header"|g'
grep -rl "@/src/components/ui/aside" src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/components/ui/aside|@/src/presentation/components/atoms/reserve/aside|g'
```

- [ ] **Step 5: Build e teste**

```bash
npm run build
npm run test:run
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: split components/ui into atoms/shadcn-ui and atoms/reserve

Mirrors Zarp's atoms/ split: vendored shadcn CLI output stays untouched in
shadcn-ui/, product-authored domain-agnostic primitives move to reserve/.
Also folds the orphaned root-level components/ui/{editor,editor-static}.tsx
(never reachable via the @/src/* alias) into shadcn-ui/ and removes the
now-empty root components/ folder."
```

---

### Task 9: Mover `components/<domain>` para `presentation/components/organisms/<domain>`

**Files:**
- Move (diretório inteiro): 19 pastas de domínio de `src/components/*` → `src/presentation/components/organisms/*`
- Move: `src/components/campaign-actions.tsx` → `src/presentation/components/organisms/leads/campaign-actions.tsx`
- Move: `src/components/tenant-selector.tsx` → `src/presentation/components/organisms/access-management/tenant-selector.tsx`

**Interfaces:**
- Consumes: `@/src/presentation/components/atoms/{shadcn-ui,reserve}/*` (Task 8)
- Produces: `@/src/presentation/components/organisms/<domain>/*` — consumido pelas pages da Task 26

- [ ] **Step 1: Mover as 19 pastas de domínio (diretório inteiro cada, preserva subestrutura)**

```bash
for d in access-management appointments b2b b2c cms coupons email-builder email-editor forms hotel-portal kanban leads modals notifications payments reports stats tables tabs; do
  git mv "src/components/$d" "src/presentation/components/organisms/$d"
done
```

- [ ] **Step 2: Mover os dois arquivos soltos, atribuindo-os ao domínio mais próximo**

```bash
git mv src/components/campaign-actions.tsx src/presentation/components/organisms/leads/campaign-actions.tsx
git mv src/components/tenant-selector.tsx src/presentation/components/organisms/access-management/tenant-selector.tsx
rmdir src/components 2>/dev/null || true
```

- [ ] **Step 3: Corrigir todos os imports — um sed por domínio (ordem importa: `campaign-actions`/`tenant-selector` antes do genérico `@/src/components/<domain>`)**

```bash
grep -rl '@/src/components/campaign-actions' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/components/campaign-actions|@/src/presentation/components/organisms/leads/campaign-actions|g'
grep -rl '@/src/components/tenant-selector' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/components/tenant-selector|@/src/presentation/components/organisms/access-management/tenant-selector|g'
for d in access-management appointments b2b b2c cms coupons email-builder email-editor forms hotel-portal kanban leads modals notifications payments reports stats tables tabs; do
  grep -rl "@/src/components/$d/" src --include='*.ts' --include='*.tsx' | xargs -r sed -i "s|@/src/components/$d/|@/src/presentation/components/organisms/$d/|g"
done
```

- [ ] **Step 4: Build e teste**

```bash
npm run build
npm run test:run
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move components/<domain> to presentation/components/organisms/<domain>

Whole-directory moves for all 19 domain folders, per src/presentation/PRESENTATION.md.
campaign-actions.tsx and tenant-selector.tsx (loose files at the old components/
root) move into the leads/ and access-management/ organisms respectively."
```

---

### Task 10: Instalar e configurar `nextjs-openapi-codegen`

**Files:**
- Modify: `package.json`
- Create: `nextjs-codegen.config.mjs`

**Interfaces:**
- Consumes: `@/src/infraestructure/axios/api` (Task 5)
- Produces: comandos `npm run codegen` / `npm run codegen:diff`; `src/infraestructure/server/services/` (gerado na Task 11)

- [ ] **Step 1: Instalar a devDependency**

```bash
npm install --save-dev nextjs-openapi-codegen@1.0.2
```

- [ ] **Step 2: Adicionar os scripts em `package.json`**

Abra `package.json` e edite o bloco `"scripts"`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx -c .eslintrc.json --fix",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "codegen": "nextjs-codegen generate",
    "codegen:diff": "nextjs-codegen diff"
  }
}
```

- [ ] **Step 3: Criar `nextjs-codegen.config.mjs` na raiz do repo**

Variáveis de ambiente do Reserve (lidas de `src/infraestructure/axios/api.ts`, ver Task 5): `NEXT_PUBLIC_RESERVE_API_URL` (produção), `NEXT_PUBLIC_API_URL` (fallback), `NEXT_PUBLIC_LOCAL_API_URL` / `NEXT_LOCAL_API_URL` (dev local), fallback final `http://localhost:3002`. O backend expõe Swagger em `/api/docs` com `SwaggerModule.setup('api/docs', app, document)` sem opções — o NestJS Swagger gera automaticamente `/api/docs-json` ao lado.

```js
const developmentApiUrl =
  process.env.NEXT_PUBLIC_LOCAL_API_URL ??
  process.env.NEXT_LOCAL_API_URL ??
  "http://localhost:3002";

const apiUrl =
  process.env.NEXT_PUBLIC_RESERVE_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  developmentApiUrl;

const normalizedApiUrl = apiUrl.replace(/\/$/, "");

/** @type {import('nextjs-openapi-codegen').CodegenConfig[]} */
export default [
  {
    name: "reserve-admin-api",
    spec:
      process.env.OPENAPI_SPEC_URL ??
      `${normalizedApiUrl}/api/docs-json`,
    // The application consumes generated services directly. Route handlers are
    // generated into npm's ignored cache to avoid exposing a second API proxy.
    routesOut: "node_modules/.cache/nextjs-openapi-codegen/routes",
    servicesOut: "src/infraestructure/server/services",
    apiEnvVar: "NEXT_PUBLIC_RESERVE_API_URL",
    apiFallback: normalizedApiUrl,
    stripPathPrefix: "/api",
    apiClientPath: "@/src/infraestructure/axios/api",
    apiClient: false,
    fetchBackend: false,
  },
];
```

- [ ] **Step 4: Build e teste (o codegen ainda não rodou — isso só valida que a instalação não quebrou nada)**

```bash
npm run build
npm run test:run
```

- [ ] **Step 5: Commit**

```bash
git add -A package.json package-lock.json nextjs-codegen.config.mjs
git commit -m "build: install nextjs-openapi-codegen and add codegen/codegen:diff scripts

Config mirrors Zarp's nextjs-codegen.config.mjs with Reserve's own env var names
(NEXT_PUBLIC_RESERVE_API_URL instead of NEXT_PUBLIC_ZARP_API_URL) and points
apiClientPath at the axios instance moved in Task 5."
```

---

### Task 11: Gerar a camada de transporte a partir do OpenAPI do `backend_reserve`

**Files:**
- Create: `src/infraestructure/server/services/**` (gerado, ~48+ diretórios de serviço)

**Interfaces:**
- Consumes: `backend_reserve` rodando localmente (ou `OPENAPI_SPEC_URL` apontando para um ambiente com o Swagger publicado)
- Produces: um módulo de serviço tipado por tag OpenAPI em `src/infraestructure/server/services/<slug>/{index.ts,types.ts}` — consumido por todas as Tasks 12–25

- [ ] **Step 1: Subir o backend localmente (ou apontar `OPENAPI_SPEC_URL` para um ambiente já rodando)**

```bash
cd "C:/Users/gabri/OneDrive/Documents/GitHub/backend_reserve"
npm run start:dev
```

Deixe rodando em outro terminal. Confirme que `http://localhost:3002/api/docs-json` responde com JSON antes de prosseguir.

- [ ] **Step 2: Rodar `codegen:diff` primeiro (regra do `AGENTS.md`, ver Task 27)**

```bash
cd "C:/Users/gabri/OneDrive/Documents/GitHub/frontend_dashboard_reserve-fase4"
npm run codegen:diff
```

Como `src/infraestructure/server/services/` ainda não existe, a saída deve listar **todos** os serviços como "novos". Leia a saída — ela reporta duplicidade de `operationId` ou tags ausentes se houver; **12 controllers do backend não têm `@ApiTags`** (`admin-email.controller.ts`, `email-campaign-batch.controller.ts`, e 10 controllers de `reserve-client-portal`) — como `@nestjs/swagger` usa `autoTagControllers: true` por padrão quando `SwaggerModule.createDocument(app, config)` é chamado sem opções (confirmado em `node_modules/@nestjs/swagger/dist/explorers/api-use-tags.explorer.js`), cada um desses ainda recebe uma tag automática = nome da classe sem o sufixo `Controller` (`AdminHotelClient`, `WhatsAppRedirect`, `EmailCampaignBatch`, etc.) — não caem todos numa tag `default` genérica.

- [ ] **Step 3: Gerar**

```bash
npm run codegen
```

- [ ] **Step 4: Verificar colisão de nome de método dentro da tag `Notifications`**

O backend tem duas tags que colidem em `list` dentro do domínio de notificações
(`notification.controller.ts` e `notification-tenant.controller.ts`, tags
`Notifications (super_admin)` / `Notifications (tenant admin)` — o slugifier do
gerador remove o conteúdo entre parênteses, então ambas colapsam para o mesmo slug
`notifications`). Depois de gerar, confirme manualmente:

```bash
ls src/infraestructure/server/services | grep notif
grep -n "async " src/infraestructure/server/services/notifications/index.ts
```

Se dois métodos `list` aparecerem no mesmo objeto de serviço com nomes colidindo, isso é um problema de contrato do backend (dois `@ApiTags` diferentes que deveriam gerar dois arquivos), não algo para corrigir aqui — documente como achado e trate na Task 23 (o adapter de `modules/notifications/infrastructure/` decide qual delegar chamando o service gerado corretamente, inspecionando o arquivo real).

- [ ] **Step 5: Build e teste**

```bash
npm run build
npm run test:run
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: generate transport layer from backend_reserve OpenAPI spec

Runs nextjs-codegen generate against backend_reserve's /api/docs-json. Generated
files are committed as-is per infraestructure/server/SERVICES.md — never hand-edited."
```

---

### Task 12: Domínio `access-management`

**Files:**
- Create: `src/modules/access-management/infrastructure/adapters.ts`
- Move: `src/common/hooks/access-management/{useAdmins,useTenants,useUsers}.ts` → `src/shared/hooks/access-management/`
- Delete: `src/common/hooks/access-management/{.gitkeep,.test,.test2}` (arquivos sem função, restos de teste manual)
- Delete: `src/common/services/access-management/.gitkeep`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug correspondente às tags "Admin Management", "Tenant Management", "Admin - User Management", "User">` (gerado na Task 11)
- Produces: `fetchAdmins(page, perPage, search)`, `fetchUsers(page, perPage, search)`, e as funções antes exportadas por `admin-service.ts`/`tenant-service.ts`/`user-service.ts`/`admin-login.ts`/`admin-profile.ts` — mesma assinatura, novo caminho de import

- [ ] **Step 1: Mover os hooks**

```bash
mkdir -p src/shared/hooks/access-management
git mv src/common/hooks/access-management/useAdmins.ts src/shared/hooks/access-management/useAdmins.ts
git mv src/common/hooks/access-management/useTenants.ts src/shared/hooks/access-management/useTenants.ts
git mv src/common/hooks/access-management/useUsers.ts src/shared/hooks/access-management/useUsers.ts
git rm src/common/hooks/access-management/.gitkeep src/common/hooks/access-management/.test src/common/hooks/access-management/.test2
git rm src/common/services/access-management/.gitkeep
```

- [ ] **Step 2: Inspecionar o serviço gerado real antes de escrever o adapter**

```bash
ls src/infraestructure/server/services | grep -iE "admin-management|tenant-management|user-management|^user$"
cat src/infraestructure/server/services/admin-management/index.ts
cat src/infraestructure/server/services/tenant-management/index.ts
cat src/infraestructure/server/services/admin-user-management/index.ts
cat src/infraestructure/server/services/user/index.ts
```

- [ ] **Step 3: Criar `src/modules/access-management/infrastructure/adapters.ts` preservando as assinaturas antigas**

Preserve exatamente as assinaturas hoje usadas pelos hooks: `fetchAdmins(page = 1, perPage = 10, search?)`, `fetchUsers(page = 1, perPage = 10, search?)`, e as funções de `tenant-service.ts` — implementadas por cima do `apiClient` (mantendo o header `x-skip-tenant` condicional a super admin, já que o serviço gerado não expõe esse controle fino) e, quando o serviço gerado cobre 1:1 a chamada, delegando para ele:

```ts
import { apiClient } from "@/src/infraestructure/axios/api";
import type {
  Admin,
  PaginatedResponse,
  CreateAdminDto,
  UpdateAdminDto,
  AdminRole,
} from "@/src/shared/domain/types/@access-management";
import type { User, UpdateUserDto } from "@/src/shared/domain/types/@access-management";

function isSuperAdminCookie(): boolean {
  return typeof window !== "undefined"
    ? document.cookie
        .split("; ")
        .find((row) => row.startsWith("session-role="))
        ?.split("=")[1] === "super_admin"
    : false;
}

/** Fetch paginated list of admins. Client-side search/pagination because the
 *  backend returns a flat array. TODO(arquitetura): move pagination/search into
 *  the backend query once reserve-auth supports it, then delegate to the
 *  generated admin-management service directly. */
export const fetchAdmins = async (
  page: number = 1,
  perPage: number = 10,
  search?: string,
): Promise<PaginatedResponse<Admin>> => {
  const headers = isSuperAdminCookie() ? { "x-skip-tenant": "true" } : {};
  const response = await apiClient.get("/admin/", { headers });
  const raw = response.data;
  let admins: Admin[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

  if (search) {
    const term = search.toLowerCase();
    admins = admins.filter(
      (a) => a.name?.toLowerCase().includes(term) || a.email?.toLowerCase().includes(term),
    );
  }

  const total = admins.length;
  const start = (page - 1) * perPage;
  const data = admins.slice(start, start + perPage);

  return { data, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
};

export const fetchUsers = async (
  page: number = 1,
  perPage: number = 10,
  search?: string,
): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get("/admin/users", {
    params: { page, limit: perPage },
    headers: { "x-skip-tenant": "true" },
  });
  const raw = response.data;
  let users: User[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

  if (search) {
    const term = search.toLowerCase();
    users = users.filter(
      (u) => u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term),
    );
  }

  return {
    data: users,
    total: users.length,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(users.length / perPage)),
  };
};

export const createAdmin = async (payload: CreateAdminDto): Promise<Admin> => {
  const { data } = await apiClient.post("/admin/register", payload);
  return data;
};

export const updateAdmin = async (id: string, payload: UpdateAdminDto): Promise<Admin> => {
  const { data } = await apiClient.patch(`/admin/${id}`, payload);
  return data;
};

export const updateUser = async (id: string, payload: UpdateUserDto): Promise<User> => {
  const { data } = await apiClient.patch(`/admin/users/${id}`, payload);
  return data;
};
```

Nota: mantenha também, neste mesmo arquivo, todas as demais funções hoje exportadas por `tenant-service.ts` (assign, updateAdminRole, etc.) copiando o corpo original — o passo acima cobre as três mais chamadas pelos hooks movidos; complete o restante inspecionando `git show HEAD~10:src/common/services/access-management/tenant-service.ts` (o conteúdo pré-migração, ainda no histórico) e portando cada função com o mesmo nome exportado.

- [ ] **Step 4: Mover `admin-login.ts` e `admin-profile.ts` para o mesmo adapter**

```bash
cat src/common/services/admin-login.ts
cat src/common/services/admin-profile.ts
```

Copie o corpo de ambos para o final de `src/modules/access-management/infrastructure/adapters.ts` (mantendo os nomes exportados), depois:

```bash
git rm src/common/services/admin-login.ts src/common/services/admin-profile.ts
git rm -r src/common/services/access-management
```

- [ ] **Step 5: Corrigir imports**

```bash
grep -rl '@/src/common/services/access-management\|@/src/common/services/admin-login\|@/src/common/services/admin-profile' src --include='*.ts' --include='*.tsx' | xargs -r sed -i \
  -e 's|@/src/common/services/access-management/admin-service|@/src/modules/access-management/infrastructure/adapters|g' \
  -e 's|@/src/common/services/access-management/tenant-service|@/src/modules/access-management/infrastructure/adapters|g' \
  -e 's|@/src/common/services/access-management/user-service|@/src/modules/access-management/infrastructure/adapters|g' \
  -e 's|@/src/common/services/admin-login|@/src/modules/access-management/infrastructure/adapters|g' \
  -e 's|@/src/common/services/admin-profile|@/src/modules/access-management/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/access-management' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/access-management|@/src/shared/hooks/access-management|g'
```

- [ ] **Step 6: Migrar os testes existentes**

```bash
mkdir -p src/modules/access-management/infrastructure/__tests__
git mv src/common/services/access-management/__tests__/admin-service.test.ts src/modules/access-management/infrastructure/__tests__/admin-service.test.ts
git mv src/common/services/access-management/__tests__/tenant-service.test.ts src/modules/access-management/infrastructure/__tests__/tenant-service.test.ts
git mv src/common/services/access-management/__tests__/user-service.test.ts src/modules/access-management/infrastructure/__tests__/user-service.test.ts
```

Edite os 3 arquivos de teste movidos, trocando o import do módulo testado de `../admin-service` (etc.) para `../adapters`.

- [ ] **Step 7: Build e teste**

```bash
npm run build
npm run test:run -- access-management
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(access-management): migrate hand-written services to modules/access-management/infrastructure/

Consolidates admin-service.ts, tenant-service.ts, user-service.ts, admin-login.ts,
and admin-profile.ts into a single adapters.ts, preserving every exported function
name and signature so consuming hooks only change their import path."
```

---

### Task 13: Domínio `leads` (incluindo isolamento de serviços órfãos)

**Files:**
- Create: `src/modules/leads/infrastructure/adapters.ts`
- Create: `src/modules/leads/infrastructure/ORPHANED-ENDPOINTS.md`
- Move: `src/common/hooks/leads/*` → `src/shared/hooks/leads/`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "Leads", "Lead Collections", "Lead Capture", "Lead Management">`
- Produces: as 17 funções de `src/common/services/leads/*` sob novo caminho, com assinatura idêntica

- [ ] **Step 1: Achado de pesquisa — 8 arquivos chamam endpoints que não existem no `backend_reserve`**

Confirmado por busca exaustiva no backend (`grep -rilE "brandAnaly|screening|qualification|temperatureAnalysis" src/modules` retornou vazio, e `lead.controller.ts` não tem rota `/qualification` nem prefixo `/auth/leads`):

| Arquivo | Endpoint chamado | Existe no backend? |
|---|---|---|
| `list-lead-qualification-service.ts` | `GET /auth/leads/qualification` | Não |
| `update-lead-qualification-service.ts` | `PATCH /auth/leads/...` | Não |
| `list-leads-service.ts` | `GET /auth/leads` | Não (rota real é `GET /leads`, sem `/auth`) |
| `complete-screening-service.ts` | `POST /auth/leads/:id/complete-screening` | Não |
| `temperature-analysis-by-message-id-service.ts` | `POST /auth/leads/temperature-analysis/:id` | Não |
| `brand-analytics-service.ts` | `GET /brand-analysis` | Não |
| `brand-analytics-detail-service.ts` | `GET /brand-analysis/:id` | Não |
| `create-brand-analytics.ts` | `POST /brand-analysis` | Não |

Não delegue essas 8 funções a um serviço gerado (não existe) — mova-as **inalteradas** para `src/modules/leads/infrastructure/adapters.ts` numa seção separada, com um comentário `TODO(arquitetura)` apontando a rota ausente, e documente em `ORPHANED-ENDPOINTS.md`. Isso preserva o comportamento atual (a chamada continuará falhando com 404 em runtime, exatamente como hoje) sem fingir que o problema foi resolvido.

- [ ] **Step 2: Criar `src/modules/leads/infrastructure/ORPHANED-ENDPOINTS.md`**

```markdown
# Endpoints órfãos do domínio `leads`

Os 8 arquivos abaixo, movidos de `common/services/` sem alteração de comportamento,
chamam rotas que **não existem** em `backend_reserve` (confirmado por busca exaustiva
em `src/modules/reserve-leads` — nenhum controller expõe `/auth/leads/qualification`,
`/auth/leads/:id/complete-screening`, `/auth/leads/temperature-analysis/:id`, ou
`/brand-analysis`). Chamá-los em produção resulta em 404. Não foram removidos nesta
fase porque removê-los é uma decisão de produto (a feature nunca foi implementada no
backend, ou foi descontinuada — não dá para saber sem o time de produto), fora do
escopo de uma migração de arquitetura.

- `listLeadQualification` (`GET /auth/leads/qualification`)
- `updateLeadQualification` (`PATCH /auth/leads/:id/...`)
- `listLeadsLegacy` (`GET /auth/leads` — nota: a rota real e funcional é
  `GET /leads`, já coberta por `leadCollectionFindAll`/`leadFindAll` no serviço
  gerado; `listLeadsLegacy` é provavelmente dead code substituído por
  `leads/list-leads-service.ts`, que chama `/leads` corretamente)
- `completeScreening` (`POST /auth/leads/:id/complete-screening`)
- `temperatureAnalysisByMessageId` (`POST /auth/leads/temperature-analysis/:id`)
- `getBrandAnalytics` / `getBrandAnalyticsDetail` / `createBrandAnalytics`
  (`/brand-analysis`)

Próximo passo recomendado (fora desta fase): confirmar com o time de produto se essas
8 funções ainda são chamadas por algum componente ativo; se não forem, remover em vez
de portar.
```

- [ ] **Step 3: Inspecionar o serviço gerado real**

```bash
ls src/infraestructure/server/services | grep -iE "^leads$|lead-collections|lead-capture|lead-management"
cat src/infraestructure/server/services/leads/index.ts
cat src/infraestructure/server/services/lead-collections/index.ts
```

- [ ] **Step 4: Criar `src/modules/leads/infrastructure/adapters.ts`**

Porte as 17 funções de `src/common/services/leads/*` preservando nome e assinatura, delegando ao serviço gerado (`leadsService`/`leadCollectionsService`, nomes exatos confirmados no Step 3) sempre que a rota bater 1:1; em seguida, na mesma arquivo, adicione as 8 funções órfãs do Step 1 sem modificação de comportamento, cada uma com o comentário:

```ts
// TODO(arquitetura): endpoint não existe em backend_reserve — ver ORPHANED-ENDPOINTS.md
```

- [ ] **Step 5: Mover os hooks**

```bash
mkdir -p src/shared/hooks/leads
for f in use-create-collection use-create-lead use-delete-collection use-delete-lead use-get-collection use-get-collection-leads use-get-lead use-lead-attachments use-list-all-collection-leads use-list-collections use-list-leads use-regenerate-collection-key use-update-collection use-update-lead use-update-lead-status; do
  git mv "src/common/hooks/leads/$f.ts" "src/shared/hooks/leads/$f.ts"
done
```

- [ ] **Step 6: Apagar os arquivos de serviço originais e corrigir imports**

```bash
git rm -r src/common/services/leads src/common/services/list-lead-qualification-service.ts \
  src/common/services/list-leads-service.ts src/common/services/complete-screening-service.ts \
  src/common/services/temperature-analysis-by-message-id-service.ts \
  src/common/services/brand-analytics-service.ts src/common/services/brand-analytics-detail-service.ts \
  src/common/services/create-brand-analytics.ts src/common/services/update-lead-qualification-service.ts

grep -rl '@/src/common/services/leads/\|@/src/common/services/list-lead-qualification-service\|@/src/common/services/list-leads-service\|@/src/common/services/complete-screening-service\|@/src/common/services/temperature-analysis-by-message-id-service\|@/src/common/services/brand-analytics-service\|@/src/common/services/brand-analytics-detail-service\|@/src/common/services/create-brand-analytics\|@/src/common/services/update-lead-qualification-service' src --include='*.ts' --include='*.tsx' -E | xargs -r sed -i -E \
  -e 's|@/src/common/services/leads/[a-z-]+|@/src/modules/leads/infrastructure/adapters|g' \
  -e 's|@/src/common/services/(list-lead-qualification-service|list-leads-service|complete-screening-service|temperature-analysis-by-message-id-service|brand-analytics-service|brand-analytics-detail-service|create-brand-analytics|update-lead-qualification-service)|@/src/modules/leads/infrastructure/adapters|g'

grep -rl '@/src/common/hooks/leads' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/leads|@/src/shared/hooks/leads|g'
grep -rl '@/src/common/actions/list-lead-qualification\|@/src/common/actions/list-leads\|@/src/common/actions/update-lead-qualification\|@/src/common/actions/temperature-analysis-by-message-id\|@/src/common/actions/complete-screening' src --include='*.ts' --include='*.tsx' | xargs -r sed -i \
  -e 's|@/src/common/actions/list-lead-qualification|@/src/presentation/actions/list-lead-qualification|g' \
  -e 's|@/src/common/actions/list-leads|@/src/presentation/actions/list-leads|g' \
  -e 's|@/src/common/actions/update-lead-qualification|@/src/presentation/actions/update-lead-qualification|g' \
  -e 's|@/src/common/actions/temperature-analysis-by-message-id|@/src/presentation/actions/temperature-analysis-by-message-id|g' \
  -e 's|@/src/common/actions/complete-screening|@/src/presentation/actions/complete-screening|g'
```

- [ ] **Step 7: Build e teste**

```bash
npm run build
npm run test:run -- leads
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(leads): migrate hand-written services to modules/leads/infrastructure/

8 of the 25 migrated functions call routes that do not exist in backend_reserve
(auth/leads/qualification, complete-screening, temperature-analysis, brand-analysis)
- moved unchanged with a TODO(arquitetura) marker and documented in
modules/leads/infrastructure/ORPHANED-ENDPOINTS.md, not silently wired to a
nonexistent generated adapter."
```

---

### Task 14: Domínio `appointments`

**Files:**
- Create: `src/modules/appointments/infrastructure/adapters.ts`
- Move: `src/common/hooks/appointments/*` → `src/shared/hooks/appointments/`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "Admin - Appointments", "Admin - Appointment Blocked Periods", "Admin - Appointment Schedule Configuration", "Public Appointments">`
- Produces: as funções de `appointments-service.ts`, `blocked-periods-service.ts`, `schedule-config-service.ts` sob novo caminho

- [ ] **Step 1: Inspecionar os serviços gerados**

```bash
ls src/infraestructure/server/services | grep -i appointment
cat src/infraestructure/server/services/admin-appointments/index.ts
cat src/infraestructure/server/services/admin-appointment-blocked-periods/index.ts
cat src/infraestructure/server/services/admin-appointment-schedule-configuration/index.ts
```

- [ ] **Step 2: Ler os 3 arquivos originais para copiar as assinaturas exatas**

```bash
cat src/common/services/appointments/appointments-service.ts
cat src/common/services/appointments/blocked-periods-service.ts
cat src/common/services/appointments/schedule-config-service.ts
```

- [ ] **Step 3: Criar `src/modules/appointments/infrastructure/adapters.ts`**

Porte as funções encontradas no Step 2 preservando nomes/assinaturas exportadas (`fetchAppointments`, `fetchAppointmentById`, `cancelAppointment`, `completeAppointment`, e as equivalentes de blocked-periods/schedule-config), delegando ao serviço gerado do Step 1.

- [ ] **Step 4: Mover os hooks**

```bash
mkdir -p src/shared/hooks/appointments
for f in use-appointment-actions use-blocked-periods use-list-appointments use-schedule-config; do
  git mv "src/common/hooks/appointments/$f.ts" "src/shared/hooks/appointments/$f.ts"
done
```

- [ ] **Step 5: Apagar originais e corrigir imports**

```bash
git rm -r src/common/services/appointments
grep -rl '@/src/common/services/appointments/' src --include='*.ts' --include='*.tsx' | xargs -r sed -i -E 's|@/src/common/services/appointments/[a-z-]+|@/src/modules/appointments/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/appointments' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/appointments|@/src/shared/hooks/appointments|g'
```

- [ ] **Step 6: Build e teste**

```bash
npm run build
npm run test:run -- appointments
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(appointments): migrate hand-written services to modules/appointments/infrastructure/"
```

---

### Task 15: Domínio `cms`

**Files:**
- Create: `src/modules/cms/infrastructure/adapters.ts`
- Move: `src/common/hooks/cms/*` → `src/shared/hooks/cms/`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "CMS Article Management", "CMS Author Management", "CMS Blogs", "CMS Image Management", "CMS - Media Assets", "CMS - Media Collections", "CMS - Media Relations", "CMS Public API">`
- Produces: as funções de `cms-article-service.ts`, `cms-author-service.ts`, `cms-blog-service.ts`, `blog-service.ts`, `cms-image-service.ts`, `cms-media-service.ts`, `cms-public-service.ts` sob novo caminho

- [ ] **Step 1: Inspecionar os 7 serviços gerados**

```bash
ls src/infraestructure/server/services | grep -i cms
for s in cms-article-management cms-author-management cms-blogs cms-image-management cms-media-assets cms-media-collections cms-media-relations cms-public-api; do
  echo "--- $s"; cat "src/infraestructure/server/services/$s/index.ts"
done
```

- [ ] **Step 2: Ler os 7 arquivos originais**

```bash
for f in cms-article-service cms-author-service cms-blog-service blog-service cms-image-service cms-media-service cms-public-service; do
  echo "--- $f"; cat "src/common/services/$f.ts"
done
```

- [ ] **Step 3: Criar `src/modules/cms/infrastructure/adapters.ts`**

Porte cada função encontrada no Step 2, preservando nome e assinatura, delegando ao serviço gerado correspondente do Step 1. Mantenha `cms-media-service.ts` e `cms-public-service.ts` como seções claramente separadas dentro do arquivo (ou, se o volume total ultrapassar ~400 linhas, separe em `adapters.ts` + `media-adapters.ts` + `public-adapters.ts` dentro da mesma pasta `infrastructure/`).

- [ ] **Step 4: Mover os hooks (preserva `index.ts` como barrel)**

```bash
mkdir -p src/shared/hooks/cms
git mv src/common/hooks/cms src/shared/hooks/cms 2>/dev/null || {
  for f in $(ls src/common/hooks/cms); do
    git mv "src/common/hooks/cms/$f" "src/shared/hooks/cms/$f"
  done
}
```

(Como `src/shared/hooks/cms` pode já ter sido criado vazio na Task 3, prefira mover arquivo a arquivo se o `git mv` de diretório falhar por a pasta destino já existir e não estar vazia.)

- [ ] **Step 5: Apagar originais e corrigir imports**

```bash
git rm src/common/services/cms-article-service.ts src/common/services/cms-author-service.ts \
  src/common/services/cms-blog-service.ts src/common/services/blog-service.ts \
  src/common/services/cms-image-service.ts src/common/services/cms-media-service.ts \
  src/common/services/cms-public-service.ts
git rm src/common/services/cms-article-service.test.ts src/common/services/cms-blog-service.test.ts \
  src/common/services/cms-public-service.test.ts 2>/dev/null || true
git rm -r src/common/services/__tests__ 2>/dev/null || true

grep -rl '@/src/common/services/cms-article-service\|@/src/common/services/cms-author-service\|@/src/common/services/cms-blog-service\|@/src/common/services/blog-service\|@/src/common/services/cms-image-service\|@/src/common/services/cms-media-service\|@/src/common/services/cms-public-service' src --include='*.ts' --include='*.tsx' -E | xargs -r sed -i -E \
  's|@/src/common/services/(cms-article-service|cms-author-service|cms-blog-service|blog-service|cms-image-service|cms-media-service|cms-public-service)|@/src/modules/cms/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/cms' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/cms|@/src/shared/hooks/cms|g'
```

- [ ] **Step 6: Recriar os testes movidos**

Os testes `cms-article-service.test.ts`, `cms-blog-service.test.ts`, `cms-public-service.test.ts`, e a pasta `__tests__/cms-integration.test.ts` / `cms-property-tests.test.ts` precisam ser recriados em `src/modules/cms/infrastructure/__tests__/`, importando de `../adapters` em vez do arquivo antigo — copie o conteúdo de cada um antes de rodar o `git rm` do Step 5, ajustando apenas a linha de import.

- [ ] **Step 7: Build e teste**

```bash
npm run build
npm run test:run -- cms
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(cms): migrate hand-written services to modules/cms/infrastructure/"
```

---

### Task 16: Domínio `coupons`

**Files:**
- Create: `src/modules/coupons/infrastructure/adapters.ts`
- Move: `src/common/hooks/useCoupons.ts` → `src/shared/hooks/coupons/use-coupons.ts`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "Admin Coupons", "Public Coupons">`
- Produces: `couponsService` (mesmo shape hoje exportado por `coupons-service.ts`) sob novo caminho

- [ ] **Step 1: Inspecionar o serviço gerado**

```bash
ls src/infraestructure/server/services | grep -i coupon
cat src/infraestructure/server/services/admin-coupons/index.ts
```

- [ ] **Step 2: Ler o arquivo original**

```bash
cat src/common/services/coupons-service.ts
```

- [ ] **Step 3: Criar `src/modules/coupons/infrastructure/adapters.ts`**

Porte o objeto `couponsService` inteiro (métodos `list`, `getById`, e os demais do arquivo original), preservando o uso de `cmsApiClient` para a chamada `list` (o comentário original explica: evita redirect global em 401) — importe de `@/src/infraestructure/axios/api` em vez de `@/src/common/config/api`.

- [ ] **Step 4: Mover o hook**

```bash
mkdir -p src/shared/hooks/coupons
git mv src/common/hooks/useCoupons.ts src/shared/hooks/coupons/use-coupons.ts
```

- [ ] **Step 5: Apagar original e corrigir imports**

```bash
git rm src/common/services/coupons-service.ts
grep -rl '@/src/common/services/coupons-service' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/services/coupons-service|@/src/modules/coupons/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/useCoupons' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/useCoupons|@/src/shared/hooks/coupons/use-coupons|g'
grep -rl "@/src/components/coupons/index" src --include='*.ts' --include='*.tsx' | true
```

- [ ] **Step 6: Build e teste**

```bash
npm run build
npm run test:run -- coupons
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(coupons): migrate coupons-service.ts to modules/coupons/infrastructure/"
```

---

### Task 17: Domínio `mailer` (email-campaign + campaign-batch + smtp-server)

**Files:**
- Create: `src/modules/mailer/infrastructure/adapters.ts`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "Email Campaign", "Config (SMTP Server)">`
- Produces: as 17 funções de `email-campaign/*`, `campaign-batch/*`, `smtp-server/*` sob novo caminho

- [ ] **Step 1: Inspecionar os serviços gerados**

```bash
ls src/infraestructure/server/services | grep -iE "email-campaign|^config$"
cat src/infraestructure/server/services/email-campaign/index.ts
cat src/infraestructure/server/services/config/index.ts
```

- [ ] **Step 2: Ler os 17 arquivos originais**

```bash
for f in src/common/services/email-campaign/*.ts src/common/services/campaign-batch/*.ts src/common/services/smtp-server/*.ts; do
  echo "--- $f"; cat "$f"
done
```

- [ ] **Step 3: Criar `src/modules/mailer/infrastructure/adapters.ts`**

Porte cada função encontrada no Step 2, preservando nome/assinatura, delegando ao serviço gerado do Step 1 (`Config (SMTP Server)` cobre `list-smtp-servers-services.ts`, `Email Campaign` cobre os demais 16 arquivos).

- [ ] **Step 4: Apagar originais e corrigir imports**

```bash
git rm -r src/common/services/email-campaign src/common/services/campaign-batch src/common/services/smtp-server

grep -rl '@/src/common/services/email-campaign/\|@/src/common/services/campaign-batch/\|@/src/common/services/smtp-server/' src --include='*.ts' --include='*.tsx' -E | xargs -r sed -i -E \
  -e 's|@/src/common/services/email-campaign/[a-z-]+|@/src/modules/mailer/infrastructure/adapters|g' \
  -e 's|@/src/common/services/campaign-batch/[a-z-]+|@/src/modules/mailer/infrastructure/adapters|g' \
  -e 's|@/src/common/services/smtp-server/[a-z-]+|@/src/modules/mailer/infrastructure/adapters|g'

grep -rl '@/src/common/actions/email-campaign/\|@/src/common/actions/smtp-server/' src --include='*.ts' --include='*.tsx' -E | xargs -r sed -i -E \
  -e 's|@/src/common/actions/email-campaign/([a-z-]+)|@/src/presentation/actions/email-campaign/\1|g' \
  -e 's|@/src/common/actions/smtp-server/([a-z-]+)|@/src/presentation/actions/smtp-server/\1|g'
```

- [ ] **Step 5: Build e teste**

```bash
npm run build
npm run test:run -- email-campaign
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(mailer): migrate email-campaign/campaign-batch/smtp-server services to modules/mailer/infrastructure/"
```

---

### Task 18: Domínio `payments` (core: plans, subscriptions, billing-config, movements)

**Files:**
- Create: `src/modules/payments/infrastructure/adapters.ts`
- Move: `src/common/hooks/payments/*` → `src/shared/hooks/payments/`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "Plans", "Subscriptions", "Payments - Billing Config">`
- Produces: as funções de `billing-config-service.ts`, `payment-movements-service.ts`, `plans-service.ts`, `subscriptions-service.ts` sob novo caminho

- [ ] **Step 1: Inspecionar os serviços gerados**

```bash
ls src/infraestructure/server/services | grep -iE "^plans$|^subscriptions$|payments-billing-config"
cat src/infraestructure/server/services/plans/index.ts
cat src/infraestructure/server/services/subscriptions/index.ts
cat src/infraestructure/server/services/payments-billing-config/index.ts
```

- [ ] **Step 2: Ler os 4 arquivos originais**

```bash
for f in billing-config payment-movements plans subscriptions; do
  echo "--- $f"; cat "src/common/services/payments/$f-service.ts"
done
```

- [ ] **Step 3: Criar `src/modules/payments/infrastructure/adapters.ts`**

Porte as funções, preservando nome/assinatura, delegando aos serviços gerados do Step 1.

- [ ] **Step 4: Mover os hooks**

```bash
mkdir -p src/shared/hooks/payments
for f in use-abandoned-carts use-archive-plan use-b2c-fees use-billing-config use-cancel-subscription use-create-billing-config use-create-checkout-session use-create-plan use-delete-billing-config use-delete-plan use-payment-movements use-plans use-subscription use-update-billing-config use-update-plan; do
  git mv "src/common/hooks/payments/$f.ts" "src/shared/hooks/payments/$f.ts"
done
```

Nota: `use-b2c-fees.ts` faz parte deste grupo de hooks mas consome o serviço `b2c-products` (Task 20) — mova-o aqui para manter a pasta `hooks/payments/` intacta, mas seu import interno mudará para `@/src/modules/b2c-products/infrastructure/adapters` na Task 20, não nesta task.

- [ ] **Step 5: Apagar originais e corrigir imports**

```bash
git rm -r src/common/services/payments
grep -rl '@/src/common/services/payments/' src --include='*.ts' --include='*.tsx' | xargs -r sed -i -E 's|@/src/common/services/payments/[a-z-]+-service|@/src/modules/payments/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/payments' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/payments|@/src/shared/hooks/payments|g'
grep -rl '@/src/common/actions/payments/' src --include='*.ts' --include='*.tsx' -E | xargs -r sed -i -E 's|@/src/common/actions/payments/([a-z-]+)|@/src/presentation/actions/payments/\1|g'
```

- [ ] **Step 6: Build e teste**

```bash
npm run build
npm run test:run -- payments
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(payments): migrate core plans/subscriptions/billing-config services to modules/payments/infrastructure/

modules/payments consumes reserve-subscriptions (Plans, Subscriptions, Payments -
Billing Config tags) — kept as 'payments' per the documented naming exception in
modules/MODULES.md, not renamed to 'subscriptions' to avoid colliding with the
separate b2c-subscriptions module."
```

---

### Task 19: Domínio `b2b-payments`

**Files:**
- Create: `src/modules/b2b-payments/infrastructure/adapters.ts`
- Move: `src/common/hooks/useB2BPayments.ts` → `src/shared/hooks/b2b-payments/use-b2b-payments.ts`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "B2B Payments", "B2B Fees">`
- Produces: as funções de `b2b-payments-service.ts` sob novo caminho

- [ ] **Step 1: Inspecionar o serviço gerado**

```bash
ls src/infraestructure/server/services | grep -i b2b
cat src/infraestructure/server/services/b2b-payments/index.ts
cat src/infraestructure/server/services/b2b-fees/index.ts
```

- [ ] **Step 2: Ler o arquivo original**

```bash
cat src/common/services/b2b-payments-service.ts
```

- [ ] **Step 3: Criar `src/modules/b2b-payments/infrastructure/adapters.ts`**

Porte cada função encontrada no Step 2, preservando nome/assinatura, delegando aos serviços gerados do Step 1.

- [ ] **Step 4: Mover o hook**

```bash
mkdir -p src/shared/hooks/b2b-payments
git mv src/common/hooks/useB2BPayments.ts src/shared/hooks/b2b-payments/use-b2b-payments.ts
```

- [ ] **Step 5: Apagar original e corrigir imports**

```bash
git rm src/common/services/b2b-payments-service.ts
grep -rl '@/src/common/services/b2b-payments-service' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/services/b2b-payments-service|@/src/modules/b2b-payments/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/useB2BPayments' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/useB2BPayments|@/src/shared/hooks/b2b-payments/use-b2b-payments|g'
```

- [ ] **Step 6: Build e teste**

```bash
npm run build
npm run test:run -- b2b
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(b2b-payments): migrate b2b-payments-service.ts to modules/b2b-payments/infrastructure/"
```

---

### Task 20: Domínio `b2c-products`

**Files:**
- Create: `src/modules/b2c-products/infrastructure/adapters.ts`
- Move: `src/common/hooks/useB2CProducts.ts` → `src/shared/hooks/b2c-products/use-b2c-products.ts`
- Modify: `src/shared/hooks/payments/use-b2c-fees.ts` (import interno)

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "Admin B2C Products", "Admin B2C Fee Config", "B2C Products", "Public B2C Products">`
- Produces: as funções de `b2c-products-service.ts` sob novo caminho

- [ ] **Step 1: Inspecionar os serviços gerados**

```bash
ls src/infraestructure/server/services | grep -i b2c
cat src/infraestructure/server/services/admin-b2c-products/index.ts
cat src/infraestructure/server/services/admin-b2c-fee-config/index.ts
```

- [ ] **Step 2: Ler o arquivo original**

```bash
cat src/common/services/b2c-products-service.ts
```

- [ ] **Step 3: Criar `src/modules/b2c-products/infrastructure/adapters.ts`**

Porte cada função encontrada no Step 2, preservando nome/assinatura.

- [ ] **Step 4: Mover o hook e corrigir `use-b2c-fees.ts`**

```bash
mkdir -p src/shared/hooks/b2c-products
git mv src/common/hooks/useB2CProducts.ts src/shared/hooks/b2c-products/use-b2c-products.ts
```

Edite `src/shared/hooks/payments/use-b2c-fees.ts` (movido na Task 18), trocando seu import de `@/src/common/services/b2c-products-service` para `@/src/modules/b2c-products/infrastructure/adapters`.

- [ ] **Step 5: Apagar original e corrigir demais imports**

```bash
git rm src/common/services/b2c-products-service.ts
grep -rl '@/src/common/services/b2c-products-service' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/services/b2c-products-service|@/src/modules/b2c-products/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/useB2CProducts' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/useB2CProducts|@/src/shared/hooks/b2c-products/use-b2c-products|g'
```

- [ ] **Step 6: Build e teste**

```bash
npm run build
npm run test:run -- b2c
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(b2c-products): migrate b2c-products-service.ts to modules/b2c-products/infrastructure/"
```

---

### Task 21: Domínio `b2c-subscriptions`

**Files:**
- Create: `src/modules/b2c-subscriptions/infrastructure/adapters.ts`
- Move: `src/common/hooks/useB2CSubscriptions.ts` → `src/shared/hooks/b2c-subscriptions/use-b2c-subscriptions.ts`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "B2C Subscriptions">`
- Produces: as funções de `b2c-subscriptions-service.ts` sob novo caminho

- [ ] **Step 1: Inspecionar o serviço gerado**

```bash
ls src/infraestructure/server/services | grep -i b2c-sub
cat src/infraestructure/server/services/b2c-subscriptions/index.ts
```

- [ ] **Step 2: Ler o arquivo original**

```bash
cat src/common/services/b2c-subscriptions-service.ts
```

- [ ] **Step 3: Criar `src/modules/b2c-subscriptions/infrastructure/adapters.ts`**

Porte cada função, preservando nome/assinatura.

- [ ] **Step 4: Mover o hook**

```bash
mkdir -p src/shared/hooks/b2c-subscriptions
git mv src/common/hooks/useB2CSubscriptions.ts src/shared/hooks/b2c-subscriptions/use-b2c-subscriptions.ts
```

- [ ] **Step 5: Apagar original e corrigir imports**

```bash
git rm src/common/services/b2c-subscriptions-service.ts
grep -rl '@/src/common/services/b2c-subscriptions-service' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/services/b2c-subscriptions-service|@/src/modules/b2c-subscriptions/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/useB2CSubscriptions' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/useB2CSubscriptions|@/src/shared/hooks/b2c-subscriptions/use-b2c-subscriptions|g'
```

- [ ] **Step 6: Build e teste**

```bash
npm run build
npm run test:run -- b2c-subscriptions
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(b2c-subscriptions): migrate b2c-subscriptions-service.ts to modules/b2c-subscriptions/infrastructure/"
```

---

### Task 22: Domínio `hotel-portal`

**Files:**
- Create: `src/modules/hotel-portal/infrastructure/adapters.ts`
- Move: `src/common/hooks/hotel-portal/*` → `src/shared/hooks/hotel-portal/`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/` correspondente a `reserve-client-portal` (controllers sem `@ApiTags`, auto-tagueados pelo NestJS Swagger como `AdminHotelClient`, `AdminHotelMetrics`, `AdminReservations`, `ClientPortal`, `GuestCrm`, `Report`, `WhatsApp`, `WhatsAppRedirect`, `WhatsAppTracking` — slugs exatos confirmados no Step 1)
- Produces: as ~20 funções de `hotel-portal-service.ts` sob novo caminho

- [ ] **Step 1: Inspecionar os serviços gerados (nomes de slug não confirmáveis sem rodar o gerador — os 9 controllers de `reserve-client-portal` não têm `@ApiTags`, então o slug é derivado do nome da classe, ex.: `AdminHotelClientController` → tag `AdminHotelClient` → slug sem hífen `adminhotelclient`)**

```bash
ls src/infraestructure/server/services | grep -iE "hotel|reservation|guest|whatsapp|clientportal|report"
for d in $(ls src/infraestructure/server/services | grep -iE "hotel|reservation|guest|whatsapp|clientportal"); do
  echo "--- $d"; cat "src/infraestructure/server/services/$d/index.ts"
done
```

- [ ] **Step 2: Ler o arquivo original**

```bash
cat src/common/services/hotel-portal-service.ts
```

- [ ] **Step 3: Criar `src/modules/hotel-portal/infrastructure/adapters.ts`**

Porte cada função encontrada no Step 2, preservando nome/assinatura, delegando aos serviços gerados identificados no Step 1 (um adapter por controller de origem: clients, metrics, reservations, whatsapp-links, reports, my-clients/client-portal).

- [ ] **Step 4: Mover os hooks**

```bash
mkdir -p src/shared/hooks/hotel-portal
for f in use-hotel-clients use-hotel-portal-campaigns use-hotel-portal-dashboard use-hotel-portal-guests use-hotel-portal-metrics use-hotel-portal-ota use-hotel-portal-overview use-hotel-portal-reports use-hotel-portal-reservations use-hotel-portal-site use-hotel-portal-snapshots use-hotel-portal-whatsapp use-hotel-portal-whatsapp-links use-my-hotel-client; do
  git mv "src/common/hooks/hotel-portal/$f.ts" "src/shared/hooks/hotel-portal/$f.ts"
done
git mv src/common/hooks/hotel-portal/index.ts src/shared/hooks/hotel-portal/index.ts
```

- [ ] **Step 5: Apagar original e corrigir imports**

```bash
git rm src/common/services/hotel-portal-service.ts
grep -rl '@/src/common/services/hotel-portal-service' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/services/hotel-portal-service|@/src/modules/hotel-portal/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/hotel-portal' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/hotel-portal|@/src/shared/hooks/hotel-portal|g'
```

- [ ] **Step 6: Build e teste**

```bash
npm run build
npm run test:run -- hotel-portal
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(hotel-portal): migrate hotel-portal-service.ts to modules/hotel-portal/infrastructure/

reserve-client-portal's 9 untagged controllers rely on NestJS Swagger's
autoTagControllers default (confirmed true when SwaggerModule.createDocument is
called without options) — each becomes its own generated service dir named after
the controller class, not a shared 'default' bucket."
```

---

### Task 23: Domínio `notifications`

**Files:**
- Create: `src/modules/notifications/infrastructure/adapters.ts`
- Modify: `src/common/hooks/notifications/{use-notification-inbox,use-notifications,use-notification-settings,use-unread-count}.ts` → `src/shared/hooks/notifications/`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "Notification Settings", "Notifications (super_admin)", "Notifications (tenant admin)">`
- Produces: um adapter novo (os 4 hooks hoje chamam `apiClient` diretamente, sem service dedicado) com as mesmas chamadas encapsuladas

- [ ] **Step 1: Inspecionar o(s) serviço(s) gerado(s) — atenção à colisão de tag identificada na Task 11 Step 4**

```bash
ls src/infraestructure/server/services | grep -i notif
cat src/infraestructure/server/services/notifications/index.ts
cat src/infraestructure/server/services/notification-settings/index.ts
```

Como `Notifications (super_admin)` e `Notifications (tenant admin)` colapsam para o mesmo slug `notifications` (o slugifier do gerador remove o conteúdo entre parênteses antes de kebab-casear), confirme se o gerador escreveu **um único arquivo** com os métodos de ambos os controllers combinados, ou se sobrescreveu um com o outro (nesse caso, métodos do segundo controller gerado por último "vencem"). Se houver perda de métodos, documente o achado e trate manualmente: adicione ao adapter uma chamada direta via `apiClient` para o método que ficou faltando, com o comentário:

```ts
// TODO(arquitetura): backend expõe duas tags "Notifications (...)" que colidem no
// slug gerado ("notifications") — método coberto manualmente até o backend
// renomear uma das tags para não colidir.
```

- [ ] **Step 2: Ler os 4 hooks originais para extrair as chamadas `apiClient` embutidas**

```bash
cat src/common/hooks/notifications/use-notification-inbox.ts
cat src/common/hooks/notifications/use-notifications.ts
cat src/common/hooks/notifications/use-notification-settings.ts
cat src/common/hooks/notifications/use-unread-count.ts
```

- [ ] **Step 3: Criar `src/modules/notifications/infrastructure/adapters.ts`**

Extraia toda chamada `apiClient.get/post/patch/delete(...)` hoje inline nos 4 hooks para funções nomeadas neste adapter (ex.: `listNotifications`, `markNotificationViewed`, `getUnreadCount`, `getNotificationSettings`, `updateNotificationSettings`), delegando ao serviço gerado do Step 1 quando o método existir lá.

- [ ] **Step 4: Mover os hooks e atualizar para consumir o adapter em vez de `apiClient` direto**

```bash
mkdir -p src/shared/hooks/notifications
git mv src/common/hooks/notifications/use-notification-inbox.ts src/shared/hooks/notifications/use-notification-inbox.ts
git mv src/common/hooks/notifications/use-notifications.ts src/shared/hooks/notifications/use-notifications.ts
git mv src/common/hooks/notifications/use-notification-settings.ts src/shared/hooks/notifications/use-notification-settings.ts
git mv src/common/hooks/notifications/use-unread-count.ts src/shared/hooks/notifications/use-unread-count.ts
git mv src/common/hooks/notifications/index.ts src/shared/hooks/notifications/index.ts
```

Edite cada um dos 4 arquivos movidos, trocando `import { apiClient } from '@/src/common/config/api'` (e a chamada inline) pela função correspondente importada de `@/src/modules/notifications/infrastructure/adapters`.

- [ ] **Step 5: Corrigir demais imports**

```bash
grep -rl '@/src/common/hooks/notifications' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/notifications|@/src/shared/hooks/notifications|g'
```

- [ ] **Step 6: Build e teste**

```bash
npm run build
npm run test:run -- notification
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(notifications): extract inline apiClient calls into modules/notifications/infrastructure/adapters.ts

Notifications hooks called apiClient directly with no service layer — this task
adds the missing adapter and updates the 4 hooks to consume it, matching every
other domain's structure."
```

---

### Task 24: Domínio `reports`

**Files:**
- Create: `src/modules/reports/infrastructure/adapters.ts`
- Move: `src/common/hooks/reports/use-reports.ts` → `src/shared/hooks/reports/use-reports.ts`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "Analytics Reports">`
- Produces: `reportService` (mesmo shape hoje exportado por `report-service.ts`) sob novo caminho

- [ ] **Step 1: Inspecionar o serviço gerado**

```bash
ls src/infraestructure/server/services | grep -i analytics
cat src/infraestructure/server/services/analytics-reports/index.ts
```

- [ ] **Step 2: Ler o arquivo original**

```bash
cat src/common/services/report-service.ts
```

- [ ] **Step 3: Criar `src/modules/reports/infrastructure/adapters.ts`**

Porte o objeto `reportService` inteiro, preservando `list`, `create`, `update`, `delete`, delegando ao serviço gerado do Step 1.

- [ ] **Step 4: Mover o hook**

```bash
mkdir -p src/shared/hooks/reports
git mv src/common/hooks/reports/use-reports.ts src/shared/hooks/reports/use-reports.ts
```

- [ ] **Step 5: Apagar original e corrigir imports**

```bash
git rm src/common/services/report-service.ts
grep -rl '@/src/common/services/report-service' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/services/report-service|@/src/modules/reports/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/reports' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/reports|@/src/shared/hooks/reports|g'
```

- [ ] **Step 6: Build e teste**

```bash
npm run build
npm run test:run -- report
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(reports): migrate report-service.ts to modules/reports/infrastructure/"
```

---

### Task 25: Domínio `stats`

**Files:**
- Create: `src/modules/stats/infrastructure/adapters.ts`
- Move: `src/common/hooks/stats/*` → `src/shared/hooks/stats/`

**Interfaces:**
- Consumes: `src/infraestructure/server/services/<slug de "Stats - Dashboard", "Stats - Integrations">`
- Produces: `statsService` (mesmo shape hoje exportado por `stats-service.ts`) sob novo caminho

- [ ] **Step 1: Inspecionar os serviços gerados**

```bash
ls src/infraestructure/server/services | grep -i stats
cat src/infraestructure/server/services/stats-dashboard/index.ts
cat src/infraestructure/server/services/stats-integrations/index.ts
```

- [ ] **Step 2: Ler o arquivo original**

```bash
cat src/common/services/stats-service.ts
```

- [ ] **Step 3: Criar `src/modules/stats/infrastructure/adapters.ts`**

Porte o objeto `statsService` inteiro (seções dashboard e integrations), preservando `buildDashboardParams` e todos os métodos, delegando aos serviços gerados do Step 1.

- [ ] **Step 4: Mover os hooks**

```bash
mkdir -p src/shared/hooks/stats
git mv src/common/hooks/stats/index.ts src/shared/hooks/stats/index.ts
git mv src/common/hooks/stats/use-stats-dashboard.ts src/shared/hooks/stats/use-stats-dashboard.ts
git mv src/common/hooks/stats/use-stats-integrations.ts src/shared/hooks/stats/use-stats-integrations.ts
```

- [ ] **Step 5: Apagar original e corrigir imports**

```bash
git rm src/common/services/stats-service.ts
grep -rl '@/src/common/services/stats-service' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/services/stats-service|@/src/modules/stats/infrastructure/adapters|g'
grep -rl '@/src/common/hooks/stats' src --include='*.ts' --include='*.tsx' | xargs -r sed -i 's|@/src/common/hooks/stats|@/src/shared/hooks/stats|g'
```

- [ ] **Step 6: Confirmar que `src/common/services/` e `src/common/hooks/` estão vazios (ou só com arquivos genuinamente fora de escopo) e apagar as pastas `common/` remanescentes**

```bash
find src/common -type f 2>/dev/null
```

Se a saída for vazia, remova o que sobrou de `src/common/`:

```bash
rm -rf src/common
```

Se sobrar algum arquivo não coberto pelas Tasks 4–25 (ex.: um serviço/hook não listado na tabela de correspondência), **não** apague — pare, registre o arquivo encontrado e trate-o antes de prosseguir (ele provavelmente pertence a um domínio que este plano não cobriu; adicione uma task extra em vez de perder o arquivo).

- [ ] **Step 7: Build e teste**

```bash
npm run build
npm run test:run
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(stats): migrate stats-service.ts to modules/stats/infrastructure/, remove empty src/common/

This is the last domain task — src/common/ is now empty and removed. All 79
hand-written service files (70 real services + 9 that were dead code calling
non-existent backend routes, see modules/leads/infrastructure/ORPHANED-ENDPOINTS.md)
have been migrated to modules/<domain>/infrastructure/ adapters."
```

---

### Task 26: Mover `src/app/**` para `presentation/components/pages|layouts` com stubs finos

**Files:**
- Move + Create (par para cada rota): todas as `page.tsx`/`layout.tsx` de `src/app/**`, exceto `src/app/layout.tsx`, `src/app/providers.tsx`, `src/app/not-found.tsx`, `src/app/favicon.ico`, `src/proxy.ts`, `src/app/public-blog/[slug]/layout.tsx` (fica integral por `generateMetadata`, ver `APP.md`)
- Modify: `src/app/dashboard/email-campaign/[id]/page.tsx` (exceção de `params: Promise`)

**Interfaces:**
- Consumes: `@/src/presentation/components/{atoms,organisms,layouts}/*` (Tasks 8–9), `@/src/modules/*/infrastructure/adapters` (Tasks 12–25), `@/src/presentation/actions/*` (Task 7)
- Produces: `src/app/**/page.tsx` como stubs de 1–3 linhas; `src/presentation/components/pages/**/page.tsx` com a JSX/lógica real

- [ ] **Step 1: Mover as ~64 rotas simples (sem exceção de `APP.md`) — script único que move e gera o stub**

```bash
cd "C:/Users/gabri/OneDrive/Documents/GitHub/frontend_dashboard_reserve-fase4"

ROUTES=(
  "auth/login"
  "dashboard/abandoned-carts"
  "dashboard/access-management"
  "dashboard/access-management/admins"
  "dashboard/access-management/admins/[id]"
  "dashboard/access-management/tenants"
  "dashboard/access-management/tenants/[id]"
  "dashboard/access-management/users"
  "dashboard/access-management/users/[id]"
  "dashboard/cms"
  "dashboard/cms/articles"
  "dashboard/cms/articles/new"
  "dashboard/cms/articles/[id]"
  "dashboard/cms/articles/[id]/preview"
  "dashboard/cms/authors"
  "dashboard/cms/blogs"
  "dashboard/cms/blogs/[blogId]"
  "dashboard/cms/collections"
  "dashboard/cms/collections/new"
  "dashboard/cms/collections/[id]"
  "dashboard/cms/media"
  "dashboard/cms/media/upload"
  "dashboard/cms/media/[id]"
  "dashboard/coupons"
  "dashboard/coupons/new"
  "dashboard/coupons/[id]"
  "dashboard/email-campaign"
  "dashboard/global"
  "dashboard/global/notifications"
  "dashboard/global/notifications/new"
  "dashboard/global/notifications/[id]"
  "dashboard/global/notifications/settings/[tenantId]"
  "dashboard/global/tenants/[tenantId]"
  "dashboard/hotel/campaigns"
  "dashboard/hotel/config"
  "dashboard/hotel/ota"
  "dashboard/hotel/overview"
  "dashboard/hotel/reports"
  "dashboard/hotel/site"
  "dashboard/hotel/whatsapp-links"
  "dashboard/hotel-portal"
  "dashboard/hotel-portal/[clientId]"
  "dashboard/leads"
  "dashboard/leads/appointments"
  "dashboard/leads/collections"
  "dashboard/leads/collections/[collectionId]"
  "dashboard/leads-kanban"
  "dashboard/notifications"
  "dashboard/payments"
  "dashboard/payments/config"
  "dashboard/payments/products"
  "dashboard/payments/subscriptions"
  "dashboard/payments/subscriptions/b2c"
  "dashboard/profile"
  "dashboard/reports"
  "dashboard/settings"
  "dashboard/stats"
  "dashboard/stats/integrations"
  "dashboard/storage"
  "public-blog"
  "public-blog/[slug]"
)

for r in "${ROUTES[@]}"; do
  if [ -f "src/app/$r/page.tsx" ]; then
    mkdir -p "src/presentation/components/pages/$r"
    git mv "src/app/$r/page.tsx" "src/presentation/components/pages/$r/page.tsx"
    printf 'export { default } from "@/src/presentation/components/pages/%s/page";\n' "$r" > "src/app/$r/page.tsx"
    git add "src/app/$r/page.tsx"
  fi
done
```

- [ ] **Step 2: Mover os `layout.tsx` simples (sem `generateMetadata`)**

```bash
LAYOUT_ROUTES=("dashboard")

for r in "${LAYOUT_ROUTES[@]}"; do
  mkdir -p "src/presentation/components/layouts/$r"
  git mv "src/app/$r/layout.tsx" "src/presentation/components/layouts/$r/layout.tsx"
  printf 'export { default } from "@/src/presentation/components/layouts/%s/layout";\n' "$r" > "src/app/$r/layout.tsx"
  git add "src/app/$r/layout.tsx"
done
```

- [ ] **Step 3: Confirmar que nenhuma rota ficou de fora**

```bash
find src/app -name "page.tsx" -o -name "layout.tsx" | sort
```

A única saída esperada agora: `src/app/layout.tsx` (root, exceção), `src/app/public-blog/[slug]/layout.tsx` (exceção `generateMetadata`), `src/app/dashboard/email-campaign/[id]/page.tsx` (tratado no Step 4 a seguir — ainda não movido pelo Step 1 porque não está na lista `ROUTES`), `src/app/not-found.tsx` (tratado no Step 5), `src/app/page.tsx` (tratado no Step 5).

- [ ] **Step 4: Tratar a exceção `dashboard/email-campaign/[id]` (Server Component assíncrono com `params: Promise` destructurado direto)**

```bash
mkdir -p "src/presentation/components/pages/dashboard/email-campaign/[id]"
git mv "src/app/dashboard/email-campaign/[id]/page.tsx" "src/presentation/components/pages/dashboard/email-campaign/[id]/page.tsx"
```

Edite o arquivo movido: renomeie o componente exportado para receber `id: string` resolvido em vez de `params: Promise<{ id: string }>`:

```tsx
// src/presentation/components/pages/dashboard/email-campaign/[id]/page.tsx
import listEmailCampaignByIdService from "@/src/modules/mailer/infrastructure/adapters";
// ... demais imports adaptados às Tasks 8, 9, 17

export default async function EmailCampaignPage({ id }: { id: string }) {
  const campaign = await listEmailCampaignByIdService(id);
  // ... resto do corpo original inalterado, sem o await params
}
```

Crie o stub fino em `src/app/dashboard/email-campaign/[id]/page.tsx`:

```tsx
import EmailCampaignPage from "@/src/presentation/components/pages/dashboard/email-campaign/[id]/page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmailCampaignPage id={id} />;
}
```

```bash
git add "src/app/dashboard/email-campaign/[id]/page.tsx" "src/presentation/components/pages/dashboard/email-campaign/[id]/page.tsx"
```

- [ ] **Step 5: Mover `not-found.tsx` e a página raiz `/`**

```bash
mkdir -p src/presentation/components/pages/not-found src/presentation/components/pages/root
git mv src/app/not-found.tsx src/presentation/components/pages/not-found/page.tsx
printf 'export { default } from "@/src/presentation/components/pages/not-found/page";\n' > src/app/not-found.tsx
git mv src/app/page.tsx src/presentation/components/pages/root/page.tsx
printf 'export { default } from "@/src/presentation/components/pages/root/page";\n' > src/app/page.tsx
git add src/app/not-found.tsx src/app/page.tsx src/presentation/components/pages/not-found/page.tsx src/presentation/components/pages/root/page.tsx
```

- [ ] **Step 6: Corrigir os imports internos de todas as páginas movidas (referências relativas `../` que apontavam para `common/`/`components/` na raiz de `src/app`)**

```bash
grep -rl '"\.\./\.\./components/ui' src/presentation/components/pages --include='*.tsx' | xargs -r sed -i -E 's|"\.\./\.\./components/ui/([a-z-]+)"|"@/src/presentation/components/atoms/reserve/\1"|g'
grep -rl "@/src/common/" src/presentation/components/pages --include='*.tsx' --include='*.ts' && echo "AINDA HÁ IMPORTS @/src/common/ — revisar manualmente antes de prosseguir" || echo "OK: nenhum import @/src/common/ restante"
```

Se o `grep` do segundo comando encontrar algo, é sinal de que uma page usa um serviço/hook que não foi coberto pelas Tasks 4–25 — pare e resolva antes do Step 7 (não prossiga com imports quebrados).

- [ ] **Step 7: Build e teste completos (última verificação antes da Task 27)**

```bash
npm run build
npm run test:run
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: move src/app pages/layouts to presentation/components/pages|layouts

Every route under src/app/** becomes a thin re-export per src/app/APP.md, except
the root layout+providers (framework-mandated), public-blog/[slug]/layout.tsx
(generateMetadata must stay at the route file), and the email-campaign/[id] async
Server Component (Promise<params> destructured directly, given the resolved id
prop instead per the documented APP.md exception)."
```

---

### Task 27: `AGENTS.md` na raiz do repositório

**Files:**
- Create: `AGENTS.md`

**Interfaces:**
- Consumes: nenhuma
- Produces: regra documentada de sincronização do transporte gerado, lida por qualquer agente que altere endpoints/DTOs/serviços

- [ ] **Step 1: Criar `AGENTS.md` na raiz**

```markdown
# Project instructions

## Backend API synchronization

`src/infraestructure/server/services` is the committed, generator-owned transport
layer produced by `npm run codegen` from `backend_reserve`'s OpenAPI document. Never
edit its generated TypeScript manually. Keep stable module-facing mappings in
`src/modules/<domain>/infrastructure/`; do not let backend transport details leak into
`presentation/` components or `shared/hooks/<domain>/`. See `src/SRC.md` for the full
architecture decision tree.

Run `npm run codegen:diff` before `npm run codegen`, review breaking changes (removed
or renamed operations, request fields that became required, response-shape changes),
and update the affected `modules/<domain>/infrastructure/adapters.ts` before
considering the integration synchronized.

If the generator reports duplicate or missing operation IDs, unresolved schemas, or an
invalid/unreachable Swagger document, fix the backend contract in `backend_reserve`
first — do not hand-patch generated output to route around it. One known instance of
this in the current contract: two `@ApiTags` under the notifications domain
(`Notifications (super_admin)` / `Notifications (tenant admin)`) collapse to the same
generated slug (`notifications`) — see `src/modules/notifications/infrastructure/adapters.ts`.

## Package manager

This repo has both `package-lock.json` and `pnpm-lock.yaml` committed. Use **npm**
(`node_modules/.package-lock.json` is the active marker; there is no
`node_modules/.modules.yaml`). Do not run `pnpm install` — it will diverge the two
lockfiles further. Resolving this ambiguity permanently is tracked as separate debt,
not part of this migration.
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "docs: add root AGENTS.md documenting the generated transport layer rule"
```

---

### Task 28: Verificação final e merge da worktree

**Files:**
- Nenhum arquivo novo — verificação e merge

**Interfaces:**
- Consumes: todo o trabalho das Tasks 1–27
- Produces: branch `fase4-frontend-arquitetura` mesclada em `main`, worktree removida

- [ ] **Step 1: Rodar a suite completa uma última vez dentro da worktree**

```bash
cd "C:/Users/gabri/OneDrive/Documents/GitHub/frontend_dashboard_reserve-fase4"
npm run build
npm run test:run
npm run lint
```

- [ ] **Step 2: Conferir que nenhum import antigo sobrou em todo o `src/`**

```bash
grep -rn '@/src/common/\|@/src/layout/\|@/src/i18n\b\|@/src/messages\b\|@/src/components/' src --include='*.ts' --include='*.tsx' | grep -v '@/src/components/atoms\|@/src/presentation/components' || echo "OK: nenhuma referência antiga restante"
```

- [ ] **Step 3: Conferir que `src/common`, `src/components`, `src/layout`, `src/i18n`, `src/messages`, `components/` (raiz), `fix_spacing.js`, `remove_shadows.js` não existem mais**

```bash
ls src/common src/components src/layout src/i18n src/messages components fix_spacing.js remove_shadows.js 2>&1 | grep "No such file" | wc -l
```

Deve ser `8` (uma linha "No such file" por item testado).

- [ ] **Step 4: Merge de volta em `main` e remoção da worktree**

```bash
cd "C:/Users/gabri/OneDrive/Documents/GitHub/frontend_dashboard_reserve"
git merge fase4-frontend-arquitetura
git worktree remove ../frontend_dashboard_reserve-fase4
git branch -d fase4-frontend-arquitetura
```

- [ ] **Step 5: Build e teste em `main` pós-merge (confirmação final)**

```bash
npm run build
npm run test:run
```
