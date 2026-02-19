# Design Document: Access Management

## Overview

The Access Management feature provides a comprehensive dashboard for managing admins, tenants, and users within the ZARP Admin platform. Built with NextUI components and React Query for data management, this system follows Nielsen's UX heuristics to deliver an intuitive, responsive interface for super administrators.

The feature is organized into three primary modules:
1. **Admin Management** - Create, view, edit, and manage admin accounts with role-based permissions
2. **Tenant Management** - Manage organizational entities and their admin relationships
3. **User Management** - View and manage end-user accounts

### Key Design Principles

- **Server State Management**: React Query handles all API interactions with automatic caching, revalidation, and optimistic updates
- **Component-Based Architecture**: NextUI components provide consistent, accessible UI patterns
- **Validation-First**: Zod schemas validate all inputs before API submission to prevent errors
- **Progressive Enhancement**: Loading states, error boundaries, and graceful degradation ensure reliability
- **Mobile-First Responsive**: All interfaces adapt seamlessly from mobile to desktop viewports

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     App Router Pages                         │
│  /dashboard/access-management/admins                         │
│  /dashboard/access-management/tenants                        │
│  /dashboard/access-management/users                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  React Components                            │
│  - List Tables (with pagination, search, actions)           │
│  - Detail Views (with relationship displays)                │
│  - Modal Forms (create/edit with validation)                │
│  - Confirmation Dialogs (for destructive actions)           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              React Query Hooks                               │
│  - useAdmins, useCreateAdmin, useUpdateAdmin                │
│  - useTenants, useAssignAdmin, useRemoveAdmin               │
│  - useUsers, useDeactivateUser                              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 Service Layer                                │
│  - admin-service.ts (API calls for admin operations)        │
│  - tenant-service.ts (API calls for tenant operations)      │
│  - user-service.ts (API calls for user operations)          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  API Client                                  │
│  - Axios instance with Bearer token authentication          │
│  - Base URL: http://localhost:3000/api                      │
│  - Interceptors for auth and error handling                 │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Integration

- **Next.js 16 App Router**: Server and client components for optimal performance
- **NextUI**: Primary UI component library for tables, modals, forms, buttons
- **React Query**: Server state management with caching and mutations
- **Zod**: Schema validation for all form inputs
- **React Hook Form**: Form state management with Zod resolver
- **Axios**: HTTP client for API communication
- **next-intl**: Internationalization for all user-facing text
- **react-hot-toast**: Toast notifications for user feedback



## Components and Interfaces

### Page Components

#### AdminListPage (`/dashboard/access-management/admins/page.tsx`)
- Server component that renders the admin list interface
- Integrates search, pagination, and action buttons
- Uses `AdminTable` component for data display

#### AdminDetailPage (`/dashboard/access-management/admins/[id]/page.tsx`)
- Server component for viewing admin details
- Displays admin information and assigned tenants
- Provides edit, activate/deactivate, and delete actions

#### TenantListPage (`/dashboard/access-management/tenants/page.tsx`)
- Server component for tenant list interface
- Similar structure to AdminListPage

#### TenantDetailPage (`/dashboard/access-management/tenants/[id]/page.tsx`)
- Server component for tenant details
- Shows assigned admins with role management
- Provides assign/remove admin functionality

#### UserListPage (`/dashboard/access-management/users/page.tsx`)
- Server component for user list interface
- Read-only view with edit and deactivate actions

#### UserDetailPage (`/dashboard/access-management/users/[id]/page.tsx`)
- Server component for user details
- Displays user information with edit capability

### UI Components

#### AdminTable
```typescript
interface AdminTableProps {
  admins: Admin[];
  isLoading: boolean;
  onEdit: (admin: Admin) => void;
  onDelete: (adminId: number) => void;
  onToggleActive: (adminId: number, isActive: boolean) => void;
}
```
- NextUI Table component with sortable columns
- Action column with edit, activate/deactivate, delete buttons
- Status chips for active/inactive state
- Responsive design with mobile card view

