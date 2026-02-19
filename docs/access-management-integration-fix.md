# Access Management Integration Fix

## Issue
The frontend was calling incorrect API endpoints that didn't match the backend implementation, resulting in "Cannot GET /admins" errors.

## Root Cause
- Frontend expected endpoints like `/api/admins`, `/api/users`
- Backend actually uses `/admin/*` for admin operations and `/admin/users/*` for user operations
- Backend uses `/tenants/*` for tenant operations (this was already correct)
- API client was appending `/api` to the base URL unnecessarily

## Changes Made

### 1. Admin Service (`src/common/services/access-management/admin-service.ts`)
Updated all endpoints to match backend API:
- `GET /admin/list` - List all admins (returns array, not paginated)
- `GET /admin/:id` - Get admin by ID
- `POST /admin/register` - Create new admin
- `PATCH /admin/:id` - Update admin
- `PATCH /admin/:id/activate` - Activate admin
- `PATCH /admin/:id/deactivate` - Deactivate admin
- `DELETE /admin/:id` - Delete admin

Added client-side pagination and search filtering since backend returns full array.

### 2. User Service (`src/common/services/access-management/user-service.ts`)
Updated all endpoints to match backend API:
- `GET /admin/users?page=1&limit=20` - List users (paginated)
- `GET /admin/users/:id` - Get user by ID
- `PATCH /admin/users/:id` - Update user
- `PATCH /admin/users/:id/deactivate` - Deactivate user
- `DELETE /admin/users/:id` - Delete user

Adapted response transformation to handle backend's pagination format.

### 3. Tenant Service (`src/common/services/access-management/tenant-service.ts`)
Updated list endpoint to handle array response:
- `GET /tenants` - Returns array, added client-side pagination and filtering

Other tenant endpoints were already correct.

### 4. API Client (`src/common/config/access-management-api-client.ts`)
- Removed `/api` suffix from base URL
- Base URL now uses `NEXT_PUBLIC_API_URL` directly (https://api.zarpstudio.com)
- Backend handles the `/api` prefix internally

## Backend API Structure (from Swagger)

### Admin Endpoints
```
POST   /admin/authenticate          - Login
POST   /admin/register              - Create admin
GET    /admin/list                  - List all admins
GET    /admin/:id                   - Get admin details
PATCH  /admin/:id                   - Update admin
PATCH  /admin/:id/role              - Update admin role
PATCH  /admin/:id/activate          - Activate admin
PATCH  /admin/:id/deactivate        - Deactivate admin
DELETE /admin/:id                   - Delete admin
```

### User Endpoints
```
GET    /admin/users?page=1&limit=20 - List users (paginated)
GET    /admin/users/:id             - Get user details
PATCH  /admin/users/:id             - Update user
PATCH  /admin/users/:id/deactivate  - Deactivate user
DELETE /admin/users/:id             - Delete user
```

### Tenant Endpoints
```
POST   /tenants                     - Create tenant
GET    /tenants                     - List all tenants
GET    /tenants/:id                 - Get tenant details
PATCH  /tenants/:id                 - Update tenant
PATCH  /tenants/:id/activate        - Activate tenant
PATCH  /tenants/:id/deactivate      - Deactivate tenant
DELETE /tenants/:id                 - Delete tenant
POST   /tenants/assign              - Assign admin to tenant
DELETE /tenants/:tenantId/admins/:adminId - Remove admin from tenant
GET    /tenants/:tenantId/admins    - List tenant admins
PATCH  /tenants/:tenantId/admins/:adminId/role - Update admin role in tenant
```

## Testing
After these changes, the access management pages should now:
1. Successfully fetch admin list at `/dashboard/access-management/admins`
2. Successfully fetch tenant list at `/dashboard/access-management/tenants`
3. Successfully fetch user list at `/dashboard/access-management/users`
4. All CRUD operations should work correctly

## Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://api.zarpstudio.com
```

The backend API is expected to be running at this URL with all endpoints prefixed with `/api` internally.

## Next Steps
1. Test all CRUD operations for admins, tenants, and users
2. Verify authentication flow works correctly
3. Test pagination and search functionality
4. Verify error handling for all edge cases
