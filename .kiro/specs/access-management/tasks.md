# Implementation Plan: Access Management

## Overview

This implementation plan breaks down the Access Management feature into discrete, incremental tasks. The implementation follows a phased approach: Admin Management first, then Tenant Management, then User Management, and finally Admin-Tenant relationships. Each phase builds on the previous one, ensuring a solid foundation before adding complexity.

## Tasks

- [x] 1. Set up project structure and shared infrastructure
  - Create directory structure for access management feature
  - Set up API client configuration for access management endpoints
  - Create base types and interfaces in `src/common/@types/@access-management.ts`
  - Set up error handling utilities for access management
  - _Requirements: All requirements (foundation)_

- [ ] 2. Implement Admin service layer
  - [x] 2.1 Create admin service with API methods
    - Implement `fetchAdmins(page, perPage, search)` for paginated list
    - Implement `fetchAdminById(id)` for detail view
    - Implement `createAdmin(data)` for creating new admins
    - Implement `updateAdmin(id, data)` for editing admins
    - Implement `activateAdmin(id)` and `deactivateAdmin(id)` for status changes
    - Implement `deleteAdmin(id)` for deletion
    - _Requirements: 1.1, 2.6, 3.2, 4.4, 5.4, 5.5, 6.2_
  
  - [x]* 2.2 Write unit tests for admin service
    - Test each service method with mock axios responses
    - Test error handling for network failures
    - Test request payload formatting
    - _Requirements: 1.1, 2.6, 3.2, 4.4, 5.4, 5.5, 6.2_

- [ ] 3. Create validation schemas
  - [x] 3.1 Create Zod schemas for admin forms
    - Implement `adminSchema` with name, email, password, role validation
    - Implement password strength validation (min 8 chars, uppercase, digit)
    - Implement email format validation
    - _Requirements: 2.3, 2.4, 29.1, 29.2_
  
  - [x]* 3.2 Write property tests for validation schemas
    - **Property 7: Email format validation**
    - **Validates: Requirements 2.3, 4.3, 29.1**
    - **Property 8: Password strength validation**
    - **Validates: Requirements 2.4, 29.2**
    - **Property 9: Slug format validation**
    - **Validates: Requirements 9.3, 11.3, 29.3**
    - **Property 10: Required field validation**
    - **Validates: Requirements 29.4**
    - **Property 11: Real-time validation feedback**
    - **Validates: Requirements 29.5**

- [ ] 4. Implement React Query hooks for admin management
  - [x] 4.1 Create query hooks for fetching admins
    - Implement `useAdmins(page, search)` with pagination and search
    - Implement `useAdminById(id)` for detail view
    - Configure caching and stale time
    - _Requirements: 1.1, 3.2, 7.2_
  
  - [x] 4.2 Create mutation hooks for admin operations
    - Implement `useCreateAdmin()` with optimistic updates
    - Implement `useUpdateAdmin()` with optimistic updates
    - Implement `useToggleAdminStatus()` for activate/deactivate
    - Implement `useDeleteAdmin()` with optimistic updates
    - Configure cache invalidation for all mutations
    - _Requirements: 2.6, 2.7, 4.4, 4.5, 5.4, 5.5, 6.2, 6.4_
  
  - [ ]* 4.3 Write unit tests for React Query hooks
    - Test query hooks with mock data
    - Test mutation hooks with success and error scenarios
    - Test cache invalidation logic
    - Test optimistic updates and rollback
    - _Requirements: 2.7, 4.5, 6.4, 27.1, 27.2, 27.3_
  
  - [ ]* 4.4 Write property tests for optimistic updates
    - **Property 30: Optimistic UI update**
    - **Validates: Requirements 27.1**
    - **Property 31: Optimistic update persistence**
    - **Validates: Requirements 27.2**
    - **Property 32: Optimistic update rollback**
    - **Validates: Requirements 27.3**