#### TenantTable
```typescript
interface TenantTableProps {
  tenants: Tenant[];
  isLoading: boolean;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenantId: number) => void;
  onToggleActive: (tenantId: number, isActive: boolean) => void;
}
```
- Similar structure to AdminTable
- Displays tenant name, slug, domain, status

#### UserTable
```typescript
interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onDeactivate: (userId: number) => void;
  onDelete: (userId: number) => void;
}
```
- Simplified table for user management
- No role or tenant relationship columns

#### AdminFormModal
```typescript
interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin?: Admin; // undefined for create, defined for edit
  onSubmit: (data: AdminFormData) => Promise<void>;
}

interface AdminFormData {
  name: string;
  email: string;
  password?: string; // required for create, optional for edit
  role: AdminRole;
}
```
- NextUI Modal with form inputs
- React Hook Form with Zod validation
- Real-time validation feedback
- Submit and cancel buttons

#### TenantFormModal
```typescript
interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant;
  onSubmit: (data: TenantFormData) => Promise<void>;
}

interface TenantFormData {
  name: string;
  slug: string;
  domain: string;
}
```
- Similar structure to AdminFormModal
- Slug validation (lowercase, numbers, hyphens only)
- Domain format validation

#### AssignAdminModal
```typescript
interface AssignAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: number;
  availableAdmins: Admin[];
  onSubmit: (adminId: number, role: AdminRole) => Promise<void>;
}
```
- Dropdown to select admin
- Dropdown to select role
- Filters out already assigned admins

#### ConfirmationDialog
```typescript
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
}
```
- Reusable confirmation dialog
- Used for delete, deactivate, remove actions
- Color-coded based on action severity

#### SearchInput
```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}
```
- NextUI Input with search icon
- Debounced input for performance
- Clear button when value exists

#### PaginationControls
```typescript
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```
- NextUI Pagination component
- Shows page numbers and navigation arrows
- Disabled state when loading



## Data Models

### Admin
```typescript
interface Admin {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
  tenants?: AdminTenantRelationship[]; // included in detail view
}

enum AdminRole {
  super_admin = 'super_admin',
  owner = 'owner',
  manager = 'manager',
  editor = 'editor',
  viewer = 'viewer'
}
```

### Tenant
```typescript
interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  admins?: AdminTenantRelationship[]; // included in detail view
}
```

### User
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### AdminTenantRelationship
```typescript
interface AdminTenantRelationship {
  admin_id: number;
  tenant_id: number;
  role: AdminRole;
  admin?: Admin; // populated when fetching tenant details
  tenant?: Tenant; // populated when fetching admin details
}
```

### API Response Types

#### Paginated Response
```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
```

#### API Error Response
```typescript
interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>; // validation errors
}
```

### Form Data Types

#### CreateAdminDto
```typescript
interface CreateAdminDto {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}
```

#### UpdateAdminDto
```typescript
interface UpdateAdminDto {
  name?: string;
  email?: string;
  role?: AdminRole;
}
```

#### CreateTenantDto
```typescript
interface CreateTenantDto {
  name: string;
  slug: string;
  domain: string;
}
```

#### UpdateTenantDto
```typescript
interface UpdateTenantDto {
  name?: string;
  slug?: string;
  domain?: string;
}
```

#### AssignAdminDto
```typescript
interface AssignAdminDto {
  admin_id: number;
  role: AdminRole;
}
```

#### UpdateAdminRoleDto
```typescript
interface UpdateAdminRoleDto {
  role: AdminRole;
}
```

