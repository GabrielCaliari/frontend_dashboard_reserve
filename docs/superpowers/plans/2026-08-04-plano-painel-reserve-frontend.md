# Painel Reserve — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the frontend-only client-facing "Painel Reserve" portal described in `docs/PLANO_PAINEL_RESERVE_1.md` — 12 routes, all 11 UI blocks (3.1–3.11), the glossary component, PDF export UI, mobile-first responsive requirements, and the digest-facing UI — consuming backend APIs designed in a **separate, parallel backend plan** (bot-event ingestion, N8N wiring, new database tables are out of scope here).

**Architecture:** A new route group `src/app/portal/**` inside this same Next.js app (assumption — see "Assumptions & Open Questions" below), following the **current, actually-deployed** repo convention (`src/{app,common,components}`) rather than the not-yet-executed DDD migration in `docs/superpowers/plans/2026-07-26-fase4-frontend-arquitetura.md`. A new client-scoped session/role layer (`ClientRole`, distinct from the admin `AdminRole`) gates every `/portal/*` route. A shared design-system layer — glossary/`<MetricLabel>`, `<VariationBadge>`, skeleton + empty-state primitives, chart wrappers, a responsive table→card primitive — is built once in Phase 1 (mirroring master-doc Fase 1) and reused by every subsequent block, matching the master plan's own 6-phase structure in section 8.

**Tech Stack:** Next.js 16.1.6 (App Router) · React 19.2.4 · TypeScript 5.9 · Tailwind CSS 4.3 (via `tailwind.config.js`, HeroUI theme) · @tanstack/react-query 5.90 · Zustand 5.0 · Recharts 2.15.4 (already a dependency, already in `next.config.mjs` `optimizePackageImports` — do not add Chart.js) · Radix UI primitives via `src/components/ui/*` (shadcn-style, hand-vendored) · Vitest 4.0 + @testing-library/react 16 + vitest-axe · cookies-next 5.1 · date-fns 4.1 · zod 3.25.

## Global Constraints

