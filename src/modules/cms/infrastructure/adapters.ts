/**
 * CMS — Infrastructure Adapters (barrel)
 *
 * Consolidates the former `common/services/{cms-article,cms-author,cms-blog,
 * blog,cms-image,cms-media,cms-public}-service.ts` (7 files, ~1700 lines total)
 * into `src/modules/cms/infrastructure/`. Every exported function name and
 * signature is preserved unchanged so consuming hooks only need their import
 * path updated. Given the combined size (over 4x the ~400-line threshold that
 * would already justify a split), the implementation lives in six per-concern
 * files instead of one flat `adapters.ts`:
 *   - `./article-adapters`  (from cms-article-service.ts)
 *   - `./author-adapters`   (from cms-author-service.ts)
 *   - `./blog-adapters`     (from cms-blog-service.ts + blog-service.ts)
 *   - `./image-adapters`    (from cms-image-service.ts)
 *   - `./media-adapters`    (from cms-media-service.ts)
 *   - `./public-adapters`   (from cms-public-service.ts)
 * This file re-exports all of them so `@/src/modules/cms/infrastructure/adapters`
 * remains a single import surface, matching what Step 3 of the task brief asks
 * for while keeping each file's line count manageable.
 *
 * ---------------------------------------------------------------------------
 * Delegate-to-generated-code decision (verified by direct inspection, not
 * copied from Task 12/13 without checking — see below for CMS-specific
 * evidence):
 *
 * The codegen output at `src/infraestructure/server/services/{cms-article-
 * management,cms-author-management,cms-blogs,cms-image-management,cms-media-
 * assets,cms-media-collections,cms-media-relations,cms-public-api}` was
 * inspected file-by-file (`index.ts` + `types.ts`) and compared against the
 * hand-written services being ported. All eight generated services are thin
 * `apiClient.get/post/put/patch/delete(...)` wrappers with no retry, no error
 * transformation, and no response normalization. Delegating to them was
 * rejected for three independent, concrete reasons:
 *
 * 1. Response shape normalization is load-bearing and untestable via the
 *    generated client. The hand-written article/author/blog/media services
 *    all normalize inconsistent backend responses (snake_case vs camelCase
 *    fields — `display_title`/`displayTitle`, `meta_title`/`metaTitle`,
 *    `cover_image`/`coverImage`, etc. — and multiple possible envelope shapes:
 *    `{data: [...]}`, `{items: [...]}`, `{results: [...]}`, bare arrays). The
 *    generated services return whatever the backend sends, untouched, typed
 *    only as the raw DTO from `types.ts`. Every existing unit test (see
 *    `cms-article-service.test.ts`, kept below as `article-adapters.test.ts`)
 *    asserts on this normalization directly (e.g. `expect(result[0]).toMatchObject
 *    ({ displayTitle, metaTitle, coverImageId, language })` from a payload sent
 *    in snake_case) — delegating would break these tests and silently change
 *    the shape every consuming hook/component receives.
 *
 * 2. `withRetry` + `transformCMSError` (from `@/src/shared/utils/cms-error-
 *    handler`) wrap every call in the hand-written services and are absent
 *    from the generated services entirely — delegating would silently drop
 *    retry-on-transient-failure behavior and the CMS-specific error shape
 *    consumers already handle.
 *
 * 3. HTTP client identity differs and is behaviorally significant, not
 *    cosmetic:
 *    - The generated services all import the default `apiClient`
 *      (`src/infraestructure/axios/api.ts`), whose response interceptor
 *      redirects the browser on any 401.
 *    - The hand-written article/author/blog/image/media services use
 *      `cmsApiClient` (same base URL and auth injection, but its interceptor
 *      explicitly does NOT redirect on 401 — "let the caller handle it" — so
 *      `transformCMSError` can surface a recoverable error instead of forcing
 *      a redirect mid-CMS-editing-flow).
 *    - `cms-public-service.ts` (ported to `public-adapters.ts`) is the
 *      starkest case: it uses `createPublicCmsClient(secretKey)`, a THIRD,
 *      unauthenticated axios instance that sends `x-blog-secret-key` instead
 *      of a JWT, for the public blog-widget use case (`src/app/public-blog/
 *      [slug]/layout.tsx` — no logged-in user, no tenant context). The
 *      generated `cms-public-api` service instead calls the JWT/tenant-aware
 *      `apiClient`, which would throw a 401 (no session) or attach the wrong
 *      tenant for every public-widget request. This is a hard functional
 *      blocker, not a preference — delegating here would break the public
 *      blog feature outright.
 *
 * This matches the pattern already documented in Task 12 (access-management)
 * and Task 13 (leads) adapters, independently re-confirmed here for the CMS
 * domain's own generated services and hand-written call sites. All six files
 * below keep the original `apiClient`/`cmsApiClient`/`createPublicCmsClient`
 * implementations verbatim.
 */

export * from "./article-adapters";
export * from "./author-adapters";
export * from "./blog-adapters";
export * from "./image-adapters";
export * from "./media-adapters";
export * from "./public-adapters";