#### UpdateUserDto
```typescript
interface UpdateUserDto {
  name?: string;
  email?: string;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, the following properties have been identified and consolidated to eliminate redundancy:

**Consolidated Properties:**
- Form validation properties (email, password, slug) are combined into comprehensive validation properties
- Success handling properties (close modal, invalidate cache, show toast) are combined into mutation success properties
- Error handling properties are combined into mutation error properties
- Activate/deactivate properties are combined into toggle status properties
- List display properties cover all entity types with a single property pattern

**Removed Redundancies:**
- Individual "close modal on success" and "show toast on success" are subsumed by comprehensive mutation success property
- Separate activate and deactivate properties are combined into status toggle property
- Multiple "display all fields" properties are combined into data completeness property

### Data Display Properties

**Property 1: List data completeness**
*For any* paginated list of admins, tenants, or users, all required fields (id, name, email, status, timestamps) should be present in each rendered record
**Validates: Requirements 1.2, 8.2, 18.2**

**Property 2: Detail data completeness**
*For any* admin, tenant, or user detail view, all available information from the API response should be displayed in the UI
**Validates: Requirements 3.3, 10.3, 19.3**

**Property 3: Relationship data display**
*For any* admin with assigned tenants or tenant with assigned admins, the relationship data (names, roles) should be correctly displayed
**Validates: Requirements 3.4, 10.4**

**Property 4: Empty state handling**
*For any* entity with no relationships or search with no results, an appropriate empty state message should be displayed
**Validates: Requirements 3.5, 7.4, 10.5, 17.4, 23.4**

### Pagination Properties

**Property 5: Pagination controls visibility**
*For any* list with total pages greater than 1, pagination controls should be displayed
**Validates: Requirements 1.3, 8.3, 18.3**

**Property 6: Pagination navigation**
*For any* page change interaction, the system should fetch and display the requested page with correct API parameters
**Validates: Requirements 1.4, 8.4, 18.4**

### Form Validation Properties

**Property 7: Email format validation**
*For any* email input across all forms, the system should validate the format matches standard email pattern (user@domain.tld) and display errors for invalid formats
**Validates: Requirements 2.3, 4.3, 20.3, 29.1**

**Property 8: Password strength validation**
*For any* password input, the system should validate it contains minimum 8 characters, at least one uppercase letter, and at least one digit
**Validates: Requirements 2.4, 29.2**

**Property 9: Slug format validation**
*For any* slug input, the system should validate it contains only lowercase letters, numbers, and hyphens, rejecting any other characters
**Validates: Requirements 9.3, 11.3, 29.3**

**Property 10: Required field validation**
*For any* form submission with empty required fields, the system should prevent submission and highlight invalid fields
**Validates: Requirements 29.4**

**Property 11: Real-time validation feedback**
*For any* form field with validation errors, when the user corrects the input, the error indicator should be removed in real-time
**Validates: Requirements 29.5**

### Mutation Success Properties

**Property 12: Create mutation success handling**
*For any* successful create operation (admin, tenant), the system should close the modal, invalidate the list cache, and display a success toast notification
**Validates: Requirements 2.7, 9.6**

**Property 13: Update mutation success handling**
*For any* successful update operation (admin, tenant, user), the system should close the modal, invalidate relevant caches, and display a success toast notification
**Validates: Requirements 4.5, 11.6, 20.5**

**Property 14: Delete mutation success handling**
*For any* successful delete operation, the system should invalidate caches, remove the record from the list, and display a success toast notification
**Validates: Requirements 6.4, 13.3, 22.3**

**Property 15: Status toggle success handling**
*For any* successful activate/deactivate operation, the system should invalidate caches and display a success toast notification
**Validates: Requirements 5.7, 12.6, 21.4**

### Mutation Error Properties

**Property 16: Form error persistence**
*For any* failed mutation operation, the system should display the error message without closing the modal, allowing the user to correct and retry
**Validates: Requirements 2.8, 4.6, 9.7, 11.7, 20.6**

**Property 17: API error display**
*For any* API request failure, the system should display an error message with details from the API response
**Validates: Requirements 1.6, 5.8, 6.5, 8.6, 12.7, 13.4, 18.6, 21.5, 22.4**

**Property 18: Network error recovery**
*For any* API request failure due to network issues, the system should display a message indicating network problems and offer a retry option
**Validates: Requirements 28.1**

**Property 19: Validation error display**
*For any* API request failure due to validation errors, the system should display the specific validation errors from the API response
**Validates: Requirements 28.2**

### Self-Action Prevention Properties

**Property 20: Self-deactivation prevention**
*For any* logged-in admin attempting to deactivate their own account, the system should prevent the action and display a warning message
**Validates: Requirements 5.6**

**Property 21: Self-deletion prevention**
*For any* logged-in admin attempting to delete their own account, the system should prevent the action and display a warning message
**Validates: Requirements 6.3**

### Search and Filter Properties

**Property 22: Search filtering**
*For any* search term entered in admin, tenant, or user lists, the displayed results should only include records where the search term matches name, email, slug, or domain fields
**Validates: Requirements 7.2, 17.2, 23.2**

**Property 23: Search reset**
*For any* search field that is cleared, the system should display all records again (subject to pagination)
**Validates: Requirements 7.3, 17.3, 23.3**

### Loading State Properties

**Property 24: Loading indicator display**
*For any* API request in progress, the system should display an appropriate loading indicator (spinner, skeleton, or disabled state)
**Validates: Requirements 1.5, 8.5, 18.5, 24.1**

**Property 25: Success feedback**
*For any* successful mutation operation, the system should display a success toast notification with a descriptive message
**Validates: Requirements 24.2**

**Property 26: Error feedback**
*For any* failed mutation operation, the system should display an error toast notification with the error message
**Validates: Requirements 24.3**

**Property 27: Inline validation feedback**
*For any* form field with validation errors, the system should display inline error messages next to the invalid fields
**Validates: Requirements 24.4**

### Navigation Properties

**Property 28: Detail navigation**
*For any* record click in a list view, the system should navigate to the corresponding detail page with the correct ID in the URL
**Validates: Requirements 3.1, 10.1, 19.1, 26.2**

**Property 29: Back navigation**
*For any* detail page, the system should provide a back button that returns to the list view
**Validates: Requirements 26.3**

### Optimistic Update Properties

**Property 30: Optimistic UI update**
*For any* mutation operation, the system should optimistically update the UI before the API responds
**Validates: Requirements 27.1**

**Property 31: Optimistic update persistence**
*For any* successful API response after optimistic update, the system should maintain the optimistic update
**Validates: Requirements 27.2**

**Property 32: Optimistic update rollback**
*For any* failed API response after optimistic update, the system should revert the optimistic update and display an error message
**Validates: Requirements 27.3**

### Responsive Design Properties

**Property 33: Mobile layout adaptation**
*For any* viewport width less than 768px, the system should adapt table layouts to card layouts or responsive table designs
**Validates: Requirements 25.1, 25.2**

**Property 34: Modal viewport fitting**
*For any* modal displayed on mobile devices, the modal should fit within the viewport without requiring horizontal scrolling
**Validates: Requirements 25.3**

### Keyboard Accessibility Properties

**Property 35: Tab navigation**
*For any* interactive element, pressing Tab should move focus to the next element in logical order
**Validates: Requirements 30.1**

**Property 36: Enter key activation**
*For any* focused button, pressing Enter should trigger the button action
**Validates: Requirements 30.2**

**Property 37: Escape key modal close**
*For any* open modal, pressing Escape should close the modal
**Validates: Requirements 30.3**

**Property 38: Focus indicator visibility**
*For any* keyboard navigation, focused elements should display visible focus indicators
**Validates: Requirements 30.4**

### Admin-Tenant Relationship Properties

**Property 39: Admin assignment**
*For any* valid admin and tenant combination with selected role, the assign operation should create the relationship and update the tenant's admin list
**Validates: Requirements 14.4, 14.5**

**Property 40: Duplicate assignment prevention**
*For any* admin already assigned to a tenant, attempting to assign them again should display an error message
**Validates: Requirements 14.6**

**Property 41: Admin removal**
*For any* admin assigned to a tenant, the remove operation should delete the relationship and update the tenant's admin list
**Validates: Requirements 15.3, 15.4**

**Property 42: Role update**
*For any* admin assigned to a tenant, updating their role should modify the relationship and reflect the new role in the UI
**Validates: Requirements 16.3, 16.4**



## Error Handling

### Error Categories

#### Validation Errors
- **Client-side validation**: Zod schemas validate inputs before submission
- **Server-side validation**: API returns 400 with validation details
- **Display**: Inline error messages next to form fields
- **Recovery**: User corrects input and resubmits

#### Authentication Errors
- **401 Unauthorized**: Token expired or invalid
- **Display**: Error toast with message
- **Recovery**: Redirect to login page (handled by API interceptor)

#### Authorization Errors
- **403 Forbidden**: User lacks required permissions
- **Display**: Error toast with message
- **Recovery**: Inform user they lack permissions

#### Not Found Errors
- **404 Not Found**: Resource doesn't exist
- **Display**: Error toast or empty state
- **Recovery**: Return to list view

#### Conflict Errors
- **409 Conflict**: Duplicate email, slug, or existing relationship
- **Display**: Inline error message in form
- **Recovery**: User modifies conflicting field

#### Network Errors
- **Network timeout or connection failure**
- **Display**: Error toast with retry option
- **Recovery**: Retry button triggers same request

#### Server Errors
- **500 Internal Server Error**: Unexpected server failure
- **Display**: Generic error message with error ID
- **Recovery**: Retry or contact support

### Error Handling Strategy

#### React Query Error Handling
```typescript
const { mutate, isError, error } = useMutation({
  mutationFn: createAdmin,
  onError: (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 409) {
      // Handle conflict (duplicate email)
      setFormError('email', { message: error.response.data.message });
    } else if (error.response?.status === 400) {
      // Handle validation errors
      const details = error.response.data.details;
      Object.entries(details || {}).forEach(([field, messages]) => {
        setFormError(field, { message: messages[0] });
      });
    } else {
      // Generic error
      toast.error(error.response?.data.message || 'An error occurred');
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['admins']);
    toast.success('Admin created successfully');
    onClose();
  }
});
```

#### Error Boundary
- Wrap each major section in error boundary
- Display fallback UI with error details
- Provide "Try Again" button to reset boundary

#### Toast Notifications
- Success: Green toast with checkmark icon
- Error: Red toast with X icon
- Warning: Yellow toast with warning icon
- Info: Blue toast with info icon

### Validation Schemas

#### Admin Validation Schema
```typescript
const adminSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain digit')
    .optional(), // optional for edit
  role: z.enum(['super_admin', 'owner', 'manager', 'editor', 'viewer'])
});
```

#### Tenant Validation Schema
```typescript
const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  domain: z.string()
    .min(1, 'Domain is required')
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Invalid domain format')
});
```

#### User Validation Schema
```typescript
const userSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format')
});
```



## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across many generated inputs.

### Unit Testing

#### Component Tests
- Test individual components in isolation
- Mock API calls and React Query hooks
- Verify rendering, user interactions, and state changes
- Focus on specific examples and edge cases

**Example Unit Tests:**
- AdminFormModal renders with correct fields
- Clicking submit button calls onSubmit handler
- Validation errors display correctly
- Modal closes on cancel button click
- Empty state message displays when no data
- Confirmation dialog shows warning text

#### Hook Tests
- Test React Query hooks with mock API responses
- Verify cache invalidation logic
- Test optimistic updates and rollback
- Verify error handling paths

**Example Hook Tests:**
- useAdmins fetches and caches admin list
- useCreateAdmin invalidates cache on success
- useUpdateAdmin performs optimistic update
- useDeleteAdmin rolls back on error

#### Service Tests
- Test API service functions with mock axios
- Verify correct endpoints are called
- Verify request payloads are formatted correctly
- Test error response handling

**Example Service Tests:**
- createAdmin sends POST to /api/admins with correct data
- updateAdmin sends PATCH to /api/admins/:id
- deleteAdmin sends DELETE to /api/admins/:id
- Service handles 409 conflict errors correctly

### Property-Based Testing

Property-based tests should be implemented using **fast-check** library for TypeScript. Each test should run a minimum of 100 iterations to ensure comprehensive input coverage.

#### Configuration
```typescript
import fc from 'fast-check';

