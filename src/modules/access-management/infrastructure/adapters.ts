/**
 * Access Management — Infrastructure Adapters
 *
 * Consolidates the former `common/services/access-management/{admin,tenant,user}-service.ts`,
 * `common/services/admin-login.ts`, and `common/services/admin-profile.ts` into a single
 * adapter module. Every exported function name and signature is preserved unchanged so
 * consuming hooks (now under `src/shared/hooks/access-management/`) only need their
 * import path updated.
 *
 * Backend module: `reserve-auth`. Generated typed clients live in
 * `src/infraestructure/server/services/{admin-management,tenant-management,
 * admin-user-management}` (see Task 11 codegen). They are not delegated to here because:
 *   - their mutation response types are `unknown` (no structural overlap with the
 *     `Admin`/`Tenant`/`User` domain types this module returns), and
 *   - their DTOs use the raw backend shape (`active`, `tenants: Record<string, unknown>[]`)
 *     while the domain types use the normalized shape (`is_active`,
 *     `AdminTenantRelationship[]`) that every function below already normalizes by hand.
 * Delegating would still require a cast at every call site with no behavioral gain, so
 * this adapter keeps the original `apiClient`-based implementations verbatim. All URL
 * paths and normalization logic here match the pre-migration services exactly.
 */

import { apiClient } from "@/src/infraestructure/axios/api";
import { LoginCredentials, AuthResponse } from "@/src/shared/domain/types/@auth";
import { AdminProfile } from "@/src/shared/domain/types/@auth";
import { errorTypes } from "@/src/infraestructure/axios/error-types";
import {
  Admin,
  Tenant,
  User,
  PaginatedResponse,
  CreateAdminDto,
  UpdateAdminDto,
  AdminRole,
  CreateTenantDto,
  UpdateTenantDto,
  AssignAdminDto,
  UpdateAdminRoleDto,
  UpdateUserDto,
} from "@/src/shared/domain/types/@access-management";

// ============================================================================
// Admin Service (formerly common/services/access-management/admin-service.ts)
// ============================================================================

/** Fetch paginated list of admins. Client-side search/pagination because backend returns a flat array. */
export const fetchAdmins = async (
  page: number = 1,
  perPage: number = 10,
  search?: string,
): Promise<PaginatedResponse<Admin>> => {
  // Check if user is super admin via cookie
  const isSuperAdmin =
    typeof window !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("session-role="))
          ?.split("=")[1] === "super_admin"
      : false;

  // Only skip tenant header for super admins
  const headers = isSuperAdmin ? { "x-skip-tenant": "true" } : {};

  const response = await apiClient.get("/admin/list", { headers });
  const raw = response.data;
  const rawAdmins: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : [];

  // Normalize: backend returns `active`, frontend expects `is_active`
  const allAdmins: Admin[] = rawAdmins.map((a) => ({
    ...a,
    is_active: a.is_active ?? a.active ?? false,
  }));

  const filtered = search
    ? allAdmins.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase()),
      )
    : allAdmins;

  const start = (page - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);

  return {
    data: paged,
    meta: {
      current_page: page,
      per_page: perPage,
      total: filtered.length,
      total_pages: Math.ceil(filtered.length / perPage),
    },
  };
};

/** Fetch a single admin by UUID. */
export const fetchAdminById = async (id: string): Promise<Admin> => {
  const response = await apiClient.get(`/admin/${id}`);
  const raw = response.data;

  // Normalize tenants: backend returns flat [{ id, name, slug, domain, role }]
  // Frontend expects [{ tenant_id, role, tenant: { name, slug } }]
  const tenants = Array.isArray(raw.tenants)
    ? raw.tenants.map((t: any) => ({
        tenant_id: t.id,
        admin_id: id,
        role: t.role,
        tenant: {
          id: t.id,
          name: t.name,
          slug: t.slug,
          domain: t.domain,
          is_active: t.is_active ?? t.active ?? true,
          created_at: t.created_at,
          updated_at: t.updated_at,
        },
      }))
    : [];

  return {
    ...raw,
    is_active: raw.is_active ?? raw.active ?? false,
    scheduled_for_deletion: raw.scheduled_for_deletion ?? false,
    deletion_scheduled_for_at: raw.deletion_scheduled_for_at ?? null,
    tenants,
  };
};

