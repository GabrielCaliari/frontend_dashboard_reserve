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
