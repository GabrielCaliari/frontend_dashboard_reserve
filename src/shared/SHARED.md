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
