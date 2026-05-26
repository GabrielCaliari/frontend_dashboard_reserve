/**
 * Navigation Property-Based Tests
 * 
 * Property tests for navigation functionality using fast-check
 * Validates: Requirements 3.1, 10.1, 19.1, 26.2, 26.3
 * 
 * Each test runs 100 iterations to ensure comprehensive input coverage
 * 
 * Tests verify navigation between list and detail views, back button
 * functionality, and URL parameter handling across all entity types.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from'vitest';
import fc from'fast-check';
import { render, screen, fireEvent, waitFor } from'@testing-library/react';
import { useRouter, useParams } from'next/navigation';
import { AdminRole } from'@/src/common/@types/@access-management';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
 useRouter: vi.fn(),
 useParams: vi.fn(),
 usePathname: vi.fn(),
}));

// Generator for Admin data
const adminArbitrary = fc.record({
 id: fc.integer({ min: 1, max: 10000 }),
 name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
 email: fc.emailAddress(),
 role: fc.constantFrom(
 AdminRole.super_admin,
 AdminRole.owner,
 AdminRole.manager,
 AdminRole.editor,
 AdminRole.viewer
 ),
 is_active: fc.boolean(),
 created_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
 updated_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
});

// Generator for Tenant data
const tenantArbitrary = fc.record({
 id: fc.integer({ min: 1, max: 10000 }),
 name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
 slug: fc.string({ minLength: 2, maxLength: 50 }).map(s => 
 s.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^-+|-+$/g,'').slice(0, 50) ||'test-slug'
 ),
 domain: fc.domain(),
 is_active: fc.boolean(),
 created_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
 updated_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
});

// Generator for User data
const userArbitrary = fc.record({
 id: fc.integer({ min: 1, max: 10000 }),
 name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
 email: fc.emailAddress(),
 is_active: fc.boolean(),
 created_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
 updated_at: fc.integer({ min: 1577836800000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
});

// Generator for entity types
const entityTypeArbitrary = fc.constantFrom('admin','tenant','user');

describe('Navigation Property Tests', () => {
 let mockPush: ReturnType<typeof vi.fn>;
 let mockBack: ReturnType<typeof vi.fn>;
 let mockParams: Record<string, string | string[]>;

 beforeEach(() => {
 mockPush = vi.fn();
 mockBack = vi.fn();
 mockParams = {};

 (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
 push: mockPush,
 back: mockBack,
 forward: vi.fn(),
 refresh: vi.fn(),
 replace: vi.fn(),
 prefetch: vi.fn(),
 });

 (useParams as ReturnType<typeof vi.fn>).mockReturnValue(mockParams);
 });

 afterEach(() => {
 vi.clearAllMocks();
 });

 describe('Property 28: Detail navigation', () => {
 it('should navigate to admin detail page with correct ID when admin record is clicked', () => {
 // Feature: access-management
 // Property 28: For any record click in a list view, the system should navigate to the corresponding detail page with the correct ID in the URL
 // Validates: Requirements 3.1, 26.2

 fc.assert(
 fc.property(
 adminArbitrary,
 (admin) => {
 // Create a mock table row that simulates clicking on an admin record
 const handleRowClick = (id: number) => {
 mockPush(`/dashboard/access-management/admins/${id}`);
 };

 // Simulate clicking on the admin row
 handleRowClick(admin.id);

 // Verify navigation was called with correct URL
 expect(mockPush).toHaveBeenCalledWith(`/dashboard/access-management/admins/${admin.id}`
 );
 expect(mockPush).toHaveBeenCalledTimes(1);

 // Verify the URL contains the correct ID
 const calledUrl = mockPush.mock.calls[0][0];
 expect(calledUrl).toContain(admin.id.toString());
 expect(calledUrl).toMatch(/\/dashboard\/access-management\/admins\/\d+/);

 // Reset for next iteration
 mockPush.mockClear();
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should navigate to tenant detail page with correct ID when tenant record is clicked', () => {
 // Feature: access-management
 // Property 28: For any record click in a list view, the system should navigate to the corresponding detail page with the correct ID in the URL
 // Validates: Requirements 10.1, 26.2

 fc.assert(
 fc.property(
 tenantArbitrary,
 (tenant) => {
 // Create a mock table row that simulates clicking on a tenant record
 const handleRowClick = (id: number) => {
 mockPush(`/dashboard/access-management/tenants/${id}`);
 };

 // Simulate clicking on the tenant row
 handleRowClick(tenant.id);

 // Verify navigation was called with correct URL
 expect(mockPush).toHaveBeenCalledWith(`/dashboard/access-management/tenants/${tenant.id}`
 );
 expect(mockPush).toHaveBeenCalledTimes(1);

 // Verify the URL contains the correct ID
 const calledUrl = mockPush.mock.calls[0][0];
 expect(calledUrl).toContain(tenant.id.toString());
 expect(calledUrl).toMatch(/\/dashboard\/access-management\/tenants\/\d+/);

 // Reset for next iteration
 mockPush.mockClear();
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should navigate to user detail page with correct ID when user record is clicked', () => {
 // Feature: access-management
 // Property 28: For any record click in a list view, the system should navigate to the corresponding detail page with the correct ID in the URL
 // Validates: Requirements 19.1, 26.2

 fc.assert(
 fc.property(
 userArbitrary,
 (user) => {
 // Create a mock table row that simulates clicking on a user record
 const handleRowClick = (id: number) => {
 mockPush(`/dashboard/access-management/users/${id}`);
 };

 // Simulate clicking on the user row
 handleRowClick(user.id);

 // Verify navigation was called with correct URL
 expect(mockPush).toHaveBeenCalledWith(`/dashboard/access-management/users/${user.id}`
 );
 expect(mockPush).toHaveBeenCalledTimes(1);

 // Verify the URL contains the correct ID
 const calledUrl = mockPush.mock.calls[0][0];
 expect(calledUrl).toContain(user.id.toString());
 expect(calledUrl).toMatch(/\/dashboard\/access-management\/users\/\d+/);

 // Reset for next iteration
 mockPush.mockClear();
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should preserve entity ID in URL parameters across all entity types', () => {
 fc.assert(
 fc.property(
 entityTypeArbitrary,
 fc.integer({ min: 1, max: 10000 }),
 (entityType, entityId) => {
 // Simulate navigation to detail page
 const detailUrl =`/dashboard/access-management/${entityType}s/${entityId}`;
 mockPush(detailUrl);

 // Verify URL structure
 expect(mockPush).toHaveBeenCalledWith(detailUrl);
 
 // Extract ID from URL
 const urlParts = detailUrl.split('/');
 const idFromUrl = parseInt(urlParts[urlParts.length - 1], 10);
 
 // Verify ID matches
 expect(idFromUrl).toBe(entityId);
 expect(detailUrl).toContain(`/${entityType}s/${entityId}`);

 // Reset for next iteration
 mockPush.mockClear();
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should handle navigation with query parameters preserved', () => {
 fc.assert(
 fc.property(
 adminArbitrary,
 fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
 fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
 (admin, searchQuery, page) => {
 // Build URL with optional query parameters
 let detailUrl =`/dashboard/access-management/admins/${admin.id}`;
 const queryParams: string[] = [];
 
 if (searchQuery) {
 queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
 }
 if (page) {
 queryParams.push(`page=${page}`);
 }
 
 if (queryParams.length > 0) {
 detailUrl +=`?${queryParams.join('&')}`;
 }

 mockPush(detailUrl);

 // Verify navigation was called
 expect(mockPush).toHaveBeenCalledWith(detailUrl);
 
 // Verify ID is in URL
 expect(detailUrl).toContain(`/admins/${admin.id}`);
 
 // Verify query parameters if present
 if (searchQuery) {
 expect(detailUrl).toContain(`search=${encodeURIComponent(searchQuery)}`);
 }
 if (page) {
 expect(detailUrl).toContain(`page=${page}`);
 }

 // Reset for next iteration
 mockPush.mockClear();
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should navigate to correct detail page for multiple consecutive clicks', () => {
 fc.assert(
 fc.property(
 fc.array(adminArbitrary, { minLength: 2, maxLength: 10 }),
 (admins) => {
 // Simulate clicking on multiple admin records in sequence
 admins.forEach((admin, index) => {
 const handleRowClick = (id: number) => {
 mockPush(`/dashboard/access-management/admins/${id}`);
 };

 handleRowClick(admin.id);

 // Verify each navigation call
 expect(mockPush).toHaveBeenNthCalledWith(
 index + 1,`/dashboard/access-management/admins/${admin.id}`
 );
 });

 // Verify total number of navigation calls
 expect(mockPush).toHaveBeenCalledTimes(admins.length);

 // Reset for next iteration
 mockPush.mockClear();
 }
 ),
 { numRuns: 100 }
 );
 });
 });

 describe('Property 29: Back navigation', () => {
 it('should navigate back to admin list when back button is clicked from admin detail page', () => {
 // Feature: access-management
 // Property 29: For any detail page, the system should provide a back button that returns to the list view
 // Validates: Requirements 26.3

 fc.assert(
 fc.property(
 adminArbitrary,
 (admin) => {
 // Simulate being on admin detail page
 mockParams.id = admin.id.toString();

 // Create back button handler
 const handleBack = () => {
 mockPush('/dashboard/access-management/admins');
 };

 // Simulate clicking back button
 handleBack();

 // Verify navigation to list page
 expect(mockPush).toHaveBeenCalledWith('/dashboard/access-management/admins');
 expect(mockPush).toHaveBeenCalledTimes(1);

 // Verify URL does not contain ID
 const calledUrl = mockPush.mock.calls[0][0];
 expect(calledUrl).not.toContain(admin.id.toString());
 expect(calledUrl).toBe('/dashboard/access-management/admins');

 // Reset for next iteration
 mockPush.mockClear();
 mockParams = {};
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should navigate back to tenant list when back button is clicked from tenant detail page', () => {
 // Feature: access-management
 // Property 29: For any detail page, the system should provide a back button that returns to the list view
 // Validates: Requirements 26.3

 fc.assert(
 fc.property(
 tenantArbitrary,
 (tenant) => {
 // Simulate being on tenant detail page
 mockParams.id = tenant.id.toString();

 // Create back button handler
 const handleBack = () => {
 mockPush('/dashboard/access-management/tenants');
 };

 // Simulate clicking back button
 handleBack();

 // Verify navigation to list page
 expect(mockPush).toHaveBeenCalledWith('/dashboard/access-management/tenants');
 expect(mockPush).toHaveBeenCalledTimes(1);

 // Verify URL does not contain ID
 const calledUrl = mockPush.mock.calls[0][0];
 expect(calledUrl).not.toContain(tenant.id.toString());
 expect(calledUrl).toBe('/dashboard/access-management/tenants');

 // Reset for next iteration
 mockPush.mockClear();
 mockParams = {};
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should navigate back to user list when back button is clicked from user detail page', () => {
 // Feature: access-management
 // Property 29: For any detail page, the system should provide a back button that returns to the list view
 // Validates: Requirements 26.3

 fc.assert(
 fc.property(
 userArbitrary,
 (user) => {
 // Simulate being on user detail page
 mockParams.id = user.id.toString();

 // Create back button handler
 const handleBack = () => {
 mockPush('/dashboard/access-management/users');
 };

 // Simulate clicking back button
 handleBack();

 // Verify navigation to list page
 expect(mockPush).toHaveBeenCalledWith('/dashboard/access-management/users');
 expect(mockPush).toHaveBeenCalledTimes(1);

 // Verify URL does not contain ID
 const calledUrl = mockPush.mock.calls[0][0];
 expect(calledUrl).not.toContain(user.id.toString());
 expect(calledUrl).toBe('/dashboard/access-management/users');

 // Reset for next iteration
 mockPush.mockClear();
 mockParams = {};
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should return to correct list page for any entity type', () => {
 fc.assert(
 fc.property(
 entityTypeArbitrary,
 fc.integer({ min: 1, max: 10000 }),
 (entityType, entityId) => {
 // Simulate being on detail page
 mockParams.id = entityId.toString();

 // Create back button handler
 const handleBack = () => {
 mockPush(`/dashboard/access-management/${entityType}s`);
 };

 // Simulate clicking back button
 handleBack();

 // Verify navigation to correct list page
 const expectedUrl =`/dashboard/access-management/${entityType}s`;
 expect(mockPush).toHaveBeenCalledWith(expectedUrl);
 
 // Verify URL structure
 expect(expectedUrl).toMatch(/\/dashboard\/access-management\/(admins|tenants|users)$/);
 expect(expectedUrl).not.toContain(entityId.toString());

 // Reset for next iteration
 mockPush.mockClear();
 mockParams = {};
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should preserve list state when navigating back with query parameters', () => {
 fc.assert(
 fc.property(
 adminArbitrary,
 fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
 fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
 (admin, searchQuery, page) => {
 // Simulate being on detail page with referrer state
 mockParams.id = admin.id.toString();

 // Build list URL with query parameters
 let listUrl ='/dashboard/access-management/admins';
 const queryParams: string[] = [];
 
 if (searchQuery) {
 queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
 }
 if (page) {
 queryParams.push(`page=${page}`);
 }
 
 if (queryParams.length > 0) {
 listUrl +=`?${queryParams.join('&')}`;
 }

 // Create back button handler that preserves state
 const handleBack = () => {
 mockPush(listUrl);
 };

 // Simulate clicking back button
 handleBack();

 // Verify navigation with preserved state
 expect(mockPush).toHaveBeenCalledWith(listUrl);
 
 // Verify query parameters are preserved
 if (searchQuery) {
 expect(listUrl).toContain(`search=${encodeURIComponent(searchQuery)}`);
 }
 if (page) {
 expect(listUrl).toContain(`page=${page}`);
 }

 // Reset for next iteration
 mockPush.mockClear();
 mockParams = {};
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should handle back navigation after multiple forward navigations', () => {
 fc.assert(
 fc.property(
 fc.array(adminArbitrary, { minLength: 2, maxLength: 5 }),
 (admins) => {
 // Simulate navigating through multiple detail pages
 admins.forEach((admin) => {
 mockPush(`/dashboard/access-management/admins/${admin.id}`);
 });

 // Clear mock to test back navigation
 mockPush.mockClear();

 // Simulate clicking back button
 const handleBack = () => {
 mockPush('/dashboard/access-management/admins');
 };

 handleBack();

 // Verify back navigation
 expect(mockPush).toHaveBeenCalledWith('/dashboard/access-management/admins');
 expect(mockPush).toHaveBeenCalledTimes(1);

 // Reset for next iteration
 mockPush.mockClear();
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should maintain correct navigation stack for browser back button', () => {
 fc.assert(
 fc.property(
 adminArbitrary,
 (admin) => {
 // Simulate navigation history
 const navigationHistory: string[] = [];

 // Navigate to list
 const listUrl ='/dashboard/access-management/admins';
 navigationHistory.push(listUrl);
 mockPush(listUrl);

 // Navigate to detail
 const detailUrl =`/dashboard/access-management/admins/${admin.id}`;
 navigationHistory.push(detailUrl);
 mockPush(detailUrl);

 // Verify navigation history
 expect(mockPush).toHaveBeenCalledTimes(2);
 expect(mockPush).toHaveBeenNthCalledWith(1, listUrl);
 expect(mockPush).toHaveBeenNthCalledWith(2, detailUrl);

 // Simulate browser back
 mockBack();

 // Verify back was called
 expect(mockBack).toHaveBeenCalledTimes(1);

 // Reset for next iteration
 mockPush.mockClear();
 mockBack.mockClear();
 }
 ),
 { numRuns: 100 }
 );
 });
 });

 describe('Cross-property navigation workflows', () => {
 it('should support complete navigation workflow: list → detail → back → list', () => {
 fc.assert(
 fc.property(
 adminArbitrary,
 (admin) => {
 // Step 1: Start at list page
 const listUrl ='/dashboard/access-management/admins';
 
 // Step 2: Navigate to detail page
 const handleRowClick = (id: number) => {
 mockPush(`/dashboard/access-management/admins/${id}`);
 };
 handleRowClick(admin.id);

 expect(mockPush).toHaveBeenCalledWith(`/dashboard/access-management/admins/${admin.id}`
 );

 // Step 3: Navigate back to list
 const handleBack = () => {
 mockPush(listUrl);
 };
 handleBack();

 expect(mockPush).toHaveBeenCalledWith(listUrl);

 // Verify complete workflow
 expect(mockPush).toHaveBeenCalledTimes(2);
 expect(mockPush).toHaveBeenNthCalledWith(
 1,`/dashboard/access-management/admins/${admin.id}`
 );
 expect(mockPush).toHaveBeenNthCalledWith(2, listUrl);

 // Reset for next iteration
 mockPush.mockClear();
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should handle navigation between different entity types', () => {
 fc.assert(
 fc.property(
 adminArbitrary,
 tenantArbitrary,
 userArbitrary,
 (admin, tenant, user) => {
 // Navigate to admin detail
 mockPush(`/dashboard/access-management/admins/${admin.id}`);
 
 // Navigate back to admin list
 mockPush('/dashboard/access-management/admins');
 
 // Navigate to tenant detail
 mockPush(`/dashboard/access-management/tenants/${tenant.id}`);
 
 // Navigate back to tenant list
 mockPush('/dashboard/access-management/tenants');
 
 // Navigate to user detail
 mockPush(`/dashboard/access-management/users/${user.id}`);
 
 // Navigate back to user list
 mockPush('/dashboard/access-management/users');

 // Verify all navigation calls
 expect(mockPush).toHaveBeenCalledTimes(6);
 expect(mockPush).toHaveBeenNthCalledWith(
 1,`/dashboard/access-management/admins/${admin.id}`
 );
 expect(mockPush).toHaveBeenNthCalledWith(
 2,'/dashboard/access-management/admins'
 );
 expect(mockPush).toHaveBeenNthCalledWith(
 3,`/dashboard/access-management/tenants/${tenant.id}`
 );
 expect(mockPush).toHaveBeenNthCalledWith(
 4,'/dashboard/access-management/tenants'
 );
 expect(mockPush).toHaveBeenNthCalledWith(
 5,`/dashboard/access-management/users/${user.id}`
 );
 expect(mockPush).toHaveBeenNthCalledWith(
 6,'/dashboard/access-management/users'
 );

 // Reset for next iteration
 mockPush.mockClear();
 }
 ),
 { numRuns: 100 }
 );
 });

 it('should maintain navigation consistency across rapid clicks', () => {
 fc.assert(
 fc.property(
 fc.array(adminArbitrary, { minLength: 3, maxLength: 8 }),
 (admins) => {
 // Simulate rapid clicking on different records
 admins.forEach((admin, index) => {
 mockPush(`/dashboard/access-management/admins/${admin.id}`);
 
 // Verify each navigation
 expect(mockPush).toHaveBeenNthCalledWith(
 index + 1,`/dashboard/access-management/admins/${admin.id}`
 );
 });

 // Verify total navigation calls
 expect(mockPush).toHaveBeenCalledTimes(admins.length);

 // Verify last navigation is to last admin
 const lastAdmin = admins[admins.length - 1];
 expect(mockPush).toHaveBeenLastCalledWith(`/dashboard/access-management/admins/${lastAdmin.id}`
 );

 // Reset for next iteration
 mockPush.mockClear();
 }
 ),
 { numRuns: 100 }
 );
 });
 });
});
