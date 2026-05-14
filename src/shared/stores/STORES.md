# shared/stores/

Global state (zustand) that needs to survive navigation across different modules
(`tenant-store.ts` — selected tenant, used app-wide; `mobile-drawer.store.ts`,
`widget.store.ts` — shared UI state). A store whose state only matters within a
single module belongs in `modules/<domain>/presentation/` (or `modules/<domain>/domain/`
if it's business state, not UI state), not here.