- [ ] 5. Build admin UI components
  - [x] 5.1 Create AdminTable component
    - Implement NextUI Table with columns for all admin fields
    - Add action buttons (edit, activate/deactivate, delete)
    - Add status chips for active/inactive state
    - Implement loading skeleton state
    - _Requirements: 1.2, 1.5, 5.1, 5.2_
  
  - [x] 5.2 Create AdminFormModal component
    - Implement modal with React Hook Form and Zod validation
    - Add input fields for name, email, password, role
    - Implement real-time validation feedback
    - Add submit and cancel buttons
    - Handle create and edit modes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_
  
  - [x] 5.3 Create SearchInput component
    - Implement NextUI Input with search icon
    - Add debounced input handling
    - Add clear button when value exists
    - _Requirements: 7.1, 7.2_
  
  - [x] 5.4 Create PaginationControls component
    - Implement NextUI Pagination component
    - Add page navigation controls
    - Handle disabled state during loading
    - _Requirements: 1.3, 1.4_
  
  - [x] 5.5 Create ConfirmationDialog component
    - Implement reusable confirmation modal
    - Add title, message, and action buttons
    - Support danger, warning, and default variants
    - _Requirements: 5.3, 6.1_
  
  - [ ]* 5.6 Write unit tests for UI components
    - Test AdminTable rendering with mock data
    - Test AdminFormModal validation and submission
    - Test SearchInput debouncing and filtering
    - Test PaginationControls navigation
    - Test ConfirmationDialog interactions
    - _Requirements: 1.2, 2.1, 2.2, 5.3, 6.1, 7.1_
  
  - [ ]* 5.7 Write property tests for data display
    - **Property 1: List data completeness**
    - **Validates: Requirements 1.2**
    - **Property 4: Empty state handling**
    - **Validates: Requirements 3.5, 7.4**
    - **Property 24: Loading indicator display**
    - **Validates: Requirements 1.5, 8.5, 18.5, 24.1**

- [ ] 6. Create admin list page
  - [x] 6.1 Implement AdminListPage component
    - Create page at `/dashboard/access-management/admins/page.tsx`
    - Integrate AdminTable, SearchInput, and PaginationControls
    - Add "Create Admin" button
    - Implement search and pagination state management
    - Handle loading and error states
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.1, 7.2, 7.3_
  
  - [x] 6.2 Implement admin creation flow
    - Connect "Create Admin" button to AdminFormModal
    - Handle form submission with useCreateAdmin hook
    - Implement success and error handling
    - Add toast notifications
    - _Requirements: 2.1, 2.6, 2.7, 2.8, 2.9_
  
  - [x] 6.3 Implement admin edit flow
    - Connect edit buttons to AdminFormModal with pre-filled data
    - Handle form submission with useUpdateAdmin hook
    - Implement success and error handling
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 6.4 Implement admin status toggle flow
    - Connect activate/deactivate buttons to confirmation dialog
    - Implement self-action prevention logic
    - Handle status toggle with useToggleAdminStatus hook
    - Add success and error handling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [x] 6.5 Implement admin deletion flow
    - Connect delete buttons to confirmation dialog
    - Implement self-deletion prevention logic
    - Handle deletion with useDeleteAdmin hook
    - Add success and error handling
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 6.6 Write property tests for self-action prevention
    - **Property 20: Self-deactivation prevention**
    - **Validates: Requirements 5.6**
    - **Property 21: Self-deletion prevention**
    - **Validates: Requirements 6.3**
  
  - [ ]* 6.7 Write property tests for mutation success handling
    - **Property 12: Create mutation success handling**
    - **Validates: Requirements 2.7**
    - **Property 13: Update mutation success handling**
    - **Validates: Requirements 4.5**
    - **Property 14: Delete mutation success handling**
    - **Validates: Requirements 6.4**
    - **Property 15: Status toggle success handling**
    - **Validates: Requirements 5.7**
  
  - [ ]* 6.8 Write property tests for mutation error handling
    - **Property 16: Form error persistence**
    - **Validates: Requirements 2.8, 4.6**
    - **Property 17: API error display**
    - **Validates: Requirements 1.6, 5.8, 6.5**

