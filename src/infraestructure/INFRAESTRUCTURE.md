# infraestructure/ — outbound adapters to the backend

Single responsibility: transport data between the frontend and the backend API
(`backend_reserve`). Zero business rule, zero JSX, zero React state.

```
infraestructure/
  axios/           the generic HTTP client (axios instance, base URL, auth headers,
                    URL normalization, backend error-code catalog) — no business logic
  server/
    services/
      <endpoint-name>/
        index.ts    function(s) that call the endpoint via infraestructure/axios
        types.ts    request/response types for that endpoint
```

`server/services/` is **generated** by `npm run codegen` from the backend's OpenAPI
document (see [server/SERVICES.md](./server/SERVICES.md) for the full sync workflow)
— do not hand-edit generated files to work around a contract issue; fix the backend
contract first. `axios/` is hand-written and stable; the generator points at it via
`apiClientPath` in `nextjs-codegen.config.mjs`.

## Naming rule

`<endpoint-name>` mirrors the backend resource (the slug of its OpenAPI tag), not the
name of the frontend module that will consume it.

## When to create a new adapter

Whenever a module under `modules/<domain>/infrastructure/` needs to wrap an endpoint
that doesn't have a generated service dir yet. The module imports from here
(`@/src/infraestructure/server/services/<name>`); never call `fetch`/axios directly
from inside `modules/<domain>/infrastructure/` or `presentation/`.

## What does NOT go here

- The decision of when/why to call the endpoint → the module's adapter or the hook.
- Normalizing the payload into the shape the UI consumes → the module's adapter (this
  migration keeps normalization inside `modules/<domain>/infrastructure/adapters.ts`
  until a `domain/` layer exists).
- A new HTTP client for a *different* external API (not the `backend_reserve`
  backend) — e.g. the IBGE states/cities lookup in `shared/services/states-service.ts`
  stays there, it never gets a generated adapter.
