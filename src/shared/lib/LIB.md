# shared/lib/

Low-level utilities with no state and no business rule — the "dumbest" possible
category (e.g. `utils.ts` with `cn()`, `html-to-markdown.ts`). If a function here
starts carrying a business decision (not just formatting/data transformation), it
belongs in `shared/utils/` or `modules/<domain>/domain/`, not here.

`components.json` (repo root) points shadcn's `utils` alias to `shared/lib/utils` —
don't move this file without updating `components.json` at the same time.