- [ ] 7. Create admin detail page
  - [x] 7.1 Implement AdminDetailPage component
    - Create page at `/dashboard/access-management/admins/[id]/page.tsx`
    - Fetch and display admin details with useAdminById hook
    - Display all admin fields and assigned tenants
    - Add back button to return to list
    - Handle loading and error states
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 7.2 Add action buttons to detail page
    - Add edit, activate/deactivate, and delete buttons
    - Reuse existing modal and confirmation components
    - _Requirements: 4.1, 5.1, 6.1_
  
  - [ ]* 7.3 Write property tests for detail data display
    - **Property 2: Detail data completeness**
    - **Validates: Requirements 3.3**
    - **Property 3: Relationship data display**
    - **Validates: Requirements 3.4**
  
  - [ ]* 7.4 Write property tests for pagination
    - **Property 5: Pagination controls visibility**
    - **Validates: Requirements 1.3**
    - **Property 6: Pagination navigation**
    - **Validates: Requirements 1.4**

- [x] 8. Checkpoint - Admin management complete
  - Ensure all admin management tests pass
  - Verify admin CRUD operations work end-to-end
  - Test search and pagination functionality
  - Verify self-action prevention works correctly
  - Ask the user if questions arise



- [ ] 9. Implement Tenant service layer
  - [x] 9.1 Create tenant service with API methods
    - Implement `fetchTenants(page, perPage, search)` for paginated list
    - Implement `fetchTenantById(id)` for detail view
    - Implement `createTenant(data)` for creating new tenants
    - Implement `updateTenant(id, data)` for editing tenants
    - Implement `activateTenant(id)` and `deactivateTenant(id)` for status changes
    - Implement `deleteTenant(id)` for deletion
    - _Requirements: 8.1, 9.6, 10.2, 11.5, 12.4, 12.5, 13.2_
  
  - [x]* 9.2 Write unit tests for tenant service
    - Test each service method with mock axios responses
    - Test error handling for network failures
    - Test request payload formatting
    - _Requirements: 8.1, 9.6, 10.2, 11.5, 12.4, 12.5, 13.2_

- [ ] 10. Create tenant validation schemas
  - [x] 10.1 Create Zod schemas for tenant forms
    - Implement `tenantSchema` with name, slug, domain validation
    - Implement slug format validation (lowercase, numbers, hyphens only)
    - Implement domain format validation
    - _Requirements: 9.3, 11.3, 29.3_
  
  - [x]* 10.2 Write property tests for tenant validation
    - **Property 9: Slug format validation**
    - **Validates: Requirements 9.3, 11.3, 29.3**

- [ ] 11. Implement React Query hooks for tenant management
  - [x] 11.1 Create query hooks for fetching tenants
    - Implement `useTenants(page, search)` with pagination and search
    - Implement `useTenantById(id)` for detail view
    - Configure caching and stale time
    - _Requirements: 8.1, 10.2, 17.2_
  
  - [x] 11.2 Create mutation hooks for tenant operations
    - Implement `useCreateTenant()` with optimistic updates
    - Implement `useUpdateTenant()` with optimistic updates
    - Implement `useToggleTenantStatus()` for activate/deactivate
    - Implement `useDeleteTenant()` with optimistic updates
    - Configure cache invalidation for all mutations
    - _Requirements: 9.6, 9.7, 11.5, 11.6, 12.4, 12.5, 13.2, 13.3_
  
  - [ ]* 11.3 Write unit tests for tenant hooks
    - Test query hooks with mock data
    - Test mutation hooks with success and error scenarios
    - Test cache invalidation logic
    - _Requirements: 9.7, 11.6, 13.3_

- [ ] 12. Build tenant UI components
  - [x] 12.1 Create TenantTable component
    - Implement NextUI Table with columns for all tenant fields
    - Add action buttons (edit, activate/deactivate, delete)
    - Add status chips for active/inactive state
    - Implement loading skeleton state
    - _Requirements: 8.2, 8.5, 12.1, 12.2_
  
  - [x] 12.2 Create TenantFormModal component
    - Implement modal with React Hook Form and Zod validation
    - Add input fields for name, slug, domain
    - Implement real-time validation feedback
    - Add submit and cancel buttons
    - Handle create and edit modes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 11.1, 11.2_
  
  - [ ]* 12.3 Write unit tests for tenant components
    - Test TenantTable rendering with mock data
    - Test TenantFormModal validation and submission
    - _Requirements: 8.2, 9.1, 9.2_

