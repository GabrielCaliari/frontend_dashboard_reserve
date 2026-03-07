/**
 * Admin Service
 *
 * Service layer for admin management operations.
 * All IDs are strings (UUIDs) matching the backend.
 */

import { apiClient } from '@/src/common/config/api';
import {
  Admin,
  PaginatedResponse,
  CreateAdminDto,
  UpdateAdminDto,
  AdminRole,
} from '@/src/common/@types/@access-management';

/** Fetch paginated list of admins. Client-side search/pagination because backend returns a flat array. */
export const fetchAdmins = async (
  page: number = 1,
  perPage: number = 10,
  search?: string,
): Promise<PaginatedResponse<Admin>> => {
  const response = await apiClient.get<Admin[]>('/admin/list');
  const allAdmins = response.data;

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
  const response = await apiClient.get<Admin>(`/admin/${id}`);
  return response.data;
};

/** Create a new admin account. */
export const createAdmin = async (data: CreateAdminDto): Promise<Admin> => {
  const response = await apiClient.post<Admin>('/admin/register', data);
  return response.data;
};

/** Update name and/or email for an existing admin. */
export const updateAdmin = async (
  id: string,
  data: Omit<UpdateAdminDto, 'role'>,
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

/** Permanently delete an admin account. Self-deletion prevention must be handled at the UI layer. */
export const deleteAdmin = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/${id}`);
};