// Configure test to run 100 iterations
fc.assert(
  fc.property(/* generators */, (/* inputs */) => {
    // test logic
  }),
  { numRuns: 100 }
);
```

#### Property Test Examples

**Property 1: List data completeness**
```typescript
// Feature: access-management, Property 1: For any paginated list of admins, all required fields should be present
fc.assert(
  fc.property(
    fc.array(adminArbitrary, { minLength: 1, maxLength: 50 }),
    (admins) => {
      const rendered = render(<AdminTable admins={admins} />);
      admins.forEach(admin => {
        expect(rendered.getByText(admin.name)).toBeInTheDocument();
        expect(rendered.getByText(admin.email)).toBeInTheDocument();
        expect(rendered.getByText(admin.role)).toBeInTheDocument();
      });
    }
  ),
  { numRuns: 100 }
);
```

**Property 7: Email format validation**
```typescript
// Feature: access-management, Property 7: For any email input, invalid formats should be rejected
fc.assert(
  fc.property(
    fc.string().filter(s => !isValidEmail(s)),
    (invalidEmail) => {
      const result = adminSchema.safeParse({ email: invalidEmail, /* other fields */ });
      expect(result.success).toBe(false);
    }
  ),
  { numRuns: 100 }
);
```

**Property 9: Slug format validation**
```typescript
// Feature: access-management, Property 9: For any slug input, only lowercase letters, numbers, and hyphens should be accepted
fc.assert(
  fc.property(
    fc.string().filter(s => /[^a-z0-9-]/.test(s)),
    (invalidSlug) => {
      const result = tenantSchema.safeParse({ slug: invalidSlug, /* other fields */ });
      expect(result.success).toBe(false);
    }
  ),
  { numRuns: 100 }
);
```

**Property 22: Search filtering**
```typescript
// Feature: access-management, Property 22: For any search term, results should only include matching records
fc.assert(
  fc.property(
    fc.array(adminArbitrary, { minLength: 10, maxLength: 50 }),
    fc.string({ minLength: 1, maxLength: 20 }),
    (admins, searchTerm) => {
      const filtered = filterAdmins(admins, searchTerm);
      filtered.forEach(admin => {
        const matches = 
          admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchTerm.toLowerCase());
        expect(matches).toBe(true);
      });
    }
  ),
  { numRuns: 100 }
);
```

**Property 30: Optimistic UI update**
```typescript
// Feature: access-management, Property 30: For any mutation, UI should update before API responds
fc.assert(
  fc.property(
    adminArbitrary,
    async (admin) => {
      const { result } = renderHook(() => useUpdateAdmin());
      const initialData = [admin];
      
      act(() => {
        result.current.mutate({ id: admin.id, name: 'Updated Name' });
      });
      
      // UI should show updated name immediately
      expect(queryClient.getQueryData(['admins'])).toContainEqual(
        expect.objectContaining({ id: admin.id, name: 'Updated Name' })
      );
    }
  ),
  { numRuns: 100 }
);
```

#### Generators (Arbitraries)

Define generators for creating random test data:

```typescript
const adminRoleArbitrary = fc.constantFrom(
  'super_admin', 'owner', 'manager', 'editor', 'viewer'
);

const adminArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  role: adminRoleArbitrary,
  is_active: fc.boolean(),
  created_at: fc.date().map(d => d.toISOString()),
  updated_at: fc.date().map(d => d.toISOString())
});

const tenantArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  slug: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split(''))),
  domain: fc.domain(),
  is_active: fc.boolean(),
  created_at: fc.date().map(d => d.toISOString()),
  updated_at: fc.date().map(d => d.toISOString())
});

const userArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  is_active: fc.boolean(),
  created_at: fc.date().map(d => d.toISOString()),
  updated_at: fc.date().map(d => d.toISOString())
});
```

### Integration Testing

#### E2E Tests with Playwright
- Test complete user flows from login to action completion
- Test across different browsers and viewport sizes
- Focus on critical paths (create admin, assign to tenant, delete)

**Example E2E Tests:**
- Super admin can create new admin and see it in list
- Super admin can assign admin to tenant and verify relationship
- Super admin cannot delete their own account
- Search filters results correctly across all entity types
- Mobile responsive layout works correctly

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: All 42 properties implemented
- **E2E Tests**: All critical user flows covered
- **Accessibility Tests**: WCAG 2.1 AA compliance

### Testing Tools

- **Jest**: Unit test runner
- **React Testing Library**: Component testing
- **fast-check**: Property-based testing
- **MSW (Mock Service Worker)**: API mocking
- **Playwright**: E2E testing
- **axe-core**: Accessibility testing

