/**
 * Access Management Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the Access Management feature.
 * It includes definitions for Admins, Tenants, Users, and their relationships.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Admin role levels with hierarchical permissions
 */
export enum AdminRole {
  super_admin = 'super_admin',
  owner = 'owner',
  manager = 'manager',
  editor = 'editor',
  viewer = 'viewer'
}

// ============================================================================
// Core Entity Interfaces
// ============================================================================

/**
 * Admin entity representing a privileged user with dashboard access
 */
export interface Admin {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
  tenants?: AdminTenantRelationship[]; // Populated in detail view
}

/**
 * Tenant entity representing an organizational unit or client
 */
export interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain: string;
  is_active: boolean;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
  admins?: AdminTenantRelationship[]; // Populated in detail view
}

/**
 * User entity representing an end-user of the platform
 */
export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

/**
 * Relationship between an admin and a tenant with role assignment
 */
export interface AdminTenantRelationship {
  admin_id: number;
  tenant_id: number;
  role: AdminRole;
  admin?: Admin; // Populated when fetching tenant details
  tenant?: Tenant; // Populated when fetching admin details
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>; // Field-specific validation errors
}

// ============================================================================
// DTO (Data Transfer Object) Types
// ============================================================================

/**
 * DTO for creating a new admin
 */
export interface CreateAdminDto {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

/**
 * DTO for updating an existing admin
 */
export interface UpdateAdminDto {
  name?: string;
  email?: string;
  role?: AdminRole;
}

/**
 * DTO for creating a new tenant
 */
export interface CreateTenantDto {
  name: string;
  slug: string;
  domain: string;
}

/**
 * DTO for updating an existing tenant
 */
export interface UpdateTenantDto {
  name?: string;
  slug?: string;
  domain?: string;
}

/**
 * DTO for assigning an admin to a tenant
 */
export interface AssignAdminDto {
  admin_id: number;
  role: AdminRole;
}

/**
 * DTO for updating an admin's role within a tenant
 */
export interface UpdateAdminRoleDto {
  role: AdminRole;
}

/**
 * DTO for updating a user
 */
export interface UpdateUserDto {
  name?: string;
  email?: string;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Parameters for paginated list queries
 */
export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
}

// ============================================================================
// Form Data Types
// ============================================================================

/**
 * Form data for admin creation/editing
 */
export interface AdminFormData {
  name: string;
  email: string;
  password?: string; // Required for create, optional for edit
  role: AdminRole;
}

/**
 * Form data for tenant creation/editing
 */
export interface TenantFormData {
  name: string;
  slug: string;
  domain: string;
}

/**
 * Form data for user editing
 */
export interface UserFormData {
  name: string;
  email: string;
}

/**
 * Form data for assigning admin to tenant
 */
export interface AssignAdminFormData {
  admin_id: number;
  role: AdminRole;
}
