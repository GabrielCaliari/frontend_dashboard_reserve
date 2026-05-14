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