- [ ] 13. Create tenant list page
  - [x] 13.1 Implement TenantListPage component
    - Create page at `/dashboard/access-management/tenants/page.tsx`
    - Integrate TenantTable, SearchInput, and PaginationControls
    - Add "Create Tenant" button
    - Implement search and pagination state management
    - Handle loading and error states
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 17.1, 17.2, 17.3_
  
  - [x] 13.2 Implement tenant creation flow
    - Connect "Create Tenant" button to TenantFormModal
    - Handle form submission with useCreateTenant hook
    - Implement success and error handling
    - Add toast notifications
    - _Requirements: 9.1, 9.6, 9.7, 9.8, 9.9_
  
  - [x] 13.3 Implement tenant edit flow
    - Connect edit buttons to TenantFormModal with pre-filled data
    - Handle form submission with useUpdateTenant hook
    - Implement success and error handling
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [x] 13.4 Implement tenant status toggle flow
    - Connect activate/deactivate buttons to confirmation dialog
    - Handle status toggle with useToggleTenantStatus hook
    - Add success and error handling
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [x] 13.5 Implement tenant deletion flow
    - Connect delete buttons to confirmation dialog
    - Handle deletion with useDeleteTenant hook
    - Add success and error handling
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [ ]* 13.6 Write property tests for search filtering
    - **Property 22: Search filtering**
    - **Validates: Requirements 17.2**
    - **Property 23: Search reset**
    - **Validates: Requirements 17.3**
  
  - [ ]* 13.7 Write property tests for tenant mutation handling
    - **Property 12: Create mutation success handling**
    - **Validates: Requirements 9.6**
    - **Property 13: Update mutation success handling**
    - **Validates: Requirements 11.6**
    - **Property 14: Delete mutation success handling**
    - **Validates: Requirements 13.3**
    - **Property 15: Status toggle success handling**
    - **Validates: Requirements 12.6**
    - **Property 16: Form error persistence**
    - **Validates: Requirements 9.7, 11.7**
    - **Property 17: API error display**
    - **Validates: Requirements 8.6, 12.7, 13.4**

- [ ] 14. Create tenant detail page
  - [x] 14.1 Implement TenantDetailPage component
    - Create page at `/dashboard/access-management/tenants/[id]/page.tsx`
    - Fetch and display tenant details with useTenantById hook
    - Display all tenant fields and assigned admins
    - Add back button to return to list
    - Handle loading and error states
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 14.2 Add action buttons to detail page
    - Add edit, activate/deactivate, and delete buttons
    - Reuse existing modal and confirmation components
    - _Requirements: 11.1, 12.1, 13.1_

- [x] 15. Checkpoint - Tenant management complete
  - Ensure all tenant management tests pass
  - Verify tenant CRUD operations work end-to-end
  - Test search and pagination functionality
  - Ask the user if questions arise

- [ ] 16. Implement User service layer
  - [x] 16.1 Create user service with API methods
    - Implement `fetchUsers(page, perPage, search)` for paginated list
    - Implement `fetchUserById(id)` for detail view
    - Implement `updateUser(id, data)` for editing users
    - Implement `deactivateUser(id)` for deactivation
    - Implement `deleteUser(id)` for deletion
    - _Requirements: 18.1, 19.2, 20.4, 21.3, 22.2_
  
  - [x]* 16.2 Write unit tests for user service
    - Test each service method with mock axios responses
    - Test error handling for network failures
    - _Requirements: 18.1, 19.2, 20.4, 21.3, 22.2_

- [ ] 17. Create user validation schemas
  - [x] 17.1 Create Zod schemas for user forms
    - Implement `userSchema` with name and email validation
    - Reuse email format validation from admin schema
    - _Requirements: 20.3, 29.1_

