/**
 * Tenant Service
 * 
 * Service layer for tenant management operations.
 * Handles all API calls related to tenant CRUD operations.
 * 
 * API Base URL: http://localhost:3000/api
 * Authentication: Bearer token (handled by accessManagementApiClient interceptor)
 */

import { accessManagementApiClient } from '@/src/common/config/access-management-api-client';
import {
  Tenant,
  PaginatedResponse,
  CreateTenantDto,
  UpdateTenantDto,
  PaginationParams,
} from '@/src/common/@types/@access-management';

/**
 * Fetch paginated list of tenants with optional search
 * 
 * @param page - Page number (default: 1)
 * @param perPage - Items per page (default: 10)
 * @param search - Optional search term for filtering by name, slug, or domain
 * @returns Promise<PaginatedResponse<Tenant>>
 * 
 * API Endpoint: GET /api/tenants
 * Query Parameters: page, per_page, search
 * 
 * Validates: Requirements 8.1, 8.2, 17.2
 */
export const fetchTenants = async (
  page: number = 1,
  perPage: number = 10,
  search?: string
): Promise<PaginatedResponse<Tenant>> => {
  // Backend returns array of tenants (not paginated)
  const response = await accessManagementApiClient.get<Tenant[]>('/tenants');
  
  // Transform to paginated response format
  const allTenants = response.data;
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
      page,
      per_page: perPage,
      total: filteredTenants.length,
      total_pages: Math.ceil(filteredTenants.length / perPage),
    },
  };
};

/**
 * Fetch a single tenant by ID with detailed information
 * 
 * @param id - Tenant ID
 * @returns Promise<Tenant>
 * 
 * API Endpoint: GET /api/tenants/:id
 * Response includes: tenant details + assigned admins with roles
 * 
 * Validates: Requirements 10.1, 10.2, 10.3
 */
export const fetchTenantById = async (id: number): Promise<Tenant> => {
  const response = await accessManagementApiClient.get<Tenant>(`/tenants/${id}`);
  return response.data;
};

/**
 * Create a new tenant
 * 
 * @param data - Tenant creation data (name, slug, domain)
 * @returns Promise<Tenant>
 * 
 * API Endpoint: POST /api/tenants
 * Request Body: CreateTenantDto
 * 
 * Validates: Requirements 9.6, 9.7
 */
export const createTenant = async (data: CreateTenantDto): Promise<Tenant> => {
  const response = await accessManagementApiClient.post<Tenant>('/tenants', data);
  return response.data;
};

/**
 * Update an existing tenant's information
 * 
 * @param id - Tenant ID
 * @param data - Tenant update data (name, slug, domain - all optional)
 * @returns Promise<Tenant>
 * 
 * API Endpoint: PATCH /api/tenants/:id
 * Request Body: UpdateTenantDto
 * 
 * Validates: Requirements 11.5, 11.6
 */
export const updateTenant = async (
  id: number,
  data: UpdateTenantDto
): Promise<Tenant> => {
  const response = await accessManagementApiClient.patch<Tenant>(`/tenants/${id}`, data);
  return response.data;
};

/**
 * Activate a tenant
 * 
 * @param id - Tenant ID
 * @returns Promise<Tenant>
 * 
 * API Endpoint: PATCH /api/tenants/:id/activate
 * Sets is_active to true
 * 
 * Validates: Requirements 12.5, 12.6
 */
export const activateTenant = async (id: number): Promise<Tenant> => {
  const response = await accessManagementApiClient.patch<Tenant>(`/tenants/${id}/activate`);
  return response.data;
};

/**
 * Deactivate a tenant
 * 
 * @param id - Tenant ID
 * @returns Promise<Tenant>
 * 
 * API Endpoint: PATCH /api/tenants/:id/deactivate
 * Sets is_active to false
 * 
 * Validates: Requirements 12.4, 12.6
 */
export const deactivateTenant = async (id: number): Promise<Tenant> => {
  const response = await accessManagementApiClient.patch<Tenant>(`/tenants/${id}/deactivate`);
  return response.data;
};

/**
 * Delete a tenant permanently
 * 
 * @param id - Tenant ID
 * @returns Promise<void>
 * 
 * API Endpoint: DELETE /api/tenants/:id
 * 
 * Validates: Requirements 13.2, 13.3
 */
export const deleteTenant = async (id: number): Promise<void> => {
  await accessManagementApiClient.delete(`/tenants/${id}`);
};
