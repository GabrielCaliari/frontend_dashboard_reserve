# infraestructure/axios/

The generic HTTP client and the low-level wiring to talk to the backend: axios
instance (`api.ts`, `api-email.ts`, `cms-public-api-client.ts`), base URL assembly
(`build-api-base-url.ts`), auth headers (`get-auth-headers.ts`), request URL
normalization (`normalize-api-request-url.ts`), and the backend's error-code catalog
(`error-types.ts`).

## Rule

Only genuine transport belongs here — don't model business rules about when/how to
call an endpoint (that's the module's `infrastructure/` adapter). A new HTTP client
for a different external API also belongs here, as long as more than one module
consumes it; otherwise it goes inside the module that uses it (or `shared/services/`
if the module hasn't been promoted yet, as with `states-service.ts`).

`nextjs-codegen.config.mjs` (`apiClientPath`) points the generated services in
`infraestructure/server/services/` at `api.ts` here — if you rename or move this
folder again, update that config too, or `npm run codegen` silently regenerates
services pointing at a stale path with no TypeScript error (it's a string, not a
static import).
