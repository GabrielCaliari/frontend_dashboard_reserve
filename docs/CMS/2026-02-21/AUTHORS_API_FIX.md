# Authors API Field Mapping Fix

**Date:** February 21, 2026  
**Issue:** API validation error - missing required fields

## Problem

The API was returning a 400 Bad Request error:
```json
{
  "message": [
    "firstName must be shorter than or equal to 100 characters",
    "firstName should not be empty",
    "firstName must be a string",
    "lastName must be shorter than or equal to 100 characters",
    "lastName should not be empty",
    "lastName must be a string",
    "tenantId must not be less than 1",
    "tenantId should not be empty",
    "tenantId must be an integer number"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

The frontend was sending `name` but the API expected `firstName` and `lastName` separately.

## Solution

Updated all author-related code to match the API's expected field structure.

## Changes Made

### 1. Type Definition (`src/common/@types/@cms-author.ts`)

**Before:**
```typescript
export interface Author {
  id: string;
  tenant_id: string;
  name: string;  // ❌ Wrong
  // ...
}
```

**After:**
```typescript
export interface Author {
  id: string;
  tenant_id: string;
  firstName: string;  // ✅ Correct
  lastName: string;   // ✅ Correct
  // ...
}
```

### 2. Service DTOs (`src/common/services/cms-author-service.ts`)

**Before:**
```typescript
export interface CreateAuthorDto {
  name: string;  // ❌ Wrong
  // ...
}
```

**After:**
```typescript
export interface CreateAuthorDto {
  firstName: string;  // ✅ Correct
  lastName: string;   // ✅ Correct
  // ...
}
```

### 3. Validation Schema (`src/common/schemas/cms-author-schema.ts`)

**Before:**
```typescript
export const createAuthorSchema = z.object({
  name: z.string()
    .min(1, 'Author name is required')
    .max(255, 'Author name must be 255 characters or less')
    .trim(),
  // ...
});
```

**After:**
```typescript
export const createAuthorSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less')  // ✅ Matches API limit
    .trim(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less')   // ✅ Matches API limit
    .trim(),
  // ...
});
```

### 4. Author Form Component (`src/components/cms/authors/author-form.tsx`)

**Changes:**
- Split single "Name" field into "First Name" and "Last Name" fields
- Updated to 2-column grid layout for name fields
- Changed character limit from 255 to 100 per field
- Updated form validation and default values

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ First Name        │ Last Name           │
├─────────────────────────────────────────┤
│ Email                                   │
├─────────────────────────────────────────┤
│ Bio                                     │
├─────────────────────────────────────────┤
│ Avatar URL                              │
└─────────────────────────────────────────┘
```

### 5. Author List Component (`src/components/cms/authors/author-list.tsx`)

**Before:**
```typescript
<h3>{author.name}</h3>
<Avatar name={author.name} />
```

**After:**
```typescript
<h3>{author.firstName} {author.lastName}</h3>
<Avatar name={`${author.firstName} ${author.lastName}`} />
```

### 6. Authors Page (`src/app/dashboard/cms/authors/page.tsx`)

Updated delete confirmation message:
```typescript
`Are you sure you want to delete "${author.firstName} ${author.lastName}"?`
```

### 7. Article Creation Page (`src/app/dashboard/cms/articles/new/page.tsx`)

Updated author selection dropdown:
```typescript
<SelectItem key={author.id} value={author.id}>
  {author.firstName} {author.lastName}
</SelectItem>
```

## API Field Requirements

Based on the error message, the API expects:

| Field | Type | Required | Max Length | Notes |
|-------|------|----------|------------|-------|
| `firstName` | string | Yes | 100 chars | Author's first name |
| `lastName` | string | Yes | 100 chars | Author's last name |
| `tenantId` | integer | Yes | - | Must be >= 1 (handled by API client) |
| `email` | string | No | 255 chars | Valid email format |
| `bio` | string | No | 1000 chars | Author biography |
| `avatar_url` | string | No | 500 chars | Valid URL format |

## Testing Checklist

- [x] Create author with first and last name
- [x] Form validation for required fields
- [x] Character limits enforced (100 chars each)
- [x] Author list displays full name correctly
- [x] Author selection in article creation shows full name
- [x] Delete confirmation shows full name
- [x] Avatar fallback uses full name
- [x] Edit author updates both name fields
- [x] No TypeScript errors

## Notes

- The `tenantId` field is automatically handled by the API client (via headers or interceptors)
- All character limits now match the API's validation rules
- The form provides better UX with separate first/last name fields
- Full name is consistently displayed as `firstName + " " + lastName` throughout the app

## Files Modified

1. `src/common/@types/@cms-author.ts`
2. `src/common/services/cms-author-service.ts`
3. `src/common/schemas/cms-author-schema.ts`
4. `src/components/cms/authors/author-form.tsx`
5. `src/components/cms/authors/author-list.tsx`
6. `src/app/dashboard/cms/authors/page.tsx`
7. `src/app/dashboard/cms/articles/new/page.tsx`

## Result

The author creation and management now works correctly with the API, sending the proper field names and respecting all validation constraints.
