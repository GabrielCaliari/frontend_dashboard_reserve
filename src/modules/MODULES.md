# modules/ — business domains

One module per UI bounded context. See the decision tree in [../SRC.md](../SRC.md)
before deciding whether a new file belongs here or in global `presentation/`/`shared/`.

## Existing modules (Fase 4)

| Module | Consumes (backend) | Layers present |
|---|---|---|
| `access-management` | `reserve-auth` | infrastructure |
| `leads` | `reserve-leads` | infrastructure |
| `appointments` | `reserve-leads` (appointment sub-resources) | infrastructure |
| `cms` | `reserve-cms` | infrastructure |
| `coupons` | `reserve-coupons` | infrastructure |
| `mailer` | `reserve-mailer` | infrastructure |
| `payments` | `reserve-subscriptions` (Plans, Subscriptions, Payments - Billing Config tags) | infrastructure |
| `b2b-payments` | `reserve-b2b-payments` | infrastructure |
| `b2c-products` | `reserve-b2c-products` | infrastructure |
| `b2c-subscriptions` | `reserve-b2c-subscriptions` | infrastructure |
| `hotel-portal` | `reserve-client-portal` | infrastructure |
| `notifications` | `reserve-notifications` | infrastructure |
| `reports` | `reserve-reports` | infrastructure |
| `stats` | `reserve-stats` | infrastructure |

Every module above starts with **only** `infrastructure/` (the adapter wrapping the
generated service, preserving the exported function names/signatures `common/services/`
already had) — this is Fase 4's scope. `domain/`, `application/`, and `presentation/`
layers are **not** created yet: domain types stay in `shared/domain/types/`, hooks stay
in `shared/hooks/<domain>/`, and UI stays in
`presentation/components/organisms/<domain>/`. Promoting a domain to the full 4-layer
structure is a later-phase decision (see the criterion below), matching how the Zarp
codebase itself still has `access-management`, `leads`, `payments`, `appointments`,
`reports`, `stats` UI living in `presentation/components/<domain>/` rather than fully
promoted — this is the intentional, documented steady state, not a TODO to rush.

`payments` is named after the pre-existing UI-wide label (130+ files reference
`components/payments`, `hooks/payments`, `actions/payments`) rather than
`subscriptions`, to avoid a second, unrelated rename on top of an already large
migration — and because `subscriptions` would collide with the separate
`b2c-subscriptions` module. This is the explicit, documented exception the naming rule
in [../SRC.md](../SRC.md) calls for when a frontend module spans more than one
backend-module-shaped name.

## When to create a new module (beyond `infrastructure/`)

Promote a domain to a full `domain/`, `application/`, `presentation/` module when the
domain already has, scattered across `shared/` and `presentation/components/`, at
least: its own domain type, a service/data adapter, and a presentation component — i.e.
when the 3 pieces already exist but are loose. Don't create the module folder (or any
of the 4 layers) just because a new component "might grow" — that's premature
over-engineering.

## Naming: mirror the backend module, not a UI-area label

Name a frontend module after the specific `reserve-*` backend module it consumes (see
[../SRC.md](../SRC.md) for the full rule). Do not group unrelated backend modules under
one vague label (a mistake documented and corrected in the Zarp codebase: a module was
once named `communications` when it only served `zarp-notifications`, and another named
`marketing` grouped automations + mailer under one UI-area label instead of mirroring
the backend's actual module split).