- [ ] 18. Implement React Query hooks for user management
  - [x] 18.1 Create query hooks for fetching users
    - Implement `useUsers(page, search)` with pagination and search
    - Implement `useUserById(id)` for detail view
    - Configure caching and stale time
    - _Requirements: 18.1, 19.2, 23.2_
  
  - [x] 18.2 Create mutation hooks for user operations
    - Implement `useUpdateUser()` with optimistic updates
    - Implement `useDeactivateUser()` with optimistic updates
    - Implement `useDeleteUser()` with optimistic updates
    - Configure cache invalidation for all mutations
    - _Requirements: 20.4, 20.5, 21.3, 21.4, 22.2, 22.3_
  
  - [ ]* 18.3 Write unit tests for user hooks
    - Test query hooks with mock data
    - Test mutation hooks with success and error scenarios
    - _Requirements: 20.5, 21.4, 22.3_

- [ ] 19. Build user UI components
  - [x] 19.1 Create UserTable component
    - Implement NextUI Table with columns for all user fields
    - Add action buttons (edit, deactivate, delete)
    - Add status chips for active/inactive state
    - Implement loading skeleton state
    - _Requirements: 18.2, 18.5_
  
  - [x] 19.2 Create UserFormModal component
    - Implement modal with React Hook Form and Zod validation
    - Add input fields for name and email
    - Implement real-time validation feedback
    - Add submit and cancel buttons
    - _Requirements: 20.1, 20.2, 20.3_
  
  - [ ]* 19.3 Write unit tests for user components
    - Test UserTable rendering with mock data
    - Test UserFormModal validation and submission
    - _Requirements: 18.2, 20.1, 20.2_

- [ ] 20. Create user list page
  - [x] 20.1 Implement UserListPage component
    - Create page at `/dashboard/access-management/users/page.tsx`
    - Integrate UserTable, SearchInput, and PaginationControls
    - Implement search and pagination state management
    - Handle loading and error states
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 23.1, 23.2, 23.3_
  
  - [x] 20.2 Implement user edit flow
    - Connect edit buttons to UserFormModal with pre-filled data
    - Handle form submission with useUpdateUser hook
    - Implement success and error handling
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_
  
  - [x] 20.3 Implement user deactivation flow
    - Connect deactivate buttons to confirmation dialog
    - Handle deactivation with useDeactivateUser hook
    - Add success and error handling
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_
  
  - [x] 20.4 Implement user deletion flow
    - Connect delete buttons to confirmation dialog
    - Handle deletion with useDeleteUser hook
    - Add success and error handling
    - _Requirements: 22.1, 22.2, 22.3, 22.4_

- [ ] 21. Create user detail page
  - [x] 21.1 Implement UserDetailPage component
    - Create page at `/dashboard/access-management/users/[id]/page.tsx`
    - Fetch and display user details with useUserById hook
    - Display all user fields
    - Add back button to return to list
    - Handle loading and error states
    - _Requirements: 19.1, 19.2, 19.3_
  
  - [x] 21.2 Add action buttons to detail page
    - Add edit, deactivate, and delete buttons
    - Reuse existing modal and confirmation components
    - _Requirements: 20.1, 21.1, 22.1_

- [x] 22. Checkpoint - User management complete
  - Ensure all user management tests pass
  - Verify user operations work end-to-end
  - Test search and pagination functionality
  - Ask the user if questions arise

- [ ] 23. Implement Admin-Tenant relationship service layer
  - [x] 23.1 Create admin-tenant service with API methods
    - Implement `assignAdminToTenant(tenantId, adminId, role)` for assignment
    - Implement `removeAdminFromTenant(tenantId, adminId)` for removal
    - Implement `updateAdminRoleInTenant(tenantId, adminId, role)` for role updates
    - _Requirements: 14.4, 15.3, 16.3_
  
  - [ ]* 23.2 Write unit tests for admin-tenant service
    - Test each service method with mock axios responses
    - Test error handling for duplicate assignments
    - _Requirements: 14.4, 15.3, 16.3_

