## Backend API integration

The typed backend clients are generated from the Swagger/OpenAPI JSON into
`src/infraestructure/server/services`. They are committed to the repository and must
not be edited manually. Module code encapsulates transport details behind stable
adapters in `src/modules/<domain>/infrastructure/` whenever the generated shape is not
itself the intended module interface (which is the case for every domain in this
migration — see [MODULES.md](../../modules/MODULES.md)).

The generator reads its source in this order:

1. `OPENAPI_SPEC_URL`
2. `NEXT_PUBLIC_RESERVE_API_URL`
3. `NEXT_PUBLIC_API_URL`
4. `NEXT_PUBLIC_LOCAL_API_URL`
5. `NEXT_LOCAL_API_URL`
6. `http://localhost:3002`

The default Swagger document is `<backend-url>/api/docs-json`.

### Update after a backend change

```bash
npm run codegen:diff
npm run codegen
npm run test:run
npm run build
```

Always inspect `npm run codegen:diff` before regenerating. Review removed or renamed
operations, request fields that became required, response-shape changes, and
authentication changes. Then update affected adapters in `modules/<domain>/infrastructure/`.

Do not edit `src/infraestructure/server/services` to repair an invalid contract. If
the generator reports duplicate or missing operation IDs, unresolved schemas, or an
invalid/unreachable Swagger document, fix the backend contract first — flag it to the
backend repo (`backend_reserve`), don't hand-patch generated output.

The client generator is
[nextjs-openapi-codegen](https://github.com/Last-Code-MgL/nextjs-openapi-codegen).

### Troubleshooting

- Override the contract source with `OPENAPI_SPEC_URL` when the local backend is not
  running.
- Run `npm run codegen:diff` to determine whether a backend deployment actually
  changes generated output.
- Keep generated route handlers out of the application: this project intentionally
  writes them to an ignored cache directory (`node_modules/.cache/`) because it calls
  the backend directly, not through a Next.js API proxy.
