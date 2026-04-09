# shared/query/

TanStack Query configuration and providers shared across modules. Domain-specific
query keys live inside the module/domain (`modules/<domain>/infrastructure/query-keys.ts`
once promoted, or colocated with the hook otherwise), not here — this folder is only
the provider wiring itself (`QueryClient` instantiation consumed by
`src/app/providers.tsx`). Per-tenant cache rotation (`TenantQueryProvider`) is Fase 5
scope — not part of this migration.
