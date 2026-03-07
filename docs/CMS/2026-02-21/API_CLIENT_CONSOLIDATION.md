# API Client Consolidation - CMS Articles Fix

**Date**: 2026-02-21  
**Status**: ✅ Complete

## Problem

Articles were not loading due to incorrect API client configuration:
- 404 errors when fetching articles
- "Query data cannot be undefined" error in React Query
- Environment variable `NEXT_LOCAL_API_URL` not accessible in browser (client-side)

## Root Cause

1. **Environment Variable Issue**: `NEXT_LOCAL_API_URL` doesn't have the `NEXT_PUBLIC_` prefix, so it's not available in the browser (client-side code)
2. **Multiple API Clients**: Redundant API client files causing inconsistent configurations
3. **Debug Logs**: Excessive console logging cluttering the output

## Solution

### 1. Fixed API Client Configuration

Updated `src/common/config/api.ts` to handle client-side vs server-side environment variables correctly:

```typescript
const API_URL = typeof window !== 'undefined'
  ? (process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3002'  // Hardcoded for client-side dev
      : process.env.NEXT_PUBLIC_API_URL)
  : (process.env.NODE_ENV === 'development'
      ? process.env.NEXT_LOCAL_API_URL
      : process.env.NEXT_PUBLIC_API_URL);
```

**Why**: In Next.js, only environment variables with `NEXT_PUBLIC_` prefix are exposed to the browser. For client-side code in development, we hardcode `http://localhost:3002`.

### 2. Consolidated API Clients

All API clients now use the single consolidated client from `src/common/config/api.ts`:

- ✅ CMS services use `cmsApiClient` (alias of `api`)
- ✅ Access Management services use `apiClient`
- ✅ All test files updated to import from consolidated client
- ❌ Removed redundant `cms-api-client.ts` (already deleted)
- ❌ Removed redundant `access-management-api-client.ts` (already deleted)

### 3. Removed Debug Logs

Cleaned up all debug console.log statements from:
- `src/common/config/api.ts`
- `src/common/services/cms-article-service.ts`
- `src/common/hooks/cms/use-list-articles.ts`
- `src/app/dashboard/cms/articles/page.tsx`

### 4. Updated Test Files

Updated imports in test files to use consolidated API client:
- `src/common/services/access-management/__tests__/admin-service.test.ts`
- `src/common/services/access-management/__tests__/tenant-service.test.ts`
- `src/common/services/access-management/__tests__/user-service.test.ts`

## Files Modified

| File | Change |
|------|--------|
| `src/common/config/api.ts` | Fixed environment variable handling for client/server, removed debug logs |
| `src/common/services/cms-article-service.ts` | Removed debug logs |
| `src/common/hooks/cms/use-list-articles.ts` | Removed debug logs |
| `src/app/dashboard/cms/articles/page.tsx` | Removed debug logs |
| `src/common/services/access-management/user-service.ts` | Updated import to use consolidated client |
| `src/common/services/access-management/__tests__/*.test.ts` | Updated imports (3 files) |

## Environment Variables

### Development
- **Client-side**: Hardcoded `http://localhost:3002`
- **Server-side**: Uses `NEXT_LOCAL_API_URL=http://localhost:3002`

### Production
- **Client & Server**: Uses `NEXT_PUBLIC_API_URL=https://api.zarpstudio.com`

## API Routes

All CMS routes use the `/cms` prefix:
- `GET /api/cms/articles?blogId={id}&tenantId={id}`
- `GET /api/cms/authors?tenantId={id}`
- `GET /api/cms/blogs?tenantId={id}`

## Testing

To verify the fix:

1. Start the backend API on `http://localhost:3002`
2. Start the frontend: `pnpm dev`
3. Login and select a tenant
4. Navigate to CMS > Articles
5. Select a blog from the dropdown
6. Articles should load without 404 errors

## Next Steps

- ✅ All API clients consolidated
- ✅ Debug logs removed
- ✅ Environment variables properly configured
- ⏳ Test in browser to confirm articles load correctly
- ⏳ Verify backend API is running and accessible

## Notes

- The `cms-public-api-client.ts` file remains as it serves a different purpose (public API with blog secret keys)
- All authentication and tenant headers are automatically added by the request interceptor
- React Query caching is configured with 30-second stale time
