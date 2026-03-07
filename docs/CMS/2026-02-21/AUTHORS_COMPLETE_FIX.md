# Authors Management - Complete Fix

**Date:** February 21, 2026  
**Status:** ✅ Resolved

## Issues Fixed

### 1. Field Mapping (firstName/lastName)
- API expected `firstName` and `lastName` separately
- Frontend was sending single `name` field
- **Solution:** Updated all types, schemas, and forms to use separate name fields

### 2. TenantId Requirement
- API required `tenantId` in request body for all operations
- Frontend was only sending it as header
- **Solution:** Added tenantId to all request payloads (GET, POST, PUT, DELETE)

### 3. Data Display (snake_case vs camelCase)
- API returns fields in snake_case (`first_name`, `last_name`)
- Frontend expects camelCase (`firstName`, `lastName`)
- **Solution:** Added mapping function to convert API responses

## Complete Solution

### Service Layer (`src/common/services/cms-author-service.ts`)

Added comprehensive mapping and tenant handling:

```typescript
// 1. Mapping function for API response conversion
const mapAuthorFromApi = (data: any): Author => {
  return {
    id: data.id,
    tenant_id: data.tenant_id || data.tenantId,
    firstName: data.firstName || data.first_name,
    lastName: data.lastName || data.last_name,
    email: data.email,
    bio: data.bio,
    avatar_url: data.avatar_url || data.avatarUrl,
    status: data.status,
    created_at: data.created_at || data.createdAt,
    updated_at: data.updated_at || data.updatedAt,
  };
};

// 2. Tenant ID extraction helper (used in all functions)
const getTenantId = (): number => {
  if (typeof window !== 'undefined') {
    const tenantStorage = localStorage.getItem('tenant-storage');
    if (tenantStorage) {
      const { state } = JSON.parse(tenantStorage);
      if (state?.selectedTenant?.id) {
        return state.selectedTenant.id;
      }
    }
  }
  throw new Error('No tenant selected');
};
```

### All Operations Updated

#### GET /authors (List)
```typescript
// Query parameter
GET /api/cms/authors?tenantId=1

// Response mapped from snake_case to camelCase
authors.map(mapAuthorFromApi)
```

#### GET /authors/:id (Single)
```typescript
// Query parameter
GET /api/cms/authors/123?tenantId=1

// Response mapped
mapAuthorFromApi(response.data)
```

#### POST /authors (Create)
```typescript
// Request body
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "tenantId": 1  // ✅ Included
}

// Response mapped
mapAuthorFromApi(response.data)
```

#### PUT /authors/:id (Update)
```typescript
// Request body
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "tenantId": 1  // ✅ Included
}

// Response mapped
mapAuthorFromApi(response.data)
```

#### DELETE /authors/:id (Delete)
```typescript
// Query parameter
DELETE /api/cms/authors/123?tenantId=1
```

## Form Changes

### Author Form Component
- Split into two fields: First Name and Last Name
- 2-column grid layout
- Character limits: 100 chars each (was 255 for single name)
- Proper validation messages

### Display Components
- Author List: Shows `firstName + " " + lastName`
- Author Selection: Shows full name in dropdown
- Delete Confirmation: Shows full name

## API Contract

### Request Format (Create/Update)
```json
{
  "firstName": "string (required, max 100)",
  "lastName": "string (required, max 100)",
  "email": "string (optional, max 255, valid email)",
  "bio": "string (optional, max 1000)",
  "avatar_url": "string (optional, max 500, valid URL)",
  "tenantId": "integer (required, >= 1)"
}
```

### Response Format (from API)
```json
{
  "id": "string",
  "tenant_id": "string",
  "first_name": "string",      // ← snake_case
  "last_name": "string",       // ← snake_case
  "email": "string",
  "bio": "string",
  "avatar_url": "string",
  "status": "string",
  "created_at": "string",
  "updated_at": "string"
}
```

### Mapped Format (in Frontend)
```typescript
{
  id: string;
  tenant_id: string;
  firstName: string;           // ← camelCase
  lastName: string;            // ← camelCase
  email?: string;
  bio?: string;
  avatar_url?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
```

## Error Handling

### No Tenant Selected
```
Error: No tenant selected
```
- Thrown before API call
- Caught by React Query
- Displayed via toast notification

### API Validation Errors
```json
{
  "message": ["firstName should not be empty", ...],
  "error": "Bad Request",
  "statusCode": 400
}
```
- Transformed by error handler
- Displayed as user-friendly message

## Testing Checklist

- [x] List authors with tenantId
- [x] Create author with firstName/lastName
- [x] Display author names correctly
- [x] Edit author updates both name fields
- [x] Delete author with tenantId
- [x] Author selection in articles shows full name
- [x] No tenant error handling
- [x] API validation error display
- [x] Character limits enforced
- [x] snake_case to camelCase mapping

## Files Modified

1. `src/common/@types/@cms-author.ts` - Updated type definition
2. `src/common/services/cms-author-service.ts` - Added mapping and tenantId handling
3. `src/common/schemas/cms-author-schema.ts` - Split name validation
4. `src/components/cms/authors/author-form.tsx` - Two name fields
5. `src/components/cms/authors/author-list.tsx` - Display full name
6. `src/app/dashboard/cms/authors/page.tsx` - Updated delete message
7. `src/app/dashboard/cms/articles/new/page.tsx` - Display full name in dropdown

## Result

✅ Authors can now be created, listed, edited, and deleted successfully  
✅ All data displays correctly with proper name formatting  
✅ TenantId is properly included in all API requests  
✅ API response mapping handles both snake_case and camelCase  
✅ Form validation matches API requirements  
✅ Error handling provides clear user feedback
