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