/** Create a new admin account. */
export const createAdmin = async (data: CreateAdminDto): Promise<Admin> => {
  const response = await apiClient.post<Admin>("/admin/register", data);
  return response.data;
};

/** Update name and/or email for an existing admin. */
export const updateAdmin = async (
  id: string,
  data: Omit<UpdateAdminDto, "role">,
): Promise<Admin> => {
  const response = await apiClient.patch<Admin>(`/admin/${id}`, data);
  return response.data;
};

/**
 * Update the role of an existing admin.
 * Backend requires a dedicated endpoint: PATCH /admin/:id/role
 */
export const updateAdminRole = async (
  id: string,
  role: AdminRole,
): Promise<Admin> => {
  const response = await apiClient.patch<Admin>(`/admin/${id}/role`, { role });
  return response.data;
};

/** Activate an admin account. */
export const activateAdmin = async (id: string): Promise<Admin> => {
  const response = await apiClient.patch<Admin>(`/admin/${id}/activate`);
  return response.data;
};

/** Deactivate an admin account. Self-deactivation prevention must be handled at the UI layer. */
export const deactivateAdmin = async (id: string): Promise<Admin> => {
  const response = await apiClient.patch<Admin>(`/admin/${id}/deactivate`);
  return response.data;
};

/** Schedule admin deletion (7-day retention window). */
export const scheduleAdminDeletion = async (
  id: string,
  reason?: string,
): Promise<any> => {
  const response = await apiClient.delete(`/admin/${id}`, {
    data: reason ? { reason } : undefined,
  });
  return response.data;
};

/** Restore an admin that was scheduled for deletion. */
export const restoreAdminDeletion = async (id: string): Promise<Admin> => {
  const response = await apiClient.post<Admin>(`/admin/${id}/restore-deletion`);
  return response.data;
};

/** Get admin deletion status. */
export const getAdminDeletionStatus = async (id: string): Promise<any> => {
  const response = await apiClient.get(`/admin/${id}/deletion-status`);
  return response.data;
};

