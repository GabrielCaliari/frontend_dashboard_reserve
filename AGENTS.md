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