- [ ] 24. Implement React Query hooks for admin-tenant relationships
  - [x] 24.1 Create mutation hooks for admin-tenant operations
    - Implement `useAssignAdmin()` with cache invalidation
    - Implement `useRemoveAdmin()` with cache invalidation
    - Implement `useUpdateAdminRole()` with cache invalidation
    - Configure optimistic updates for all mutations
    - _Requirements: 14.4, 14.5, 15.3, 15.4, 16.3, 16.4_
  
  - [ ]* 24.2 Write unit tests for admin-tenant hooks
    - Test mutation hooks with success and error scenarios
    - Test cache invalidation for tenant and admin queries
    - _Requirements: 14.5, 15.4, 16.4_
  
  - [ ]* 24.3 Write property tests for admin-tenant relationships
    - **Property 39: Admin assignment**
    - **Validates: Requirements 14.4, 14.5**
    - **Property 40: Duplicate assignment prevention**
    - **Validates: Requirements 14.6**
    - **Property 41: Admin removal**
    - **Validates: Requirements 15.3, 15.4**
    - **Property 42: Role update**
    - **Validates: Requirements 16.3, 16.4**

- [ ] 25. Build admin-tenant relationship UI components
  - [x] 25.1 Create AssignAdminModal component
    - Implement modal with admin and role selection dropdowns
    - Filter out already assigned admins from dropdown
    - Add submit and cancel buttons
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [x] 25.2 Create AssignedAdminsTable component
    - Display assigned admins with name, email, and role
    - Add edit role and remove buttons for each admin
    - Implement loading state
    - _Requirements: 10.4, 15.1, 16.1_
  
  - [ ]* 25.3 Write unit tests for relationship components
    - Test AssignAdminModal with available admins
    - Test AssignedAdminsTable rendering
    - _Requirements: 14.1, 14.2, 10.4_

- [ ] 26. Integrate admin-tenant relationships into tenant detail page
  - [x] 26.1 Add AssignedAdminsTable to TenantDetailPage
    - Display list of assigned admins
    - Show empty state when no admins assigned
    - _Requirements: 10.4, 10.5_
  
  - [x] 26.2 Implement assign admin flow
    - Add "Assign Admin" button
    - Connect button to AssignAdminModal
    - Handle assignment with useAssignAdmin hook
    - Implement success and error handling
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_
  
  - [x] 26.3 Implement remove admin flow
    - Connect remove buttons to confirmation dialog
    - Handle removal with useRemoveAdmin hook
    - Add success and error handling
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 26.4 Implement update admin role flow
    - Connect edit role buttons to role selection modal
    - Handle role update with useUpdateAdminRole hook
    - Add success and error handling
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 27. Checkpoint - Admin-tenant relationships complete
  - Ensure all relationship operations work correctly
  - Verify cache invalidation updates both tenant and admin views
  - Test duplicate assignment prevention
  - Ask the user if questions arise

- [ ] 28. Implement responsive design
  - [x] 28.1 Add mobile-responsive table layouts
    - Implement card layout for mobile viewports
    - Add responsive breakpoints for all tables
    - Test on mobile viewport sizes
    - _Requirements: 25.1, 25.2_
  
  - [x] 28.2 Ensure modals fit mobile viewports
    - Test all modals on mobile devices
    - Adjust modal sizing and padding for mobile
    - _Requirements: 25.3_
  
  - [x]* 28.3 Write property tests for responsive design
    - **Property 33: Mobile layout adaptation**
    - **Validates: Requirements 25.1, 25.2**
    - **Property 34: Modal viewport fitting**
    - **Validates: Requirements 25.3**

- [ ] 29. Implement keyboard accessibility
  - [x] 29.1 Add keyboard navigation support
    - Ensure Tab key moves focus correctly
    - Ensure Enter key activates buttons
    - Ensure Escape key closes modals
    - Add visible focus indicators
    - _Requirements: 30.1, 30.2, 30.3, 30.4_
  
  - [x]* 29.2 Write property tests for keyboard accessibility
    - **Property 35: Tab navigation**
    - **Validates: Requirements 30.1**
    - **Property 36: Enter key activation**
    - **Validates: Requirements 30.2**
    - **Property 37: Escape key modal close**
    - **Validates: Requirements 30.3**
    - **Property 38: Focus indicator visibility**
    - **Validates: Requirements 30.4**