/** Permanently delete an admin account. Self-deletion prevention must be handled at the UI layer. */
export const deleteAdmin = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/${id}`);
};

// ============================================================================
// Tenant Service (formerly common/services/access-management/tenant-service.ts)
// ============================================================================

/**
 * Fetch paginated list of tenants with optional search
 */
export const fetchTenants = async (
  page: number = 1,
  perPage: number = 10,
  search?: string,
): Promise<PaginatedResponse<Tenant>> => {
  // Backend returns array of tenants (not paginated)
  const response = await apiClient.get("/tenants");

  // Normalize response — backend may return array directly or wrapped in { data: [...] }
  const raw = response.data;
  const rawTenants: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : [];

  const allTenants: Tenant[] = rawTenants.map((t) => ({
    ...t,
    is_active: t.is_active ?? t.active ?? false,
    scheduled_for_deletion:
      t.scheduled_for_deletion ?? t.deletion_scheduled_for_at != null ?? false,
    deletion_scheduled_for_at: t.deletion_scheduled_for_at ?? null,
  }));
  const filteredTenants = search
    ? allTenants.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(search.toLowerCase()) ||
          tenant.slug.toLowerCase().includes(search.toLowerCase()) ||
          (tenant.domain &&
            tenant.domain.toLowerCase().includes(search.toLowerCase())),
      )
    : allTenants;

  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedData = filteredTenants.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    meta: {
      current_page: page,
      per_page: perPage,
      total: filteredTenants.length,
      total_pages: Math.ceil(filteredTenants.length / perPage),
    },
  };
};

/**
 * Fetch a single tenant by ID with detailed information
 */
export const fetchTenantById = async (id: string): Promise<Tenant> => {
  const response = await apiClient.get(`/tenants/${id}`);
  const raw = response.data;
  return { ...raw, is_active: raw.is_active ?? raw.active ?? false };
};

/**
 * Create a new tenant
 */
export const createTenant = async (data: CreateTenantDto): Promise<Tenant> => {
  const response = await apiClient.post<Tenant>("/tenants", data);
  return response.data;
};

/**
 * Update an existing tenant's information
 */
export const updateTenant = async (
  id: string,
  data: UpdateTenantDto,
): Promise<Tenant> => {
  const response = await apiClient.patch<Tenant>(`/tenants/${id}`, data);
  return response.data;
};

/**
 * Activate a tenant
 */
export const activateTenant = async (id: string): Promise<Tenant> => {
  const response = await apiClient.patch<Tenant>(`/tenants/${id}/activate`);
  return response.data;
};

/**
 * Deactivate a tenant
 */
export const deactivateTenant = async (id: string): Promise<Tenant> => {
  const response = await apiClient.patch<Tenant>(`/tenants/${id}/deactivate`);
  return response.data;
};

/**
 * Delete a tenant permanently
 */
export const deleteTenant = async (id: string): Promise<void> => {
  await apiClient.delete(`/tenants/${id}`);
};

export const scheduleTenantDeletion = async (
  id: string,
  reason?: string,
): Promise<any> => {
  const response = await apiClient.delete(`/tenants/${id}`, {
    data: reason ? { reason } : undefined,
  });
  return response.data;
};

export const restoreTenantDeletion = async (id: string): Promise<Tenant> => {
  const response = await apiClient.post<Tenant>(`/tenants/${id}/restore`);
  return response.data;
};

export const getTenantDeletionStatus = async (id: string): Promise<any> => {
  const response = await apiClient.get(`/tenants/${id}/deletion-status`);
  return response.data;
};

export const assignAdminToTenant = async (
  data: AssignAdminDto,
): Promise<void> => {
  await apiClient.post("/tenants/assign", data);
};

export const unassignAdminFromTenant = async (
  tenantId: string,
  adminId: string,
): Promise<void> => {
  await apiClient.delete(`/tenants/${tenantId}/admins/${adminId}`);
};

export const updateAdminTenantRole = async (
  tenantId: string,
  adminId: string,
  data: UpdateAdminRoleDto,
): Promise<void> => {
  await apiClient.patch(`/tenants/${tenantId}/admins/${adminId}/role`, data);
};

// ============================================================================
// User Service (formerly common/services/access-management/user-service.ts)
// ============================================================================

export const fetchUsers = async (
  page: number = 1,
  perPage: number = 10,
  search?: string,
): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get("/admin/users", {
    params: { page, limit: perPage },
    headers: { "x-skip-tenant": "true" },
  });
  const raw = response.data;
  // Backend returns { data: User[], total, page, limit }
  let users: User[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : [];

  if (search) {
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
    );
  }

  const total = search ? users.length : (raw?.total ?? users.length);

  return {
    data: users,
    meta: {
      current_page: raw?.page ?? page,
      per_page: raw?.limit ?? perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  };
};

export const fetchUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get<User>(`/admin/users/${id}`);
  return response.data;
};

export const updateUser = async (
  id: string,
  data: UpdateUserDto,
): Promise<User> => {
  const response = await apiClient.patch<User>(`/admin/users/${id}`, data);
  return response.data;
};

export const deactivateUser = async (id: string): Promise<User> => {
  const response = await apiClient.patch<User>(`/admin/users/${id}/deactivate`);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/users/${id}`);
};

// ============================================================================
// Admin Login (formerly common/services/admin-login.ts)
// ============================================================================

export async function adminLoginService({ email, password }: LoginCredentials) {
  try {
    // Endpoint: /admin/authenticate
    const response = await apiClient.post<AuthResponse>(`/admin/authenticate`, {
      email,
      password,
    });

    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.code) {
      return error.response.data.code;
    }

    return errorTypes._500.admin_una;
  }
}

// ============================================================================
// Admin Profile (formerly common/services/admin-profile.ts)
// ============================================================================

export async function getAdminProfileService(): Promise<AdminProfile | string> {
  try {
    const response = await apiClient.get<AdminProfile>(`/admin/me`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.code) {
      return error.response.data.code;
    }
    return errorTypes._500.admin_una;
  }
}

// ============================================================================
// My Tenants (formerly common/services/tenant.ts — found missed during Task 26
// import audit; same reserve-auth domain as the rest of this adapter)
// ============================================================================

export async function listMyTenantsService(): Promise<Tenant[] | string> {
  try {
    const response = await apiClient.get<Tenant[]>(`/auth/tenants/my-tenants`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.data?.code) {
      return error.response.data.code;
    }
    return errorTypes._500.admin_una;
  }
}
