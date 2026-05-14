/**
 * Access Management Type Definitions
 */

export enum AdminRole {
  super_admin = 'super_admin',
  owner = 'owner',
  manager = 'manager',
  editor = 'editor',
  viewer = 'viewer',
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  scheduled_for_deletion?: boolean;
  deletion_scheduled_for_at?: string | null;
  created_at: string;
  updated_at: string;
  tenants?: AdminTenantRelationship[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  is_active: boolean;
  scheduled_for_deletion?: boolean;
  deletion_scheduled_for_at?: string | null;
  created_at: string;
  updated_at: string;
  admins?: AdminTenantRelationship[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  cpf?: string;
  sex?: number;
  date_of_birth?: string;
  date_expires_in?: string;
  plan_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminTenantRelationship {
  admin_id: string;
  tenant_id: string;
  role: AdminRole;
  admin?: Admin;
  tenant?: Tenant;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface CreateAdminDto {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

export interface UpdateAdminDto {
  name?: string;
  email?: string;
  password?: string;
  role?: AdminRole;
}

export interface AssignAdminDto {
  admin_id: string;
  tenant_id: string;
}

export interface UpdateAdminRoleDto {
  role: AdminRole;
}

export interface TenantAssignmentChange {
  add: { tenant_id: string; role: AdminRole }[];
  remove: string[];
  updateRole: { tenant_id: string; role: AdminRole }[];
}

export interface CreateTenantDto { name: string; slug: string; domain: string; }
export interface UpdateTenantDto { name?: string; slug?: string; domain?: string; }

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone_number?: string;
}

export interface PaginationParams { page?: number; per_page?: number; search?: string; }

export interface AdminFormData { name: string; email: string; password?: string; role: AdminRole; tenantAssignments?: TenantAssignmentChange; }
export interface TenantFormData { name: string; slug: string; domain: string; }
export interface UserFormData { name: string; email: string; phone_number?: string; }
export interface AssignAdminFormData { admin_id: string; role: AdminRole; }