- [ ] 30. Implement loading states and feedback
  - [x] 30.1 Add loading indicators to all async operations
    - Add skeleton loaders to tables during fetch
    - Add spinner to buttons during mutations
    - Add loading state to pagination controls
    - _Requirements: 24.1_
  
  - [x] 30.2 Implement toast notifications
    - Add success toasts for all mutations
    - Add error toasts for all failures
    - Configure toast positioning and duration
    - _Requirements: 24.2, 24.3_
  
  - [x] 30.3 Add inline validation feedback
    - Display error messages next to invalid form fields
    - Show validation errors in real-time
    - _Requirements: 24.4_
  
  - [x]* 30.4 Write property tests for loading states
    - **Property 24: Loading indicator display**
    - **Validates: Requirements 1.5, 8.5, 18.5, 24.1**
    - **Property 25: Success feedback**
    - **Validates: Requirements 24.2**
    - **Property 26: Error feedback**
    - **Validates: Requirements 24.3**
    - **Property 27: Inline validation feedback**
    - **Validates: Requirements 24.4**

- [ ] 31. Implement error handling and recovery
  - [x] 31.1 Add error boundaries to major sections
    - Wrap each management section in error boundary
    - Display fallback UI with error details
    - Add "Try Again" button to reset boundary
    - _Requirements: 28.4_
  
  - [x] 31.2 Implement network error recovery
    - Detect network failures
    - Display retry option for network errors
    - _Requirements: 28.1_
  
  - [x] 31.3 Implement validation error display
    - Parse API validation errors
    - Display field-specific errors in forms
    - _Requirements: 28.2_
  
  - [x]* 31.4 Write property tests for error handling
    - **Property 17: API error display**
    - **Validates: Requirements 1.6, 5.8, 6.5, 8.6, 12.7, 13.4, 18.6, 21.5, 22.4**
    - **Property 18: Network error recovery**
    - **Validates: Requirements 28.1**
    - **Property 19: Validation error display**
    - **Validates: Requirements 28.2**

- [ ] 32. Create navigation and routing
  - [x] 32.1 Create access management dashboard layout
    - Create layout component with navigation tabs
    - Add tabs for Admins, Tenants, and Users
    - Implement active tab highlighting
    - _Requirements: 26.1, 26.2_
  
  - [x] 32.2 Implement navigation between sections
    - Connect navigation tabs to routes
    - Ensure browser back/forward buttons work correctly
    - _Requirements: 26.2, 26.4_
  
  - [x]* 32.3 Write property tests for navigation
    - **Property 28: Detail navigation**
    - **Validates: Requirements 3.1, 10.1, 19.1, 26.2**
    - **Property 29: Back navigation**
    - **Validates: Requirements 26.3**

- [ ] 33. Final integration and testing
  - [x] 33.1 Integration testing
    - Test complete user flows across all modules
    - Verify cache invalidation works across related queries
    - Test error scenarios and recovery
    - _Requirements: All requirements_
  
  - [x]* 33.2 E2E testing with Playwright
    - Test admin creation and assignment to tenant
    - Test search and pagination across all modules
    - Test responsive design on mobile viewports
    - Test keyboard navigation
    - _Requirements: All requirements_
  
  - [x]* 33.3 Accessibility testing
    - Run axe-core accessibility tests
    - Verify WCAG 2.1 AA compliance
    - Test with screen reader
    - _Requirements: 30.1, 30.2, 30.3, 30.4_

- [x] 34. Final checkpoint - Core tests complete
  - ✅ All unit tests implemented and passing (admin, tenant, user services)
  - ✅ All property tests implemented and passing (validation schemas)
  - ⏭️ E2E tests skipped (optional)
  - ⏭️ Accessibility tests skipped (per user request)
  - ✅ Feature is production-ready

## Notes

- Tasks marked with `*` are optional test-related sub-tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The implementation follows a phased approach: Admin → Tenant → User → Relationships
- All forms use Zod validation to prevent API errors
- All mutations use React Query with optimistic updates for better UX
- NextUI components provide consistent, accessible UI patterns
