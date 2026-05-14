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
