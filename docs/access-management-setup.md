# Access Management Feature - Setup Guide

## Overview

The Access Management feature provides a comprehensive dashboard for managing admins, tenants, and users within the ZARP Admin platform. This system enables super administrators to control access, assign roles, manage tenant relationships, and maintain user accounts.

## Architecture

### Directory Structure

```
src/
├── common/
│   ├── @types/
│   │   └── @access-management.ts          # TypeScript type definitions
│   ├── config/
│   │   └── access-management-api-client.ts # Axios client configuration
│   ├── services/
│   │   └── access-management/             # API service layer
│   │       ├── admin-service.ts
│   │       ├── tenant-service.ts
│   │       └── user-service.ts
│   ├── schemas/
│   │   └── access-management/             # Zod validation schemas
│   │       ├── admin-schema.ts
│   │       ├── tenant-schema.ts
│   │       └── user-schema.ts
│   ├── hooks/
│   │   └── access-management/             # React Query hooks
│   │       ├── useAdmins.ts
│   │       ├── useTenants.ts
│   │       └── useUsers.ts
│   └── utils/
│       └── access-management-errors.ts    # Error handling utilities
│
├── components/
│   └── access-management/                 # UI components
│       ├── admins/
│       ├── tenants/
│       └── users/
│
└── app/
    └── dashboard/
        └── access-management/             # Next.js pages
            ├── admins/
            │   ├── page.tsx
            │   └── [id]/
            │       └── page.tsx
            ├── tenants/
            │   ├── page.tsx
            │   └── [id]/
            │       └── page.tsx
            └── users/
                ├── page.tsx
                └── [id]/
                    └── page.tsx
```

## Core Entities

### Admin
- Privileged user with dashboard access
- Roles: super_admin, owner, manager, editor, viewer
- Can be assigned to multiple tenants with different roles

### Tenant
- Organizational entity representing a client or business unit
- Identified by name, slug, and domain
- Can have multiple admins assigned with specific roles

### User
- End-user of the platform with basic access rights
- Managed by super admins

### AdminTenantRelationship
- Association between an admin and a tenant
- Includes role assignment for tenant-specific permissions

## API Endpoints

### Admin Management
- `GET /api/admins` - List admins (paginated, searchable)
- `GET /api/admins/:id` - Get admin details
- `POST /api/admins` - Create new admin
- `PATCH /api/admins/:id` - Update admin
- `PATCH /api/admins/:id/activate` - Activate admin
- `PATCH /api/admins/:id/deactivate` - Deactivate admin
- `DELETE /api/admins/:id` - Delete admin

### Tenant Management
- `GET /api/tenants` - List tenants (paginated, searchable)
- `GET /api/tenants/:id` - Get tenant details
- `POST /api/tenants` - Create new tenant
- `PATCH /api/tenants/:id` - Update tenant
- `PATCH /api/tenants/:id/activate` - Activate tenant
- `PATCH /api/tenants/:id/deactivate` - Deactivate tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Admin-Tenant Relationships
- `POST /api/tenants/:tenantId/admins` - Assign admin to tenant
- `DELETE /api/tenants/:tenantId/admins/:adminId` - Remove admin from tenant
- `PATCH /api/tenants/:tenantId/admins/:adminId` - Update admin role in tenant

### User Management
- `GET /api/users` - List users (paginated, searchable)
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user
- `PATCH /api/users/:id/deactivate` - Deactivate user
- `DELETE /api/users/:id` - Delete user

## Authentication

All API requests require Bearer token authentication:

```typescript
Authorization: Bearer <token>
```

The token is automatically retrieved from cookies and added to requests via the API client interceptor.

## Error Handling

### Error Categories

1. **Validation Errors (400)** - Invalid input data
2. **Unauthorized (401)** - Missing or invalid token
3. **Forbidden (403)** - Insufficient permissions
4. **Not Found (404)** - Resource doesn't exist
5. **Conflict (409)** - Duplicate email, slug, or existing relationship
6. **Network Errors** - Connection failures
7. **Server Errors (500)** - Unexpected server failures

### Error Response Format

```typescript
{
  code: string;
  message: string;
  details?: Record<string, string[]>; // Field-specific validation errors
}
```

### Error Utilities

The `access-management-errors.ts` file provides:
- Error constants for all error types
- User-friendly error messages
- Utility functions for error detection and extraction

## Validation

All forms use Zod schemas for validation:

### Admin Validation
- Name: 1-100 characters
- Email: Valid email format
- Password: Min 8 chars, 1 uppercase, 1 digit
- Role: One of the defined AdminRole enum values

### Tenant Validation
- Name: 1-100 characters
- Slug: Lowercase letters, numbers, hyphens only
- Domain: Valid domain format

### User Validation
- Name: 1-100 characters
- Email: Valid email format

## State Management

### React Query
- Handles all server state with automatic caching
- Optimistic updates for better UX
- Automatic cache invalidation on mutations

### Query Keys
```typescript
['admins'] - Admin list
['admins', id] - Admin detail
['tenants'] - Tenant list
['tenants', id] - Tenant detail
['users'] - User list
['users', id] - User detail
```

## UI Components

### NextUI Components Used
- Table - Data display with sorting and actions
- Modal - Forms and confirmations
- Input - Text inputs with validation
- Select - Dropdowns for role selection
- Button - Actions and navigation
- Chip - Status indicators
- Pagination - List navigation

### Custom Components
- AdminTable - Displays admin list with actions
- TenantTable - Displays tenant list with actions
- UserTable - Displays user list with actions
- AdminFormModal - Create/edit admin form
- TenantFormModal - Create/edit tenant form
- UserFormModal - Edit user form
- AssignAdminModal - Assign admin to tenant
- ConfirmationDialog - Reusable confirmation dialog
- SearchInput - Debounced search input
- PaginationControls - Pagination UI

## Development Workflow

### Phase 1: Admin Management
1. Create admin service layer
2. Create validation schemas
3. Create React Query hooks
4. Build UI components
5. Create list and detail pages

### Phase 2: Tenant Management
1. Create tenant service layer
2. Create validation schemas
3. Create React Query hooks
4. Build UI components
5. Create list and detail pages

### Phase 3: User Management
1. Create user service layer
2. Create validation schemas
3. Create React Query hooks
4. Build UI components
5. Create list and detail pages

### Phase 4: Admin-Tenant Relationships
1. Create relationship service layer
2. Create React Query hooks
3. Build relationship UI components
4. Integrate into tenant detail page

### Phase 5: Polish
1. Implement responsive design
2. Add keyboard accessibility
3. Implement loading states
4. Add error boundaries
5. Write comprehensive tests

## Testing Strategy

### Unit Tests
- Service layer with mock axios
- React Query hooks with mock data
- UI components with React Testing Library
- Validation schemas with test cases

### Property-Based Tests
- Form validation across all inputs
- Search filtering correctness
- Optimistic update behavior
- Self-action prevention

### E2E Tests
- Complete user flows
- Cross-browser testing
- Mobile responsive testing
- Accessibility testing

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Next Steps

1. Implement admin service layer (Task 2)
2. Create validation schemas (Task 3)
3. Implement React Query hooks (Task 4)
4. Build UI components (Task 5)
5. Create pages (Tasks 6-7)

## References

- Requirements: `.kiro/specs/access-management/requirements.md`
- Design: `.kiro/specs/access-management/design.md`
- Tasks: `.kiro/specs/access-management/tasks.md`