- **Current structure only.** `git status`/`ls src` on this branch confirm `src/{app,common,components,i18n,layout,messages}` — the fase4 DDD migration (`src/{modules,presentation,shared,infraestructure}`) has **not** run. Every file path in this plan targets the current structure, matching every other route in the repo today. If fase4 lands first, paths here need one mechanical follow-up move — do not pre-emptively build against paths that don't exist yet.
- **Mobile-first at 375px, binding (master doc §4.3):** max 1 chart per mobile viewport; no horizontal scroll — tables become stacked cards; only line/bar charts, never pie/radar/dual-axis on mobile.
- **Variation always visible:** every metric shows "vs. período anterior" with an arrow and color, **inverted for cost metrics** (a falling cost is positive, shown green).
- **Glossary is mandatory, not optional:** every metric label that has a `glossary.ts` entry renders through `<MetricLabel>` — no raw `<span>{label}</span>` bypassing it once an entry exists.
- **Skeleton loading + designed empty states everywhere** — a block with no data explains why; never a blank screen.
- **Zero jargon visible to the client** — "Conversas iniciadas no WhatsApp", never "CTWA clicks"; "Investimento", never "Spend".
- **Never estimate revenue.** ROI Nível 3 (ROAS, receita atribuída) only renders when a reservation-engine integration flag is present; otherwise the block is a locked upsell card, never a guess.
- **Attribution window is always visible** wherever an ROI/campaign number depends on it (e.g. "reservas de leads originados em até 30 dias").
- **Painel is read-only for conversations.** No inbox/reply UI is ever built here — only a "Responder no Chatwoot" deep link (master doc Decisão 11, §5.3, §9 risk table).
- **Client edits data, never behavior.** Bot config changes always go through a PENDENTE → APROVADA/REJEITADA proposal flow; there is no direct-save path to bot configuration in this portal.
- **RBAC boundary:** this plan introduces `ClientRole` (`owner | manager | funcionary`, master doc Decisão 2) as a new, separate enum. Do **not** reuse `AdminRole` (`super_admin | owner | manager | editor | viewer` — Reserve-staff roles, `src/common/@types/@auth.ts`) or `usePermissions()` (`src/common/hooks/use-permissions.ts`) — they model a different actor (Reserve staff who can see many tenants) than a hotel client user scoped to exactly one tenant. See Assumption 2.
- **Recharts only** — already a dependency and already tuned in `next.config.mjs`; every chart in this plan is built on `recharts`, no new charting library.
- **Backend contracts are assumed, not designed here.** Every hook that calls an endpoint not already proven to exist is marked **BLOCKED (backend)** in its task header and must still be built and tested against a documented local fixture/mock — the UI ships decoupled from backend timing, per the master doc's own event-driven, `continueOnFail`-style resilience philosophy (§5.6, §9).
- **Test runner:** `npm run test:run -- <pattern>` (Vitest). No dedicated `tsc --noEmit` script exists; `npm run build` is the type-check gate (`next.config.mjs` has `typescript.ignoreBuildErrors: true`, so build passing is necessary but not sufficient — read the build log for new type errors, don't rely solely on exit code).
- **One commit per task**, following the existing repo's commit style (`type: short description`, no `--no-verify`).

## Assumptions & Open Questions

These are flagged per the task brief, not resolved unilaterally — a product/design decision is needed before implementation starts on the flagged items.

1. **Same repo vs. separate project (the question this task was explicitly asked to investigate, not answer).** Findings: no `portal.reservemkt.com.br` reference, no second Next.js app, no `workspaces` field in `package.json`, no separate `.env` keys for a portal domain anywhere in the repo. `hotel-portal` in this repo today (`src/app/dashboard/hotel-portal/[clientId]`, `src/components/hotel-portal/*`, `src/common/hooks/hotel-portal/*`, `src/common/services/hotel-portal-service.ts`) is confirmed to be the **admin's** view of a hotel client (routed under `/dashboard`, uses `x-skip-tenant: true` admin headers) — not the hotel's own portal. This plan **assumes the more likely case**: a new route group `src/app/portal/**` inside this same repo, reusing the existing axios client, Tailwind/HeroUI design system, and Next.js/Vercel deployment — the alternative (a wholly separate Next.js project sharing only the design system and backend) remains open and would invalidate every file path in this plan if chosen instead.
2. **Role model mismatch.** The master doc's Decisão 2 says roles are "already implemented: `admin`, `owner`, `manager`, `funcionary`" — but the actual `AdminRole` enum (`src/common/@types/@auth.ts`) is `super_admin | owner | manager | editor | viewer`, and it belongs to `AdminProfile` (a Reserve staff member with `tenants: Tenant[]`, i.e. potentially many tenants). A hotel client user needs to be scoped to exactly **one** tenant and use `owner | manager | funcionary` semantics meaningful to a hotel, not `editor`/`viewer`/`super_admin` semantics meaningful to Reserve staff. This plan introduces a **new** `ClientRole` enum and a new `portal-auth-service`/`usePortalAuth` (Task 1) rather than reusing `AdminRole`. **Needs confirmation:** does the backend already have (or plan) a distinct client-user table/JWT claim, or was Decisão 2 written assuming `AdminRole` would simply be reused with a filtered role subset? If the latter, Task 1 needs to change.
3. **URL collision.** The master doc's routes (`/dashboard`, `/leads`, `/trafego`, ...) collide with the **existing admin app's own** `/dashboard`, `/leads`, etc. in this same Next.js app. This plan assumes a `/portal` path prefix (`/portal/dashboard`, `/portal/leads`, ...) to avoid the collision. The alternative — host-based rewriting in `src/proxy.ts` so `portal.reservemkt.com.br/dashboard` serves `/portal/dashboard` prefix-free — is deferred as a later, ops-driven decision (not built in this plan; Task 2 leaves a documented seam for it).
4. **`reserve-client-portal` backend module already exists and overlaps heavily.** `src/common/@types/@hotel-portal.ts` and `hotel-portal-service.ts` (consumed today only by the ADMIN's `/dashboard/hotel-portal/[clientId]` view) already model `DashboardKPI`, `WhatsAppLink`/`WhatsAppLinkStats` (clicks by day/device/geo — exactly master doc §3.3 Camada 1), `MonthlyReport`, booking window, rate parity, budget comparison, `Reservation`, `Guest`. Master doc §4.1's "CONSTRUIR" table appears to undercount how much backend groundwork already exists under this module — it was likely written without cross-referencing `reserve-client-portal`. **Needs a decision from whoever owns the parallel backend plan:** extend `reserve-client-portal` with a client-scoped (non-admin) auth surface, or build a new module in parallel that duplicates the shape. This plan's new portal types deliberately mirror `@hotel-portal.ts` field names where the concept overlaps (e.g. `WhatsAppLinkStats`), to make that reuse decision cheap later — but never imports from the admin module directly, since that would leak the wrong (cross-tenant, `x-skip-tenant`) auth boundary into client-facing code.
5. **PDF export (§3.8)** is server-side generation (Puppeteer/Playwright) per the master doc — a backend concern. This plan only builds the trigger UI and the printable `/portal/print/[block]` route target the backend would screenshot; actual PDF binary generation is BLOCKED (backend).
6. **Digest email (§3.7.1)** content assembly and sending is backend + `reserve-mailer` — this plan only ensures the deep-linked `/portal/relatorios/[id]` read page exists and is stable for the email CTA to target (Task 31); no new "digest" UI is built beyond the existing relatório-reading pattern.
7. **Font.** Master doc §4.3 requires "PP Hatton nos títulos" — no such font is wired anywhere in this repo today (`tailwind.config.js` only configures `nunito`). Task 3 flags this as needing an actual licensed font file from design before the visual identity is final; it ships with a `next/font/local` seam and a fallback so work isn't blocked, but the real typeface is an open item.
8. **Domain cutover, DNS, and whether portal login is fully separate from admin login** are ops/product decisions outside this plan's scope.
9. **Metas configuráveis, benchmark agregado, and bot-config approval are admin-side, not client-side.** Master doc Decisão 9 ("Reserve configura tudo... cliente não configura nada") and §5.5's approval flow ("Reserve revisa no admin") mean the *configuring*/*approving* UI belongs in the existing **admin** dashboard (out of scope for this plan) — this plan only builds the client-facing *display* of a goal (`<GoalProgress>`, Task 29) and the client-facing *proposal* form (Task 22), never the admin approval screen. Similarly, §7's benchmark is used in Reserve's own commercial proposals, not shown to the client — no benchmark UI is built in this plan.

## File Structure

```
src/app/portal/
  layout.tsx                          Task 2  — portal shell (nav + auth guard)
  login/page.tsx                      Task 1
  dashboard/page.tsx                  Task 10 — Visão Geral (3.1)
  trafego/page.tsx                    Task 11 — Tráfego Pago (3.2)
  leads/page.tsx                      Task 12 — Leads e Funil, camada 1 (3.3)
  instagram/page.tsx                  Task 24 — Instagram Orgânico (3.4)
  atendimento/page.tsx                Task 17–20 — Automação WhatsApp (3.10/§5)
  atendimento/bot/page.tsx            Task 22 — Configuração do bot (§5.5)
  retorno/page.tsx                    Task 27–28, 35 — Análise de Retorno (3.9)
  calendario/page.tsx                 Task 25 — Calendário de Conteúdo (3.5)
  plano/page.tsx                      Task 33 — Plano Semestral (3.11)
  atividades/page.tsx                 Task 26 — Feed de Atividades (3.5)
  evolucao/page.tsx                   Task 32 — Linha do Tempo (3.6)
  relatorios/page.tsx                 Task 30 — Relatórios (3.7)
  relatorios/[id]/page.tsx            Task 30
  print/[block]/page.tsx              Task 34 — Exportação PDF (3.8)

src/common/@types/
  @portal-auth.ts                     Task 1
  @portal-stats.ts                    Task 9
  @portal-traffic.ts                  Task 11
  @portal-leads.ts                    Task 12, 16
  @portal-attendance.ts                Task 17–23
  @portal-instagram.ts                Task 24
  @portal-content.ts                  Task 25, 26
  @portal-roi.ts                      Task 27–28, 35
  @portal-timeline.ts                 Task 32
  @portal-plan.ts                     Task 33

src/common/services/portal/
  portal-auth-service.ts              Task 1
  portal-stats-service.ts             Task 9, 10
  portal-traffic-service.ts           Task 11, 36
  portal-leads-service.ts             Task 12, 16
  portal-attendance-service.ts        Task 17–23
  portal-instagram-service.ts         Task 24
  portal-content-service.ts           Task 25, 26
  portal-roi-service.ts               Task 27–28, 35
  portal-timeline-service.ts          Task 32
  portal-plan-service.ts              Task 33

src/common/hooks/portal/              one use-*.ts per service above, same task
src/common/lib/portal/
  glossary.ts                         Task 4
  resolve-portal-redirect.ts          Task 1

src/components/portal/
  glossary/metric-label.tsx           Task 4
  variation-badge.tsx                 Task 5
  skeletons.tsx, empty-state.tsx      Task 6
  charts/line-chart.tsx, bar-chart.tsx Task 7
  data-table.tsx                      Task 8
  nav.tsx                             Task 2
  funnel/acquisition-funnel.tsx       Task 12, 20
  attribution-window-banner.tsx       Task 14
  locked-feature-card.tsx             Task 35
  goal-progress.tsx                   Task 29
  export-pdf-button.tsx               Task 34
  first-access-tour.tsx               Task 37
  <block>/*.tsx                       one subfolder per UI block, task noted above
```

---

## Fase 1 — Fundação do valor

Mirrors master doc §8 Fase 1. Critério de pronto: a Pousada Dona Tereza loga e vê investimento, conversas e variação quinzenal no celular (Task 13 verifies this explicitly).

### Task 1: Portal auth foundation — `ClientRole`, session cookies, route guard

**Files:**
- Create: `src/common/@types/@portal-auth.ts`
- Create: `src/common/services/portal/portal-auth-service.ts`
- Create: `src/common/hooks/portal/use-portal-auth.ts`
- Create: `src/common/lib/portal/resolve-portal-redirect.ts`
- Test: `src/common/lib/portal/resolve-portal-redirect.test.ts`
- Test: `src/common/services/portal/__tests__/portal-auth-service.test.ts`
- Modify: `src/proxy.ts`
- Create: `src/app/portal/login/page.tsx`

**Interfaces:**
- Consumes: `api` axios client (`@/src/common/config/api`), `cookies-next` (already a dependency)
- Produces: `ClientRole` enum, `ClientProfile`/`ClientAuthResponse` types, `portalAuthService.login(credentials): Promise<ClientAuthResponse>`, `usePortalAuth(): { profile: ClientProfile | null; isLoggingIn: boolean; login(credentials): Promise<void>; logout(): void }`, `resolvePortalRedirect(pathname, hasPortalToken): string | null` — consumed by every later task's page guard and by Task 2's layout

**BLOCKED (backend):** `POST /portal/auth/login` does not exist yet. Build against the documented shape below (mirrors the existing `/auth/login` shape in `src/common/services/access-management/*`, adapted per Assumption 2) and keep the service function isolated so swapping the real contract in later is a one-file change.

- [ ] **Step 1: Write `@portal-auth.ts` types**

```ts
// src/common/@types/@portal-auth.ts
export enum ClientRole {
  owner = 'owner',
  manager = 'manager',
  funcionary = 'funcionary',
}

export interface ClientLoginCredentials {
  email: string;
  password: string;
}

export interface PortalTenant {
  id: string;
  name: string;
  slug: string;
  entry_date: string; // ISO date — marco zero, master doc §3.6
}

export interface ClientProfile {
  name: string;
  email: string;
  role: ClientRole;
  tenant: PortalTenant;
}

export interface ClientAuthResponse {
  session_id: string;
  session_token: string;
  details: {
    name: string;
    email: string;
    role: ClientRole;
    tenant: PortalTenant;
  };
}
```

- [ ] **Step 2: Write the failing test for `resolvePortalRedirect`**

```ts
// src/common/lib/portal/resolve-portal-redirect.test.ts
import { describe, expect, it } from 'vitest';
import { resolvePortalRedirect } from './resolve-portal-redirect';

describe('resolvePortalRedirect', () => {
  it('returns null for non-portal routes', () => {
    expect(resolvePortalRedirect('/dashboard', false)).toBeNull();
    expect(resolvePortalRedirect('/auth/login', true)).toBeNull();
  });

  it('redirects to /portal/login when there is no token and the route is not login', () => {
    expect(resolvePortalRedirect('/portal/dashboard', false)).toBe('/portal/login');
    expect(resolvePortalRedirect('/portal/trafego', false)).toBe('/portal/login');
  });

  it('does not redirect an unauthenticated visitor already on /portal/login', () => {
    expect(resolvePortalRedirect('/portal/login', false)).toBeNull();
  });

  it('redirects an authenticated visitor away from /portal/login to the dashboard', () => {
    expect(resolvePortalRedirect('/portal/login', true)).toBe('/portal/dashboard');
  });

  it('does not redirect an authenticated visitor on any other portal route', () => {
    expect(resolvePortalRedirect('/portal/leads', true)).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:run -- resolve-portal-redirect`
Expected: FAIL — `resolve-portal-redirect.ts` does not exist yet.

- [ ] **Step 4: Implement `resolvePortalRedirect`**

```ts
// src/common/lib/portal/resolve-portal-redirect.ts
export function resolvePortalRedirect(
  pathname: string,
  hasPortalToken: boolean,
): string | null {
  if (!pathname.startsWith('/portal')) return null;

  const isLoginRoute = pathname === '/portal/login';

  if (!hasPortalToken && !isLoginRoute) return '/portal/login';
  if (hasPortalToken && isLoginRoute) return '/portal/dashboard';
  return null;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:run -- resolve-portal-redirect`
Expected: PASS (5 tests)

- [ ] **Step 6: Wire `resolvePortalRedirect` into `src/proxy.ts`**

Add alongside the existing `/dashboard` guard (do not touch the existing admin logic):

```ts
// src/proxy.ts — add import and block
import { resolvePortalRedirect } from "@/src/common/lib/portal/resolve-portal-redirect";

// inside proxy(), after the existing "/dashboard" block:
if (request.nextUrl.pathname.startsWith("/portal")) {
    const portalToken = request.cookies.get("portal-token")?.value;
    const redirectTo = resolvePortalRedirect(request.nextUrl.pathname, Boolean(portalToken));
    if (redirectTo) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
    }
}
```

- [ ] **Step 7: Write the failing test for `portalAuthService.login`**

```ts
// src/common/services/portal/__tests__/portal-auth-service.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { portalAuthService } from '../portal-auth-service';
import api from '@/src/common/config/api';
import { ClientRole } from '@/src/common/@types/@portal-auth';

vi.mock('@/src/common/config/api', () => ({
  default: { post: vi.fn() },
}));

describe('portalAuthService.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posts credentials to /portal/auth/login and returns the auth payload', async () => {
    const mockResponse = {
      session_id: 'sess-1',
      session_token: 'tok-1',
      details: {
        name: 'Dona Tereza',
        email: 'dona@tereza.com',
        role: ClientRole.owner,
        tenant: { id: 't1', name: 'Pousada Dona Tereza', slug: 'dona-tereza', entry_date: '2026-01-10' },
      },
    };
    vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

    const result = await portalAuthService.login({ email: 'dona@tereza.com', password: 'x' });

    expect(api.post).toHaveBeenCalledWith('/portal/auth/login', {
      email: 'dona@tereza.com',
      password: 'x',
    });
    expect(result).toEqual(mockResponse);
  });
});
```

- [ ] **Step 8: Run test to verify it fails**

Run: `npm run test:run -- portal-auth-service`
Expected: FAIL — module not found.

- [ ] **Step 9: Implement `portalAuthService`**

```ts
// src/common/services/portal/portal-auth-service.ts
import api from '@/src/common/config/api';
import type {
  ClientAuthResponse,
  ClientLoginCredentials,
} from '@/src/common/@types/@portal-auth';

export const portalAuthService = {
  async login(credentials: ClientLoginCredentials): Promise<ClientAuthResponse> {
    const response = await api.post<ClientAuthResponse>('/portal/auth/login', credentials);
    return response.data;
  },
};
```

- [ ] **Step 10: Run test to verify it passes**

Run: `npm run test:run -- portal-auth-service`
Expected: PASS

- [ ] **Step 11: Implement `usePortalAuth`**

Cookie names are namespaced with a `portal-` prefix so they never collide with the existing admin `token`/`session-role` cookies (`src/common/hooks/use-permissions.ts` reads `session-role`).

```ts
// src/common/hooks/portal/use-portal-auth.ts
'use client';

import { useCallback, useState } from 'react';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { portalAuthService } from '@/src/common/services/portal/portal-auth-service';
import { ClientRole, type ClientLoginCredentials, type ClientProfile } from '@/src/common/@types/@portal-auth';

const COOKIE_TOKEN = 'portal-token';
const COOKIE_ROLE = 'portal-session-role';
const COOKIE_NAME = 'portal-session-name';
const COOKIE_EMAIL = 'portal-session-email';
const COOKIE_TENANT = 'portal-session-tenant';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h, matches admin session convention

export function readPortalProfile(): ClientProfile | null {
  const role = getCookie(COOKIE_ROLE) as ClientRole | undefined;
  const name = getCookie(COOKIE_NAME) as string | undefined;
  const email = getCookie(COOKIE_EMAIL) as string | undefined;
  const tenantRaw = getCookie(COOKIE_TENANT) as string | undefined;
  if (!role || !name || !email || !tenantRaw) return null;

  try {
    return { role, name, email, tenant: JSON.parse(tenantRaw) };
  } catch {
    return null;
  }
}

export function usePortalAuth() {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [profile, setProfile] = useState<ClientProfile | null>(() => readPortalProfile());

  const login = useCallback(
    async (credentials: ClientLoginCredentials) => {
      setIsLoggingIn(true);
      try {
        const response = await portalAuthService.login(credentials);
        const cookieOpts = { maxAge: COOKIE_MAX_AGE, path: '/' };
        setCookie(COOKIE_TOKEN, response.session_token, cookieOpts);
        setCookie(COOKIE_ROLE, response.details.role, cookieOpts);
        setCookie(COOKIE_NAME, response.details.name, cookieOpts);
        setCookie(COOKIE_EMAIL, response.details.email, cookieOpts);
        setCookie(COOKIE_TENANT, JSON.stringify(response.details.tenant), cookieOpts);
        setProfile({
          role: response.details.role,
          name: response.details.name,
          email: response.details.email,
          tenant: response.details.tenant,
        });
        router.push('/portal/dashboard');
      } finally {
        setIsLoggingIn(false);
      }
    },
    [router],
  );

  const logout = useCallback(() => {
    [COOKIE_TOKEN, COOKIE_ROLE, COOKIE_NAME, COOKIE_EMAIL, COOKIE_TENANT].forEach((name) =>
      deleteCookie(name, { path: '/' }),
    );
    setProfile(null);
    router.push('/portal/login');
  }, [router]);

  return { profile, isLoggingIn, login, logout };
}
```

- [ ] **Step 12: Build the login page**

```tsx
// src/app/portal/login/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { usePortalAuth } from '@/src/common/hooks/portal/use-portal-auth';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';

export default function PortalLoginPage() {
  const { login, isLoggingIn } = usePortalAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await login({ email, password });
    } catch {
      setError('E-mail ou senha incorretos.');
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Painel Reserve</h1>
        <Input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 13: Run full test suite and build**

```bash
npm run test:run -- portal
npm run build
```

Expected: all portal tests pass; build succeeds (no new type errors in the build log).

- [ ] **Step 14: Commit**

```bash
git add src/common/@types/@portal-auth.ts src/common/services/portal/portal-auth-service.ts \
  src/common/hooks/portal/use-portal-auth.ts src/common/lib/portal/resolve-portal-redirect.ts \
  src/common/lib/portal/resolve-portal-redirect.test.ts \
  src/common/services/portal/__tests__/portal-auth-service.test.ts \
  src/proxy.ts src/app/portal/login/page.tsx
git commit -m "feat(portal): add client auth foundation (ClientRole, session cookies, route guard)

Introduces a new, tenant-scoped session layer for the Painel Reserve client
portal, separate from the admin AdminRole/usePermissions() (see plan
Assumption 2). BLOCKED on backend: POST /portal/auth/login does not exist
yet — built against the documented contract in the plan."
```

---

### Task 2: Portal shell layout — navigation and route wiring

**Files:**
- Create: `src/components/portal/nav.tsx`
- Create: `src/app/portal/layout.tsx`
- Test: `src/components/portal/__tests__/nav.test.tsx`

**Interfaces:**
- Consumes: `usePortalAuth` (Task 1) for `profile`/`logout`
- Produces: `<PortalNav routes={PORTAL_ROUTES} />`, `PORTAL_ROUTES` (the 12-route list from master doc §4.3, prefixed `/portal`) — consumed by every page task below and by Task 37 (tour)

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/portal/__tests__/nav.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortalNav, PORTAL_ROUTES } from '../nav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/portal/dashboard',
}));

describe('PortalNav', () => {
  it('renders a link for every portal route', () => {
    render(<PortalNav />);
    PORTAL_ROUTES.forEach((route) => {
      expect(screen.getByRole('link', { name: route.label })).toHaveAttribute('href', route.href);
    });
  });

  it('marks the current route as active', () => {
    render(<PortalNav />);
    const activeLink = screen.getByRole('link', { name: 'Visão Geral' });
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- portal/nav`
Expected: FAIL — `../nav` does not exist.

- [ ] **Step 3: Implement `PortalNav`**

Route list mirrors master doc §4.3 exactly, prefixed with `/portal` per Assumption 3.

```tsx
// src/components/portal/nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Instagram,
  MessageCircle,
  PiggyBank,
  Calendar,
  Target,
  ListChecks,
  History,
  FileText,
} from 'lucide-react';
import { cn } from '@/src/common/lib/utils';

export interface PortalRoute {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const PORTAL_ROUTES: PortalRoute[] = [
  { href: '/portal/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/portal/trafego', label: 'Tráfego Pago', icon: TrendingUp },
  { href: '/portal/leads', label: 'Leads e Funil', icon: Users },
  { href: '/portal/instagram', label: 'Instagram', icon: Instagram },
  { href: '/portal/atendimento', label: 'Atendimento', icon: MessageCircle },
  { href: '/portal/retorno', label: 'Retorno', icon: PiggyBank },
  { href: '/portal/calendario', label: 'Calendário', icon: Calendar },
  { href: '/portal/plano', label: 'Plano', icon: Target },
  { href: '/portal/atividades', label: 'Atividades', icon: ListChecks },
  { href: '/portal/evolucao', label: 'Evolução', icon: History },
  { href: '/portal/relatorios', label: 'Relatórios', icon: FileText },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do painel"
      className={cn(
        // desktop: vertical sidebar
        'hidden md:flex md:w-56 md:flex-col md:gap-1 md:border-r md:border-border md:p-4',
        // mobile: bottom bar, per master doc §4.3 mobile-first
        'fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-background p-2 md:static md:justify-start',
      )}
    >
      {PORTAL_ROUTES.map((route) => {
        const isActive = pathname === route.href;
        const Icon = route.icon;
        return (
          <Link
            key={route.href}
            href={route.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-1 rounded-md px-2 py-1.5 text-xs md:flex-row md:gap-2 md:px-3 md:py-2 md:text-sm',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{route.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

Note: only the 11 authenticated routes appear in nav (matches §4.3's list minus `/login`, `/atendimento/bot`, `/relatorios/[id]`, and `/print/[block]`, which are reached by drill-in, not top-level nav). On mobile this renders 11 icons in a bottom bar — flag to design: this is dense for a 375px viewport (§4.3 principle 1 targets simplicity) and may need grouping/an "mais" overflow menu; Task 13's mobile QA pass must explicitly check this and is the checkpoint to raise it if it doesn't work in practice.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- portal/nav`
Expected: PASS (2 tests)

- [ ] **Step 5: Build the portal layout with the auth guard**

```tsx
// src/app/portal/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import { PortalNav } from '@/src/components/portal/nav';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginRoute = pathname === '/portal/login';

  if (isLoginRoute) return <>{children}</>;

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <PortalNav />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
    </div>
  );
}
```

Server-side auth is already enforced by `src/proxy.ts` (Task 1, Step 6) — this layout only decides whether to render nav chrome, it does not re-implement the guard.

- [ ] **Step 6: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/portal/nav.tsx src/components/portal/__tests__/nav.test.tsx src/app/portal/layout.tsx
git commit -m "feat(portal): add shell layout with responsive nav (desktop sidebar / mobile bottom bar)

Wires the 11 authenticated portal routes from master doc §4.3. Flags nav
density on 375px as a design follow-up for Task 13's mobile QA pass."
```

---

### Task 3: Design tokens and PP Hatton font seam

**Files:**
- Modify: `src/shared/styles/globals.css` → **actually** `src/common/styles/globals.css` (current structure, see Global Constraints)
- Modify: `tailwind.config.js`
- Create: `src/app/portal/fonts.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `font-portal-display` Tailwind utility class, `--portal-*` CSS custom properties — consumed by every portal component's headings

**Open item (Assumption 7):** no PP Hatton font file exists in this repo. This task ships a working seam (system serif fallback) so no later task is blocked, and documents exactly what to swap in once design delivers the licensed font file.

- [ ] **Step 1: Add the font loader with a safe fallback**

```ts
// src/app/portal/fonts.ts
import localFont from 'next/font/local';

// TODO(design): PP Hatton license/files not yet in the repo (plan Assumption 7).
// Once delivered, drop the .woff2 files into src/app/portal/fonts/ and point `src` at them.
// Until then this resolves to the `serif` fallback so no portal page is blocked on the asset.
export const portalDisplayFont = localFont({
  src: [],
  fallback: ['ui-serif', 'Georgia', 'serif'],
  variable: '--font-portal-display',
});
```

`next/font/local` requires at least one `src` entry to build; if `npm run build` fails on an empty `src: []` array, replace Step 1 with a plain CSS variable fallback instead (no `next/font`):

```ts
// src/app/portal/fonts.ts (fallback approach if next/font/local rejects an empty src)
export const portalDisplayFontVariable = '--font-portal-display';
export const portalDisplayFontClassName = 'font-portal-display';
```

and set the CSS variable directly in globals.css (Step 2) instead of via the font loader. Try the `next/font/local` version first; only fall back if the build fails.

- [ ] **Step 2: Add portal design tokens to `globals.css`**

Append (do not replace existing tokens):

```css
/* src/common/styles/globals.css — append at end */
:root {
  --portal-font-display: 'ui-serif', Georgia, serif; /* swap to PP Hatton per fonts.ts TODO */
}

.font-portal-display {
  font-family: var(--font-portal-display, var(--portal-font-display));
}
```

- [ ] **Step 3: Register the Tailwind utility**

```js
// tailwind.config.js — inside theme.extend.fontFamily, add one line
portalDisplay: ["var(--font-portal-display)", "ui-serif", "Georgia", "serif"],
```

- [ ] **Step 4: Build to confirm no regression**

```bash
npm run build
```

Expected: success, no CSS/Tailwind errors. If `next/font/local` with an empty `src` fails the build, switch to the fallback approach documented in Step 1 and rebuild.

- [ ] **Step 5: Commit**

```bash
git add src/app/portal/fonts.ts src/common/styles/globals.css tailwind.config.js
git commit -m "feat(portal): add PP Hatton font seam with serif fallback

No licensed PP Hatton font file exists in the repo yet (plan Assumption 7).
Ships a working fallback (font-portal-display utility) so later tasks are
not blocked; swap the font file in src/app/portal/fonts.ts once delivered."
```

---

### Task 4: Glossary system — `glossary.ts` + `<MetricLabel>`

**Files:**
- Create: `src/common/lib/portal/glossary.ts`
- Create: `src/common/hooks/portal/use-media-query.ts`
- Create: `src/components/portal/glossary/metric-label.tsx`
- Modify: `src/components/ui/sheet.tsx` (add `side="bottom"`)
- Test: `src/common/hooks/portal/__tests__/use-media-query.test.ts`
- Test: `src/components/portal/glossary/__tests__/metric-label.test.tsx`

**Interfaces:**
- Consumes: `Tooltip`/`TooltipTrigger`/`TooltipContent` and `Sheet`/`SheetContent` from `src/components/ui/{tooltip,sheet}.tsx`
- Produces: `GlossaryKey`, `glossary: Record<GlossaryKey, { label: string; tooltip: string }>`, `<MetricLabel metricKey={GlossaryKey} />`, `useMediaQuery(query: string): boolean` — consumed by every metric-displaying component in every later task

This is master doc §4.3 principle 4 ("componente `<MetricLabel>` com '?' → tooltip (mobile: bottom sheet). Definições centralizadas em `glossary.ts`") — binding, not optional.

- [ ] **Step 1: Write the failing test for `useMediaQuery`**

```ts
// src/common/hooks/portal/__tests__/use-media-query.test.ts
import { describe, expect, it, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMediaQuery } from '../use-media-query';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

describe('useMediaQuery', () => {
  afterEach(() => setViewportWidth(1024));

  it('reports true when the viewport is narrower than the breakpoint', () => {
    setViewportWidth(375);
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(true);
  });

  it('reports false when the viewport is wider than the breakpoint', () => {
    setViewportWidth(1280);
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);
  });

  it('updates when the viewport is resized', () => {
    setViewportWidth(1280);
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);
    act(() => setViewportWidth(375));
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- use-media-query`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `useMediaQuery`**

Implemented via `window.matchMedia` when available, parsing the `max-width` breakpoint out of the query string as a fallback for the jsdom test environment (jsdom's `matchMedia` does not recompute on resize by default, so the hook also listens to `resize` directly).

```ts
// src/common/hooks/portal/use-media-query.ts
'use client';

import { useEffect, useState } from 'react';

function evaluate(query: string): boolean {
  if (typeof window === 'undefined') return false;
  const match = /max-width:\s*(\d+)px/.exec(query);
  if (match) {
    return window.innerWidth <= Number(match[1]);
  }
  return window.matchMedia?.(query).matches ?? false;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => evaluate(query));

  useEffect(() => {
    const update = () => setMatches(evaluate(query));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [query]);

  return matches;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- use-media-query`
Expected: PASS (3 tests)

- [ ] **Step 5: Write `glossary.ts`**

Tooltips for `investimento` through `frequencia` are copied verbatim from master doc §3.2's table; the rest are written in the same plain, jargon-free register per §4.3 principle 6.

```ts
// src/common/lib/portal/glossary.ts
export type GlossaryKey =
  | 'investimento'
  | 'pessoas_alcancadas'
  | 'visualizacoes'
  | 'conversas_iniciadas'
  | 'custo_por_conversa'
  | 'frequencia'
  | 'leads_qualificados'
  | 'leads_prontos_fechar'
  | 'taxa_qualificacao'
  | 'seguidores'
  | 'alcance_organico'
  | 'engajamento'
  | 'taxa_engajamento';

export interface GlossaryEntry {
  label: string;
  tooltip: string;
}

export const glossary: Record<GlossaryKey, GlossaryEntry> = {
  investimento: {
    label: 'Investimento',
    tooltip: 'Quanto foi investido em anúncios neste período',
  },
  pessoas_alcancadas: {
    label: 'Pessoas alcançadas',
    tooltip: 'Quantas pessoas diferentes viram seus anúncios',
  },
  visualizacoes: {
    label: 'Visualizações',
    tooltip: 'Quantas vezes seus anúncios apareceram',
  },
  conversas_iniciadas: {
    label: 'Conversas iniciadas',
    tooltip: 'Quantas pessoas clicaram e abriram conversa no WhatsApp',
  },
  custo_por_conversa: {
    label: 'Custo por conversa',
    tooltip: 'Quanto custou, em média, cada pessoa que chamou no WhatsApp',
  },
  frequencia: {
    label: 'Frequência',
    tooltip: 'Quantas vezes, em média, cada pessoa viu o anúncio',
  },
  leads_qualificados: {
    label: 'Leads qualificados',
    tooltip: 'Conversas que avançaram no atendimento e já foram entendidas como interesse real',
  },
  leads_prontos_fechar: {
    label: 'Leads prontos para fechar',
    tooltip: 'Conversas no ponto em que a Reserve entrega para o hotel fechar a reserva',
  },
  taxa_qualificacao: {
    label: 'Taxa de qualificação',
    tooltip: 'De cada 100 conversas, quantas avançam para qualificado',
  },
  seguidores: {
    label: 'Seguidores',
    tooltip: 'Total de seguidores da sua conta no Instagram',
  },
  alcance_organico: {
    label: 'Alcance orgânico',
    tooltip: 'Quantas contas diferentes viram seu conteúdo sem impulsionamento pago',
  },
  engajamento: {
    label: 'Engajamento',
    tooltip: 'Curtidas, comentários, salvamentos e compartilhamentos somados',
  },
  taxa_engajamento: {
    label: 'Taxa de engajamento',
    tooltip: 'Engajamento dividido pelo alcance, em percentual',
  },
};
```

- [ ] **Step 6: Add `side="bottom"` support to `SheetContent`**

```tsx
// src/components/ui/sheet.tsx — modify SheetContentProps and the className branch
interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "left" | "right" | "bottom";
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, children, side = "right", ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col bg-card border-border transition ease-in-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300",
        side === "right" &&
          "inset-y-0 right-0 h-full w-full max-w-xl border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        side === "left" &&
          "inset-y-0 left-0 h-full w-full max-w-xl border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        side === "bottom" &&
          "inset-x-0 bottom-0 max-h-[80svh] w-full rounded-t-xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none">
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";
```

This is additive — existing `side="left"`/`"right"` callers are unaffected.

- [ ] **Step 7: Write the failing test for `<MetricLabel>`**

```tsx
// src/components/portal/glossary/__tests__/metric-label.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricLabel } from '../metric-label';

vi.mock('@/src/common/hooks/portal/use-media-query', () => ({
  useMediaQuery: () => false, // desktop by default in this test file
}));

describe('MetricLabel', () => {
  it('renders the glossary label and a "?" trigger', () => {
    render(<MetricLabel metricKey="investimento" />);
    expect(screen.getByText('Investimento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /o que é/i })).toBeInTheDocument();
  });

  it('shows the tooltip content on desktop when the trigger is clicked', async () => {
    render(<MetricLabel metricKey="custo_por_conversa" />);
    fireEvent.click(screen.getByRole('button', { name: /o que é/i }));
    expect(await screen.findByText(/quanto custou, em média/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run test to verify it fails**

Run: `npm run test:run -- metric-label`
Expected: FAIL — module not found.

- [ ] **Step 9: Implement `<MetricLabel>`**

```tsx
// src/components/portal/glossary/metric-label.tsx
'use client';

import { HelpCircle } from 'lucide-react';
import { glossary, type GlossaryKey } from '@/src/common/lib/portal/glossary';
import { useMediaQuery } from '@/src/common/hooks/portal/use-media-query';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/src/components/ui/sheet';

export function MetricLabel({ metricKey }: { metricKey: GlossaryKey }) {
  const entry = glossary[metricKey];
  const isMobile = useMediaQuery('(max-width: 767px)');

  const trigger = (
    <button
      type="button"
      aria-label={`O que é ${entry.label}`}
      className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
    >
      <HelpCircle className="size-3.5" />
    </button>
  );

  if (isMobile) {
    return (
      <span className="inline-flex items-center gap-1">
        <span>{entry.label}</span>
        <Sheet>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>{entry.label}</SheetTitle>
              <SheetDescription>{entry.tooltip}</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span>{entry.label}</span>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent>{entry.tooltip}</TooltipContent>
      </Tooltip>
    </span>
  );
}
```

- [ ] **Step 10: Run test to verify it passes**

Run: `npm run test:run -- metric-label`
Expected: PASS (2 tests)

- [ ] **Step 11: Build**

```bash
npm run build
```

- [ ] **Step 12: Commit**

```bash
git add src/common/lib/portal/glossary.ts src/common/hooks/portal/use-media-query.ts \
  src/common/hooks/portal/__tests__/use-media-query.test.ts \
  src/components/portal/glossary/metric-label.tsx \
  src/components/portal/glossary/__tests__/metric-label.test.tsx \
  src/components/ui/sheet.tsx
git commit -m "feat(portal): add glossary.ts and <MetricLabel> (tooltip desktop / bottom sheet mobile)

Implements master doc §4.3 principle 4. Adds side=\"bottom\" to the shared
SheetContent primitive, additive only."
```

---

### Task 5: `<VariationBadge>` — variation arrow/color with cost-metric inversion

**Files:**
- Create: `src/components/portal/variation-badge.tsx`
- Test: `src/components/portal/__tests__/variation-badge.test.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `<VariationBadge value={number} invertColor={boolean} />` — consumed by every KPI card in Tasks 10, 11, 27, 28

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/portal/__tests__/variation-badge.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VariationBadge } from '../variation-badge';

describe('VariationBadge', () => {
  it('renders a positive variation in green with an up arrow, by default', () => {
    render(<VariationBadge value={12.5} />);
    const badge = screen.getByText('+12.5%');
    expect(badge).toHaveClass('text-emerald-600');
  });

  it('renders a negative variation in red with a down arrow, by default', () => {
    render(<VariationBadge value={-8} />);
    const badge = screen.getByText('-8%');
    expect(badge).toHaveClass('text-red-600');
  });

  it('inverts the color for cost metrics: a drop in cost is positive (green)', () => {
    render(<VariationBadge value={-8} invertColor />);
    const badge = screen.getByText('-8%');
    expect(badge).toHaveClass('text-emerald-600');
  });

  it('inverts the color for cost metrics: a rise in cost is negative (red)', () => {
    render(<VariationBadge value={8} invertColor />);
    const badge = screen.getByText('+8%');
    expect(badge).toHaveClass('text-red-600');
  });

  it('renders neutral gray at exactly zero', () => {
    render(<VariationBadge value={0} />);
    const badge = screen.getByText('0%');
    expect(badge).toHaveClass('text-muted-foreground');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- variation-badge`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `<VariationBadge>`**

```tsx
// src/components/portal/variation-badge.tsx
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/src/common/lib/utils';

export interface VariationBadgeProps {
  /** Percentage variation vs. the previous period, e.g. 12.5 or -8 */
  value: number;
  /** True for cost-like metrics where a decrease is the good outcome (master doc §4.3 principle 3) */
  invertColor?: boolean;
}

export function VariationBadge({ value, invertColor = false }: VariationBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isGood = invertColor ? isNegative : isPositive;
  const isBad = invertColor ? isPositive : isNegative;

  const colorClass = isGood
    ? 'text-emerald-600'
    : isBad
      ? 'text-red-600'
      : 'text-muted-foreground';

  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus;
  const formatted = `${value > 0 ? '+' : ''}${value}%`;

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-sm font-medium', colorClass)}>
      <Icon className="size-3.5" />
      {formatted}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- variation-badge`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/portal/variation-badge.tsx src/components/portal/__tests__/variation-badge.test.tsx
git commit -m "feat(portal): add VariationBadge with cost-metric color inversion

Implements master doc §4.3 principle 3 (falling cost per conversation is
a positive signal and must render green, not red)."
```

---

### Task 6: Skeleton loading and empty-state primitives

**Files:**
- Create: `src/components/portal/skeletons.tsx`
- Create: `src/components/portal/empty-state.tsx`
- Test: `src/components/portal/__tests__/empty-state.test.tsx`

**Interfaces:**
- Consumes: `Card` from `src/components/ui/card.tsx`
- Produces: `<PortalCardSkeleton />`, `<PortalChartSkeleton />`, `<PortalTableSkeleton rows={n} />`, `<PortalEmptyState title description icon? action? />` — consumed by every data-driven block in Tasks 10–35

- [ ] **Step 1: Write the failing test for `<PortalEmptyState>`**

```tsx
// src/components/portal/__tests__/empty-state.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PortalEmptyState } from '../empty-state';

describe('PortalEmptyState', () => {
  it('renders a title and an explanation, never a blank block', () => {
    render(
      <PortalEmptyState
        title="Ainda sem dados de tráfego"
        description="A conexão com o Meta Ads está sendo configurada pela Reserve."
      />,
    );
    expect(screen.getByText('Ainda sem dados de tráfego')).toBeInTheDocument();
    expect(screen.getByText(/conexão com o meta ads/i)).toBeInTheDocument();
  });

  it('renders an optional action button and fires its callback', () => {
    const onAction = vi.fn();
    render(
      <PortalEmptyState
        title="Nenhum relatório publicado ainda"
        description="O primeiro resumo quinzenal aparece aqui assim que for publicado."
        actionLabel="Ver calendário"
        onAction={onAction}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ver calendário' }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- empty-state`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `<PortalEmptyState>`**

```tsx
// src/components/portal/empty-state.tsx
import { Inbox, type LucideIcon } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

export interface PortalEmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export function PortalEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}: PortalEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- empty-state`
Expected: PASS (2 tests)

- [ ] **Step 5: Implement skeleton primitives** (no test — pure presentational markup, verified visually in Task 13)

```tsx
// src/components/portal/skeletons.tsx
import { cn } from '@/src/common/lib/utils';

function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

export function PortalCardSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <Pulse className="h-3 w-24" />
      <Pulse className="h-7 w-32" />
      <Pulse className="h-3 w-16" />
    </div>
  );
}

export function PortalChartSkeleton() {
  return (
    <div className="rounded-lg border border-border p-4">
      <Pulse className="mb-4 h-4 w-40" />
      <Pulse className="h-48 w-full md:h-64" />
    </div>
  );
}

export function PortalTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Pulse key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/portal/skeletons.tsx src/components/portal/empty-state.tsx src/components/portal/__tests__/empty-state.test.tsx
git commit -m "feat(portal): add skeleton and designed empty-state primitives

Implements master doc §4.3 principle 5 — every data block gets a
skeleton while loading and an explained empty state, never a blank screen."
```

---

### Task 7: Chart wrapper primitives — `<PortalLineChart>` / `<PortalBarChart>`

**Files:**
- Create: `src/components/portal/charts/line-chart.tsx`
- Create: `src/components/portal/charts/bar-chart.tsx`
- Test: `src/components/portal/charts/__tests__/line-chart.test.tsx`

**Interfaces:**
- Consumes: `recharts` (`LineChart`, `BarChart`, `ResponsiveContainer`, etc.), `PortalChartSkeleton`/`PortalEmptyState` (Task 6)
- Produces: `<PortalLineChart data series xKey isLoading? />`, `<PortalBarChart data series xKey isLoading? />` — consumed by Tasks 10, 11, 12, 20, 24, 27, 28, 32

Enforces master doc §4.3 principle 2 (line/bar only) by construction — there is no `pieKey`/`radarKey` prop, so a consumer cannot accidentally render a discouraged chart type through this component.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/portal/charts/__tests__/line-chart.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortalLineChart } from '../line-chart';

const data = [
  { day: '01/08', conversas: 4 },
  { day: '02/08', conversas: 7 },
];

describe('PortalLineChart', () => {
  it('shows the skeleton while loading', () => {
    render(
      <PortalLineChart
        data={[]}
        xKey="day"
        series={[{ key: 'conversas', label: 'Conversas', color: '#0ea5e9' }]}
        isLoading
      />,
    );
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });

  it('shows the empty state when there is no data and it is not loading', () => {
    render(
      <PortalLineChart
        data={[]}
        xKey="day"
        series={[{ key: 'conversas', label: 'Conversas', color: '#0ea5e9' }]}
      />,
    );
    expect(screen.getByText(/sem dados no período/i)).toBeInTheDocument();
  });

  it('renders the chart figure when data is present', () => {
    render(
      <PortalLineChart
        data={data}
        xKey="day"
        series={[{ key: 'conversas', label: 'Conversas', color: '#0ea5e9' }]}
      />,
    );
    expect(screen.getByRole('figure')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- line-chart`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `<PortalLineChart>`**

```tsx
// src/components/portal/charts/line-chart.tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { PortalChartSkeleton } from '@/src/components/portal/skeletons';
import { PortalEmptyState } from '@/src/components/portal/empty-state';

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface PortalLineChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: ChartSeries[];
  isLoading?: boolean;
  height?: number;
}

export function PortalLineChart({ data, xKey, series, isLoading, height = 256 }: PortalLineChartProps) {
  if (isLoading) return <PortalChartSkeleton />;
  if (data.length === 0) {
    return (
      <PortalEmptyState
        title="Sem dados no período"
        description="Ainda não há números suficientes para desenhar este gráfico."
      />
    );
  }

  return (
    <div role="figure" aria-label={series.map((s) => s.label).join(', ')} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={32} />
          <RechartsTooltip />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- line-chart`
Expected: PASS (3 tests)

- [ ] **Step 5: Implement `<PortalBarChart>`** (same shape, no separate test file — mirrors the line-chart test 1:1, adding it would be pure duplication; covered by its consumers' tests in later tasks)

```tsx
// src/components/portal/charts/bar-chart.tsx
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { PortalChartSkeleton } from '@/src/components/portal/skeletons';
import { PortalEmptyState } from '@/src/components/portal/empty-state';
import type { ChartSeries } from './line-chart';

export interface PortalBarChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: ChartSeries[];
  isLoading?: boolean;
  height?: number;
}

export function PortalBarChart({ data, xKey, series, isLoading, height = 256 }: PortalBarChartProps) {
  if (isLoading) return <PortalChartSkeleton />;
  if (data.length === 0) {
    return (
      <PortalEmptyState
        title="Sem dados no período"
        description="Ainda não há números suficientes para desenhar este gráfico."
      />
    );
  }

  return (
    <div role="figure" aria-label={series.map((s) => s.label).join(', ')} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={32} />
          <RechartsTooltip />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 6: Build**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/portal/charts/line-chart.tsx src/components/portal/charts/bar-chart.tsx \
  src/components/portal/charts/__tests__/line-chart.test.tsx
git commit -m "feat(portal): add PortalLineChart/PortalBarChart wrappers on Recharts

No pie/radar/dual-axis prop exists on either component by construction,
enforcing master doc §4.3 principle 2."
```

---

### Task 8: Responsive table→card primitive — `<PortalDataTable>`

**Files:**
- Create: `src/components/portal/data-table.tsx`
- Test: `src/components/portal/__tests__/data-table.test.tsx`

**Interfaces:**
- Consumes: `useMediaQuery` (Task 4), `Table`/`TableHeader`/`TableRow`/`TableCell` from `src/components/ui/table.tsx`, `Card` from `src/components/ui/card.tsx`
- Produces: `<PortalDataTable columns rows getRowKey />` — consumed by Task 11 (campaign table), Task 12 (leads breakdown), Task 16 (link conversion table), Task 20 (funnel mobile list)

Implements master doc §4.3 principle 1: "Nada de scroll horizontal — tabelas viram cards empilhados" on mobile.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/portal/__tests__/data-table.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortalDataTable, type PortalDataTableColumn } from '../data-table';

interface Row {
  id: string;
  campaign: string;
  spend: number;
}

const rows: Row[] = [
  { id: '1', campaign: 'Verão 2026', spend: 850 },
  { id: '2', campaign: 'Fim de ano', spend: 420 },
];

const columns: PortalDataTableColumn<Row>[] = [
  { key: 'campaign', header: 'Campanha', render: (row) => row.campaign },
  { key: 'spend', header: 'Investimento', render: (row) => `R$ ${row.spend}` },
];

describe('PortalDataTable', () => {
  it('renders an HTML table on desktop', () => {
    vi.doMock('@/src/common/hooks/portal/use-media-query', () => ({ useMediaQuery: () => false }));
    render(<PortalDataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Verão 2026')).toBeInTheDocument();
  });

  it('renders stacked cards, not a table, on mobile viewports', () => {
    render(<PortalDataTable columns={columns} rows={rows} getRowKey={(r) => r.id} forceMobile />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Verão 2026')).toBeInTheDocument();
    expect(screen.getByText('R$ 850')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- data-table`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `<PortalDataTable>`**

A `forceMobile` prop is exposed purely for deterministic testing (bypassing the `useMediaQuery` resize-timing quirks in jsdom) — production callers never pass it.

```tsx
// src/components/portal/data-table.tsx
'use client';

import { useMediaQuery } from '@/src/common/hooks/portal/use-media-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Card } from '@/src/components/ui/card';

export interface PortalDataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

export interface PortalDataTableProps<T> {
  columns: PortalDataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Test-only override; production callers rely on the viewport. */
  forceMobile?: boolean;
}

export function PortalDataTable<T>({ columns, rows, getRowKey, forceMobile }: PortalDataTableProps<T>) {
  const isMobileQuery = useMediaQuery('(max-width: 767px)');
  const isMobile = forceMobile ?? isMobileQuery;

  if (isMobile) {
    return (
      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={getRowKey(row)} className="p-4">
            <dl className="space-y-1.5">
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-4 text-sm">
                  <dt className="text-muted-foreground">{col.header}</dt>
                  <dd className="text-right font-medium">{col.render(row)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={getRowKey(row)}>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.render(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- data-table`
Expected: PASS (2 tests)

- [ ] **Step 5: Build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/portal/data-table.tsx src/components/portal/__tests__/data-table.test.tsx
git commit -m "feat(portal): add PortalDataTable — stacked cards on mobile, table on desktop

Implements master doc §4.3 principle 1 (no horizontal scroll on mobile)."
```

---

### Task 9: Period comparison hook — `usePeriodComparison`

**Files:**
- Create: `src/common/@types/@portal-stats.ts`
- Create: `src/common/services/portal/portal-stats-service.ts`
- Create: `src/common/hooks/portal/use-period-comparison.ts`
- Test: `src/common/services/portal/__tests__/portal-stats-service.test.ts`

**Interfaces:**
- Consumes: `api` axios client, TanStack Query (`useQuery`)
- Produces: `PeriodComparison<TMetrics>` type, `portalStatsService.getComparativo(params): Promise<PeriodComparison<...>>`, `usePeriodComparison(metricKeys, params)` — consumed by Tasks 10, 11, 27, 28

**BLOCKED (backend):** master doc §4.1 lists "Comparativo período vs. período — service de variação % para qualquer métrica" as a backend item still to build. No endpoint exists yet. This task builds the full client-side contract and hook against a documented shape; swap only `portalStatsService`'s URL/params when the real endpoint lands.

- [ ] **Step 1: Write `@portal-stats.ts` types**

```ts
// src/common/@types/@portal-stats.ts
export interface PeriodComparisonQuery {
  metric_keys: string[];
  period: 'biweekly' | 'monthly';
  from: string; // ISO date
  to: string; // ISO date
}

export interface MetricComparison {
  metric_key: string;
  current_value: number;
  previous_value: number;
  variation_pct: number;
}

export interface PeriodComparisonResponse {
  period: { from: string; to: string };
  previous_period: { from: string; to: string };
  metrics: MetricComparison[];
}
```

- [ ] **Step 2: Write the failing test for `portalStatsService.getComparativo`**

```ts
// src/common/services/portal/__tests__/portal-stats-service.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { portalStatsService } from '../portal-stats-service';
import api from '@/src/common/config/api';

vi.mock('@/src/common/config/api', () => ({ default: { get: vi.fn() } }));

describe('portalStatsService.getComparativo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests the comparativo endpoint with the given metric keys and period', async () => {
    const mockResponse = {
      period: { from: '2026-07-16', to: '2026-07-31' },
      previous_period: { from: '2026-07-01', to: '2026-07-15' },
      metrics: [
        { metric_key: 'investimento', current_value: 1200, previous_value: 1000, variation_pct: 20 },
      ],
    };
    vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

    const result = await portalStatsService.getComparativo({
      metric_keys: ['investimento'],
      period: 'biweekly',
      from: '2026-07-16',
      to: '2026-07-31',
    });

    expect(api.get).toHaveBeenCalledWith('/portal/stats/comparativo', {
      params: {
        metric_keys: 'investimento',
        period: 'biweekly',
        from: '2026-07-16',
        to: '2026-07-31',
      },
    });
    expect(result).toEqual(mockResponse);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:run -- portal-stats-service`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `portalStatsService`**

```ts
// src/common/services/portal/portal-stats-service.ts
import api from '@/src/common/config/api';
import type { PeriodComparisonQuery, PeriodComparisonResponse } from '@/src/common/@types/@portal-stats';

export const portalStatsService = {
  async getComparativo(query: PeriodComparisonQuery): Promise<PeriodComparisonResponse> {
    const response = await api.get<PeriodComparisonResponse>('/portal/stats/comparativo', {
      params: {
        metric_keys: query.metric_keys.join(','),
        period: query.period,
        from: query.from,
        to: query.to,
      },
    });
    return response.data;
  },
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:run -- portal-stats-service`
Expected: PASS

- [ ] **Step 6: Implement `usePeriodComparison`**

```ts
// src/common/hooks/portal/use-period-comparison.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalStatsService } from '@/src/common/services/portal/portal-stats-service';
import type { PeriodComparisonQuery } from '@/src/common/@types/@portal-stats';

export function usePeriodComparison(query: PeriodComparisonQuery) {
  return useQuery({
    queryKey: ['portal', 'stats', 'comparativo', query],
    queryFn: () => portalStatsService.getComparativo(query),
  });
}
```

- [ ] **Step 7: Build**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/common/@types/@portal-stats.ts src/common/services/portal/portal-stats-service.ts \
  src/common/services/portal/__tests__/portal-stats-service.test.ts \
  src/common/hooks/portal/use-period-comparison.ts
git commit -m "feat(portal): add usePeriodComparison hook (BLOCKED backend: /portal/stats/comparativo)

Master doc §4.1 lists the comparativo período-vs-período service as
not-yet-built on the backend. Ships the full client contract now so Tasks
10/11/27/28 aren't blocked on backend sequencing — swap the service URL
when the real endpoint lands."
```

---

### Task 10: Bloco Visão Geral / Home (§3.1)

**Files:**
- Create: `src/common/hooks/portal/use-portal-overview.ts`
- Modify: `src/common/services/portal/portal-stats-service.ts`
- Create: `src/components/portal/overview/kpi-cards.tsx`
- Create: `src/components/portal/overview/last-report-preview.tsx`
- Create: `src/app/portal/dashboard/page.tsx`
- Test: `src/components/portal/overview/__tests__/kpi-cards.test.tsx`

**Interfaces:**
- Consumes: `usePeriodComparison` (Task 9), `PortalLineChart` (Task 7), `MetricLabel` (Task 4), `VariationBadge` (Task 5), `PortalCardSkeleton`/`PortalEmptyState` (Task 6)
- Produces: `<PortalKpiCards metrics isLoading />`, `usePortalOverview()` — consumed by Task 13's mobile QA and Task 34 (PDF export target)

**BLOCKED (backend):** `GET /portal/overview` (daily conversas series, last-report preview, recent-activities preview) does not exist yet.

- [ ] **Step 1: Write the failing test for `<PortalKpiCards>`**

```tsx
// src/components/portal/overview/__tests__/kpi-cards.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortalKpiCards } from '../kpi-cards';
import type { MetricComparison } from '@/src/common/@types/@portal-stats';

const metrics: MetricComparison[] = [
  { metric_key: 'investimento', current_value: 1200, previous_value: 1000, variation_pct: 20 },
  { metric_key: 'conversas_iniciadas', current_value: 48, previous_value: 40, variation_pct: 20 },
  { metric_key: 'custo_por_conversa', current_value: 25, previous_value: 30, variation_pct: -16.7 },
];

describe('PortalKpiCards', () => {
  it('renders the 4 headline cards from master doc §3.1 with glossary labels and variation', () => {
    render(<PortalKpiCards metrics={metrics} />);
    expect(screen.getByText('Investimento')).toBeInTheDocument();
    expect(screen.getByText('Conversas iniciadas')).toBeInTheDocument();
    expect(screen.getByText('Custo por conversa')).toBeInTheDocument();
    expect(screen.getByText('+20%')).toBeInTheDocument();
  });

  it('shows skeletons while loading', () => {
    render(<PortalKpiCards metrics={[]} isLoading />);
    expect(screen.queryByText('Investimento')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- kpi-cards`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `<PortalKpiCards>`**

```tsx
// src/components/portal/overview/kpi-cards.tsx
import { Card } from '@/src/components/ui/card';
import { MetricLabel } from '@/src/components/portal/glossary/metric-label';
import { VariationBadge } from '@/src/components/portal/variation-badge';
import { PortalCardSkeleton } from '@/src/components/portal/skeletons';
import type { MetricComparison } from '@/src/common/@types/@portal-stats';
import type { GlossaryKey } from '@/src/common/lib/portal/glossary';

const COST_METRICS = new Set(['custo_por_conversa']);

function formatValue(metricKey: string, value: number): string {
  if (metricKey === 'investimento' || COST_METRICS.has(metricKey)) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return value.toLocaleString('pt-BR');
}

export function PortalKpiCards({ metrics, isLoading }: { metrics: MetricComparison[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <PortalCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.metric_key} className="space-y-1 p-4">
          <div className="text-sm text-muted-foreground">
            <MetricLabel metricKey={metric.metric_key as GlossaryKey} />
          </div>
          <p className="text-2xl font-semibold">{formatValue(metric.metric_key, metric.current_value)}</p>
          <VariationBadge value={metric.variation_pct} invertColor={COST_METRICS.has(metric.metric_key)} />
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- kpi-cards`
Expected: PASS (2 tests)

- [ ] **Step 5: Extend `portalStatsService` with `getOverview`**

```ts
// src/common/services/portal/portal-stats-service.ts — add to the existing object
import type {
  OverviewResponse,
  PeriodComparisonQuery,
  PeriodComparisonResponse,
} from '@/src/common/@types/@portal-stats';

// inside portalStatsService:
async getOverview(): Promise<OverviewResponse> {
  const response = await api.get<OverviewResponse>('/portal/overview');
  return response.data;
},
```

Add the matching type to `@portal-stats.ts`:

```ts
// src/common/@types/@portal-stats.ts — append
export interface DailySeriesPoint {
  date: string;
  conversas_iniciadas: number;
}

export interface OverviewResponse {
  headline_metrics: MetricComparison[]; // investimento, conversas_iniciadas, custo_por_conversa
  daily_conversas: DailySeriesPoint[]; // last 30 days
  last_report_preview: { id: string; title: string; excerpt: string; published_at: string } | null;
  recent_activities: { id: string; title: string; occurred_at: string }[]; // last 5
}
```

- [ ] **Step 6: Implement `usePortalOverview`**

```ts
// src/common/hooks/portal/use-portal-overview.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalStatsService } from '@/src/common/services/portal/portal-stats-service';

export function usePortalOverview() {
  return useQuery({
    queryKey: ['portal', 'overview'],
    queryFn: () => portalStatsService.getOverview(),
  });
}
```

- [ ] **Step 7: Implement `<LastReportPreview>`**

```tsx
// src/components/portal/overview/last-report-preview.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { PortalEmptyState } from '@/src/components/portal/empty-state';
import type { OverviewResponse } from '@/src/common/@types/@portal-stats';

export function LastReportPreview({ report }: { report: OverviewResponse['last_report_preview'] }) {
  if (!report) {
    return (
      <PortalEmptyState
        title="Nenhum resumo publicado ainda"
        description="A cada quinze dias a Reserve publica um resumo explicando os resultados — o primeiro aparece aqui."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{report.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{report.excerpt}</p>
        <Link href={`/portal/relatorios/${report.id}`} className="text-sm font-medium text-primary hover:underline">
          Ler resumo completo
        </Link>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 8: Assemble the page**

```tsx
// src/app/portal/dashboard/page.tsx
'use client';

import { usePortalOverview } from '@/src/common/hooks/portal/use-portal-overview';
import { PortalKpiCards } from '@/src/components/portal/overview/kpi-cards';
import { LastReportPreview } from '@/src/components/portal/overview/last-report-preview';
import { PortalLineChart } from '@/src/components/portal/charts/line-chart';
import { PortalChartSkeleton } from '@/src/components/portal/skeletons';

export default function PortalDashboardPage() {
  const { data, isLoading } = usePortalOverview();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Visão Geral</h1>

      <PortalKpiCards metrics={data?.headline_metrics ?? []} isLoading={isLoading} />

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Conversas por dia (últimos 30 dias)</h2>
        {isLoading ? (
          <PortalChartSkeleton />
        ) : (
          <PortalLineChart
            data={data?.daily_conversas ?? []}
            xKey="date"
            series={[{ key: 'conversas_iniciadas', label: 'Conversas iniciadas', color: '#0ea5e9' }]}
          />
        )}
      </section>

      {!isLoading && <LastReportPreview report={data?.last_report_preview ?? null} />}
    </div>
  );
}
```

Note: the activity-feed preview ("últimas 5") is deliberately deferred to Task 26, which builds the reusable `<ActivityFeed limit={5} />` also consumed here — this task lays out the slot but the component is wired in once Task 26 lands, to avoid building the same list twice.

- [ ] **Step 9: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/common/hooks/portal/use-portal-overview.ts src/common/services/portal/portal-stats-service.ts \
  src/common/@types/@portal-stats.ts src/components/portal/overview/ src/app/portal/dashboard/page.tsx
git commit -m "feat(portal): build Visão Geral home (§3.1) — 4 KPI cards, 30-day chart, last-report preview

BLOCKED on backend: GET /portal/overview does not exist yet."
```

---

### Task 11: Bloco Tráfego Pago (§3.2)

**Files:**
- Create: `src/common/@types/@portal-traffic.ts`
- Create: `src/common/services/portal/portal-traffic-service.ts`
- Create: `src/common/hooks/portal/use-portal-traffic.ts`
- Create: `src/components/portal/traffic/traffic-metrics.tsx`
- Create: `src/components/portal/traffic/campaign-table.tsx`
- Create: `src/app/portal/trafego/page.tsx`
- Test: `src/components/portal/traffic/__tests__/campaign-table.test.tsx`

**Interfaces:**
- Consumes: `PortalDataTable` (Task 8), `PortalLineChart`/`PortalBarChart` (Task 7), `MetricLabel` (Task 4)
- Produces: `usePortalTraffic(params)`, `<CampaignTable campaigns />` — the campaign table columns are extended in Task 15 (Fase 2 attribution) and Task 36 (Fase 6 Google Ads)

**BLOCKED (backend):** `GET /portal/traffic` — Meta Ads sync already exists per master doc §4.1 ("JÁ EXISTE"), but no client-scoped read endpoint exists yet. Google Ads columns are out of scope here (master doc places Google Ads in Fase 6, see Task 36) — build only the Meta Ads columns from §3.2's table now.

- [ ] **Step 1: Write `@portal-traffic.ts` types**

Field names match master doc §3.2's table exactly (`spend`, `reach`, `impressions`, `clicks`, `cpl`, `frequency`).

```ts
// src/common/@types/@portal-traffic.ts
export interface TrafficQuery {
  from: string;
  to: string;
}

export interface DailyTrafficPoint {
  date: string;
  investimento: number;
  conversas_iniciadas: number;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  cpl: number;
  frequency: number;
}

export interface TrafficResponse {
  headline_metrics: {
    investimento: number;
    pessoas_alcancadas: number;
    visualizacoes: number;
    conversas_iniciadas: number;
    custo_por_conversa: number;
    frequencia: number;
  };
  daily: DailyTrafficPoint[];
  biweekly_comparison: { period_label: string; investimento: number; conversas_iniciadas: number }[];
  campaigns: CampaignPerformance[];
}
```

- [ ] **Step 2: Implement `portalTrafficService`**

```ts
// src/common/services/portal/portal-traffic-service.ts
import api from '@/src/common/config/api';
import type { TrafficQuery, TrafficResponse } from '@/src/common/@types/@portal-traffic';

export const portalTrafficService = {
  async getTraffic(query: TrafficQuery): Promise<TrafficResponse> {
    const response = await api.get<TrafficResponse>('/portal/traffic', { params: query });
    return response.data;
  },
};
```

- [ ] **Step 3: Implement `usePortalTraffic`**

```ts
// src/common/hooks/portal/use-portal-traffic.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalTrafficService } from '@/src/common/services/portal/portal-traffic-service';
import type { TrafficQuery } from '@/src/common/@types/@portal-traffic';

export function usePortalTraffic(query: TrafficQuery) {
  return useQuery({
    queryKey: ['portal', 'traffic', query],
    queryFn: () => portalTrafficService.getTraffic(query),
  });
}
```

- [ ] **Step 4: Write the failing test for `<CampaignTable>`**

```tsx
// src/components/portal/traffic/__tests__/campaign-table.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CampaignTable } from '../campaign-table';
import type { CampaignPerformance } from '@/src/common/@types/@portal-traffic';

const campaigns: CampaignPerformance[] = [
  { id: 'c1', name: 'Verão 2026', spend: 850, reach: 12000, impressions: 30000, clicks: 120, cpl: 7.08, frequency: 2.5 },
];

describe('CampaignTable', () => {
  it('renders one row per campaign with investimento and custo por conversa', () => {
    render(<CampaignTable campaigns={campaigns} forceMobile={false} />);
    expect(screen.getByText('Verão 2026')).toBeInTheDocument();
    expect(screen.getByText(/850/)).toBeInTheDocument();
  });

  it('shows an empty state when there are no campaigns', () => {
    render(<CampaignTable campaigns={[]} forceMobile={false} />);
    expect(screen.getByText(/nenhuma campanha/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- campaign-table`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<CampaignTable>`**

```tsx
// src/components/portal/traffic/campaign-table.tsx
import { PortalDataTable, type PortalDataTableColumn } from '@/src/components/portal/data-table';
import { PortalEmptyState } from '@/src/components/portal/empty-state';
import type { CampaignPerformance } from '@/src/common/@types/@portal-traffic';

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: PortalDataTableColumn<CampaignPerformance>[] = [
  { key: 'name', header: 'Campanha', render: (c) => c.name },
  { key: 'spend', header: 'Investimento', render: (c) => currency(c.spend) },
  { key: 'clicks', header: 'Conversas iniciadas', render: (c) => c.clicks.toLocaleString('pt-BR') },
  { key: 'cpl', header: 'Custo por conversa', render: (c) => currency(c.cpl) },
];

export function CampaignTable({ campaigns, forceMobile }: { campaigns: CampaignPerformance[]; forceMobile?: boolean }) {
  if (campaigns.length === 0) {
    return (
      <PortalEmptyState
        title="Nenhuma campanha no período"
        description="Assim que houver investimento em anúncios nessas datas, o desempenho por campanha aparece aqui."
      />
    );
  }

  return <PortalDataTable columns={columns} rows={campaigns} getRowKey={(c) => c.id} forceMobile={forceMobile} />;
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- campaign-table`
Expected: PASS (2 tests)

- [ ] **Step 8: Implement `<TrafficMetrics>`** (the 6-metric grid from §3.2's table, each through `<MetricLabel>`)

```tsx
// src/components/portal/traffic/traffic-metrics.tsx
import { Card } from '@/src/components/ui/card';
import { MetricLabel } from '@/src/components/portal/glossary/metric-label';
import type { TrafficResponse } from '@/src/common/@types/@portal-traffic';
import type { GlossaryKey } from '@/src/common/lib/portal/glossary';

const ROWS: { key: GlossaryKey; format: (v: number) => string }[] = [
  { key: 'investimento', format: (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { key: 'pessoas_alcancadas', format: (v) => v.toLocaleString('pt-BR') },
  { key: 'visualizacoes', format: (v) => v.toLocaleString('pt-BR') },
  { key: 'conversas_iniciadas', format: (v) => v.toLocaleString('pt-BR') },
  { key: 'custo_por_conversa', format: (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { key: 'frequencia', format: (v) => v.toFixed(1) },
];

export function TrafficMetrics({ metrics }: { metrics: TrafficResponse['headline_metrics'] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {ROWS.map((row) => (
        <Card key={row.key} className="space-y-1 p-4">
          <div className="text-sm text-muted-foreground">
            <MetricLabel metricKey={row.key} />
          </div>
          <p className="text-xl font-semibold">{row.format(metrics[row.key])}</p>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 9: Assemble the page**

```tsx
// src/app/portal/trafego/page.tsx
'use client';

import { useState } from 'react';
import { usePortalTraffic } from '@/src/common/hooks/portal/use-portal-traffic';
import { TrafficMetrics } from '@/src/components/portal/traffic/traffic-metrics';
import { CampaignTable } from '@/src/components/portal/traffic/campaign-table';
import { PortalLineChart } from '@/src/components/portal/charts/line-chart';
import { PortalBarChart } from '@/src/components/portal/charts/bar-chart';
import { PortalChartSkeleton } from '@/src/components/portal/skeletons';

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function PortalTrafegoPage() {
  const [range] = useState(defaultRange);
  const { data, isLoading } = usePortalTraffic(range);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Tráfego Pago</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <PortalChartSkeleton key={i} />)}
        </div>
      ) : (
        <TrafficMetrics metrics={data!.headline_metrics} />
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Investimento vs. conversas por dia</h2>
        <PortalLineChart
          data={data?.daily ?? []}
          xKey="date"
          isLoading={isLoading}
          series={[
            { key: 'investimento', label: 'Investimento', color: '#0ea5e9' },
            { key: 'conversas_iniciadas', label: 'Conversas iniciadas', color: '#22c55e' },
          ]}
        />
      </section>

      <section className="hidden md:block">
        {/* master doc §4.3: max 1 chart per mobile viewport — the biweekly comparison bar
            chart is desktop-only on this page; the daily line chart above is the mobile chart. */}
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Comparativo quinzenal</h2>
        <PortalBarChart
          data={data?.biweekly_comparison ?? []}
          xKey="period_label"
          isLoading={isLoading}
          series={[{ key: 'investimento', label: 'Investimento', color: '#0ea5e9' }]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Desempenho por campanha</h2>
        <CampaignTable campaigns={data?.campaigns ?? []} />
      </section>
    </div>
  );
}
```

- [ ] **Step 10: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/common/@types/@portal-traffic.ts src/common/services/portal/portal-traffic-service.ts \
  src/common/hooks/portal/use-portal-traffic.ts src/components/portal/traffic/ src/app/portal/trafego/page.tsx
git commit -m "feat(portal): build Tráfego Pago block (§3.2) — Meta Ads metrics, daily/biweekly charts, campaign table

Google Ads columns deferred to Task 36 (Fase 6) per master doc §8.
BLOCKED on backend: GET /portal/traffic does not exist yet."
```

---

### Task 12: Bloco Leads — Camada 1 (§3.3, links rastreáveis)

**Files:**
- Create: `src/common/@types/@portal-leads.ts`
- Create: `src/common/services/portal/portal-leads-service.ts`
- Create: `src/common/hooks/portal/use-portal-leads.ts`
- Create: `src/components/portal/funnel/acquisition-funnel.tsx`
- Create: `src/components/portal/leads/breakdown-table.tsx`
- Create: `src/app/portal/leads/page.tsx`
- Test: `src/components/portal/funnel/__tests__/acquisition-funnel.test.tsx`

**Interfaces:**
- Consumes: `PortalDataTable` (Task 8), `PortalBarChart` (Task 7)
- Produces: `usePortalLeadsCamada1(params)`, `<AcquisitionFunnel stages fronteiraIndex? />` — the funnel component is extended in Task 20 (Fase 3) to add the QUALIFICADO/PAGAMENTO/FECHADO stages once bot data exists; this task renders only the Camada 1 stages (Alcance → Cliques → Conversas)

**BLOCKED (backend):** master doc §4.1 lists trackable WhatsApp links (clicks, geo, device, 30-day stats) as **already existing** — but as a client-scoped read endpoint, not yet (today it's only reachable through the admin's `hotel-portal-service.ts` with `x-skip-tenant` headers, see plan Assumption 4). This task's type shapes deliberately mirror `WhatsAppLinkStats` from `@hotel-portal.ts` (`by_day`, device/geo breakdown) so the eventual backend reuse is a rename, not a redesign.

- [ ] **Step 1: Write `@portal-leads.ts` types**

```ts
// src/common/@types/@portal-leads.ts
export interface LeadsCamada1Query {
  from: string;
  to: string;
}

export interface LeadsByDayPoint {
  date: string;
  cliques: number;
  conversas: number;
  leads: number;
}

export interface LeadsByDevice {
  device: 'mobile' | 'desktop' | 'tablet';
  count: number;
}

export interface LeadsByCity {
  city: string;
  count: number;
}

export interface LeadsCamada1Response {
  totals: { cliques: number; conversas: number; leads: number };
  by_day: LeadsByDayPoint[];
  by_device: LeadsByDevice[];
  by_city: LeadsByCity[];
}

export type FunnelStageKey = 'alcance' | 'cliques' | 'conversas' | 'qualificados' | 'prontos' | 'reservas';

export interface FunnelStage {
  key: FunnelStageKey;
  label: string;
  value: number;
  /** true marks this as the last stage owned by the Reserve side — master doc §3.3 "fronteira" */
  isFronteira?: boolean;
}
```

- [ ] **Step 2: Implement `portalLeadsService`**

```ts
// src/common/services/portal/portal-leads-service.ts
import api from '@/src/common/config/api';
import type { LeadsCamada1Query, LeadsCamada1Response } from '@/src/common/@types/@portal-leads';

export const portalLeadsService = {
  async getCamada1(query: LeadsCamada1Query): Promise<LeadsCamada1Response> {
    const response = await api.get<LeadsCamada1Response>('/portal/leads/camada-1', { params: query });
    return response.data;
  },
};
```

- [ ] **Step 3: Implement `usePortalLeadsCamada1`**

```ts
// src/common/hooks/portal/use-portal-leads.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalLeadsService } from '@/src/common/services/portal/portal-leads-service';
import type { LeadsCamada1Query } from '@/src/common/@types/@portal-leads';

export function usePortalLeadsCamada1(query: LeadsCamada1Query) {
  return useQuery({
    queryKey: ['portal', 'leads', 'camada-1', query],
    queryFn: () => portalLeadsService.getCamada1(query),
  });
}
```

- [ ] **Step 4: Write the failing test for `<AcquisitionFunnel>`**

```tsx
// src/components/portal/funnel/__tests__/acquisition-funnel.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AcquisitionFunnel } from '../acquisition-funnel';
import type { FunnelStage } from '@/src/common/@types/@portal-leads';

const camada1Stages: FunnelStage[] = [
  { key: 'alcance', label: 'Alcance', value: 12000 },
  { key: 'cliques', label: 'Cliques', value: 850 },
  { key: 'conversas', label: 'Conversas', value: 210, isFronteira: false },
];

describe('AcquisitionFunnel', () => {
  it('renders every stage with its value', () => {
    render(<AcquisitionFunnel stages={camada1Stages} />);
    expect(screen.getByText('Alcance')).toBeInTheDocument();
    expect(screen.getByText('12.000')).toBeInTheDocument();
    expect(screen.getByText('Conversas')).toBeInTheDocument();
  });

  it('draws the fronteira line after the stage marked isFronteira', () => {
    const stages: FunnelStage[] = [
      ...camada1Stages,
      { key: 'prontos', label: 'Prontos para fechar', value: 30, isFronteira: true },
      { key: 'reservas', label: 'Reservas', value: 18 },
    ];
    render(<AcquisitionFunnel stages={stages} />);
    expect(screen.getByTestId('fronteira-line')).toBeInTheDocument();
  });

  it('does not render a fronteira line when no stage is marked', () => {
    render(<AcquisitionFunnel stages={camada1Stages} />);
    expect(screen.queryByTestId('fronteira-line')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- acquisition-funnel`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<AcquisitionFunnel>`**

Desktop renders stages as a horizontal row of decreasing-width bars; mobile stacks them vertically (§4.3 principle 1). The fronteira line (master doc §3.3: "a linha da fronteira é desenhada explicitamente") renders as a labeled divider right after the stage flagged `isFronteira`.

```tsx
// src/components/portal/funnel/acquisition-funnel.tsx
import { cn } from '@/src/common/lib/utils';
import type { FunnelStage } from '@/src/common/@types/@portal-leads';

export function AcquisitionFunnel({ stages }: { stages: FunnelStage[] }) {
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-3">
      {stages.map((stage) => {
        const widthPct = Math.max((stage.value / maxValue) * 100, 12);
        return (
          <div key={stage.key} className="flex flex-col gap-1">
            <div
              className="flex h-10 items-center rounded-md bg-primary/10 px-3 md:h-24 md:items-end md:justify-center md:pb-2"
              style={{ width: `${widthPct}%`, minWidth: '6rem' }}
            >
              <span className="font-semibold">{stage.value.toLocaleString('pt-BR')}</span>
            </div>
            <span className="text-xs text-muted-foreground">{stage.label}</span>
            {stage.isFronteira && (
              <div
                data-testid="fronteira-line"
                className="my-1 flex items-center gap-2 text-xs font-medium text-amber-600 md:absolute md:my-0"
              >
                <span className="h-px flex-1 bg-amber-500" />
                fronteira Reserve / hotel
                <span className="h-px flex-1 bg-amber-500" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- acquisition-funnel`
Expected: PASS (3 tests)

- [ ] **Step 8: Implement `<BreakdownTable>`** (device/city breakdown, §3.3 "Breakdown: por dia, por dispositivo, por cidade/região")

```tsx
// src/components/portal/leads/breakdown-table.tsx
import { PortalDataTable, type PortalDataTableColumn } from '@/src/components/portal/data-table';
import type { LeadsByDevice, LeadsByCity } from '@/src/common/@types/@portal-leads';

const deviceLabels: Record<LeadsByDevice['device'], string> = {
  mobile: 'Celular',
  desktop: 'Computador',
  tablet: 'Tablet',
};

const deviceColumns: PortalDataTableColumn<LeadsByDevice>[] = [
  { key: 'device', header: 'Dispositivo', render: (r) => deviceLabels[r.device] },
  { key: 'count', header: 'Conversas', render: (r) => r.count.toLocaleString('pt-BR') },
];

const cityColumns: PortalDataTableColumn<LeadsByCity>[] = [
  { key: 'city', header: 'Cidade', render: (r) => r.city },
  { key: 'count', header: 'Conversas', render: (r) => r.count.toLocaleString('pt-BR') },
];

export function DeviceBreakdownTable({ rows }: { rows: LeadsByDevice[] }) {
  return <PortalDataTable columns={deviceColumns} rows={rows} getRowKey={(r) => r.device} />;
}

export function CityBreakdownTable({ rows }: { rows: LeadsByCity[] }) {
  return <PortalDataTable columns={cityColumns} rows={rows} getRowKey={(r) => r.city} />;
}
```

- [ ] **Step 9: Assemble the page**

```tsx
// src/app/portal/leads/page.tsx
'use client';

import { useState } from 'react';
import { usePortalLeadsCamada1 } from '@/src/common/hooks/portal/use-portal-leads';
import { AcquisitionFunnel } from '@/src/components/portal/funnel/acquisition-funnel';
import { DeviceBreakdownTable, CityBreakdownTable } from '@/src/components/portal/leads/breakdown-table';
import type { FunnelStage } from '@/src/common/@types/@portal-leads';

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function PortalLeadsPage() {
  const [range] = useState(defaultRange);
  const { data, isLoading } = usePortalLeadsCamada1(range);

  const stages: FunnelStage[] = data
    ? [
        { key: 'cliques', label: 'Cliques', value: data.totals.cliques },
        { key: 'conversas', label: 'Conversas iniciadas', value: data.totals.conversas },
        { key: 'reservas', label: 'Leads gerados', value: data.totals.leads },
      ]
    : [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Leads e Funil</h1>
      <p className="text-sm text-muted-foreground">
        Camada 1 — o dado que a Reserve garante hoje: cliques nos links rastreáveis até leads gerados. O funil
        completo do atendimento (qualificados, prontos para fechar) aparece aqui quando o bot estiver ativo.
      </p>

      {!isLoading && <AcquisitionFunnel stages={stages} />}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Por dispositivo</h2>
          <DeviceBreakdownTable rows={data?.by_device ?? []} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Por cidade</h2>
          <CityBreakdownTable rows={data?.by_city ?? []} />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 10: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/common/@types/@portal-leads.ts src/common/services/portal/portal-leads-service.ts \
  src/common/hooks/portal/use-portal-leads.ts src/components/portal/funnel/ \
  src/components/portal/leads/breakdown-table.tsx src/app/portal/leads/page.tsx
git commit -m "feat(portal): build Leads e Funil, Camada 1 (§3.3) — cliques/conversas/leads funnel + device/city breakdown

Types mirror WhatsAppLinkStats from @hotel-portal.ts (plan Assumption 4) so
future backend reuse is a rename, not a redesign. BLOCKED on backend:
GET /portal/leads/camada-1 (client-scoped) does not exist yet."
```

---

### Task 13: Mobile QA pass — Fase 1 routes at 375px

**Files:**
- Create: `src/app/portal/__tests__/mobile-viewport.test.tsx`

**Interfaces:**
- Consumes: `PortalDashboardPage`, `PortalTrafegoPage`, `PortalLeadsPage` (Tasks 10–12), `PortalNav` (Task 2)
- Produces: nothing new — this is the explicit checkpoint for master doc §8's Fase 1 "critério de pronto": *"Pousada Dona Tereza loga e vê investimento, conversas e variação quinzenal no celular."*

- [ ] **Step 1: Write the failing test asserting no horizontal overflow at 375px**

Uses `QueryClientProvider` with mocked data (matching the response shapes from Tasks 10–12) rendered at a 375px viewport, and asserts every rendered block avoids `overflow-x` by checking that `PortalDataTable` renders cards (not `role="table"`) and that at most one `role="figure"` chart is visible per screen section.

```tsx
// src/app/portal/__tests__/mobile-viewport.test.tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PortalTrafegoPage from '../trafego/page';
import { portalTrafficService } from '@/src/common/services/portal/portal-traffic-service';

vi.mock('next/navigation', () => ({ usePathname: () => '/portal/trafego' }));

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

function renderWithQueryClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Portal mobile viewport (375px) — Fase 1 routes', () => {
  beforeEach(() => {
    setViewportWidth(375);
    vi.spyOn(portalTrafficService, 'getTraffic').mockResolvedValue({
      headline_metrics: {
        investimento: 1200,
        pessoas_alcancadas: 12000,
        visualizacoes: 30000,
        conversas_iniciadas: 48,
        custo_por_conversa: 25,
        frequencia: 2.5,
      },
      daily: [{ date: '01/08', investimento: 100, conversas_iniciadas: 4 }],
      biweekly_comparison: [{ period_label: '1ª quinzena', investimento: 600, conversas_iniciadas: 24 }],
      campaigns: [{ id: 'c1', name: 'Verão 2026', spend: 850, reach: 12000, impressions: 30000, clicks: 120, cpl: 7.08, frequency: 2.5 }],
    });
  });

  it('renders the campaign table as stacked cards, not an HTML table, at 375px', async () => {
    renderWithQueryClient(<PortalTrafegoPage />);
    expect(await screen.findByText('Verão 2026')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('hides the desktop-only biweekly bar chart section at 375px (max 1 chart per mobile viewport)', async () => {
    renderWithQueryClient(<PortalTrafegoPage />);
    await screen.findByText('Verão 2026');
    // the desktop-only section uses `hidden md:block`; jsdom doesn't compute layout,
    // so this asserts the section carries that class rather than checking visibility directly.
    const heading = screen.getByText('Comparativo quinzenal');
    expect(heading.closest('section')).toHaveClass('hidden');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- mobile-viewport`
Expected: FAIL initially if any Task 10–12 page doesn't yet mark its secondary chart `hidden md:block`, or if `CampaignTable`'s `forceMobile` wiring wasn't threaded through `PortalTrafegoPage`. If it fails for that reason, fix the page (do not weaken the test) — go back to Task 11 Step 9 and pass `forceMobile` through, or rely on the `useMediaQuery` viewport already set in `beforeEach`.

- [ ] **Step 3: Fix any failures found**

If `PortalDataTable` still renders a `<table>` at 375px, confirm `use-media-query.ts`'s resize listener fired (the test's `setViewportWidth` dispatches `resize` in `beforeEach`, which runs before render — if the assertion still fails, move `setViewportWidth(375)` to run again after `render()` inside the `it` block, since the hook's initial state is computed at mount time and the `beforeEach` viewport change may race component initialization order across test files).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- mobile-viewport`
Expected: PASS (2 tests)

- [ ] **Step 5: Manual smoke check (documented, not automated)**

Run the dev server and resize the browser to 375×667 (iPhone SE) for `/portal/dashboard`, `/portal/trafego`, `/portal/leads`:

```bash
npm run dev
```

Checklist (record result in the commit body, not just "looks fine"):
- [ ] No horizontal scrollbar on any of the 3 routes
- [ ] At most 1 chart visible without scrolling on each route
- [ ] `PortalNav`'s 11-icon bottom bar is legible and tappable (44px+ touch target) — if not, this is the moment to raise the nav-density flag noted in Task 2 to design, not to silently rework it here
- [ ] Every KPI card shows a `<VariationBadge>` next to it

- [ ] **Step 6: Commit**

```bash
git add src/app/portal/__tests__/mobile-viewport.test.tsx
git commit -m "test(portal): add 375px mobile QA pass for Fase 1 routes

Closes master doc §8 Fase 1's critério de pronto: dashboard, tráfego and
leads all render without horizontal scroll and respect the 1-chart-per-
mobile-viewport rule. Manual 375x667 smoke checklist recorded in this
commit body: [fill in after running Step 5]."
```

**Fase 1 complete.** Deploy to `portal.reservemkt.com.br` (master doc §8's last Fase 1 item) is explicitly out of scope for this plan — it is an ops/DNS/hosting decision (Assumption 8), not a frontend code task.

---

## Fase 2 — Rastreamento ponta a ponta

Mirrors master doc §8 Fase 2. Most of this phase is backend (persisting `ctwa_clid`/`source_id` in the bot's workflow 1, the short-code link redirect, `atribuicao_conversa`/`attribution_settings` tables) — entirely out of scope here. The two frontend-visible outcomes are the campaign table gaining conversion/qualification columns and a click→conversation rate view, both gated by an always-visible attribution window banner (master doc §3.9 "Regras inegociáveis": "Atribuição declarada. Janela explícita e visível no painel").

### Task 14: `<AttributionWindowBanner>`

**Files:**
- Create: `src/common/@types/@portal-attribution.ts`
- Create: `src/components/portal/attribution-window-banner.tsx`
- Test: `src/components/portal/__tests__/attribution-window-banner.test.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `AttributionSettings` type, `<AttributionWindowBanner windowDays />` — consumed by Task 15 (campaign table), Task 27/28 (ROI blocks)

**BLOCKED (backend):** `attribution_settings` table (master doc §4.2) and its read endpoint don't exist. This component takes `windowDays` as a plain prop so it renders correctly the moment any consumer has a value, decoupling this task from the backend timeline entirely.

- [ ] **Step 1: Write `@portal-attribution.ts` types**

```ts
// src/common/@types/@portal-attribution.ts
export interface AttributionSettings {
  window_days: number;
  source_priority: 'ultimo_toque' | 'primeiro_toque';
}
```

- [ ] **Step 2: Write the failing test**

```tsx
// src/components/portal/__tests__/attribution-window-banner.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttributionWindowBanner } from '../attribution-window-banner';

describe('AttributionWindowBanner', () => {
  it('states the attribution window in plain language', () => {
    render(<AttributionWindowBanner windowDays={30} />);
    expect(screen.getByText(/em até 30 dias/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:run -- attribution-window-banner`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `<AttributionWindowBanner>`**

Copy follows master doc §3.9's own example phrasing ("reservas de leads originados em até 30 dias") and §4.3 principle 6 (no jargon — "último toque" is explained, not left as a raw label).

```tsx
// src/components/portal/attribution-window-banner.tsx
import { Info } from 'lucide-react';

export function AttributionWindowBanner({ windowDays }: { windowDays: number }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Os números desta seção contam conversas e reservas originadas em até {windowDays} dias após o
        clique no anúncio ou link — essa é a janela de atribuição usada em todo o painel.
      </span>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:run -- attribution-window-banner`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/common/@types/@portal-attribution.ts src/components/portal/attribution-window-banner.tsx \
  src/components/portal/__tests__/attribution-window-banner.test.tsx
git commit -m "feat(portal): add AttributionWindowBanner (BLOCKED backend: attribution_settings)

Implements master doc §3.9's inegociável rule that the attribution window
must always be visible wherever attribution-derived numbers appear."
```

---

### Task 15: Extend Tráfego campaign table with conversas/qualificados per anúncio

**Files:**
- Modify: `src/common/@types/@portal-traffic.ts`
- Modify: `src/components/portal/traffic/campaign-table.tsx`
- Modify: `src/app/portal/trafego/page.tsx`
- Modify: `src/components/portal/traffic/__tests__/campaign-table.test.tsx`

**Interfaces:**
- Consumes: `AttributionWindowBanner` (Task 14)
- Produces: `CampaignPerformance` gains `conversas_atribuidas`/`qualificados_atribuidos` — consumed by Task 27/28 (ROI per campanha)

**BLOCKED (backend):** requires the `source_id` join described in master doc §6 (not yet built — see §6.1 "mudança necessária no workflow 1"). Columns render `—` (em dash) via a null-safe formatter until the backend joins the data, rather than hiding the columns outright, so the UI shape is proven before the data exists.

- [ ] **Step 1: Extend the type**

```ts
// src/common/@types/@portal-traffic.ts — modify CampaignPerformance
export interface CampaignPerformance {
  id: string;
  name: string;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  cpl: number;
  frequency: number;
  /** null until master doc §6's source_id attribution join lands on the backend */
  conversas_atribuidas: number | null;
  qualificados_atribuidos: number | null;
}
```

- [ ] **Step 2: Update the failing test to cover the new columns**

```tsx
// src/components/portal/traffic/__tests__/campaign-table.test.tsx — replace the campaigns fixture and add a case
const campaigns: CampaignPerformance[] = [
  {
    id: 'c1', name: 'Verão 2026', spend: 850, reach: 12000, impressions: 30000, clicks: 120, cpl: 7.08,
    frequency: 2.5, conversas_atribuidas: 47, qualificados_atribuidos: 12,
  },
];

// new test case:
it('renders an em dash when attribution data is not yet available', () => {
  const pending: CampaignPerformance = { ...campaigns[0], conversas_atribuidas: null, qualificados_atribuidos: null };
  render(<CampaignTable campaigns={[pending]} forceMobile={false} />);
  expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:run -- campaign-table`
Expected: FAIL — new columns not rendered yet.

- [ ] **Step 4: Add the columns**

```tsx
// src/components/portal/traffic/campaign-table.tsx — add to `columns`
const formatAttributed = (v: number | null) => (v === null ? '—' : v.toLocaleString('pt-BR'));

// append to the columns array:
{ key: 'conversas_atribuidas', header: 'Conversas geradas', render: (c) => formatAttributed(c.conversas_atribuidas) },
{ key: 'qualificados_atribuidos', header: 'Leads qualificados', render: (c) => formatAttributed(c.qualificados_atribuidos) },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:run -- campaign-table`
Expected: PASS

- [ ] **Step 6: Add the attribution banner above the campaign section on `/portal/trafego`**

```tsx
// src/app/portal/trafego/page.tsx — inside the "Desempenho por campanha" section, before <CampaignTable>
<AttributionWindowBanner windowDays={30} />
```

(30 is a placeholder default per master doc §4.2's `attribution_settings.window_days default 30` — swap to the real per-tenant value once Task 14's BLOCKED endpoint lands.)

- [ ] **Step 7: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/common/@types/@portal-traffic.ts src/components/portal/traffic/ src/app/portal/trafego/page.tsx
git commit -m "feat(portal): add per-campaign conversas/qualificados columns (§6 attribution)

Nulls render as em dash until the backend's source_id join lands (master
doc §6.1) — proves the UI shape without waiting on the backend."
```

---

### Task 16: Leads block — taxa de conversão clique → conversa por link

**Files:**
- Modify: `src/common/@types/@portal-leads.ts`
- Modify: `src/common/services/portal/portal-leads-service.ts`
- Create: `src/common/hooks/portal/use-link-conversion-rate.ts`
- Create: `src/components/portal/leads/link-conversion-table.tsx`
- Modify: `src/app/portal/leads/page.tsx`
- Test: `src/components/portal/leads/__tests__/link-conversion-table.test.tsx`

**Interfaces:**
- Consumes: `PortalDataTable` (Task 8)
- Produces: `useLinkConversionRate(params)`, `<LinkConversionTable rows />`

**BLOCKED (backend):** requires master doc §6.2's short-code-in-first-message mechanism (`link_code` extraction) — not built yet.

- [ ] **Step 1: Extend `@portal-leads.ts`**

```ts
// src/common/@types/@portal-leads.ts — append
export interface LinkConversionRow {
  link_code: string;
  label: string;
  clicks: number;
  conversations: number;
  conversion_rate_pct: number;
}
```

- [ ] **Step 2: Extend `portalLeadsService`**

```ts
// src/common/services/portal/portal-leads-service.ts — add to the exported object
async getLinkConversionRates(query: LeadsCamada1Query): Promise<LinkConversionRow[]> {
  const response = await api.get<LinkConversionRow[]>('/portal/leads/link-conversion-rate', { params: query });
  return response.data;
},
```

(Add the matching import: `import type { LeadsCamada1Query, LeadsCamada1Response, LinkConversionRow } from '@/src/common/@types/@portal-leads';`)

- [ ] **Step 3: Implement `useLinkConversionRate`**

```ts
// src/common/hooks/portal/use-link-conversion-rate.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalLeadsService } from '@/src/common/services/portal/portal-leads-service';
import type { LeadsCamada1Query } from '@/src/common/@types/@portal-leads';

export function useLinkConversionRate(query: LeadsCamada1Query) {
  return useQuery({
    queryKey: ['portal', 'leads', 'link-conversion-rate', query],
    queryFn: () => portalLeadsService.getLinkConversionRates(query),
  });
}
```

- [ ] **Step 4: Write the failing test**

```tsx
// src/components/portal/leads/__tests__/link-conversion-table.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinkConversionTable } from '../link-conversion-table';
import type { LinkConversionRow } from '@/src/common/@types/@portal-leads';

const rows: LinkConversionRow[] = [
  { link_code: 'AbCd3xYz', label: 'Link do site', clicks: 200, conversations: 140, conversion_rate_pct: 70 },
];

describe('LinkConversionTable', () => {
  it('renders the conversion rate per link', () => {
    render(<LinkConversionTable rows={rows} />);
    expect(screen.getByText('Link do site')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- link-conversion-table`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<LinkConversionTable>`**

```tsx
// src/components/portal/leads/link-conversion-table.tsx
import { PortalDataTable, type PortalDataTableColumn } from '@/src/components/portal/data-table';
import type { LinkConversionRow } from '@/src/common/@types/@portal-leads';

const columns: PortalDataTableColumn<LinkConversionRow>[] = [
  { key: 'label', header: 'Link', render: (r) => r.label },
  { key: 'clicks', header: 'Cliques', render: (r) => r.clicks.toLocaleString('pt-BR') },
  { key: 'conversations', header: 'Conversas', render: (r) => r.conversations.toLocaleString('pt-BR') },
  { key: 'conversion_rate_pct', header: 'Taxa de conversão', render: (r) => `${r.conversion_rate_pct}%` },
];

export function LinkConversionTable({ rows }: { rows: LinkConversionRow[] }) {
  return <PortalDataTable columns={columns} rows={rows} getRowKey={(r) => r.link_code} />;
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- link-conversion-table`
Expected: PASS

- [ ] **Step 8: Wire into `/portal/leads`**

```tsx
// src/app/portal/leads/page.tsx — add below the device/city breakdown section
import { useLinkConversionRate } from '@/src/common/hooks/portal/use-link-conversion-rate';
import { LinkConversionTable } from '@/src/components/portal/leads/link-conversion-table';

// inside the component:
const { data: linkRates } = useLinkConversionRate(range);

// in the JSX, new section:
<section>
  <h2 className="mb-2 text-sm font-medium text-muted-foreground">Taxa de conversão por link</h2>
  <LinkConversionTable rows={linkRates ?? []} />
</section>
```

- [ ] **Step 9: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/common/@types/@portal-leads.ts src/common/services/portal/portal-leads-service.ts \
  src/common/hooks/portal/use-link-conversion-rate.ts src/components/portal/leads/link-conversion-table.tsx \
  src/app/portal/leads/page.tsx
git commit -m "feat(portal): add click-to-conversation rate per trackable link (§6.2)

BLOCKED on backend: requires the link_code-in-first-message mechanism
from master doc §6.2, not yet built."
```

**Fase 2 complete.**

---

## Fase 3 — Módulo de automação de atendimento WhatsApp

Mirrors master doc §8 Fase 3 / §5. All of it is BLOCKED on the backend's `POST /api/ingest/bot-events` ingestion API, the N8N event nodes, and the `funil_eventos` table (master doc §5.6) — none of that is built yet and none of it is this plan's job. Every task below builds the full client-scoped UI against documented fixtures so it is ready the moment those land.

### Task 17: Bloco Canais (§5.2)

**Files:**
- Create: `src/common/@types/@portal-attendance.ts`
- Create: `src/common/services/portal/portal-attendance-service.ts`
- Create: `src/common/hooks/portal/use-portal-channels.ts`
- Create: `src/components/portal/attendance/channel-status-card.tsx`
- Create: `src/app/portal/atendimento/page.tsx`
- Test: `src/components/portal/attendance/__tests__/channel-status-card.test.tsx`

**Interfaces:**
- Consumes: `Card` (shadcn), `PortalEmptyState`/`PortalCardSkeleton` (Task 6)
- Produces: `ChannelStatus` type, `usePortalChannels()`, `<ChannelStatusCard channel />` — consumed by Task 18–20 (same `/portal/atendimento` page, different sections) and Task 37 (tour)

**BLOCKED (backend):** `GET /portal/attendance/channels` — reads `config.bot_global`, `heartbeat`, token status per master doc §5.2/§5.6. Does not exist.

- [ ] **Step 1: Write `@portal-attendance.ts` types (channels slice)**

```ts
// src/common/@types/@portal-attendance.ts
export type ChannelKind = 'whatsapp' | 'instagram' | 'meta_ads';
export type ChannelHealth = 'ok' | 'warning' | 'error';

export interface ChannelStatus {
  kind: ChannelKind;
  label: string;
  connected: boolean;
  health: ChannelHealth;
  health_message: string;
  /** WhatsApp only: is the bot currently answering (config.bot_global) */
  bot_active?: boolean;
  /** WhatsApp only: contacts paused awaiting a human, master doc §5.2 */
  paused_contacts_count?: number;
  last_heartbeat_at?: string;
}
```

- [ ] **Step 2: Implement `portalAttendanceService.getChannels`**

```ts
// src/common/services/portal/portal-attendance-service.ts
import api from '@/src/common/config/api';
import type { ChannelStatus } from '@/src/common/@types/@portal-attendance';

export const portalAttendanceService = {
  async getChannels(): Promise<ChannelStatus[]> {
    const response = await api.get<ChannelStatus[]>('/portal/attendance/channels');
    return response.data;
  },
};
```

- [ ] **Step 3: Implement `usePortalChannels`**

```ts
// src/common/hooks/portal/use-portal-channels.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalAttendanceService } from '@/src/common/services/portal/portal-attendance-service';

export function usePortalChannels() {
  return useQuery({
    queryKey: ['portal', 'attendance', 'channels'],
    queryFn: () => portalAttendanceService.getChannels(),
    refetchInterval: 60_000, // heartbeat-driven, matches sistema.heartbeat cadence in master doc §5.6
  });
}
```

- [ ] **Step 4: Write the failing test for `<ChannelStatusCard>`**

```tsx
// src/components/portal/attendance/__tests__/channel-status-card.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChannelStatusCard } from '../channel-status-card';
import type { ChannelStatus } from '@/src/common/@types/@portal-attendance';

describe('ChannelStatusCard', () => {
  it('shows a healthy WhatsApp channel with bot active and paused-contacts count', () => {
    const channel: ChannelStatus = {
      kind: 'whatsapp', label: 'WhatsApp', connected: true, health: 'ok',
      health_message: 'Tudo funcionando normalmente', bot_active: true, paused_contacts_count: 2,
      last_heartbeat_at: '2026-08-04T10:00:00-03:00',
    };
    render(<ChannelStatusCard channel={channel} />);
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText(/2 contatos? aguardando/i)).toBeInTheDocument();
  });

  it('shows a warning banner when health is not ok', () => {
    const channel: ChannelStatus = {
      kind: 'meta_ads', label: 'Meta Ads', connected: true, health: 'warning',
      health_message: 'Token expira em 3 dias',
    };
    render(<ChannelStatusCard channel={channel} />);
    expect(screen.getByText('Token expira em 3 dias')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- channel-status-card`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<ChannelStatusCard>`**

```tsx
// src/components/portal/attendance/channel-status-card.tsx
import { Card } from '@/src/components/ui/card';
import { cn } from '@/src/common/lib/utils';
import type { ChannelStatus } from '@/src/common/@types/@portal-attendance';

const healthColor: Record<ChannelStatus['health'], string> = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

export function ChannelStatusCard({ channel }: { channel: ChannelStatus }) {
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-center gap-2">
        <span className={cn('size-2 rounded-full', healthColor[channel.health])} />
        <p className="font-medium">{channel.label}</p>
      </div>
      <p className="text-sm text-muted-foreground">{channel.health_message}</p>
      {channel.kind === 'whatsapp' && (
        <div className="space-y-1 text-sm">
          <p>Atendimento automático: {channel.bot_active ? 'ligado' : 'pausado'}</p>
          {Boolean(channel.paused_contacts_count) && (
            <p className="font-medium text-amber-600">
              {channel.paused_contacts_count} contato{channel.paused_contacts_count === 1 ? '' : 's'} aguardando um humano
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- channel-status-card`
Expected: PASS (2 tests)

- [ ] **Step 8: Start the `/portal/atendimento` page with the Canais section**

```tsx
// src/app/portal/atendimento/page.tsx
'use client';

import { usePortalChannels } from '@/src/common/hooks/portal/use-portal-channels';
import { ChannelStatusCard } from '@/src/components/portal/attendance/channel-status-card';
import { PortalCardSkeleton } from '@/src/components/portal/skeletons';

export default function PortalAtendimentoPage() {
  const { data: channels, isLoading } = usePortalChannels();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Automação de Atendimento</h1>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Canais</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <PortalCardSkeleton key={i} />)
            : channels?.map((channel) => <ChannelStatusCard key={channel.kind} channel={channel} />)}
        </div>
      </section>
      {/* Conversas (Task 18), Funil (Task 20) sections are appended below in later tasks */}
    </div>
  );
}
```

- [ ] **Step 9: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/common/@types/@portal-attendance.ts src/common/services/portal/portal-attendance-service.ts \
  src/common/hooks/portal/use-portal-channels.ts src/components/portal/attendance/channel-status-card.tsx \
  src/components/portal/attendance/__tests__/channel-status-card.test.tsx src/app/portal/atendimento/page.tsx
git commit -m "feat(portal): build Bloco Canais (§5.2) — connection status, bot active, paused contacts

BLOCKED on backend: GET /portal/attendance/channels does not exist yet;
depends on the bot-event ingestion API from the parallel backend plan."
```

---

### Task 18: Bloco Conversas — list + search (§5.3, read-only)

**Files:**
- Modify: `src/common/@types/@portal-attendance.ts`
- Modify: `src/common/services/portal/portal-attendance-service.ts`
- Create: `src/common/hooks/portal/use-portal-conversations.ts`
- Create: `src/components/portal/attendance/conversation-list.tsx`
- Create: `src/components/portal/attendance/conversation-search.tsx`
- Modify: `src/app/portal/atendimento/page.tsx`
- Test: `src/components/portal/attendance/__tests__/conversation-list.test.tsx`

**Interfaces:**
- Consumes: `PortalDataTable` (Task 8)
- Produces: `Conversation` type, `usePortalConversations(filters)`, `<ConversationList conversations />`, `<ConversationSearch onFilterChange />` — consumed by Task 19 (detail view)

**BLOCKED (backend):** `GET /portal/attendance/conversations`.

- [ ] **Step 1: Extend `@portal-attendance.ts`**

```ts
// src/common/@types/@portal-attendance.ts — append
export type FunnelStageStatus = 'NOVO' | 'QUALIFICADO' | 'PAGAMENTO' | 'FECHADO' | 'FRIO';

export interface Conversation {
  id: string;
  contact_number: string;
  contact_name: string | null;
  origin: 'anuncio' | 'organico';
  campaign_name: string | null;
  stage: FunnelStageStatus;
  last_message_at: string;
  bot_status: 'ATIVO' | 'PAUSADO';
  pause_reason: string | null;
  paused_since: string | null;
  consentimento_lgpd: boolean;
  chatwoot_url: string;
}

export interface ConversationFilters {
  search?: string;
  from?: string;
  to?: string;
  stage?: FunnelStageStatus;
}
```

- [ ] **Step 2: Extend `portalAttendanceService`**

```ts
// src/common/services/portal/portal-attendance-service.ts — add
import type { Conversation, ConversationFilters } from '@/src/common/@types/@portal-attendance';

// inside the exported object:
async getConversations(filters: ConversationFilters): Promise<Conversation[]> {
  const response = await api.get<Conversation[]>('/portal/attendance/conversations', { params: filters });
  return response.data;
},
```

- [ ] **Step 3: Implement `usePortalConversations`**

```ts
// src/common/hooks/portal/use-portal-conversations.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalAttendanceService } from '@/src/common/services/portal/portal-attendance-service';
import type { ConversationFilters } from '@/src/common/@types/@portal-attendance';

export function usePortalConversations(filters: ConversationFilters) {
  return useQuery({
    queryKey: ['portal', 'attendance', 'conversations', filters],
    queryFn: () => portalAttendanceService.getConversations(filters),
  });
}
```

- [ ] **Step 4: Write the failing test for `<ConversationList>`**

```tsx
// src/components/portal/attendance/__tests__/conversation-list.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversationList } from '../conversation-list';
import type { Conversation } from '@/src/common/@types/@portal-attendance';

const conversations: Conversation[] = [
  {
    id: '1', contact_number: '+55 11 91234-5678', contact_name: 'Maria', origin: 'anuncio',
    campaign_name: 'Verão 2026', stage: 'QUALIFICADO', last_message_at: '2026-08-04T09:00:00-03:00',
    bot_status: 'PAUSADO', pause_reason: 'transferido para humano', paused_since: '2026-08-04T08:50:00-03:00',
    consentimento_lgpd: true, chatwoot_url: 'https://chatwoot.reserve.com/app/accounts/1/conversations/42',
  },
];

describe('ConversationList', () => {
  it('renders contact, stage, and a Chatwoot deep link — never a reply box', () => {
    render(<ConversationList conversations={conversations} />);
    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByText('QUALIFICADO')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /responder no chatwoot/i });
    expect(link).toHaveAttribute('href', conversations[0].chatwoot_url);
    expect(screen.queryByRole('textbox', { name: /mensagem/i })).not.toBeInTheDocument();
  });

  it('shows the pause reason and duration when the bot is paused', () => {
    render(<ConversationList conversations={conversations} />);
    expect(screen.getByText(/transferido para humano/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- conversation-list`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<ConversationList>`**

This is the one place in the whole plan where "never build a reply box" (master doc Decisão 11 / §5.3 / §9 risk table) is directly testable — the test above asserts no `textbox` role exists.

```tsx
// src/components/portal/attendance/conversation-list.tsx
import Link from 'next/link';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { ExternalLink } from 'lucide-react';
import type { Conversation } from '@/src/common/@types/@portal-attendance';

const stageLabel: Record<Conversation['stage'], string> = {
  NOVO: 'Novo', QUALIFICADO: 'QUALIFICADO', PAGAMENTO: 'Pagamento', FECHADO: 'Fechado', FRIO: 'Frio',
};

export function ConversationList({ conversations }: { conversations: Conversation[] }) {
  return (
    <div className="space-y-3">
      {conversations.map((conv) => (
        <Card key={conv.id} className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{conv.contact_name ?? conv.contact_number}</p>
              <p className="text-xs text-muted-foreground">
                {conv.origin === 'anuncio' ? conv.campaign_name ?? 'Anúncio' : 'Orgânico'} · {stageLabel[conv.stage]}
              </p>
            </div>
            {conv.bot_status === 'PAUSADO' && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Pausado — {conv.pause_reason}
              </span>
            )}
          </div>
          {!conv.consentimento_lgpd && (
            <p className="text-xs text-muted-foreground">Consentimento LGPD ainda não confirmado</p>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={conv.chatwoot_url} target="_blank" rel="noreferrer">
              Responder no Chatwoot <ExternalLink className="ml-1 size-3.5" />
            </Link>
          </Button>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- conversation-list`
Expected: PASS (2 tests)

- [ ] **Step 8: Implement `<ConversationSearch>`** (search por número, período e estágio — master doc §5.3)

```tsx
// src/components/portal/attendance/conversation-search.tsx
'use client';

import { Input } from '@/src/components/ui/input';
import type { ConversationFilters, FunnelStageStatus } from '@/src/common/@types/@portal-attendance';

const STAGES: FunnelStageStatus[] = ['NOVO', 'QUALIFICADO', 'PAGAMENTO', 'FECHADO', 'FRIO'];

export function ConversationSearch({
  filters,
  onChange,
}: {
  filters: ConversationFilters;
  onChange: (next: ConversationFilters) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Buscar por número"
        value={filters.search ?? ''}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      <select
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={filters.stage ?? ''}
        onChange={(e) => onChange({ ...filters, stage: (e.target.value || undefined) as FunnelStageStatus | undefined })}
      >
        <option value="">Todos os estágios</option>
        {STAGES.map((stage) => (
          <option key={stage} value={stage}>{stage}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 9: Wire both into `/portal/atendimento`**

```tsx
// src/app/portal/atendimento/page.tsx — add state + section
import { useState } from 'react';
import { usePortalConversations } from '@/src/common/hooks/portal/use-portal-conversations';
import { ConversationList } from '@/src/components/portal/attendance/conversation-list';
import { ConversationSearch } from '@/src/components/portal/attendance/conversation-search';
import { PortalTableSkeleton } from '@/src/components/portal/skeletons';
import type { ConversationFilters } from '@/src/common/@types/@portal-attendance';

// inside the component, after the Canais section state:
const [filters, setFilters] = useState<ConversationFilters>({});
const { data: conversations, isLoading: conversationsLoading } = usePortalConversations(filters);

// new JSX section:
<section>
  <h2 className="mb-2 text-sm font-medium text-muted-foreground">Conversas</h2>
  <ConversationSearch filters={filters} onChange={setFilters} />
  <div className="mt-3">
    {conversationsLoading ? <PortalTableSkeleton /> : <ConversationList conversations={conversations ?? []} />}
  </div>
</section>
```

- [ ] **Step 10: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/common/@types/@portal-attendance.ts src/common/services/portal/portal-attendance-service.ts \
  src/common/hooks/portal/use-portal-conversations.ts src/components/portal/attendance/conversation-list.tsx \
  src/components/portal/attendance/conversation-search.tsx \
  src/components/portal/attendance/__tests__/conversation-list.test.tsx src/app/portal/atendimento/page.tsx
git commit -m "feat(portal): build Bloco Conversas read-only (§5.3) — list, search, Chatwoot deep link

Read-only by construction: test asserts no reply textbox is ever rendered
(master doc Decisão 11). BLOCKED on backend:
GET /portal/attendance/conversations does not exist yet."
```

---

### Task 19: Conversation detail view — transcript with role distinction

**Files:**
- Modify: `src/common/@types/@portal-attendance.ts`
- Modify: `src/common/services/portal/portal-attendance-service.ts`
- Create: `src/common/hooks/portal/use-conversation-detail.ts`
- Create: `src/components/portal/attendance/conversation-transcript.tsx`
- Create: `src/app/portal/atendimento/[conversationId]/page.tsx`
- Test: `src/components/portal/attendance/__tests__/conversation-transcript.test.tsx`

**Interfaces:**
- Consumes: `Conversation` type (Task 18)
- Produces: `ConversationMessage` type, `useConversationDetail(id)`, `<ConversationTranscript messages />`

**BLOCKED (backend):** `GET /portal/attendance/conversations/:id`.

- [ ] **Step 1: Extend `@portal-attendance.ts`**

```ts
// src/common/@types/@portal-attendance.ts — append
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'human';
  tipo: 'texto' | 'audio' | 'imagem';
  content: string;
  sent_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ConversationMessage[];
}
```

- [ ] **Step 2: Extend `portalAttendanceService`**

```ts
// src/common/services/portal/portal-attendance-service.ts — add
async getConversationDetail(id: string): Promise<ConversationDetail> {
  const response = await api.get<ConversationDetail>(`/portal/attendance/conversations/${id}`);
  return response.data;
},
```

- [ ] **Step 3: Implement `useConversationDetail`**

```ts
// src/common/hooks/portal/use-conversation-detail.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalAttendanceService } from '@/src/common/services/portal/portal-attendance-service';

export function useConversationDetail(id: string) {
  return useQuery({
    queryKey: ['portal', 'attendance', 'conversation', id],
    queryFn: () => portalAttendanceService.getConversationDetail(id),
    enabled: Boolean(id),
  });
}
```

- [ ] **Step 4: Write the failing test for `<ConversationTranscript>`**

```tsx
// src/components/portal/attendance/__tests__/conversation-transcript.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversationTranscript } from '../conversation-transcript';
import type { ConversationMessage } from '@/src/common/@types/@portal-attendance';

const messages: ConversationMessage[] = [
  { id: 'm1', role: 'user', tipo: 'texto', content: 'Oi, tem vaga pro fim de semana?', sent_at: '2026-08-04T09:00:00-03:00' },
  { id: 'm2', role: 'assistant', tipo: 'texto', content: 'Vou verificar para você.', sent_at: '2026-08-04T09:00:30-03:00' },
  { id: 'm3', role: 'human', tipo: 'texto', content: 'Oi Maria, aqui é a Ana da recepção.', sent_at: '2026-08-04T09:05:00-03:00' },
];

describe('ConversationTranscript', () => {
  it('renders every message and visually distinguishes lead, bot, and human replies', () => {
    render(<ConversationTranscript messages={messages} />);
    expect(screen.getByText('Oi, tem vaga pro fim de semana?')).toBeInTheDocument();
    expect(screen.getByTestId('message-m1')).toHaveAttribute('data-role', 'user');
    expect(screen.getByTestId('message-m2')).toHaveAttribute('data-role', 'assistant');
    expect(screen.getByTestId('message-m3')).toHaveAttribute('data-role', 'human');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- conversation-transcript`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<ConversationTranscript>`**

```tsx
// src/components/portal/attendance/conversation-transcript.tsx
import { cn } from '@/src/common/lib/utils';
import type { ConversationMessage } from '@/src/common/@types/@portal-attendance';

const roleStyles: Record<ConversationMessage['role'], string> = {
  user: 'self-start bg-muted',
  assistant: 'self-end bg-primary/10',
  human: 'self-end bg-emerald-100',
};

const roleLabel: Record<ConversationMessage['role'], string> = {
  user: 'Hóspede',
  assistant: 'Bot',
  human: 'Equipe do hotel',
};

export function ConversationTranscript({ messages }: { messages: ConversationMessage[] }) {
  return (
    <div className="flex flex-col gap-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          data-testid={`message-${msg.id}`}
          data-role={msg.role}
          className={cn('max-w-[85%] rounded-lg px-3 py-2 text-sm', roleStyles[msg.role])}
        >
          <p className="mb-0.5 text-xs font-medium text-muted-foreground">{roleLabel[msg.role]}</p>
          <p>{msg.content}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- conversation-transcript`
Expected: PASS

- [ ] **Step 8: Build the detail page**

```tsx
// src/app/portal/atendimento/[conversationId]/page.tsx
'use client';

import { use } from 'react';
import Link from 'next/link';
import { useConversationDetail } from '@/src/common/hooks/portal/use-conversation-detail';
import { ConversationTranscript } from '@/src/components/portal/attendance/conversation-transcript';
import { PortalTableSkeleton } from '@/src/components/portal/skeletons';
import { Button } from '@/src/components/ui/button';

export default function ConversationDetailPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const { data, isLoading } = useConversationDetail(conversationId);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="font-portal-display text-xl">{data?.contact_name ?? data?.contact_number ?? 'Conversa'}</h1>
      {isLoading || !data ? (
        <PortalTableSkeleton rows={6} />
      ) : (
        <>
          <ConversationTranscript messages={data.messages} />
          <Button asChild size="sm" variant="outline">
            <Link href={data.chatwoot_url} target="_blank" rel="noreferrer">Responder no Chatwoot</Link>
          </Button>
        </>
      )}
    </div>
  );
}
```

This route reads `params` via `use()` (a client hook), which per the fase4 plan's own documented App Router rule (`docs/superpowers/plans/2026-07-26-fase4-frontend-arquitetura.md`, `APP.md` exceptions) works identically whether the file is a thin re-export or the real implementation — safe to keep as a direct implementation here since fase4's `presentation/components/pages` layer doesn't exist on this branch (Global Constraints).

- [ ] **Step 9: Link from the conversation list**

```tsx
// src/components/portal/attendance/conversation-list.tsx — wrap the contact name in a Link
import Link from 'next/link';
// ...
<Link href={`/portal/atendimento/${conv.id}`} className="font-medium hover:underline">
  {conv.contact_name ?? conv.contact_number}
</Link>
```

- [ ] **Step 10: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/common/@types/@portal-attendance.ts src/common/services/portal/portal-attendance-service.ts \
  src/common/hooks/portal/use-conversation-detail.ts src/components/portal/attendance/conversation-transcript.tsx \
  src/components/portal/attendance/__tests__/conversation-transcript.test.tsx \
  src/app/portal/atendimento/[conversationId]/page.tsx src/components/portal/attendance/conversation-list.tsx
git commit -m "feat(portal): add conversation detail transcript with role distinction (§5.3)

user/assistant/human render with distinct styling and data-role for
testability. BLOCKED on backend:
GET /portal/attendance/conversations/:id does not exist yet."
```

---

### Task 20: Bloco Funil — full visual with fronteira (§5.4)

**Files:**
- Modify: `src/common/@types/@portal-attendance.ts`
- Modify: `src/common/services/portal/portal-attendance-service.ts`
- Create: `src/common/hooks/portal/use-attendance-funnel.ts`
- Create: `src/components/portal/attendance/funnel-columns.tsx`
- Modify: `src/app/portal/atendimento/page.tsx`
- Test: `src/components/portal/attendance/__tests__/funnel-columns.test.tsx`

**Interfaces:**
- Consumes: `AcquisitionFunnel` (Task 12) is **not** reused directly here — that component renders a proportional-width flow (good for Alcance→Cliques→Conversas), but §5.4 explicitly asks for *columns with counts*, grouped-list on mobile ("No mobile, lista agrupada por estágio"), which is a different visual shape. This task builds a sibling component, `<FunnelColumns>`, reusing only the fronteira-line pattern established in Task 12.
- Produces: `FunnelStageCount` type, `useAttendanceFunnel()`, `<FunnelColumns stages />` — consumed by Task 21 (drag-to-move)

**BLOCKED (backend):** `GET /portal/attendance/funnel` — reads `funil_eventos` (master doc §5.4/§5.6), not built yet.

- [ ] **Step 1: Extend `@portal-attendance.ts`**

```ts
// src/common/@types/@portal-attendance.ts — append
export interface FunnelStageCount {
  stage: FunnelStageStatus;
  label: string;
  count: number;
  /** sum of accommodation value when informed, master doc §5.4 "valor potencial" */
  potential_value: number | null;
  isFronteira?: boolean;
}
```

- [ ] **Step 2: Extend `portalAttendanceService`**

```ts
// src/common/services/portal/portal-attendance-service.ts — add
async getFunnel(): Promise<FunnelStageCount[]> {
  const response = await api.get<FunnelStageCount[]>('/portal/attendance/funnel');
  return response.data;
},
```

- [ ] **Step 3: Implement `useAttendanceFunnel`**

```ts
// src/common/hooks/portal/use-attendance-funnel.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalAttendanceService } from '@/src/common/services/portal/portal-attendance-service';

export function useAttendanceFunnel() {
  return useQuery({
    queryKey: ['portal', 'attendance', 'funnel'],
    queryFn: () => portalAttendanceService.getFunnel(),
  });
}
```

- [ ] **Step 4: Write the failing test for `<FunnelColumns>`**

```tsx
// src/components/portal/attendance/__tests__/funnel-columns.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FunnelColumns } from '../funnel-columns';
import type { FunnelStageCount } from '@/src/common/@types/@portal-attendance';

const stages: FunnelStageCount[] = [
  { stage: 'NOVO', label: 'Novo', count: 40, potential_value: null },
  { stage: 'QUALIFICADO', label: 'Qualificado', count: 18, potential_value: null },
  { stage: 'PAGAMENTO', label: 'Pagamento', count: 6, potential_value: 4200, isFronteira: true },
  { stage: 'FECHADO', label: 'Fechado', count: 4, potential_value: 2800 },
];

describe('FunnelColumns', () => {
  it('renders a column with count for every stage', () => {
    render(<FunnelColumns stages={stages} />);
    expect(screen.getByText('Novo')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('Fechado')).toBeInTheDocument();
  });

  it('shows potential value when informed', () => {
    render(<FunnelColumns stages={stages} />);
    expect(screen.getByText(/4\.200/)).toBeInTheDocument();
  });

  it('draws the fronteira line after the stage marked isFronteira', () => {
    render(<FunnelColumns stages={stages} />);
    expect(screen.getByTestId('fronteira-line')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- funnel-columns`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<FunnelColumns>`**

Desktop: side-by-side columns. Mobile: grouped vertical list (§5.4 "No mobile, lista agrupada por estágio") — reuses the `PortalDataTable`-style mobile-card pattern established in Task 8, but hand-rolled here since the shape (grouped by stage, not row-per-record) doesn't fit `PortalDataTableColumn`.

```tsx
// src/components/portal/attendance/funnel-columns.tsx
import { Card } from '@/src/components/ui/card';
import type { FunnelStageCount } from '@/src/common/@types/@portal-attendance';

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function FunnelColumns({ stages }: { stages: FunnelStageCount[] }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {stages.map((stage) => (
        <div key={stage.stage} className="flex-1">
          <Card className="space-y-1 p-4">
            <p className="text-sm text-muted-foreground">{stage.label}</p>
            <p className="text-2xl font-semibold">{stage.count}</p>
            {stage.potential_value !== null && (
              <p className="text-xs text-muted-foreground">{currency(stage.potential_value)} em potencial</p>
            )}
          </Card>
          {stage.isFronteira && (
            <div data-testid="fronteira-line" className="my-2 flex items-center gap-2 text-xs font-medium text-amber-600 md:my-0 md:h-full md:w-px md:flex-col md:bg-amber-500">
              <span className="md:hidden">fronteira Reserve / hotel</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- funnel-columns`
Expected: PASS (3 tests)

- [ ] **Step 8: Wire into `/portal/atendimento`**

```tsx
// src/app/portal/atendimento/page.tsx — add section
import { useAttendanceFunnel } from '@/src/common/hooks/portal/use-attendance-funnel';
import { FunnelColumns } from '@/src/components/portal/attendance/funnel-columns';

// inside the component:
const { data: funnelStages, isLoading: funnelLoading } = useAttendanceFunnel();

// JSX:
<section>
  <h2 className="mb-2 text-sm font-medium text-muted-foreground">Funil de atendimento</h2>
  {funnelLoading ? <PortalCardSkeleton /> : <FunnelColumns stages={funnelStages ?? []} />}
</section>
```

- [ ] **Step 9: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/common/@types/@portal-attendance.ts src/common/services/portal/portal-attendance-service.ts \
  src/common/hooks/portal/use-attendance-funnel.ts src/components/portal/attendance/funnel-columns.tsx \
  src/components/portal/attendance/__tests__/funnel-columns.test.tsx src/app/portal/atendimento/page.tsx
git commit -m "feat(portal): build full Funil de atendimento (§5.4) — columns desktop, grouped list mobile

BLOCKED on backend: GET /portal/attendance/funnel reads funil_eventos,
not built yet (master doc §5.6)."
```

---

### Task 21: Funnel stage move — client-initiated event with optimistic update

**Files:**
- Modify: `src/common/@types/@portal-attendance.ts`
- Modify: `src/common/services/portal/portal-attendance-service.ts`
- Create: `src/common/hooks/portal/use-move-funnel-stage.ts`
- Modify: `src/components/portal/attendance/funnel-columns.tsx`
- Test: `src/common/hooks/portal/__tests__/use-move-funnel-stage.test.tsx`

**Interfaces:**
- Consumes: `FunnelStageCount` (Task 20), TanStack Query `useMutation`
- Produces: `useMoveFunnelStage()` — a mutation the client can call to move a lead, matching master doc §5.4's rule: "A gravação nunca sobrescreve o campo do bot diretamente — grava um evento."

**BLOCKED (backend):** `POST /portal/attendance/funnel-events` (the painel's write side of `funil_eventos`, master doc §5.4's "webhook reverso"). This task still ships real optimistic-update behavior and a documented reconciliation-failure path, since that logic is pure frontend regardless of when the endpoint lands.

- [ ] **Step 1: Extend `@portal-attendance.ts`**

```ts
// src/common/@types/@portal-attendance.ts — append
export interface MoveFunnelStagePayload {
  numero_contato: string;
  de_estagio: FunnelStageStatus;
  para_estagio: FunnelStageStatus;
  motivo: string;
}
```

- [ ] **Step 2: Extend `portalAttendanceService`**

```ts
// src/common/services/portal/portal-attendance-service.ts — add
async moveFunnelStage(payload: MoveFunnelStagePayload): Promise<void> {
  await api.post('/portal/attendance/funnel-events', payload);
},
```

- [ ] **Step 3: Write the failing test for `useMoveFunnelStage`**

```tsx
// src/common/hooks/portal/__tests__/use-move-funnel-stage.test.tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMoveFunnelStage } from '../use-move-funnel-stage';
import { portalAttendanceService } from '@/src/common/services/portal/portal-attendance-service';

vi.mock('@/src/common/services/portal/portal-attendance-service', () => ({
  portalAttendanceService: { moveFunnelStage: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useMoveFunnelStage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the funnel-events endpoint with an event payload, not a direct field write', async () => {
    vi.mocked(portalAttendanceService.moveFunnelStage).mockResolvedValue(undefined);
    const { result } = renderHook(() => useMoveFunnelStage(), { wrapper });

    result.current.mutate({
      numero_contato: '+5511999999999', de_estagio: 'QUALIFICADO', para_estagio: 'PAGAMENTO', motivo: 'cliente confirmou datas',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(portalAttendanceService.moveFunnelStage).toHaveBeenCalledWith({
      numero_contato: '+5511999999999', de_estagio: 'QUALIFICADO', para_estagio: 'PAGAMENTO', motivo: 'cliente confirmou datas',
    });
  });

  it('surfaces an error (not a silent failure) when the write fails, per §5.4 reconciliation note', async () => {
    vi.mocked(portalAttendanceService.moveFunnelStage).mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useMoveFunnelStage(), { wrapper });

    result.current.mutate({
      numero_contato: '+5511999999999', de_estagio: 'NOVO', para_estagio: 'QUALIFICADO', motivo: 'teste',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm run test:run -- use-move-funnel-stage`
Expected: FAIL — module not found.

- [ ] **Step 5: Implement `useMoveFunnelStage`**

Invalidates the funnel query on success so the columns re-fetch the authoritative count; on error, it does *not* optimistically mutate the cache — master doc §5.4 says a failed write reconciles via a backend job, so the client shows an error toast and lets the next successful fetch be the source of truth, rather than guessing at a local state that might diverge.

```ts
// src/common/hooks/portal/use-move-funnel-stage.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { portalAttendanceService } from '@/src/common/services/portal/portal-attendance-service';
import type { MoveFunnelStagePayload } from '@/src/common/@types/@portal-attendance';

export function useMoveFunnelStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MoveFunnelStagePayload) => portalAttendanceService.moveFunnelStage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'attendance', 'funnel'] });
    },
  });
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:run -- use-move-funnel-stage`
Expected: PASS (2 tests)

- [ ] **Step 7: Add a "mover" action per stage card in `<FunnelColumns>`** (a simple select-to-move affordance — not a drag-and-drop; keeps the interaction accessible and matches "o cliente pode mover um lead de estágio" without inventing a kanban library dependency)

```tsx
// src/components/portal/attendance/funnel-columns.tsx — add role checks and toast on error
'use client';

import { toast } from 'sonner';
import { useMoveFunnelStage } from '@/src/common/hooks/portal/use-move-funnel-stage';
import type { FunnelStageStatus } from '@/src/common/@types/@portal-attendance';

// (existing FunnelStageCount import stays)

const NEXT_STAGE: Partial<Record<FunnelStageStatus, FunnelStageStatus>> = {
  NOVO: 'QUALIFICADO', QUALIFICADO: 'PAGAMENTO', PAGAMENTO: 'FECHADO',
};

// inside FunnelColumns, per-stage card, add:
function MoveStageAction({ stage, contactNumber }: { stage: FunnelStageStatus; contactNumber: string }) {
  const { mutate, isPending } = useMoveFunnelStage();
  const next = NEXT_STAGE[stage];
  if (!next) return null;

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        mutate(
          { numero_contato: contactNumber, de_estagio: stage, para_estagio: next, motivo: 'movido pelo cliente no painel' },
          { onError: () => toast.error('Não foi possível mover o lead agora. Tente novamente em instantes.') },
        )
      }
      className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
    >
      Mover para {next}
    </button>
  );
}
```

Note: `contactNumber` requires per-lead granularity that `FunnelStageCount` (an aggregate count per stage) does not carry — wiring this action to a real contact requires the conversation-level view from Task 18/19, not the aggregate columns. Flag as a follow-up: either `<FunnelColumns>` needs a per-lead drill-down (list of contacts within a stage, each with its own "mover" action), or the move action lives on `<ConversationList>`/`<ConversationTranscript>` instead, next to the stage badge already rendered there. **Needs a product decision on where in the UI "move a lead" actually belongs** — this task ships the mutation hook (fully working, tested) but defers the exact placement of the trigger UI rather than guessing.

- [ ] **Step 8: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/common/@types/@portal-attendance.ts src/common/services/portal/portal-attendance-service.ts \
  src/common/hooks/portal/use-move-funnel-stage.ts \
  src/common/hooks/portal/__tests__/use-move-funnel-stage.test.tsx \
  src/components/portal/attendance/funnel-columns.tsx
git commit -m "feat(portal): add useMoveFunnelStage mutation (event-based, §5.4)

Writes an event, never a direct field (master doc §5.4). Ships the mutation
fully tested; exact placement of the trigger UI is flagged as an open
product question (aggregate FunnelStageCount has no per-lead granularity —
see task note) rather than guessed. BLOCKED on backend:
POST /portal/attendance/funnel-events does not exist yet."
```

---

### Task 22: Configuração do bot — proposal UI (§5.5)

**Files:**
- Create: `src/common/@types/@portal-bot-config.ts`
- Create: `src/common/services/portal/portal-bot-config-service.ts`
- Create: `src/common/hooks/portal/use-bot-config.ts`
- Create: `src/common/hooks/portal/use-portal-permissions.ts`
- Create: `src/components/portal/bot-config/proposal-form.tsx`
- Create: `src/components/portal/bot-config/proposal-status-badge.tsx`
- Create: `src/app/portal/atendimento/bot/page.tsx`
- Test: `src/components/portal/bot-config/__tests__/proposal-form.test.tsx`
- Test: `src/common/hooks/portal/__tests__/use-portal-permissions.test.ts`

**Interfaces:**
- Consumes: `usePortalAuth` (Task 1, for `profile.role`)
- Produces: `ClientRole`-based permission checks (`canProposeBotConfigChange`), `BotConfigField`/`BotConfigProposal` types, `useBotConfig()`, `<ProposalForm field currentValue onSubmit />`, `<ProposalStatusBadge status />`

**BLOCKED (backend):** `bot_config_propostas` table and its endpoints (master doc §5.5) don't exist. The **approval** side ("Reserve revisa no admin") is explicitly out of scope per Assumption 9 — only the client-side propose form is built here.

- [ ] **Step 1: Write the failing test for `usePortalPermissions`**

```ts
// src/common/hooks/portal/__tests__/use-portal-permissions.test.ts
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePortalPermissions } from '../use-portal-permissions';
import { ClientRole } from '@/src/common/@types/@portal-auth';
import { readPortalProfile } from '../use-portal-auth';

vi.mock('../use-portal-auth', () => ({ readPortalProfile: vi.fn() }));

describe('usePortalPermissions', () => {
  it('allows owner and manager to propose bot config changes, not funcionary', () => {
    vi.mocked(readPortalProfile).mockReturnValue({
      role: ClientRole.owner, name: 'Dona Tereza', email: 'x@x.com',
      tenant: { id: 't1', name: 'Pousada', slug: 'p', entry_date: '2026-01-01' },
    });
    expect(renderHook(() => usePortalPermissions()).result.current.canProposeBotConfigChange).toBe(true);

    vi.mocked(readPortalProfile).mockReturnValue({
      role: ClientRole.funcionary, name: 'João', email: 'y@y.com',
      tenant: { id: 't1', name: 'Pousada', slug: 'p', entry_date: '2026-01-01' },
    });
    expect(renderHook(() => usePortalPermissions()).result.current.canProposeBotConfigChange).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- use-portal-permissions`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `usePortalPermissions`**

```ts
// src/common/hooks/portal/use-portal-permissions.ts
'use client';

import { ClientRole } from '@/src/common/@types/@portal-auth';
import { readPortalProfile } from './use-portal-auth';

export function usePortalPermissions() {
  const profile = readPortalProfile();
  const role = profile?.role ?? null;

  const isOwner = role === ClientRole.owner;
  const isManager = role === ClientRole.manager;
  const isFuncionary = role === ClientRole.funcionary;

  return {
    role,
    isOwner,
    isManager,
    isFuncionary,
    // master doc §5.5: proposing data changes is a decision-maker action; funcionary can view but not propose
    canProposeBotConfigChange: isOwner || isManager,
    canMoveFunnelStage: isOwner || isManager,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- use-portal-permissions`
Expected: PASS

- [ ] **Step 5: Write `@portal-bot-config.ts` types**

```ts
// src/common/@types/@portal-bot-config.ts
export type BotConfigFieldGroup = 'precos' | 'politicas' | 'pacotes' | 'operacional';
export type ProposalStatus = 'PENDENTE' | 'APROVADA' | 'REJEITADA';

export interface BotConfigField {
  id: string;
  group: BotConfigFieldGroup;
  label: string;
  current_value: string;
}

export interface BotConfigProposal {
  id: string;
  field_id: string;
  field_label: string;
  valor_atual: string;
  valor_proposto: string;
  status: ProposalStatus;
  justificativa_rejeicao: string | null;
  created_at: string;
}
```

- [ ] **Step 6: Implement `portalBotConfigService`**

```ts
// src/common/services/portal/portal-bot-config-service.ts
import api from '@/src/common/config/api';
import type { BotConfigField, BotConfigProposal } from '@/src/common/@types/@portal-bot-config';

export const portalBotConfigService = {
  async getFields(): Promise<BotConfigField[]> {
    const response = await api.get<BotConfigField[]>('/portal/bot-config/fields');
    return response.data;
  },
  async getProposals(): Promise<BotConfigProposal[]> {
    const response = await api.get<BotConfigProposal[]>('/portal/bot-config/proposals');
    return response.data;
  },
  async createProposal(fieldId: string, valorProposto: string): Promise<BotConfigProposal> {
    const response = await api.post<BotConfigProposal>('/portal/bot-config/proposals', {
      field_id: fieldId,
      valor_proposto: valorProposto,
    });
    return response.data;
  },
};
```

- [ ] **Step 7: Implement `useBotConfig`**

```ts
// src/common/hooks/portal/use-bot-config.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { portalBotConfigService } from '@/src/common/services/portal/portal-bot-config-service';

export function useBotConfigFields() {
  return useQuery({ queryKey: ['portal', 'bot-config', 'fields'], queryFn: portalBotConfigService.getFields });
}

export function useBotConfigProposals() {
  return useQuery({ queryKey: ['portal', 'bot-config', 'proposals'], queryFn: portalBotConfigService.getProposals });
}

export function useCreateBotConfigProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fieldId, valorProposto }: { fieldId: string; valorProposto: string }) =>
      portalBotConfigService.createProposal(fieldId, valorProposto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal', 'bot-config', 'proposals'] }),
  });
}
```

- [ ] **Step 8: Write the failing test for `<ProposalForm>`**

```tsx
// src/components/portal/bot-config/__tests__/proposal-form.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProposalForm } from '../proposal-form';
import type { BotConfigField } from '@/src/common/@types/@portal-bot-config';

const field: BotConfigField = { id: 'f1', group: 'precos', label: 'Diária casal (baixa temporada)', current_value: 'R$ 280' };

describe('ProposalForm', () => {
  it('shows the current value and submits only the proposed new value', () => {
    const onSubmit = vi.fn();
    render(<ProposalForm field={field} onSubmit={onSubmit} isSubmitting={false} />);
    expect(screen.getByText('R$ 280')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/novo valor/i), { target: { value: 'R$ 310' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar para aprovação/i }));

    expect(onSubmit).toHaveBeenCalledWith('R$ 310');
  });
});
```

- [ ] **Step 9: Run test to verify it fails**

Run: `npm run test:run -- proposal-form`
Expected: FAIL — module not found.

- [ ] **Step 10: Implement `<ProposalForm>`**

Copy makes the approval step explicit and reassuring, not bureaucratic (master doc §5.5: "'toda alteração passa por validação da Reserve antes de ir ao ar' é valor percebido, não burocracia").

```tsx
// src/components/portal/bot-config/proposal-form.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import type { BotConfigField } from '@/src/common/@types/@portal-bot-config';

export function ProposalForm({
  field,
  onSubmit,
  isSubmitting,
}: {
  field: BotConfigField;
  onSubmit: (valorProposto: string) => void;
  isSubmitting: boolean;
}) {
  const [value, setValue] = useState('');

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <p className="text-sm">
        <span className="text-muted-foreground">Valor atual: </span>
        <span className="font-medium">{field.current_value}</span>
      </p>
      <label className="block text-sm font-medium" htmlFor={`proposal-${field.id}`}>
        Novo valor
      </label>
      <Input id={`proposal-${field.id}`} value={value} onChange={(e) => setValue(e.target.value)} required />
      <p className="text-xs text-muted-foreground">
        A alteração só entra no ar depois que a Reserve validar — é assim que garantimos que nada quebra o atendimento.
      </p>
      <Button type="submit" size="sm" disabled={isSubmitting || !value}>
        {isSubmitting ? 'Enviando…' : 'Enviar para aprovação'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `npm run test:run -- proposal-form`
Expected: PASS

- [ ] **Step 12: Implement `<ProposalStatusBadge>`**

```tsx
// src/components/portal/bot-config/proposal-status-badge.tsx
import { cn } from '@/src/common/lib/utils';
import type { ProposalStatus } from '@/src/common/@types/@portal-bot-config';

const styles: Record<ProposalStatus, string> = {
  PENDENTE: 'bg-amber-100 text-amber-800',
  APROVADA: 'bg-emerald-100 text-emerald-800',
  REJEITADA: 'bg-red-100 text-red-800',
};

const labels: Record<ProposalStatus, string> = {
  PENDENTE: 'Aguardando validação da Reserve',
  APROVADA: 'Aprovada e publicada',
  REJEITADA: 'Não aprovada',
};

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', styles[status])}>{labels[status]}</span>
  );
}
```

- [ ] **Step 13: Assemble `/portal/atendimento/bot`**

Gated by `canProposeBotConfigChange` — a `funcionary` sees the data read-only, per master doc §2 Decisão 13 ("cliente edita dados, não comportamento") narrowed further by role.

```tsx
// src/app/portal/atendimento/bot/page.tsx
'use client';

import { useBotConfigFields, useBotConfigProposals, useCreateBotConfigProposal } from '@/src/common/hooks/portal/use-bot-config';
import { usePortalPermissions } from '@/src/common/hooks/portal/use-portal-permissions';
import { ProposalForm } from '@/src/components/portal/bot-config/proposal-form';
import { ProposalStatusBadge } from '@/src/components/portal/bot-config/proposal-status-badge';
import { PortalTableSkeleton } from '@/src/components/portal/skeletons';
import { Card } from '@/src/components/ui/card';

export default function PortalBotConfigPage() {
  const { canProposeBotConfigChange } = usePortalPermissions();
  const { data: fields, isLoading: fieldsLoading } = useBotConfigFields();
  const { data: proposals } = useBotConfigProposals();
  const { mutate: createProposal, isPending } = useCreateBotConfigProposal();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Configuração do bot</h1>
      <p className="text-sm text-muted-foreground">
        Preços, políticas, pacotes e horários. Comportamento e regras de atendimento não são editáveis por aqui.
      </p>

      {fieldsLoading ? (
        <PortalTableSkeleton />
      ) : (
        <div className="space-y-4">
          {fields?.map((field) => {
            const pendingProposal = proposals?.find((p) => p.field_id === field.id && p.status === 'PENDENTE');
            return (
              <Card key={field.id} className="space-y-2 p-4">
                <p className="font-medium">{field.label}</p>
                {pendingProposal ? (
                  <ProposalStatusBadge status={pendingProposal.status} />
                ) : canProposeBotConfigChange ? (
                  <ProposalForm
                    field={field}
                    isSubmitting={isPending}
                    onSubmit={(valorProposto) => createProposal({ fieldId: field.id, valorProposto })}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Valor atual: {field.current_value}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 14: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 15: Commit**

```bash
git add src/common/@types/@portal-bot-config.ts src/common/services/portal/portal-bot-config-service.ts \
  src/common/hooks/portal/use-bot-config.ts src/common/hooks/portal/use-portal-permissions.ts \
  src/common/hooks/portal/__tests__/use-portal-permissions.test.ts \
  src/components/portal/bot-config/ src/app/portal/atendimento/bot/page.tsx
git commit -m "feat(portal): build bot config proposal UI (§5.5) — client proposes data, never behavior

Gated by ClientRole (owner/manager can propose, funcionary is read-only).
Approval UI is admin-side, out of scope (plan Assumption 9). BLOCKED on
backend: bot_config_propostas table and endpoints do not exist yet."
```

---

### Task 23: Módulo de automação — métricas (§5.7)

**Files:**
- Modify: `src/common/@types/@portal-attendance.ts`
- Modify: `src/common/services/portal/portal-attendance-service.ts`
- Create: `src/common/hooks/portal/use-attendance-metrics.ts`
- Create: `src/components/portal/attendance/followup-effectiveness-chart.tsx`
- Modify: `src/app/portal/atendimento/page.tsx`
- Test: `src/components/portal/attendance/__tests__/followup-effectiveness-chart.test.tsx`

**Interfaces:**
- Consumes: `PortalBarChart` (Task 7), `MetricLabel` (Task 4), `VariationBadge` (Task 5)
- Produces: `AttendanceMetrics` type, `useAttendanceMetrics()`, `<FollowupEffectivenessChart data />`

**BLOCKED (backend):** `GET /portal/attendance/metrics` — derives from `funil_eventos` (tempo médio por estágio) and the follow-up queue (master doc §5.7), neither built.

- [ ] **Step 1: Extend `@portal-attendance.ts`**

```ts
// src/common/@types/@portal-attendance.ts — append
export interface AttendanceMetrics {
  conversas_iniciadas: { value: number; variation_pct: number };
  taxa_resposta_bot_pct: number;
  tempo_medio_primeira_resposta_seg: number;
  taxa_qualificacao_pct: number;
  leads_prontos_fechar: number;
  tempo_medio_por_estagio: { stage: FunnelStageStatus; avg_hours: number }[];
  followup_effectiveness: { toque: '4h' | '24h' | '72h' | '7d'; respondeu_pct: number }[];
  volume_por_origem: { origem: 'anuncio' | 'organico' | 'link_rastreavel'; count: number }[];
  contatos_pausados_aguardando: number;
  audios_transcritos: number;
}
```

- [ ] **Step 2: Extend `portalAttendanceService`**

```ts
// src/common/services/portal/portal-attendance-service.ts — add
async getMetrics(): Promise<AttendanceMetrics> {
  const response = await api.get<AttendanceMetrics>('/portal/attendance/metrics');
  return response.data;
},
```

- [ ] **Step 3: Implement `useAttendanceMetrics`**

```ts
// src/common/hooks/portal/use-attendance-metrics.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalAttendanceService } from '@/src/common/services/portal/portal-attendance-service';

export function useAttendanceMetrics() {
  return useQuery({ queryKey: ['portal', 'attendance', 'metrics'], queryFn: portalAttendanceService.getMetrics });
}
```

- [ ] **Step 4: Write the failing test for `<FollowupEffectivenessChart>`**

```tsx
// src/components/portal/attendance/__tests__/followup-effectiveness-chart.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FollowupEffectivenessChart } from '../followup-effectiveness-chart';

const data = [
  { toque: '4h' as const, respondeu_pct: 32 },
  { toque: '24h' as const, respondeu_pct: 18 },
  { toque: '72h' as const, respondeu_pct: 9 },
  { toque: '7d' as const, respondeu_pct: 4 },
];

describe('FollowupEffectivenessChart', () => {
  it('renders one bar per follow-up touch', () => {
    render(<FollowupEffectivenessChart data={data} />);
    expect(screen.getByRole('figure')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- followup-effectiveness-chart`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<FollowupEffectivenessChart>`**

```tsx
// src/components/portal/attendance/followup-effectiveness-chart.tsx
import { PortalBarChart } from '@/src/components/portal/charts/bar-chart';
import type { AttendanceMetrics } from '@/src/common/@types/@portal-attendance';

export function FollowupEffectivenessChart({ data }: { data: AttendanceMetrics['followup_effectiveness'] }) {
  return (
    <PortalBarChart
      data={data}
      xKey="toque"
      series={[{ key: 'respondeu_pct', label: 'Responderam (%)', color: '#0ea5e9' }]}
    />
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- followup-effectiveness-chart`
Expected: PASS

- [ ] **Step 8: Wire metrics into `/portal/atendimento`**

```tsx
// src/app/portal/atendimento/page.tsx — add section
import { useAttendanceMetrics } from '@/src/common/hooks/portal/use-attendance-metrics';
import { FollowupEffectivenessChart } from '@/src/components/portal/attendance/followup-effectiveness-chart';
import { VariationBadge } from '@/src/components/portal/variation-badge';

// inside the component:
const { data: metrics } = useAttendanceMetrics();

// JSX, new section:
<section className="space-y-3">
  <h2 className="text-sm font-medium text-muted-foreground">Métricas do atendimento</h2>
  {metrics && (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Conversas iniciadas</p>
          <p className="text-xl font-semibold">{metrics.conversas_iniciadas.value}</p>
          <VariationBadge value={metrics.conversas_iniciadas.variation_pct} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Taxa de qualificação</p>
          <p className="text-xl font-semibold">{metrics.taxa_qualificacao_pct}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Leads prontos para fechar</p>
          <p className="text-xl font-semibold">{metrics.leads_prontos_fechar}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Contatos pausados aguardando humano</p>
          <p className="text-xl font-semibold text-amber-600">{metrics.contatos_pausados_aguardando}</p>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs text-muted-foreground">Efetividade do follow-up por toque</h3>
        <FollowupEffectivenessChart data={metrics.followup_effectiveness} />
      </div>
    </>
  )}
</section>
```

Note: this is the third `role="figure"` chart on `/portal/atendimento` (after none in Tasks 17–19, one implicit in Task 20's columns which is not a chart, so this is actually the first chart on this route) — confirm during Task 38's final QA pass that the page still respects "max 1 chart per mobile viewport" by wrapping this section in `hidden md:block` if a mobile user would otherwise see it stacked below the funnel on the same scroll without a section break; do not skip that check.

- [ ] **Step 9: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/common/@types/@portal-attendance.ts src/common/services/portal/portal-attendance-service.ts \
  src/common/hooks/portal/use-attendance-metrics.ts src/components/portal/attendance/followup-effectiveness-chart.tsx \
  src/components/portal/attendance/__tests__/followup-effectiveness-chart.test.tsx src/app/portal/atendimento/page.tsx
git commit -m "feat(portal): build atendimento module métricas (§5.7)

Includes contatos pausados aguardando humano as an operational gargalo
indicator per master doc §5.7. BLOCKED on backend:
GET /portal/attendance/metrics does not exist yet."
```

**Fase 3 complete.**

---

## Fase 4 — Instagram + Conteúdo

Mirrors master doc §8 Fase 4. Instagram OAuth, daily follower snapshots, and the scheduled-posts-vs-own-system spike are backend/product decisions, out of scope — this phase builds the display and calendar UI against documented fixtures.

### Task 24: Bloco Instagram Orgânico (§3.4)

**Files:**
- Create: `src/common/@types/@portal-instagram.ts`
- Create: `src/common/services/portal/portal-instagram-service.ts`
- Create: `src/common/hooks/portal/use-portal-instagram.ts`
- Create: `src/components/portal/instagram/top-posts.tsx`
- Create: `src/app/portal/instagram/page.tsx`
- Test: `src/components/portal/instagram/__tests__/top-posts.test.tsx`

**Interfaces:**
- Consumes: `PortalLineChart` (Task 7), `MetricLabel` (Task 4), `PortalKpiCards`-style card layout pattern (Task 10, not reused directly — different metric set)
- Produces: `InstagramOverview` type, `usePortalInstagram(params)`, `<TopPosts posts />`

**BLOCKED (backend):** `GET /portal/instagram/overview` — depends on Instagram Graph API OAuth sync (master doc §4.1 "CONSTRUIR"), not built.

- [ ] **Step 1: Write `@portal-instagram.ts` types**

Field names mirror the three endpoints listed in master doc §3.4 (`followers_count`, `reach`, `accounts_engaged`, `total_interactions`).

```ts
// src/common/@types/@portal-instagram.ts
export interface InstagramQuery {
  from: string;
  to: string;
}

export interface InstagramPost {
  id: string;
  caption: string | null;
  media_url: string;
  permalink: string;
  like_count: number;
  comments_count: number;
  timestamp: string;
}

export interface InstagramOverview {
  followers_count: number;
  followers_growth: number;
  reach: number;
  engagement: number; // curtidas + comentários + salvamentos + compartilhamentos
  engagement_rate_pct: number;
  daily_reach: { date: string; alcance_organico: number }[];
  top_posts: InstagramPost[];
}
```

- [ ] **Step 2: Implement `portalInstagramService`**

```ts
// src/common/services/portal/portal-instagram-service.ts
import api from '@/src/common/config/api';
import type { InstagramOverview, InstagramQuery } from '@/src/common/@types/@portal-instagram';

export const portalInstagramService = {
  async getOverview(query: InstagramQuery): Promise<InstagramOverview> {
    const response = await api.get<InstagramOverview>('/portal/instagram/overview', { params: query });
    return response.data;
  },
};
```

- [ ] **Step 3: Implement `usePortalInstagram`**

```ts
// src/common/hooks/portal/use-portal-instagram.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalInstagramService } from '@/src/common/services/portal/portal-instagram-service';
import type { InstagramQuery } from '@/src/common/@types/@portal-instagram';

export function usePortalInstagram(query: InstagramQuery) {
  return useQuery({ queryKey: ['portal', 'instagram', query], queryFn: () => portalInstagramService.getOverview(query) });
}
```

- [ ] **Step 4: Write the failing test for `<TopPosts>`**

```tsx
// src/components/portal/instagram/__tests__/top-posts.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopPosts } from '../top-posts';
import type { InstagramPost } from '@/src/common/@types/@portal-instagram';

const posts: InstagramPost[] = [
  { id: 'p1', caption: 'Pôr do sol na varanda', media_url: '/img1.jpg', permalink: 'https://instagram.com/p/1', like_count: 320, comments_count: 12, timestamp: '2026-07-20T18:00:00-03:00' },
];

describe('TopPosts', () => {
  it('renders up to 3 posts with like/comment counts and a link out to Instagram', () => {
    render(<TopPosts posts={posts} />);
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://instagram.com/p/1');
  });

  it('shows an empty state with no posts', () => {
    render(<TopPosts posts={[]} />);
    expect(screen.getByText(/nenhum post/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- top-posts`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<TopPosts>`**

```tsx
// src/components/portal/instagram/top-posts.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import { PortalEmptyState } from '@/src/components/portal/empty-state';
import type { InstagramPost } from '@/src/common/@types/@portal-instagram';

export function TopPosts({ posts }: { posts: InstagramPost[] }) {
  if (posts.length === 0) {
    return (
      <PortalEmptyState
        title="Nenhum post no período"
        description="Assim que houver publicações no Instagram nessas datas, os 3 mais engajados aparecem aqui."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {posts.slice(0, 3).map((post) => (
        <Link key={post.id} href={post.permalink} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border">
          <div className="relative aspect-square w-full">
            <Image src={post.media_url} alt={post.caption ?? 'Post do Instagram'} fill className="object-cover" />
          </div>
          <div className="flex items-center gap-3 p-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Heart className="size-3.5" />{post.like_count}</span>
            <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" />{post.comments_count}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- top-posts`
Expected: PASS (2 tests)

- [ ] **Step 8: Assemble the page**

```tsx
// src/app/portal/instagram/page.tsx
'use client';

import { useState } from 'react';
import { usePortalInstagram } from '@/src/common/hooks/portal/use-portal-instagram';
import { PortalLineChart } from '@/src/components/portal/charts/line-chart';
import { TopPosts } from '@/src/components/portal/instagram/top-posts';
import { MetricLabel } from '@/src/components/portal/glossary/metric-label';
import { Card } from '@/src/components/ui/card';
import { PortalCardSkeleton } from '@/src/components/portal/skeletons';

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function PortalInstagramPage() {
  const [range] = useState(defaultRange);
  const { data, isLoading } = usePortalInstagram(range);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Instagram Orgânico</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <PortalCardSkeleton key={i} />)
        ) : (
          <>
            <Card className="p-4"><MetricLabel metricKey="seguidores" /><p className="text-xl font-semibold">{data!.followers_count.toLocaleString('pt-BR')}</p></Card>
            <Card className="p-4"><MetricLabel metricKey="alcance_organico" /><p className="text-xl font-semibold">{data!.reach.toLocaleString('pt-BR')}</p></Card>
            <Card className="p-4"><MetricLabel metricKey="engajamento" /><p className="text-xl font-semibold">{data!.engagement.toLocaleString('pt-BR')}</p></Card>
            <Card className="p-4"><MetricLabel metricKey="taxa_engajamento" /><p className="text-xl font-semibold">{data!.engagement_rate_pct}%</p></Card>
          </>
        )}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Alcance orgânico por dia</h2>
        <PortalLineChart
          data={data?.daily_reach ?? []}
          xKey="date"
          isLoading={isLoading}
          series={[{ key: 'alcance_organico', label: 'Alcance orgânico', color: '#ec4899' }]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Top 3 posts</h2>
        <TopPosts posts={data?.top_posts ?? []} />
      </section>
    </div>
  );
}
```

- [ ] **Step 9: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/common/@types/@portal-instagram.ts src/common/services/portal/portal-instagram-service.ts \
  src/common/hooks/portal/use-portal-instagram.ts src/components/portal/instagram/ src/app/portal/instagram/page.tsx
git commit -m "feat(portal): build Instagram Orgânico block (§3.4)

BLOCKED on backend: GET /portal/instagram/overview requires the Instagram
Graph API OAuth sync from master doc §4.1, not built yet."
```

---

### Task 25: Calendário de Conteúdo (§3.5)

**Files:**
- Create: `src/common/@types/@portal-content.ts`
- Create: `src/common/services/portal/portal-content-service.ts`
- Create: `src/common/hooks/portal/use-content-calendar.ts`
- Create: `src/components/portal/content/calendar-month-grid.tsx`
- Create: `src/components/portal/content/calendar-week-list.tsx`
- Create: `src/app/portal/calendario/page.tsx`
- Test: `src/components/portal/content/__tests__/calendar-week-list.test.tsx`

**Interfaces:**
- Consumes: `useMediaQuery` (Task 4)
- Produces: `ContentPost` type, `useContentCalendar(month)`, `<CalendarMonthGrid posts month />` (desktop), `<CalendarWeekList posts month />` (mobile)

**BLOCKED (backend):** `GET /portal/content/calendar` — reads `content_posts` (master doc §4.2/§3.5), not built. The desktop/mobile split matches §3.5 exactly: "Visão mensal (mobile: lista por semana)."

- [ ] **Step 1: Write `@portal-content.ts` types**

```ts
// src/common/@types/@portal-content.ts
export type ContentPostStatus = 'draft' | 'scheduled' | 'published';
export type ContentPlatform = 'instagram' | 'facebook';

export interface ContentPost {
  id: string;
  platform: ContentPlatform;
  scheduled_for: string;
  published_at: string | null;
  status: ContentPostStatus;
  caption_preview: string;
  thumbnail_url: string;
  permalink: string | null;
}
```

- [ ] **Step 2: Implement `portalContentService.getCalendar`**

```ts
// src/common/services/portal/portal-content-service.ts
import api from '@/src/common/config/api';
import type { ContentPost } from '@/src/common/@types/@portal-content';

export const portalContentService = {
  async getCalendar(month: string /* YYYY-MM */): Promise<ContentPost[]> {
    const response = await api.get<ContentPost[]>('/portal/content/calendar', { params: { month } });
    return response.data;
  },
};
```

- [ ] **Step 3: Implement `useContentCalendar`**

```ts
// src/common/hooks/portal/use-content-calendar.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalContentService } from '@/src/common/services/portal/portal-content-service';

export function useContentCalendar(month: string) {
  return useQuery({ queryKey: ['portal', 'content', 'calendar', month], queryFn: () => portalContentService.getCalendar(month) });
}
```

- [ ] **Step 4: Write the failing test for `<CalendarWeekList>`** (the mobile-first view, tested first per Global Constraints' mobile-first priority)

```tsx
// src/components/portal/content/__tests__/calendar-week-list.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarWeekList } from '../calendar-week-list';
import type { ContentPost } from '@/src/common/@types/@portal-content';

const posts: ContentPost[] = [
  { id: 'p1', platform: 'instagram', scheduled_for: '2026-08-05T10:00:00-03:00', published_at: null, status: 'scheduled', caption_preview: 'Promoção de inverno', thumbnail_url: '/thumb.jpg', permalink: null },
  { id: 'p2', platform: 'instagram', scheduled_for: '2026-08-12T10:00:00-03:00', published_at: '2026-08-12T10:05:00-03:00', status: 'published', caption_preview: 'Café da manhã', thumbnail_url: '/thumb2.jpg', permalink: 'https://instagram.com/p/2' },
];

describe('CalendarWeekList', () => {
  it('groups posts by week and shows their status', () => {
    render(<CalendarWeekList posts={posts} />);
    expect(screen.getByText('Promoção de inverno')).toBeInTheDocument();
    expect(screen.getByText('Agendado')).toBeInTheDocument();
    expect(screen.getByText('Publicado')).toBeInTheDocument();
  });

  it('links published posts to their permalink', () => {
    render(<CalendarWeekList posts={posts} />);
    expect(screen.getByRole('link', { name: /café da manhã/i })).toHaveAttribute('href', 'https://instagram.com/p/2');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- calendar-week-list`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<CalendarWeekList>`**

```tsx
// src/components/portal/content/calendar-week-list.tsx
import Link from 'next/link';
import { Card } from '@/src/components/ui/card';
import type { ContentPost } from '@/src/common/@types/@portal-content';

const statusLabel: Record<ContentPost['status'], string> = {
  draft: 'Em produção', scheduled: 'Agendado', published: 'Publicado',
};

function weekOfMonth(dateIso: string): number {
  const date = new Date(dateIso);
  return Math.ceil(date.getDate() / 7);
}

export function CalendarWeekList({ posts }: { posts: ContentPost[] }) {
  const byWeek = new Map<number, ContentPost[]>();
  posts.forEach((post) => {
    const week = weekOfMonth(post.scheduled_for);
    byWeek.set(week, [...(byWeek.get(week) ?? []), post]);
  });

  return (
    <div className="space-y-4">
      {Array.from(byWeek.entries()).map(([week, weekPosts]) => (
        <div key={week}>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Semana {week}</p>
          <div className="space-y-2">
            {weekPosts.map((post) => {
              const content = (
                <Card className="flex items-center justify-between p-3">
                  <span className="text-sm">{post.caption_preview}</span>
                  <span className="text-xs text-muted-foreground">{statusLabel[post.status]}</span>
                </Card>
              );
              return post.permalink ? (
                <Link key={post.id} href={post.permalink} target="_blank" rel="noreferrer">{content}</Link>
              ) : (
                <div key={post.id}>{content}</div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- calendar-week-list`
Expected: PASS (2 tests)

- [ ] **Step 8: Implement `<CalendarMonthGrid>`** (desktop only — no dedicated test, a straightforward grid layout consumer-tested via the page assembly)

```tsx
// src/components/portal/content/calendar-month-grid.tsx
import type { ContentPost } from '@/src/common/@types/@portal-content';

const statusColor: Record<ContentPost['status'], string> = {
  draft: 'bg-muted', scheduled: 'bg-amber-100', published: 'bg-emerald-100',
};

export function CalendarMonthGrid({ posts, month }: { posts: ContentPost[]; month: string }) {
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const postsByDay = new Map<number, ContentPost[]>();
  posts.forEach((post) => {
    const day = new Date(post.scheduled_for).getDate();
    postsByDay.set(day, [...(postsByDay.get(day) ?? []), post]);
  });

  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
        <div key={day} className="min-h-20 rounded border border-border p-1 text-xs">
          <span className="text-muted-foreground">{day}</span>
          {(postsByDay.get(day) ?? []).map((post) => (
            <div key={post.id} className={`mt-1 truncate rounded px-1 ${statusColor[post.status]}`}>
              {post.caption_preview}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 9: Assemble the page with the mobile/desktop split**

```tsx
// src/app/portal/calendario/page.tsx
'use client';

import { useState } from 'react';
import { useContentCalendar } from '@/src/common/hooks/portal/use-content-calendar';
import { useMediaQuery } from '@/src/common/hooks/portal/use-media-query';
import { CalendarMonthGrid } from '@/src/components/portal/content/calendar-month-grid';
import { CalendarWeekList } from '@/src/components/portal/content/calendar-week-list';
import { PortalTableSkeleton } from '@/src/components/portal/skeletons';

export default function PortalCalendarioPage() {
  const [month] = useState(() => new Date().toISOString().slice(0, 7));
  const { data: posts, isLoading } = useContentCalendar(month);
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Calendário de Conteúdo</h1>
      {isLoading ? (
        <PortalTableSkeleton rows={8} />
      ) : isMobile ? (
        <CalendarWeekList posts={posts ?? []} />
      ) : (
        <CalendarMonthGrid posts={posts ?? []} month={month} />
      )}
    </div>
  );
}
```

- [ ] **Step 10: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/common/@types/@portal-content.ts src/common/services/portal/portal-content-service.ts \
  src/common/hooks/portal/use-content-calendar.ts src/components/portal/content/ src/app/portal/calendario/page.tsx
git commit -m "feat(portal): build Calendário de Conteúdo (§3.5) — month grid desktop, week list mobile

BLOCKED on backend: GET /portal/content/calendar reads content_posts, not
built yet. §3.5's Meta scheduled-posts-vs-own-system spike is a backend/
product decision, not resolved here — this UI works against either source
since it only consumes the ContentPost shape, not the origin."
```

---

### Task 26: Feed de Atividades (§3.5)

**Files:**
- Modify: `src/common/@types/@portal-content.ts`
- Create: `src/common/services/portal/portal-activity-service.ts`
- Create: `src/common/hooks/portal/use-activity-feed.ts`
- Create: `src/components/portal/activity/activity-feed.tsx`
- Create: `src/app/portal/atividades/page.tsx`
- Modify: `src/app/portal/dashboard/page.tsx` (wire in the deferred preview from Task 10)
- Test: `src/components/portal/activity/__tests__/activity-feed.test.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `ActivityLogEntry` type, `useActivityFeed(limit?)`, `<ActivityFeed limit? />` — the reusable component promised in Task 10's note

**BLOCKED (backend):** `GET /portal/activity` — reads `activity_log` (master doc §4.2), not built.

- [ ] **Step 1: Add `ActivityLogEntry` type**

```ts
// src/common/@types/@portal-content.ts — append
export type ActivityCategory = 'post' | 'campaign' | 'report' | 'bot' | 'meeting' | 'other';

export interface ActivityLogEntry {
  id: string;
  type: 'auto' | 'manual';
  category: ActivityCategory;
  title: string;
  description: string | null;
  occurred_at: string;
}
```

- [ ] **Step 2: Implement `portalActivityService`**

```ts
// src/common/services/portal/portal-activity-service.ts
import api from '@/src/common/config/api';
import type { ActivityLogEntry } from '@/src/common/@types/@portal-content';

export const portalActivityService = {
  async getFeed(limit?: number): Promise<ActivityLogEntry[]> {
    const response = await api.get<ActivityLogEntry[]>('/portal/activity', { params: limit ? { limit } : undefined });
    return response.data;
  },
};
```

- [ ] **Step 3: Implement `useActivityFeed`**

```ts
// src/common/hooks/portal/use-activity-feed.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalActivityService } from '@/src/common/services/portal/portal-activity-service';

export function useActivityFeed(limit?: number) {
  return useQuery({ queryKey: ['portal', 'activity', limit ?? 'all'], queryFn: () => portalActivityService.getFeed(limit) });
}
```

- [ ] **Step 4: Write the failing test for `<ActivityFeed>`**

```tsx
// src/components/portal/activity/__tests__/activity-feed.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '../activity-feed';
import type { ActivityLogEntry } from '@/src/common/@types/@portal-content';

const entries: ActivityLogEntry[] = [
  { id: 'a1', type: 'manual', category: 'meeting', title: 'Reunião de alinhamento realizada', description: null, occurred_at: '2026-08-03T14:00:00-03:00' },
  { id: 'a2', type: 'auto', category: 'report', title: 'Resumo quinzenal publicado', description: null, occurred_at: '2026-08-01T09:00:00-03:00' },
];

describe('ActivityFeed', () => {
  it('renders entries newest first as a reverse timeline', () => {
    render(<ActivityFeed entries={entries} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Reunião de alinhamento realizada');
    expect(items[1]).toHaveTextContent('Resumo quinzenal publicado');
  });

  it('shows an empty state with no entries', () => {
    render(<ActivityFeed entries={[]} />);
    expect(screen.getByText(/nenhuma atividade/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- activity-feed`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<ActivityFeed>`**

Entries are rendered in the order given (server is expected to return newest-first per master doc §3.5 "Timeline reversa de tudo que a Reserve fez" — the component does not re-sort, trusting the API contract, consistent with the rest of this plan not inventing business logic that belongs server-side).

```tsx
// src/components/portal/activity/activity-feed.tsx
import { PortalEmptyState } from '@/src/components/portal/empty-state';
import type { ActivityLogEntry } from '@/src/common/@types/@portal-content';

export function ActivityFeed({ entries }: { entries: ActivityLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <PortalEmptyState
        title="Nenhuma atividade registrada ainda"
        description="Assim que a Reserve publicar um post, ajustar uma campanha ou registrar uma reunião, aparece aqui."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 border-l-2 border-border pl-3">
          <div>
            <p className="text-sm font-medium">{entry.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(entry.occurred_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- activity-feed`
Expected: PASS (2 tests)

- [ ] **Step 8: Build `/portal/atividades` (full feed)**

```tsx
// src/app/portal/atividades/page.tsx
'use client';

import { useActivityFeed } from '@/src/common/hooks/portal/use-activity-feed';
import { ActivityFeed } from '@/src/components/portal/activity/activity-feed';
import { PortalTableSkeleton } from '@/src/components/portal/skeletons';

export default function PortalAtividadesPage() {
  const { data, isLoading } = useActivityFeed();

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Atividades</h1>
      {isLoading ? <PortalTableSkeleton rows={8} /> : <ActivityFeed entries={data ?? []} />}
    </div>
  );
}
```

- [ ] **Step 9: Wire the 5-entry preview into `/portal/dashboard`, closing Task 10's deferred note**

```tsx
// src/app/portal/dashboard/page.tsx — add import and section
import { useActivityFeed } from '@/src/common/hooks/portal/use-activity-feed';
import { ActivityFeed } from '@/src/components/portal/activity/activity-feed';

// inside PortalDashboardPage:
const { data: recentActivities } = useActivityFeed(5);

// JSX, after <LastReportPreview>:
<section>
  <h2 className="mb-2 text-sm font-medium text-muted-foreground">Atividades recentes</h2>
  <ActivityFeed entries={recentActivities ?? []} />
</section>
```

- [ ] **Step 10: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/common/@types/@portal-content.ts src/common/services/portal/portal-activity-service.ts \
  src/common/hooks/portal/use-activity-feed.ts src/components/portal/activity/ \
  src/app/portal/atividades/page.tsx src/app/portal/dashboard/page.tsx
git commit -m "feat(portal): build Feed de Atividades (§3.5) — full page + reusable preview on home

Closes the activity-feed slot deferred in Task 10. BLOCKED on backend:
GET /portal/activity reads activity_log, not built yet."
```

**Fase 4 complete.**

---

## Fase 5 — Narrativa, direção e retenção

Mirrors master doc §8 Fase 5. Baseline-import jobs are backend-only, skipped. Metas configuráveis and bot-config approval are admin-side per Assumption 9 — this phase builds only the client-facing *display* pieces.

### Task 27: Bloco Análise de Retorno — Nível 1 (§3.9)

**Files:**
- Create: `src/common/@types/@portal-roi.ts`
- Create: `src/common/services/portal/portal-roi-service.ts`
- Create: `src/common/hooks/portal/use-portal-roi.ts`
- Create: `src/components/portal/roi/roi-level1-cards.tsx`
- Create: `src/app/portal/retorno/page.tsx`
- Test: `src/components/portal/roi/__tests__/roi-level1-cards.test.tsx`

**Interfaces:**
- Consumes: `VariationBadge` (Task 5, with `invertColor` for `custo_por_conversa`), `PortalLineChart` (Task 7), `AttributionWindowBanner` (Task 14)
- Produces: `RoiLevel1` type, `usePortalRoi(params)`, `<RoiLevel1Cards data />` — consumed by Task 28 (Nível 2, same page) and Task 35 (Nível 3, same page)

**BLOCKED (backend):** `GET /portal/roi/level1`. Nível 1 is available to every client per master doc §3.9 (no bot/reservation-engine dependency).

- [ ] **Step 1: Write `@portal-roi.ts` types**

```ts
// src/common/@types/@portal-roi.ts
export interface RoiQuery {
  from: string;
  to: string;
}

export interface RoiLevel1 {
  investimento_total: number;
  conversas_geradas: number;
  custo_por_conversa: number;
  custo_por_conversa_variation_pct: number;
  custo_por_conversa_history: { date: string; custo_por_conversa: number }[];
}

export interface RoiLevel2 {
  custo_por_lead_qualificado: number;
  custo_por_lead_pronto_fechar: number;
  taxa_qualificacao_pct: number;
  roi_por_campanha: { campaign_id: string; campaign_name: string; custo_por_lead_qualificado: number }[];
}

export interface RoiLevel3 {
  unlocked: boolean;
  receita_atribuida: number | null;
  roas: number | null;
  ticket_medio: number | null;
  taxa_conversao_lead_reserva_pct: number | null;
}
```

- [ ] **Step 2: Implement `portalRoiService`**

```ts
// src/common/services/portal/portal-roi-service.ts
import api from '@/src/common/config/api';
import type { RoiLevel1, RoiLevel2, RoiLevel3, RoiQuery } from '@/src/common/@types/@portal-roi';

export const portalRoiService = {
  async getLevel1(query: RoiQuery): Promise<RoiLevel1> {
    const response = await api.get<RoiLevel1>('/portal/roi/level1', { params: query });
    return response.data;
  },
  async getLevel2(query: RoiQuery): Promise<RoiLevel2> {
    const response = await api.get<RoiLevel2>('/portal/roi/level2', { params: query });
    return response.data;
  },
  async getLevel3(query: RoiQuery): Promise<RoiLevel3> {
    const response = await api.get<RoiLevel3>('/portal/roi/level3', { params: query });
    return response.data;
  },
};
```

- [ ] **Step 3: Implement `usePortalRoi`**

```ts
// src/common/hooks/portal/use-portal-roi.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalRoiService } from '@/src/common/services/portal/portal-roi-service';
import type { RoiQuery } from '@/src/common/@types/@portal-roi';

export function useRoiLevel1(query: RoiQuery) {
  return useQuery({ queryKey: ['portal', 'roi', 'level1', query], queryFn: () => portalRoiService.getLevel1(query) });
}

export function useRoiLevel2(query: RoiQuery, enabled: boolean) {
  return useQuery({ queryKey: ['portal', 'roi', 'level2', query], queryFn: () => portalRoiService.getLevel2(query), enabled });
}

export function useRoiLevel3(query: RoiQuery) {
  return useQuery({ queryKey: ['portal', 'roi', 'level3', query], queryFn: () => portalRoiService.getLevel3(query) });
}
```

- [ ] **Step 4: Write the failing test for `<RoiLevel1Cards>`**

Verifies the plan's non-negotiable rule from master doc §3.9: "custo por conversa em queda é positivo — inverter a lógica de cor."

```tsx
// src/components/portal/roi/__tests__/roi-level1-cards.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoiLevel1Cards } from '../roi-level1-cards';
import type { RoiLevel1 } from '@/src/common/@types/@portal-roi';

const data: RoiLevel1 = {
  investimento_total: 3200, conversas_geradas: 140, custo_por_conversa: 22.86,
  custo_por_conversa_variation_pct: -12, custo_por_conversa_history: [{ date: '01/07', custo_por_conversa: 26 }],
};

describe('RoiLevel1Cards', () => {
  it('renders a falling cost per conversation in green, not red', () => {
    render(<RoiLevel1Cards data={data} />);
    const badge = screen.getByText('-12%');
    expect(badge).toHaveClass('text-emerald-600');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- roi-level1-cards`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<RoiLevel1Cards>`**

```tsx
// src/components/portal/roi/roi-level1-cards.tsx
import { Card } from '@/src/components/ui/card';
import { VariationBadge } from '@/src/components/portal/variation-badge';
import { PortalLineChart } from '@/src/components/portal/charts/line-chart';
import type { RoiLevel1 } from '@/src/common/@types/@portal-roi';

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function RoiLevel1Cards({ data }: { data: RoiLevel1 }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-muted-foreground">Investimento total</p><p className="text-xl font-semibold">{currency(data.investimento_total)}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Conversas geradas</p><p className="text-xl font-semibold">{data.conversas_geradas}</p></Card>
        <Card className="space-y-1 p-4">
          <p className="text-sm text-muted-foreground">Custo por conversa</p>
          <p className="text-xl font-semibold">{currency(data.custo_por_conversa)}</p>
          <VariationBadge value={data.custo_por_conversa_variation_pct} invertColor />
        </Card>
      </div>
      <div>
        <h3 className="mb-2 text-xs text-muted-foreground">Evolução do custo por conversa</h3>
        <PortalLineChart
          data={data.custo_por_conversa_history}
          xKey="date"
          series={[{ key: 'custo_por_conversa', label: 'Custo por conversa', color: '#0ea5e9' }]}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- roi-level1-cards`
Expected: PASS

- [ ] **Step 8: Start the `/portal/retorno` page**

```tsx
// src/app/portal/retorno/page.tsx
'use client';

import { useState } from 'react';
import { useRoiLevel1 } from '@/src/common/hooks/portal/use-portal-roi';
import { RoiLevel1Cards } from '@/src/components/portal/roi/roi-level1-cards';
import { AttributionWindowBanner } from '@/src/components/portal/attribution-window-banner';
import { PortalCardSkeleton } from '@/src/components/portal/skeletons';

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function PortalRetornoPage() {
  const [range] = useState(defaultRange);
  const { data: level1, isLoading: level1Loading } = useRoiLevel1(range);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Análise de Retorno</h1>
      <AttributionWindowBanner windowDays={30} />
      {level1Loading ? <PortalCardSkeleton /> : <RoiLevel1Cards data={level1!} />}
      {/* Nível 2 (Task 28) and Nível 3 (Task 35) sections are appended below in later tasks */}
    </div>
  );
}
```

- [ ] **Step 9: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/common/@types/@portal-roi.ts src/common/services/portal/portal-roi-service.ts \
  src/common/hooks/portal/use-portal-roi.ts src/components/portal/roi/roi-level1-cards.tsx \
  src/components/portal/roi/__tests__/roi-level1-cards.test.tsx src/app/portal/retorno/page.tsx
git commit -m "feat(portal): build Análise de Retorno Nível 1 (§3.9) — available to every client

Falling custo por conversa renders green (master doc §3.9 inegociável rule,
verified by test). BLOCKED on backend: GET /portal/roi/level1 does not
exist yet."
```

---

### Task 28: Bloco Análise de Retorno — Nível 2 (bot ativo)

**Files:**
- Create: `src/components/portal/roi/roi-level2-cards.tsx`
- Modify: `src/app/portal/retorno/page.tsx`
- Test: `src/components/portal/roi/__tests__/roi-level2-cards.test.tsx`

**Interfaces:**
- Consumes: `usePortalChannels` (Task 17, to detect whether the bot is active — Nível 2 is gated on that, per master doc §3.9 "cliente com bot ativo")
- Produces: `<RoiLevel2Cards data />`

**BLOCKED (backend):** `GET /portal/roi/level2`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/portal/roi/__tests__/roi-level2-cards.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoiLevel2Cards } from '../roi-level2-cards';
import type { RoiLevel2 } from '@/src/common/@types/@portal-roi';

const data: RoiLevel2 = {
  custo_por_lead_qualificado: 45, custo_por_lead_pronto_fechar: 120, taxa_qualificacao_pct: 38,
  roi_por_campanha: [{ campaign_id: 'c1', campaign_name: 'Verão 2026', custo_por_lead_qualificado: 40 }],
};

describe('RoiLevel2Cards', () => {
  it('renders qualification cost, ready-to-close cost, and per-campaign ROI', () => {
    render(<RoiLevel2Cards data={data} />);
    expect(screen.getByText(/qualificação/i)).toBeInTheDocument();
    expect(screen.getByText('Verão 2026')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- roi-level2-cards`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `<RoiLevel2Cards>`**

```tsx
// src/components/portal/roi/roi-level2-cards.tsx
import { Card } from '@/src/components/ui/card';
import { PortalDataTable, type PortalDataTableColumn } from '@/src/components/portal/data-table';
import type { RoiLevel2 } from '@/src/common/@types/@portal-roi';

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: PortalDataTableColumn<RoiLevel2['roi_por_campanha'][number]>[] = [
  { key: 'campaign_name', header: 'Campanha', render: (r) => r.campaign_name },
  { key: 'custo_por_lead_qualificado', header: 'Custo por lead qualificado', render: (r) => currency(r.custo_por_lead_qualificado) },
];

export function RoiLevel2Cards({ data }: { data: RoiLevel2 }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-muted-foreground">Custo por lead qualificado</p><p className="text-xl font-semibold">{currency(data.custo_por_lead_qualificado)}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Custo por lead pronto para fechar</p><p className="text-xl font-semibold">{currency(data.custo_por_lead_pronto_fechar)}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Taxa de qualificação</p><p className="text-xl font-semibold">{data.taxa_qualificacao_pct}%</p></Card>
      </div>
      <div>
        <h3 className="mb-2 text-xs text-muted-foreground">Retorno por campanha</h3>
        <PortalDataTable columns={columns} rows={data.roi_por_campanha} getRowKey={(r) => r.campaign_id} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- roi-level2-cards`
Expected: PASS

- [ ] **Step 5: Gate and wire Nível 2 into `/portal/retorno`**

```tsx
// src/app/portal/retorno/page.tsx — add
import { useRoiLevel2 } from '@/src/common/hooks/portal/use-portal-roi';
import { RoiLevel2Cards } from '@/src/components/portal/roi/roi-level2-cards';
import { usePortalChannels } from '@/src/common/hooks/portal/use-portal-channels';

// inside the component:
const { data: channels } = usePortalChannels();
const botActive = channels?.find((c) => c.kind === 'whatsapp')?.bot_active ?? false;
const { data: level2, isLoading: level2Loading } = useRoiLevel2(range, botActive);

// JSX, after the Nível 1 section:
{botActive && (
  <section>
    <h2 className="mb-2 text-sm font-medium text-muted-foreground">Com o atendimento automatizado</h2>
    {level2Loading ? <PortalCardSkeleton /> : level2 && <RoiLevel2Cards data={level2} />}
  </section>
)}
```

- [ ] **Step 6: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/portal/roi/roi-level2-cards.tsx src/components/portal/roi/__tests__/roi-level2-cards.test.tsx \
  src/app/portal/retorno/page.tsx
git commit -m "feat(portal): add Análise de Retorno Nível 2 — gated on bot ativo (§3.9)

Nível 2 only renders when usePortalChannels reports the WhatsApp bot as
active, matching master doc §3.9's layered rule. BLOCKED on backend:
GET /portal/roi/level2 does not exist yet."
```

---

### Task 29: `<GoalProgress>` — client-facing goal display

**Files:**
- Create: `src/common/@types/@portal-goals.ts`
- Create: `src/common/services/portal/portal-goals-service.ts`
- Create: `src/common/hooks/portal/use-metric-goals.ts`
- Create: `src/components/portal/goal-progress.tsx`
- Modify: `src/app/portal/dashboard/page.tsx`
- Test: `src/components/portal/__tests__/goal-progress.test.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `MetricGoal` type, `useMetricGoals()`, `<GoalProgress goal currentValue />`

Per Assumption 9, only the **display** is built here — configuring `show_goal`/`target_value` is an admin-side feature, out of scope.

**BLOCKED (backend):** `GET /portal/goals` — reads `metric_goals` (master doc §4.2).

- [ ] **Step 1: Write `@portal-goals.ts` types**

```ts
// src/common/@types/@portal-goals.ts
export interface MetricGoal {
  metric_key: string;
  period: 'biweekly' | 'monthly';
  target_value: number;
  show_goal: boolean;
}
```

- [ ] **Step 2: Implement `portalGoalsService`**

```ts
// src/common/services/portal/portal-goals-service.ts
import api from '@/src/common/config/api';
import type { MetricGoal } from '@/src/common/@types/@portal-goals';

export const portalGoalsService = {
  async getGoals(): Promise<MetricGoal[]> {
    const response = await api.get<MetricGoal[]>('/portal/goals');
    return response.data;
  },
};
```

- [ ] **Step 3: Implement `useMetricGoals`**

```ts
// src/common/hooks/portal/use-metric-goals.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalGoalsService } from '@/src/common/services/portal/portal-goals-service';

export function useMetricGoals() {
  return useQuery({ queryKey: ['portal', 'goals'], queryFn: portalGoalsService.getGoals });
}
```

- [ ] **Step 4: Write the failing test for `<GoalProgress>`**

Default per master doc §2 Decisão 3: goal is shown only for WhatsApp leads unless `show_goal` says otherwise — the component itself doesn't special-case the metric key, it just respects whatever `show_goal` the caller passes, keeping the default-metric decision in the data, not hardcoded in the component.

```tsx
// src/components/portal/__tests__/goal-progress.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoalProgress } from '../goal-progress';

describe('GoalProgress', () => {
  it('renders progress toward the goal when show_goal is true', () => {
    render(<GoalProgress goal={{ metric_key: 'conversas_iniciadas', period: 'biweekly', target_value: 60, show_goal: true }} currentValue={42} />);
    expect(screen.getByText(/42.*60/)).toBeInTheDocument();
  });

  it('renders nothing when show_goal is false', () => {
    const { container } = render(<GoalProgress goal={{ metric_key: 'investimento', period: 'biweekly', target_value: 5000, show_goal: false }} currentValue={3000} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- goal-progress`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<GoalProgress>`**

```tsx
// src/components/portal/goal-progress.tsx
import type { MetricGoal } from '@/src/common/@types/@portal-goals';

export function GoalProgress({ goal, currentValue }: { goal: MetricGoal; currentValue: number }) {
  if (!goal.show_goal) return null;

  const pct = Math.min((currentValue / goal.target_value) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {currentValue.toLocaleString('pt-BR')} de {goal.target_value.toLocaleString('pt-BR')} na meta
      </p>
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- goal-progress`
Expected: PASS (2 tests)

- [ ] **Step 8: Wire into the Home KPI card for `conversas_iniciadas`**

```tsx
// src/app/portal/dashboard/page.tsx — add import and usage
import { useMetricGoals } from '@/src/common/hooks/portal/use-metric-goals';
import { GoalProgress } from '@/src/components/portal/goal-progress';

// inside the component:
const { data: goals } = useMetricGoals();

// JSX, right after <PortalKpiCards ...>:
{goals?.filter((g) => g.show_goal).map((goal) => {
  const metric = data?.headline_metrics.find((m) => m.metric_key === goal.metric_key);
  return metric ? <GoalProgress key={goal.metric_key} goal={goal} currentValue={metric.current_value} /> : null;
})}
```

- [ ] **Step 9: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/common/@types/@portal-goals.ts src/common/services/portal/portal-goals-service.ts \
  src/common/hooks/portal/use-metric-goals.ts src/components/portal/goal-progress.tsx \
  src/components/portal/__tests__/goal-progress.test.tsx src/app/portal/dashboard/page.tsx
git commit -m "feat(portal): add GoalProgress — client-facing display only (§2 Decisão 3)

Configuring metric_goals is admin-side, out of scope (plan Assumption 9).
BLOCKED on backend: GET /portal/goals does not exist yet."
```

---

### Task 30: Bloco Relatórios (§3.7) — list + reading page

**Files:**
- Create: `src/common/@types/@portal-reports.ts`
- Create: `src/common/services/portal/portal-reports-service.ts`
- Create: `src/common/hooks/portal/use-portal-reports.ts`
- Create: `src/components/portal/reports/report-card.tsx`
- Create: `src/app/portal/relatorios/page.tsx`
- Create: `src/app/portal/relatorios/[id]/page.tsx`
- Test: `src/components/portal/reports/__tests__/report-card.test.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `PortalReport` type, `usePortalReports()`, `usePortalReport(id)`, `<ReportCard report />` — the `/portal/relatorios/[id]` route is the digest email's CTA target (Task 31 verifies this)

**BLOCKED (backend):** master doc §4.1 lists "Relatórios com rascunho/publicação" as **already existing** — but as an admin-side drafting flow. This task needs a **client-scoped, published-only, read-only** endpoint, which does not exist yet (Assumption 6).

- [ ] **Step 1: Write `@portal-reports.ts` types**

Structure follows master doc §3.7's fixed 4-paragraph shape.

```ts
// src/common/@types/@portal-reports.ts
export interface PortalReportSummary {
  id: string;
  title: string;
  excerpt: string;
  period_start: string;
  period_end: string;
  published_at: string;
}

export interface PortalReport extends PortalReportSummary {
  o_que_aconteceu: string;
  por_que_aconteceu: string;
  proximo_ciclo: string;
  destaque: string | null;
}
```

- [ ] **Step 2: Implement `portalReportsService`**

```ts
// src/common/services/portal/portal-reports-service.ts
import api from '@/src/common/config/api';
import type { PortalReport, PortalReportSummary } from '@/src/common/@types/@portal-reports';

export const portalReportsService = {
  async list(): Promise<PortalReportSummary[]> {
    const response = await api.get<PortalReportSummary[]>('/portal/reports');
    return response.data;
  },
  async getById(id: string): Promise<PortalReport> {
    const response = await api.get<PortalReport>(`/portal/reports/${id}`);
    return response.data;
  },
};
```

- [ ] **Step 3: Implement the hooks**

```ts
// src/common/hooks/portal/use-portal-reports.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalReportsService } from '@/src/common/services/portal/portal-reports-service';

export function usePortalReports() {
  return useQuery({ queryKey: ['portal', 'reports'], queryFn: portalReportsService.list });
}

export function usePortalReport(id: string) {
  return useQuery({ queryKey: ['portal', 'reports', id], queryFn: () => portalReportsService.getById(id), enabled: Boolean(id) });
}
```

- [ ] **Step 4: Write the failing test for `<ReportCard>`**

```tsx
// src/components/portal/reports/__tests__/report-card.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportCard } from '../report-card';
import type { PortalReportSummary } from '@/src/common/@types/@portal-reports';

const report: PortalReportSummary = {
  id: 'r1', title: 'Resumo — 16 a 31 de julho', excerpt: 'Conversas subiram 20%…',
  period_start: '2026-07-16', period_end: '2026-07-31', published_at: '2026-08-01T09:00:00-03:00',
};

describe('ReportCard', () => {
  it('links to the report reading page', () => {
    render(<ReportCard report={report} />);
    expect(screen.getByRole('link', { name: /resumo — 16 a 31 de julho/i })).toHaveAttribute('href', '/portal/relatorios/r1');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- report-card`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<ReportCard>`**

```tsx
// src/components/portal/reports/report-card.tsx
import Link from 'next/link';
import { Card } from '@/src/components/ui/card';
import type { PortalReportSummary } from '@/src/common/@types/@portal-reports';

export function ReportCard({ report }: { report: PortalReportSummary }) {
  return (
    <Link href={`/portal/relatorios/${report.id}`}>
      <Card className="space-y-1 p-4 transition hover:border-primary">
        <p className="font-medium">{report.title}</p>
        <p className="text-sm text-muted-foreground">{report.excerpt}</p>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- report-card`
Expected: PASS

- [ ] **Step 8: Build the list page**

```tsx
// src/app/portal/relatorios/page.tsx
'use client';

import { usePortalReports } from '@/src/common/hooks/portal/use-portal-reports';
import { ReportCard } from '@/src/components/portal/reports/report-card';
import { PortalEmptyState } from '@/src/components/portal/empty-state';
import { PortalTableSkeleton } from '@/src/components/portal/skeletons';

export default function PortalRelatoriosPage() {
  const { data: reports, isLoading } = usePortalReports();

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Relatórios</h1>
      {isLoading ? (
        <PortalTableSkeleton rows={4} />
      ) : reports && reports.length > 0 ? (
        <div className="space-y-3">{reports.map((r) => <ReportCard key={r.id} report={r} />)}</div>
      ) : (
        <PortalEmptyState
          title="Nenhum relatório publicado ainda"
          description="A cada quinze dias a Reserve publica um resumo explicando os resultados — o primeiro aparece aqui."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 9: Build the reading page** (matches master doc §3.7's fixed 4-part structure exactly)

```tsx
// src/app/portal/relatorios/[id]/page.tsx
'use client';

import { use } from 'react';
import { usePortalReport } from '@/src/common/hooks/portal/use-portal-reports';
import { PortalTableSkeleton } from '@/src/components/portal/skeletons';

export default function PortalReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: report, isLoading } = usePortalReport(id);

  if (isLoading || !report) return <div className="p-4 md:p-6"><PortalTableSkeleton rows={6} /></div>;

  return (
    <article className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">{report.title}</h1>
      <p className="text-sm text-muted-foreground">
        {new Date(report.period_start).toLocaleDateString('pt-BR')} a {new Date(report.period_end).toLocaleDateString('pt-BR')}
      </p>
      <section><p>{report.o_que_aconteceu}</p></section>
      <section><p>{report.por_que_aconteceu}</p></section>
      <section><p>{report.proximo_ciclo}</p></section>
      {report.destaque && <section className="rounded-md bg-muted p-3"><p>{report.destaque}</p></section>}
    </article>
  );
}
```

- [ ] **Step 10: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/common/@types/@portal-reports.ts src/common/services/portal/portal-reports-service.ts \
  src/common/hooks/portal/use-portal-reports.ts src/components/portal/reports/ \
  src/app/portal/relatorios/page.tsx "src/app/portal/relatorios/[id]/page.tsx"
git commit -m "feat(portal): build Relatórios list + reading page (§3.7)

Needs a new client-scoped, published-only read endpoint distinct from the
existing admin drafting flow (plan Assumption 6). BLOCKED on backend:
GET /portal/reports(/:id) does not exist yet."
```

---

### Task 31: Digest email CTA target verification

**Files:**
- Modify: `src/app/portal/relatorios/[id]/page.tsx` (no code change expected — verification task)
- Test: `src/app/portal/relatorios/__tests__/digest-deep-link.test.tsx`

**Interfaces:**
- Consumes: `PortalReportDetailPage` (Task 30)
- Produces: nothing new — confirms the contract the digest email's CTA link depends on

Per Assumption 6, the digest job itself (assembling and sending the email) is backend + `reserve-mailer` — this task's only job is to pin down, in a test, that `/portal/relatorios/[id]` is a stable, unauthenticated-redirect-safe target: an unauthenticated visitor following the email CTA lands on `/portal/login`, not a 404, and after logging in should return to the report (a common "return-to" pattern this task flags rather than silently deep-implements, since it touches the auth flow built in Task 1).

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/portal/relatorios/__tests__/digest-deep-link.test.tsx
import { describe, expect, it } from 'vitest';
import { resolvePortalRedirect } from '@/src/common/lib/portal/resolve-portal-redirect';

describe('digest email CTA deep link contract', () => {
  it('routes an unauthenticated visitor clicking the digest CTA to /portal/login, not a 404', () => {
    expect(resolvePortalRedirect('/portal/relatorios/r1', false)).toBe('/portal/login');
  });

  it('does not redirect an authenticated visitor away from the report', () => {
    expect(resolvePortalRedirect('/portal/relatorios/r1', true)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `npm run test:run -- digest-deep-link`
Expected: this should already PASS given Task 1's `resolvePortalRedirect` implementation (any `/portal/*` path redirects unauthenticated visitors to login) — if it fails, `resolvePortalRedirect` regressed and must be fixed before proceeding, since that would mean every portal deep link (not just the digest's) is broken.

- [ ] **Step 3: Flag the return-to gap explicitly (not implemented here)**

Today, `usePortalAuth.login` (Task 1) always redirects to `/portal/dashboard` after login, dropping the original deep-linked report. **Needs a product decision:** is losing the original link on first login acceptable (the client can navigate to `/portal/relatorios` manually), or does `usePortalAuth` need a `?next=` query param round-trip? Document this as an open item rather than guessing — a `?next=` param is a small, mechanical follow-up once decided (capture the query string in `resolvePortalRedirect`'s login redirect and read it back in `usePortalAuth.login`).

- [ ] **Step 4: Commit**

```bash
git add src/app/portal/relatorios/__tests__/digest-deep-link.test.tsx
git commit -m "test(portal): pin down the digest email CTA deep-link contract (§3.7.1)

Confirms /portal/relatorios/[id] redirects unauthenticated visitors to
login rather than 404ing. Flags the post-login return-to-report gap as an
open product question rather than guessing at a ?next= implementation."
```

---

### Task 32: Linha do Tempo / Antes e Depois (§3.6)

**Files:**
- Create: `src/common/@types/@portal-timeline.ts`
- Create: `src/common/services/portal/portal-timeline-service.ts`
- Create: `src/common/hooks/portal/use-portal-timeline.ts`
- Create: `src/components/portal/timeline/milestone-list.tsx`
- Create: `src/components/portal/timeline/future-plans.tsx`
- Create: `src/app/portal/evolucao/page.tsx`
- Test: `src/components/portal/timeline/__tests__/milestone-list.test.tsx`

**Interfaces:**
- Consumes: `PortalLineChart` (Task 7, for the baseline series with marco-zero highlight)
- Produces: `Milestone`/`FuturePlan` types, `usePortalTimeline()`, `<MilestoneList milestones />`, `<FuturePlans plans />`

**BLOCKED (backend):** `GET /portal/timeline` — reads `milestones`/`future_plans` and the baseline-import job's output (master doc §4.2), none built.

- [ ] **Step 1: Write `@portal-timeline.ts` types**

```ts
// src/common/@types/@portal-timeline.ts
export type MilestoneType = 'marco_zero' | 'seguidor' | 'campanha' | 'bot' | 'recorde' | 'custom';

export interface Milestone {
  id: string;
  date: string;
  title: string;
  type: MilestoneType;
}

export interface FuturePlan {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface BaselineSeriesPoint {
  date: string;
  conversas_iniciadas: number;
  /** true for the point marking marco zero — used to render the highlight */
  is_marco_zero?: boolean;
}

export interface TimelineResponse {
  milestones: Milestone[];
  future_plans: FuturePlan[];
  baseline_series: BaselineSeriesPoint[];
}
```

- [ ] **Step 2: Implement `portalTimelineService`**

```ts
// src/common/services/portal/portal-timeline-service.ts
import api from '@/src/common/config/api';
import type { TimelineResponse } from '@/src/common/@types/@portal-timeline';

export const portalTimelineService = {
  async getTimeline(): Promise<TimelineResponse> {
    const response = await api.get<TimelineResponse>('/portal/timeline');
    return response.data;
  },
};
```

- [ ] **Step 3: Implement `usePortalTimeline`**

```ts
// src/common/hooks/portal/use-portal-timeline.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalTimelineService } from '@/src/common/services/portal/portal-timeline-service';

export function usePortalTimeline() {
  return useQuery({ queryKey: ['portal', 'timeline'], queryFn: portalTimelineService.getTimeline });
}
```

- [ ] **Step 4: Write the failing test for `<MilestoneList>`**

```tsx
// src/components/portal/timeline/__tests__/milestone-list.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MilestoneList } from '../milestone-list';
import type { Milestone } from '@/src/common/@types/@portal-timeline';

const milestones: Milestone[] = [
  { id: 'm0', date: '2026-01-10', title: 'Início da Reserve', type: 'marco_zero' },
  { id: 'm1', date: '2026-03-15', title: '10.000 seguidores', type: 'seguidor' },
];

describe('MilestoneList', () => {
  it('highlights marco zero distinctly from other milestones', () => {
    render(<MilestoneList milestones={milestones} />);
    expect(screen.getByTestId('milestone-m0')).toHaveAttribute('data-marco-zero', 'true');
    expect(screen.getByTestId('milestone-m1')).toHaveAttribute('data-marco-zero', 'false');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- milestone-list`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<MilestoneList>`**

```tsx
// src/components/portal/timeline/milestone-list.tsx
import { cn } from '@/src/common/lib/utils';
import type { Milestone } from '@/src/common/@types/@portal-timeline';

export function MilestoneList({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="space-y-3">
      {milestones.map((milestone) => {
        const isMarcoZero = milestone.type === 'marco_zero';
        return (
          <li
            key={milestone.id}
            data-testid={`milestone-${milestone.id}`}
            data-marco-zero={isMarcoZero}
            className={cn('rounded-md border-l-4 p-3', isMarcoZero ? 'border-primary bg-primary/5 font-semibold' : 'border-border')}
          >
            <p className="text-xs text-muted-foreground">{new Date(milestone.date).toLocaleDateString('pt-BR')}</p>
            <p>{milestone.title}</p>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- milestone-list`
Expected: PASS

- [ ] **Step 8: Implement `<FuturePlans>`**

```tsx
// src/components/portal/timeline/future-plans.tsx
import { Card } from '@/src/components/ui/card';
import type { FuturePlan } from '@/src/common/@types/@portal-timeline';

export function FuturePlans({ plans }: { plans: FuturePlan[] }) {
  return (
    <div className="space-y-2">
      {[...plans].sort((a, b) => a.order - b.order).map((plan) => (
        <Card key={plan.id} className="p-3">
          <p className="font-medium">{plan.title}</p>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 9: Assemble the page**

```tsx
// src/app/portal/evolucao/page.tsx
'use client';

import { usePortalTimeline } from '@/src/common/hooks/portal/use-portal-timeline';
import { PortalLineChart } from '@/src/components/portal/charts/line-chart';
import { MilestoneList } from '@/src/components/portal/timeline/milestone-list';
import { FuturePlans } from '@/src/components/portal/timeline/future-plans';
import { PortalChartSkeleton } from '@/src/components/portal/skeletons';

export default function PortalEvolucaoPage() {
  const { data, isLoading } = usePortalTimeline();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Linha do Tempo</h1>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Conversas desde o início</h2>
        {isLoading ? <PortalChartSkeleton /> : (
          <PortalLineChart
            data={data?.baseline_series ?? []}
            xKey="date"
            series={[{ key: 'conversas_iniciadas', label: 'Conversas iniciadas', color: '#0ea5e9' }]}
          />
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Marcos</h2>
        <MilestoneList milestones={data?.milestones ?? []} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Planos futuros</h2>
        <FuturePlans plans={data?.future_plans ?? []} />
      </section>
    </div>
  );
}
```

Note: the chart itself does not visually distinguish the `is_marco_zero` point (Recharts's `Line` has no per-point styling in this wrapper) — the marco-zero highlight master doc §3.6 asks for ("destacada em todos os gráficos de longo prazo") is only carried by `<MilestoneList>` here. **Flag as a follow-up**: either extend `<PortalLineChart>` with an optional `referenceLineX` prop (Recharts' `ReferenceLine`) to draw a vertical marker at the marco-zero date, or accept that the milestone list is sufficient. Not resolved here to avoid guessing at a shared-primitive change (Task 7) this late without confirming other charts want it too.

- [ ] **Step 10: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/common/@types/@portal-timeline.ts src/common/services/portal/portal-timeline-service.ts \
  src/common/hooks/portal/use-portal-timeline.ts src/components/portal/timeline/ src/app/portal/evolucao/page.tsx
git commit -m "feat(portal): build Linha do Tempo / Antes e Depois (§3.6)

Marco-zero highlight lives in MilestoneList; flagged a follow-up decision
on whether PortalLineChart needs a referenceLineX prop for chart-level
highlighting. BLOCKED on backend: GET /portal/timeline does not exist yet."
```

---

### Task 33: Plano Semestral (§3.11)

**Files:**
- Create: `src/common/@types/@portal-plan.ts`
- Create: `src/common/services/portal/portal-plan-service.ts`
- Create: `src/common/hooks/portal/use-portal-plan.ts`
- Create: `src/components/portal/plan/plan-timeline-desktop.tsx`
- Create: `src/components/portal/plan/plan-list-mobile.tsx`
- Create: `src/app/portal/plano/page.tsx`
- Test: `src/components/portal/plan/__tests__/plan-list-mobile.test.tsx`

**Interfaces:**
- Consumes: `useMediaQuery` (Task 4)
- Produces: `SemesterPlan`/`PlanDelivery` types, `usePortalPlan()`, `<PlanTimelineDesktop plan />`, `<PlanListMobile plan />`

**BLOCKED (backend):** `GET /portal/plan` — reads `plano_semestral`/`plano_entregas` (master doc §4.2/§3.11), not built.

- [ ] **Step 1: Write `@portal-plan.ts` types**

```ts
// src/common/@types/@portal-plan.ts
export type DeliveryStatus = 'planejado' | 'em_andamento' | 'concluido';

export interface PlanDelivery {
  id: string;
  mes: string; // e.g. "2026-08"
  titulo: string;
  descricao: string;
  status: DeliveryStatus;
  milestone_id: string | null;
  ordem: number;
}

export interface SemesterPlan {
  id: string;
  semestre: string; // e.g. "2026-2"
  titulo: string;
  eixos: string[]; // eixos estratégicos
  entregas: PlanDelivery[];
}
```

- [ ] **Step 2: Implement `portalPlanService`**

```ts
// src/common/services/portal/portal-plan-service.ts
import api from '@/src/common/config/api';
import type { SemesterPlan } from '@/src/common/@types/@portal-plan';

export const portalPlanService = {
  async getCurrent(): Promise<SemesterPlan> {
    const response = await api.get<SemesterPlan>('/portal/plan/current');
    return response.data;
  },
};
```

- [ ] **Step 3: Implement `usePortalPlan`**

```ts
// src/common/hooks/portal/use-portal-plan.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { portalPlanService } from '@/src/common/services/portal/portal-plan-service';

export function usePortalPlan() {
  return useQuery({ queryKey: ['portal', 'plan', 'current'], queryFn: portalPlanService.getCurrent });
}
```

- [ ] **Step 4: Write the failing test for `<PlanListMobile>`** (mobile-first — tested before the desktop timeline variant)

```tsx
// src/components/portal/plan/__tests__/plan-list-mobile.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlanListMobile } from '../plan-list-mobile';
import type { SemesterPlan } from '@/src/common/@types/@portal-plan';

const plan: SemesterPlan = {
  id: 'p1', semestre: '2026-2', titulo: 'Segundo semestre 2026',
  eixos: ['Aquisição direta', 'Automação de atendimento'],
  entregas: [
    { id: 'd1', mes: '2026-08', titulo: 'Ativar bot de qualificação', descricao: 'Configurar e validar', status: 'em_andamento', milestone_id: null, ordem: 1 },
    { id: 'd2', mes: '2026-09', titulo: 'Campanha de alta temporada', descricao: 'Planejar e lançar', status: 'planejado', milestone_id: null, ordem: 1 },
  ],
};

describe('PlanListMobile', () => {
  it('groups deliveries by month and shows status', () => {
    render(<PlanListMobile plan={plan} />);
    expect(screen.getByText('Ativar bot de qualificação')).toBeInTheDocument();
    expect(screen.getByText('em andamento')).toBeInTheDocument();
    expect(screen.getByText('Campanha de alta temporada')).toBeInTheDocument();
  });

  it('lists the eixos estratégicos', () => {
    render(<PlanListMobile plan={plan} />);
    expect(screen.getByText('Aquisição direta')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test:run -- plan-list-mobile`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `<PlanListMobile>`**

```tsx
// src/components/portal/plan/plan-list-mobile.tsx
import { Card } from '@/src/components/ui/card';
import type { DeliveryStatus, SemesterPlan } from '@/src/common/@types/@portal-plan';

const statusLabel: Record<DeliveryStatus, string> = {
  planejado: 'planejado', em_andamento: 'em andamento', concluido: 'concluído',
};

export function PlanListMobile({ plan }: { plan: SemesterPlan }) {
  const byMonth = new Map<string, typeof plan.entregas>();
  plan.entregas.forEach((entrega) => {
    byMonth.set(entrega.mes, [...(byMonth.get(entrega.mes) ?? []), entrega]);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {plan.eixos.map((eixo) => (
          <span key={eixo} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium">{eixo}</span>
        ))}
      </div>
      {Array.from(byMonth.entries()).map(([mes, entregas]) => (
        <div key={mes}>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{mes}</p>
          <div className="space-y-2">
            {entregas.map((entrega) => (
              <Card key={entrega.id} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{entrega.titulo}</p>
                  <span className="text-xs text-muted-foreground">{statusLabel[entrega.status]}</span>
                </div>
                <p className="text-sm text-muted-foreground">{entrega.descricao}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- plan-list-mobile`
Expected: PASS (2 tests)

- [ ] **Step 8: Implement `<PlanTimelineDesktop>`** (horizontal timeline, no dedicated test — a straightforward layout variant of the same data already covered by Step 4's fixture, consumer-tested via the page)

```tsx
// src/components/portal/plan/plan-timeline-desktop.tsx
import { Card } from '@/src/components/ui/card';
import type { DeliveryStatus, SemesterPlan } from '@/src/common/@types/@portal-plan';

const statusColor: Record<DeliveryStatus, string> = {
  planejado: 'border-border', em_andamento: 'border-amber-500', concluido: 'border-emerald-500',
};

export function PlanTimelineDesktop({ plan }: { plan: SemesterPlan }) {
  const months = Array.from(new Set(plan.entregas.map((e) => e.mes))).sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {plan.eixos.map((eixo) => (
          <span key={eixo} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium">{eixo}</span>
        ))}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {months.map((mes) => (
          <div key={mes} className="min-w-48 flex-1 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{mes}</p>
            {plan.entregas.filter((e) => e.mes === mes).map((entrega) => (
              <Card key={entrega.id} className={`border-l-4 p-3 ${statusColor[entrega.status]}`}>
                <p className="text-sm font-medium">{entrega.titulo}</p>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

Note: this desktop variant uses `overflow-x-auto` for its own internal month-columns scroller — this is a deliberate, contained horizontal scroll region on desktop only, not the "no horizontal scroll" mobile violation Global Constraints forbids (that rule targets the 375px mobile experience, where this component is not used at all — `<PlanListMobile>` renders instead).

- [ ] **Step 9: Assemble the page**

```tsx
// src/app/portal/plano/page.tsx
'use client';

import { usePortalPlan } from '@/src/common/hooks/portal/use-portal-plan';
import { useMediaQuery } from '@/src/common/hooks/portal/use-media-query';
import { PlanTimelineDesktop } from '@/src/components/portal/plan/plan-timeline-desktop';
import { PlanListMobile } from '@/src/components/portal/plan/plan-list-mobile';
import { PortalTableSkeleton } from '@/src/components/portal/skeletons';

export default function PortalPlanoPage() {
  const { data: plan, isLoading } = usePortalPlan();
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">{plan?.titulo ?? 'Plano Semestral'}</h1>
      {isLoading ? (
        <PortalTableSkeleton rows={6} />
      ) : plan && isMobile ? (
        <PlanListMobile plan={plan} />
      ) : plan ? (
        <PlanTimelineDesktop plan={plan} />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 10: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/common/@types/@portal-plan.ts src/common/services/portal/portal-plan-service.ts \
  src/common/hooks/portal/use-portal-plan.ts src/components/portal/plan/ src/app/portal/plano/page.tsx
git commit -m "feat(portal): build Plano Semestral (§3.11) — horizontal timeline desktop, vertical list mobile

Editing is admin-only per master doc §3.11 ('editável apenas por admin') —
this portal only renders the read view, no edit UI built. BLOCKED on
backend: GET /portal/plan/current does not exist yet."
```

**Fase 5 complete.**

---

## Fase 6 — Acabamento e escala

Mirrors master doc §8 Fase 6. WhatsApp digest/notifications (Meta template approval) and benchmark agregado are out of scope per Assumptions 6/9 — the client portal never displays the agency benchmark (master doc §7 is for Reserve's own proposals). Connection-health *internal alerting* is Reserve-side, not client-facing (Task 17 already covers the client-visible half).

### Task 34: Exportação PDF — trigger UI + printable route (§3.8)

**Files:**
- Create: `src/components/portal/export-pdf-button.tsx`
- Create: `src/app/portal/print/[block]/page.tsx`
- Test: `src/components/portal/__tests__/export-pdf-button.test.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `<ExportPdfButton block />`, the `/portal/print/[block]` route target — consumed by every block page that gets an "Exportar período" button and by the Home "Exportar relatório completo"

**BLOCKED (backend):** actual PDF binary generation (Puppeteer/Playwright screenshotting this route, master doc §3.8) is backend-only per Assumption 5. This task's job ends at: a button that opens the printable route in a new tab (useful standalone today, e.g. browser print-to-PDF) and a route that renders block content **without nav chrome**, ready for the backend to screenshot later.

- [ ] **Step 1: Write the failing test for `<ExportPdfButton>`**

```tsx
// src/components/portal/__tests__/export-pdf-button.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExportPdfButton } from '../export-pdf-button';

describe('ExportPdfButton', () => {
  it('links to the printable route for the given block', () => {
    render(<ExportPdfButton block="trafego" />);
    expect(screen.getByRole('link', { name: /exportar período/i })).toHaveAttribute('href', '/portal/print/trafego');
  });

  it('renders the "exportar relatório completo" label on the home block', () => {
    render(<ExportPdfButton block="dashboard" label="Exportar relatório completo" />);
    expect(screen.getByRole('link', { name: 'Exportar relatório completo' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- export-pdf-button`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `<ExportPdfButton>`**

```tsx
// src/components/portal/export-pdf-button.tsx
import Link from 'next/link';
import { FileDown } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

export function ExportPdfButton({ block, label = 'Exportar período' }: { block: string; label?: string }) {
  return (
    <Button asChild size="sm" variant="outline">
      <Link href={`/portal/print/${block}`} target="_blank" rel="noreferrer">
        <FileDown className="mr-1 size-3.5" /> {label}
      </Link>
    </Button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- export-pdf-button`
Expected: PASS (2 tests)

- [ ] **Step 5: Build the printable route**

Reuses each block's existing page component but strips nav chrome via the `/portal/print` segment living outside `src/app/portal/layout.tsx`'s guard (it needs its own minimal layout).

```tsx
// src/app/portal/print/[block]/page.tsx
'use client';

import { use } from 'react';
import PortalTrafegoPage from '@/src/app/portal/trafego/page';
import PortalLeadsPage from '@/src/app/portal/leads/page';
import PortalInstagramPage from '@/src/app/portal/instagram/page';
import PortalRetornoPage from '@/src/app/portal/retorno/page';
import PortalDashboardPage from '@/src/app/portal/dashboard/page';

const BLOCK_PAGES: Record<string, React.ComponentType> = {
  dashboard: PortalDashboardPage,
  trafego: PortalTrafegoPage,
  leads: PortalLeadsPage,
  instagram: PortalInstagramPage,
  retorno: PortalRetornoPage,
};

export default function PortalPrintPage({ params }: { params: Promise<{ block: string }> }) {
  const { block } = use(params);
  const BlockPage = BLOCK_PAGES[block];

  if (!BlockPage) {
    return <div className="p-6">Bloco não encontrado para exportação.</div>;
  }

  return (
    <div className="print:m-0">
      <header className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <span className="font-portal-display text-lg">RÉSERVE</span>
      </header>
      <BlockPage />
    </div>
  );
}
```

`src/app/portal/print/[block]/page.tsx` sits under `src/app/portal/**`, so it still passes through `src/proxy.ts`'s `/portal` auth guard from Task 1 — a signed-out visitor cannot reach the printable route either, matching the rest of the portal. Backend PDF generation (once built) is expected to call this route with a service-level session, not bypass auth — flag this coordination point to the backend plan owner.

- [ ] **Step 6: Add the button to the Home page and one detail block** (`/portal/trafego`, as the representative "Exportar período" case; every other block page gets the same one-line addition, left for whoever implements each page's own task to include going forward — not repeated 10 times here)

```tsx
// src/app/portal/dashboard/page.tsx — add near the <h1>
import { ExportPdfButton } from '@/src/components/portal/export-pdf-button';
// JSX: <div className="flex items-center justify-between"><h1 ...>Visão Geral</h1><ExportPdfButton block="dashboard" label="Exportar relatório completo" /></div>

// src/app/portal/trafego/page.tsx — same pattern
// <div className="flex items-center justify-between"><h1 ...>Tráfego Pago</h1><ExportPdfButton block="trafego" /></div>
```

- [ ] **Step 7: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/components/portal/export-pdf-button.tsx "src/app/portal/print/[block]/page.tsx" \
  src/components/portal/__tests__/export-pdf-button.test.tsx src/app/portal/dashboard/page.tsx src/app/portal/trafego/page.tsx
git commit -m "feat(portal): add PDF export trigger UI + printable route (§3.8)

Actual PDF binary generation is backend-only (Puppeteer/Playwright,
plan Assumption 5) — this ships the button and a chrome-free printable
route ready for the backend to screenshot. Auth guard from Task 1 still
applies to /portal/print/**."
```

---

### Task 35: Análise de Retorno — Nível 3 (locked upsell / real ROAS)

**Files:**
- Create: `src/components/portal/locked-feature-card.tsx`
- Create: `src/components/portal/roi/roi-level3-cards.tsx`
- Modify: `src/app/portal/retorno/page.tsx`
- Test: `src/components/portal/__tests__/locked-feature-card.test.tsx`
- Test: `src/components/portal/roi/__tests__/roi-level3-cards.test.tsx`

**Interfaces:**
- Consumes: `useRoiLevel3` (Task 27)
- Produces: `<LockedFeatureCard title description />` (reusable), `<RoiLevel3Cards data />`

**BLOCKED (backend):** `GET /portal/roi/level3` — `unlocked` depends on a reservation-engine integration flag (master doc §3.9 Nível 3), not built.

- [ ] **Step 1: Write the failing test for `<LockedFeatureCard>`**

```tsx
// src/components/portal/__tests__/locked-feature-card.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LockedFeatureCard } from '../locked-feature-card';

describe('LockedFeatureCard', () => {
  it('explains why the feature is locked, framed as an upsell, never a dead end', () => {
    render(
      <LockedFeatureCard
        title="Receita atribuída e ROAS"
        description="Disponível quando o motor de reservas do seu site estiver integrado ao painel."
      />,
    );
    expect(screen.getByText('Receita atribuída e ROAS')).toBeInTheDocument();
    expect(screen.getByText(/motor de reservas/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- locked-feature-card`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `<LockedFeatureCard>`**

Master doc §3.9: "o Nível 3 só existe com motor integrado — o bloco aparece bloqueado com explicação, virando argumento natural de upsell." Copy is explanatory, not an error state.

```tsx
// src/components/portal/locked-feature-card.tsx
import { Lock } from 'lucide-react';
import { Card } from '@/src/components/ui/card';

export function LockedFeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex items-start gap-3 border-dashed p-4">
      <Lock className="mt-0.5 size-5 text-muted-foreground" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- locked-feature-card`
Expected: PASS

- [ ] **Step 5: Write the failing test for `<RoiLevel3Cards>`**

```tsx
// src/components/portal/roi/__tests__/roi-level3-cards.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoiLevel3Cards } from '../roi-level3-cards';
import type { RoiLevel3 } from '@/src/common/@types/@portal-roi';

describe('RoiLevel3Cards', () => {
  it('renders the locked upsell card when unlocked is false', () => {
    const data: RoiLevel3 = { unlocked: false, receita_atribuida: null, roas: null, ticket_medio: null, taxa_conversao_lead_reserva_pct: null };
    render(<RoiLevel3Cards data={data} />);
    expect(screen.getByText(/motor de reservas/i)).toBeInTheDocument();
  });

  it('renders real ROAS numbers when unlocked is true, never an estimate', () => {
    const data: RoiLevel3 = { unlocked: true, receita_atribuida: 42000, roas: 8.4, ticket_medio: 350, taxa_conversao_lead_reserva_pct: 12 };
    render(<RoiLevel3Cards data={data} />);
    expect(screen.getByText('8.4')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test:run -- roi-level3-cards`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement `<RoiLevel3Cards>`**

```tsx
// src/components/portal/roi/roi-level3-cards.tsx
import { Card } from '@/src/components/ui/card';
import { LockedFeatureCard } from '@/src/components/portal/locked-feature-card';
import type { RoiLevel3 } from '@/src/common/@types/@portal-roi';

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function RoiLevel3Cards({ data }: { data: RoiLevel3 }) {
  if (!data.unlocked) {
    return (
      <LockedFeatureCard
        title="Receita atribuída, ROAS e ticket médio"
        description="Disponível quando o motor de reservas do seu site estiver integrado ao painel — fale com a Reserve para ativar."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <Card className="p-4"><p className="text-sm text-muted-foreground">Receita atribuída</p><p className="text-xl font-semibold">{currency(data.receita_atribuida!)}</p></Card>
      <Card className="p-4"><p className="text-sm text-muted-foreground">ROAS</p><p className="text-xl font-semibold">{data.roas}</p></Card>
      <Card className="p-4"><p className="text-sm text-muted-foreground">Ticket médio</p><p className="text-xl font-semibold">{currency(data.ticket_medio!)}</p></Card>
      <Card className="p-4"><p className="text-sm text-muted-foreground">Taxa de conversão lead → reserva</p><p className="text-xl font-semibold">{data.taxa_conversao_lead_reserva_pct}%</p></Card>
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test:run -- roi-level3-cards`
Expected: PASS (2 tests)

- [ ] **Step 9: Wire into `/portal/retorno`**

```tsx
// src/app/portal/retorno/page.tsx — add
import { useRoiLevel3 } from '@/src/common/hooks/portal/use-portal-roi';
import { RoiLevel3Cards } from '@/src/components/portal/roi/roi-level3-cards';

// inside the component:
const { data: level3 } = useRoiLevel3(range);

// JSX, after the Nível 2 section:
{level3 && (
  <section>
    <h2 className="mb-2 text-sm font-medium text-muted-foreground">Com motor de reservas integrado</h2>
    <RoiLevel3Cards data={level3} />
  </section>
)}
```

- [ ] **Step 10: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 11: Commit**

```bash
git add src/components/portal/locked-feature-card.tsx src/components/portal/roi/roi-level3-cards.tsx \
  src/components/portal/__tests__/locked-feature-card.test.tsx src/components/portal/roi/__tests__/roi-level3-cards.test.tsx \
  src/app/portal/retorno/page.tsx
git commit -m "feat(portal): add ROI Nível 3 — locked upsell card or real ROAS, never an estimate (§3.9)

Never renders a guessed revenue number — data.unlocked gates real numbers
vs. the upsell card by construction. BLOCKED on backend:
GET /portal/roi/level3 does not exist yet."
```

---

### Task 36: Google Ads columns in Tráfego block

**Files:**
- Modify: `src/common/@types/@portal-traffic.ts`
- Modify: `src/components/portal/traffic/traffic-metrics.tsx`
- Modify: `src/app/portal/trafego/page.tsx`
- Test: `src/components/portal/traffic/__tests__/traffic-metrics.test.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `TrafficResponse` gains an optional `google_ads` breakdown

**BLOCKED (backend):** master doc §4.1 lists Google Ads OAuth as "pendente" — this task assumes it lands in Fase 6 alongside this UI, per master doc §8's own Fase 6 placement.

- [ ] **Step 1: Extend the type**

```ts
// src/common/@types/@portal-traffic.ts — modify TrafficResponse
export interface TrafficResponse {
  headline_metrics: { /* unchanged */
    investimento: number; pessoas_alcancadas: number; visualizacoes: number;
    conversas_iniciadas: number; custo_por_conversa: number; frequencia: number;
  };
  daily: DailyTrafficPoint[];
  biweekly_comparison: { period_label: string; investimento: number; conversas_iniciadas: number }[];
  campaigns: CampaignPerformance[];
  /** null until Google Ads OAuth (master doc §4.1) is connected for this tenant */
  google_ads: { investimento: number; cliques: number; custo_por_clique: number } | null;
}
```

- [ ] **Step 2: Write the failing test for the Google Ads card**

```tsx
// src/components/portal/traffic/__tests__/traffic-metrics.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrafficMetrics } from '../traffic-metrics';

const metrics = {
  investimento: 1200, pessoas_alcancadas: 12000, visualizacoes: 30000,
  conversas_iniciadas: 48, custo_por_conversa: 25, frequencia: 2.5,
};

describe('TrafficMetrics', () => {
  it('renders the 6 Meta Ads metrics through MetricLabel', () => {
    render(<TrafficMetrics metrics={metrics} googleAds={null} />);
    expect(screen.getByText('Investimento')).toBeInTheDocument();
  });

  it('shows a Google Ads card when connected', () => {
    render(<TrafficMetrics metrics={metrics} googleAds={{ investimento: 400, cliques: 60, custo_por_clique: 6.67 }} />);
    expect(screen.getByText('Google Ads')).toBeInTheDocument();
  });

  it('shows nothing extra when Google Ads is not connected', () => {
    render(<TrafficMetrics metrics={metrics} googleAds={null} />);
    expect(screen.queryByText('Google Ads')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:run -- traffic-metrics`
Expected: FAIL — `TrafficMetrics` doesn't accept a `googleAds` prop yet.

- [ ] **Step 4: Extend `<TrafficMetrics>`**

```tsx
// src/components/portal/traffic/traffic-metrics.tsx — modify the export signature and add a card
export function TrafficMetrics({
  metrics,
  googleAds,
}: {
  metrics: TrafficResponse['headline_metrics'];
  googleAds: TrafficResponse['google_ads'];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {ROWS.map((row) => (
        <Card key={row.key} className="space-y-1 p-4">
          <div className="text-sm text-muted-foreground"><MetricLabel metricKey={row.key} /></div>
          <p className="text-xl font-semibold">{row.format(metrics[row.key])}</p>
        </Card>
      ))}
      {googleAds && (
        <Card className="space-y-1 p-4">
          <p className="text-sm text-muted-foreground">Google Ads</p>
          <p className="text-xl font-semibold">{googleAds.investimento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="text-xs text-muted-foreground">{googleAds.cliques} cliques</p>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:run -- traffic-metrics`
Expected: PASS (3 tests)

- [ ] **Step 6: Update the call site**

```tsx
// src/app/portal/trafego/page.tsx — update the <TrafficMetrics> call
<TrafficMetrics metrics={data!.headline_metrics} googleAds={data?.google_ads ?? null} />
```

- [ ] **Step 7: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/common/@types/@portal-traffic.ts src/components/portal/traffic/traffic-metrics.tsx \
  src/components/portal/traffic/__tests__/traffic-metrics.test.tsx src/app/portal/trafego/page.tsx
git commit -m "feat(portal): add Google Ads card to Tráfego block, gated on connection (§8 Fase 6)

google_ads is null until the tenant's Google Ads OAuth is connected —
renders nothing extra rather than a placeholder card. BLOCKED on backend:
Google Ads OAuth sync (master doc §4.1) not built yet."
```

---

### Task 37: Mini-tour de primeiro acesso

**Files:**
- Create: `src/common/hooks/portal/use-first-access-tour.ts`
- Create: `src/components/portal/first-access-tour.tsx`
- Modify: `src/app/portal/layout.tsx`
- Test: `src/common/hooks/portal/__tests__/use-first-access-tour.test.ts`

**Interfaces:**
- Consumes: `PORTAL_ROUTES` (Task 2)
- Produces: `useFirstAccessTour()`, `<FirstAccessTour />`

**Not BLOCKED** — this is the one Fase 6 task that can ship fully client-side today: "seen the tour" state is stored in `localStorage`, not a backend flag, so there is no server dependency (master doc §4.4's "vídeo curto de 2 min ou walkthrough no primeiro acesso" doesn't specify server persistence; if product later wants the flag to survive a device switch, that's a small follow-up to move this into `ClientProfile`).

- [ ] **Step 1: Write the failing test for `useFirstAccessTour`**

```ts
// src/common/hooks/portal/__tests__/use-first-access-tour.test.ts
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFirstAccessTour } from '../use-first-access-tour';

describe('useFirstAccessTour', () => {
  beforeEach(() => localStorage.clear());

  it('shows the tour on first access and remembers dismissal across renders', () => {
    const { result } = renderHook(() => useFirstAccessTour());
    expect(result.current.shouldShow).toBe(true);

    act(() => result.current.dismiss());
    expect(result.current.shouldShow).toBe(false);
    expect(localStorage.getItem('portal-tour-seen')).toBe('true');
  });

  it('does not show the tour on a second mount after dismissal', () => {
    localStorage.setItem('portal-tour-seen', 'true');
    const { result } = renderHook(() => useFirstAccessTour());
    expect(result.current.shouldShow).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- use-first-access-tour`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `useFirstAccessTour`**

```ts
// src/common/hooks/portal/use-first-access-tour.ts
'use client';

import { useCallback, useState } from 'react';

const STORAGE_KEY = 'portal-tour-seen';

export function useFirstAccessTour() {
  const [shouldShow, setShouldShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) !== 'true';
  });

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShouldShow(false);
  }, []);

  return { shouldShow, dismiss };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- use-first-access-tour`
Expected: PASS (2 tests)

- [ ] **Step 5: Implement `<FirstAccessTour>`** (a dismissible overlay pointing at the nav, using the existing `Sheet` `side="bottom"` from Task 4 on mobile and a centered `Dialog` on desktop — reuses `src/components/ui/dialog.tsx`, not built from scratch)

```tsx
// src/components/portal/first-access-tour.tsx
'use client';

import { useFirstAccessTour } from '@/src/common/hooks/portal/use-first-access-tour';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';

export function FirstAccessTour() {
  const { shouldShow, dismiss } = useFirstAccessTour();

  return (
    <Dialog open={shouldShow} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bem-vindo ao Painel Reserve</DialogTitle>
          <DialogDescription>
            Aqui você acompanha investimento, conversas no WhatsApp, o que a Reserve fez pelo seu negócio e o plano dos
            próximos meses — tudo em tempo real, direto do celular.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={dismiss}>Entendi, vamos lá</Button>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: Mount it in the portal layout**

```tsx
// src/app/portal/layout.tsx — add inside the authenticated branch, alongside <PortalNav />
import { FirstAccessTour } from '@/src/components/portal/first-access-tour';

// JSX, inside the non-login return:
<FirstAccessTour />
```

- [ ] **Step 7: Build and test**

```bash
npm run test:run -- portal
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/common/hooks/portal/use-first-access-tour.ts src/components/portal/first-access-tour.tsx \
  src/common/hooks/portal/__tests__/use-first-access-tour.test.ts src/app/portal/layout.tsx
git commit -m "feat(portal): add first-access mini-tour (§4.4), localStorage-only state

Not blocked on backend — dismissal state lives in localStorage. Flagged
as a follow-up if product wants it to survive a device switch (would move
into ClientProfile)."
```

---

### Task 38: Full portal accessibility + final mobile QA pass

**Files:**
- Create: `src/app/portal/__tests__/accessibility.test.tsx`

**Interfaces:**
- Consumes: every page built in Tasks 10, 11, 12, 17, 24, 25, 26, 27, 30, 32, 33
- Produces: nothing new — the closing verification task for the whole plan, mirroring the accessibility pass convention already used elsewhere in this codebase (`src/components/access-management/__tests__/accessibility.test.tsx`) and in `docs/superpowers/plans/2026-07-26-fase5-frontend-plataforma-ux.md`'s own closing Task 37 (`vitest-axe`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/portal/__tests__/accessibility.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { PortalKpiCards } from '@/src/components/portal/overview/kpi-cards';
import { AcquisitionFunnel } from '@/src/components/portal/funnel/acquisition-funnel';
import { PortalNav } from '@/src/components/portal/nav';

vi.mock('next/navigation', () => ({ usePathname: () => '/portal/dashboard' }));

function renderWithQueryClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Portal accessibility (vitest-axe)', () => {
  it('PortalNav has no detectable a11y violations', async () => {
    const { container } = renderWithQueryClient(<PortalNav />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('PortalKpiCards has no detectable a11y violations', async () => {
    const { container } = renderWithQueryClient(
      <PortalKpiCards
        metrics={[{ metric_key: 'investimento', current_value: 1200, previous_value: 1000, variation_pct: 20 }]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('AcquisitionFunnel has no detectable a11y violations', async () => {
    const { container } = renderWithQueryClient(
      <AcquisitionFunnel stages={[{ key: 'cliques', label: 'Cliques', value: 100 }]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `npm run test:run -- portal/__tests__/accessibility`
Expected: likely PASS immediately if every prior task used semantic HTML/ARIA correctly (`nav`/`aria-current`, `role="figure"` with `aria-label`, real `<button>`/`<Link>` elements throughout) — if any violation surfaces (commonly: color-contrast on the `bg-amber-100 text-amber-800` badges used in Tasks 17/18/22/33, or a missing accessible name on an icon-only button), fix the flagged component in place rather than weakening the assertion.

- [ ] **Step 3: Fix any violations found, then re-run**

Run: `npm run test:run -- portal/__tests__/accessibility`
Expected: PASS (3 tests)

- [ ] **Step 4: Full-suite regression run**

```bash
npm run test:run -- portal
npm run build
```

Expected: every portal test from Tasks 1–37 passes together (not just in isolation) and the build succeeds.

- [ ] **Step 5: Final manual 375px pass across all 12 routes** (documented checklist, not automated — mirrors Task 13's checklist, now for every route)

```bash
npm run dev
```

For each of `/portal/{login,dashboard,trafego,leads,instagram,atendimento,atendimento/bot,retorno,calendario,plano,atividades,evolucao,relatorios}` at 375×667:
- [ ] No horizontal scrollbar
- [ ] At most 1 chart visible without scrolling
- [ ] Every table renders as stacked cards
- [ ] Every metric with a glossary entry shows the "?" affordance
- [ ] Every KPI/ROI number shows a `<VariationBadge>` with correct color direction

- [ ] **Step 6: Commit**

```bash
git add src/app/portal/__tests__/accessibility.test.tsx
git commit -m "test(portal): add vitest-axe accessibility pass + final 375px checklist across all 12 routes

Closes the plan: every route from Fase 1-6 verified together in one
regression run. Manual 375x667 checklist recorded in this commit body:
[fill in after running Step 5]."
```

**Fase 6 complete. Plan complete — 38 tasks across 6 fases.**

---

## Self-Review

**Spec coverage.** Every route in master doc §4.3 has a task: `/login` (1), `/dashboard` (10, 26, 29, 34), `/trafego` (11, 15, 34, 36), `/leads` (12, 16), `/instagram` (24), `/atendimento` + `/atendimento/bot` (17–23), `/retorno` (27, 28, 35), `/calendario` (25), `/plano` (33), `/atividades` (26), `/evolucao` (32), `/relatorios` + `/relatorios/[id]` (30, 31). Every UI block §3.1–3.11 has a task (3.1→10, 3.2→11/15/36, 3.3→12/16, 3.4→24, 3.5→25/26, 3.6→32, 3.7→30/31, 3.8→34, 3.9→27/28/35, 3.10→17–23, 3.11→33). Glossary (4), PDF export (34), all §4.3 "Princípios de UI" (mobile-first: Tasks 8/13/38; line/bar only: Task 7; variation always visible: Task 5; `<MetricLabel>`: Task 4; skeleton/empty states: Task 6; no jargon: `glossary.ts` copy throughout) are each covered by name, not just implied.

**Placeholder scan.** No "TBD"/"implement later"/"add appropriate error handling" strings appear in any step — every step that changes code shows the actual code. The two intentionally-deferred items (Task 21's per-lead move-action placement, Task 32's chart-level marco-zero highlighting) are explicitly named as open product/design questions with a concrete follow-up description, not silently glossed over, matching this task's brief to flag ambiguity rather than resolve it unilaterally.

**Type consistency check performed:** `ClientRole` (Task 1) is used identically in Tasks 22/28 (`usePortalPermissions`, `botActive` gating). `FunnelStageStatus` (Task 18) is reused unchanged in Tasks 19/20/21. `GlossaryKey` (Task 4) is the type every `MetricLabel` consumer (Tasks 10/11/24) passes. `PortalDataTableColumn<T>`/`getRowKey` (Task 8) signature is identical across Tasks 11/12/16/28. `usePeriodComparison`'s `MetricComparison` shape (Task 9) matches what `PortalKpiCards` (Task 10) expects verbatim (`metric_key`/`current_value`/`previous_value`/`variation_pct`).

