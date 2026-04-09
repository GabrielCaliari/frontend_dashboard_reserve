# app/ — Next.js App Router: routing layer only

`src/app/**` is the Next.js App Router's routing and file-convention surface. Its
only job is to declare routes, wire them to the actual page/layout implementation,
and hold whatever the framework strictly requires to live at that exact path
(`route.ts` handlers, `generateMetadata`, the root `<html>` shell, `proxy.ts`). It is
**not** where page logic, JSX, or business orchestration lives.

## The rule

- `src/app/**/page.tsx` — a route file that either directly renders the real page
  component, or, for the common case, re-exports it:
  ```ts
  export { default } from "@/src/presentation/components/pages/dashboard/leads/page";
  ```
  The actual JSX, hooks, and page logic live in
  `src/presentation/components/pages/<same-route-path>/page.tsx` — a 1:1 mirror of
  the route's path under `src/app/`.
- `src/app/**/layout.tsx` — same pattern, re-exporting from
  `src/presentation/components/layouts/<same-route-path>/layout.tsx`.
- `src/app/**/route.ts` (route handlers), `proxy.ts` — stay in `src/app/` or the repo
  root as the framework requires; these are inherently routing, not page content.

## Exceptions — files that must stay in `src/app/` as real implementations

- **`src/app/layout.tsx` (root layout)** — contains `<html>`/`<body>`, global fonts,
  and top-level providers (`Providers`, `NextIntlClientProvider`, `Header`,
  `NextTopLoader`, `Toaster`). This is the one layout that stays fully implemented
  here; don't try to extract it into `presentation/components/layouts/`.
- **`src/app/providers.tsx`** — the `QueryClientProvider`/`HeroUIProvider` composition
  consumed directly by the root layout above; stays next to it.
- **A route with `generateMetadata`** — e.g. `src/app/public-blog/[slug]/layout.tsx`.
  Next.js resolves `generateMetadata` from the route segment's own file; keep it
  there in full (it also has a trivial `default` export just rendering `children` —
  not worth splitting one export in and one export out for a 6-line component).
- **A dynamic route where the page is an `async function` Server Component that
  destructures `params: Promise<{...}>` directly in its signature** (not via React's
  `use()`) — the extracted component's signature changes to accept the *resolved*
  value instead, and the thin `page.tsx` becomes a small `async` function that awaits
  `params` and passes the plain object down. In this codebase this applies to exactly
  one route: `src/app/dashboard/email-campaign/[id]/page.tsx` (see Task 26, Step 4).
  ```tsx
  // src/app/dashboard/email-campaign/[id]/page.tsx
  import EmailCampaignPage from "@/src/presentation/components/pages/dashboard/email-campaign/[id]/page";

  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <EmailCampaignPage id={id} />;
  }
  ```
  A page/layout that instead reads `params` via React's `use(params)` hook, or via
  the client-side `useParams()` hook, does **not** need this treatment — both work
  identically regardless of which file the component lives in, so a plain
  `export { default } from '...'` is enough. This covers every other dynamic route in
  this codebase (`dashboard/access-management/{admins,tenants,users}/[id]`,
  `dashboard/cms/{articles,collections,media}/[id]`, `dashboard/cms/blogs/[blogId]`,
  `dashboard/coupons/[id]`, `dashboard/global/notifications/[id]`,
  `dashboard/global/notifications/settings/[tenantId]`,
  `dashboard/global/tenants/[tenantId]`, `dashboard/hotel-portal/[clientId]`,
  `dashboard/leads/collections/[collectionId]`, `public-blog/[slug]/page.tsx`).

## Route groups

```
app/
  auth/          public authentication routes
  dashboard/     the authenticated admin app (majority of routes)
  public-blog/   public-facing blog rendering, no auth
```

Each maps to the same path under `presentation/components/pages/` and
`presentation/components/layouts/`.
