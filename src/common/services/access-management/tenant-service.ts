/**
 * Tenant Service
 *
 * Service layer for tenant management operations.
 * Handles all API calls related to tenant CRUD operations.
 *
 * API Base URL: Configured in api.ts
 * Authentication: Bearer token (handled by api interceptor)
 */

import { apiClient } from "@/src/infraestructure/axios/api";
import {
  Tenant,
  PaginatedResponse,
  CreateTenantDto,
  UpdateTenantDto,
  PaginationParams,
  AssignAdminDto,
  UpdateAdminRoleDto,
  AdminRole,
} from "@/src/shared/domain/types/@access-management";

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
