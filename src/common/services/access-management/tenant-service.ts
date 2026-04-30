/**
 * Tenant Service
 * 
 * Service layer for tenant management operations.
 * Handles all API calls related to tenant CRUD operations.
 * 
 * API Base URL: Configured in api.ts
 * Authentication: Bearer token (handled by api interceptor)
 */

import { apiClient } from '@/src/common/config/api';
import {
  Tenant,
  PaginatedResponse,
  CreateTenantDto,
  UpdateTenantDto,
  PaginationParams,
} from '@/src/common/@types/@access-management';

/**
 * Fetch paginated list of tenants with optional search
 */
export const fetchTenants = async (
  page: number = 1,
  perPage: number = 10,
  search?: string
): Promise<PaginatedResponse<Tenant>> => {
  // Backend returns array of tenants (not paginated)
  const response = await apiClient.get('/tenants');
  
  // Normalize response — backend may return array directly or wrapped in { data: [...] }
  const raw = response.data;
  const rawTenants: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);

  // Normalize: backend returns `active`, frontend expects `is_active`
  const allTenants: Tenant[] = rawTenants.map((t) => ({
    ...t,
    is_active: t.is_active ?? t.active ?? false,
  }));
  const filteredTenants = search 
    ? allTenants.filter(tenant => 
        tenant.name.toLowerCase().includes(search.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(search.toLowerCase()) ||
        (tenant.domain && tenant.domain.toLowerCase().includes(search.toLowerCase()))
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
  const response = await apiClient.post<Tenant>('/tenants', data);
  return response.data;
};

/**
 * Update an existing tenant's information
 */
export const updateTenant = async (
  id: string,
  data: UpdateTenantDto
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
