# CMS API Routes Update - Frontend Corrections

## Summary

Updated all CMS API routes in the frontend to match the backend changes. The `/api` prefix was removed from all CMS endpoints.

## Changes Made

### 1. API Client Configuration

#### `src/common/config/cms-api-client.ts`
```typescript
// BEFORE ❌
baseURL: `${CMS_API_URL}/api/cms`

// AFTER ✅
baseURL: `${CMS_API_URL}/cms`
```

#### `src/common/config/cms-public-api-client.ts`
```typescript
// BEFORE ❌
baseURL: `${CMS_API_URL}/api/cms/public`

// AFTER ✅
baseURL: `${CMS_API_URL}/cms/public`
```

### 2. Article Service

#### `src/common/services/article-service.ts`
Fixed duplicate path in public endpoints:

```typescript
// BEFORE ❌
`${API_URL}/cms/api/cms/public/articles`
`${API_URL}/cms/api/cms/public/articles/${slug}`

// AFTER ✅
`${API_URL}/cms/public/articles`
`${API_URL}/cms/public/articles/${slug}`
```

## Updated Endpoint Mapping

### Admin Endpoints (Protected)

| Method | Old Route | New Route |
|--------|-----------|-----------|
| POST | `/api/cms/blogs/:blogId/articles` | `/cms/blogs/:blogId/articles` |
| GET | `/api/cms/blogs/:blogId/articles` | `/cms/blogs/:blogId/articles` |
| GET | `/api/cms/blogs/:blogId/articles/:id` | `/cms/blogs/:blogId/articles/:id` |
| PUT | `/api/cms/blogs/:blogId/articles/:id` | `/cms/blogs/:blogId/articles/:id` |
| DELETE | `/api/cms/blogs/:blogId/articles/:id` | `/cms/blogs/:blogId/articles/:id` |
| POST | `/api/cms/blogs/:blogId/articles/:id/publish` | `/cms/blogs/:blogId/articles/:id/publish` |
| POST | `/api/cms/blogs/:blogId/articles/:id/archive` | `/cms/blogs/:blogId/articles/:id/archive` |

### Blog Endpoints (Protected)

| Method | Old Route | New Route |
|--------|-----------|-----------|
| GET | `/api/cms/blogs` | `/cms/blogs` |
| GET | `/api/cms/blogs/:id` | `/cms/blogs/:id` |
| POST | `/api/cms/blogs` | `/cms/blogs` |
| PUT | `/api/cms/blogs/:id` | `/cms/blogs/:id` |
| DELETE | `/api/cms/blogs/:id` | `/cms/blogs/:id` |
| POST | `/api/cms/blogs/:id/regenerate-key` | `/cms/blogs/:id/regenerate-key` |

### Image Endpoints (Protected)

| Method | Old Route | New Route |
|--------|-----------|-----------|
| POST | `/api/cms/articles/:articleId/images` | `/cms/articles/:articleId/images` |
| GET | `/api/cms/articles/:articleId/images` | `/cms/articles/:articleId/images` |
| DELETE | `/api/cms/articles/:articleId/images/:id` | `/cms/articles/:articleId/images/:id` |

### Public Endpoints (Secret Key Required)

| Method | Old Route | New Route |
|--------|-----------|-----------|
| GET | `/api/cms/public/articles` | `/cms/public/articles` |
| GET | `/api/cms/public/articles/:slug` | `/cms/public/articles/:slug` |

## Files Modified

1. `src/common/config/cms-api-client.ts` - Updated baseURL
2. `src/common/config/cms-public-api-client.ts` - Updated baseURL
3. `src/common/services/article-service.ts` - Fixed duplicate paths in public endpoints

## Testing

All existing services and hooks continue to work without changes because they use the configured API clients:

- `src/common/services/blog-service.ts` ✅ (uses `api` client)
- `src/common/services/article-service.ts` ✅ (uses `api` client + direct axios for public)
- All hooks in `src/common/hooks/cms/` ✅ (use services)

## Environment Variables

No changes required to environment variables. The system continues to use:
- `NEXT_PUBLIC_API_URL` - Base API URL (e.g., `http://localhost:3002`)

## Verification

To verify the changes are working:

```powershell
# Test admin endpoint (requires auth token and tenant-id)
Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:3002/cms/blogs/3/articles" `
  -Method "POST" `
  -Headers @{
    "Authorization" = "Bearer YOUR_TOKEN"
    "x-tenant-id" = "1"
  } `
  -ContentType "application/json" `
  -Body '{"title":"Test","content":"<p>Test</p>"}'

# Test public endpoint (requires secret key)
Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:3002/cms/public/articles" `
  -Headers @{
    "x-blog-secret-key" = "YOUR_SECRET_KEY"
  }
```

## Migration Checklist

- [x] Update cms-api-client.ts baseURL
- [x] Update cms-public-api-client.ts baseURL
- [x] Fix duplicate paths in article-service.ts
- [x] Verify blog-service.ts routes (already correct)
- [x] Verify article-service.ts routes (already correct)
- [x] Document changes

## Notes

- The main `api.ts` client already uses the correct base URL without `/api` prefix
- All service methods already use relative paths (e.g., `/cms/blogs`)
- The only issue was in the API client baseURL configuration and duplicate paths in public endpoints
- No changes needed in React components or hooks
