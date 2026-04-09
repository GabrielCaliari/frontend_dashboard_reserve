/**
 * Admin Service
 *
 * Service layer for admin management operations.
 * All IDs are strings (UUIDs) matching the backend.
 */

import { apiClient } from "@/src/common/config/api";
import {
  Admin,
  PaginatedResponse,
  CreateAdminDto,
  UpdateAdminDto,
  AdminRole,
} from "@/src/common/@types/@access-management";

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
