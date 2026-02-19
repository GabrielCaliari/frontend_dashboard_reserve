/**
 * Admin Service
 * 
 * Service layer for admin management operations.
 * Handles all API calls related to admin CRUD operations.
 * 
 * API Base URL: http://localhost:3000/api
 * Authentication: Bearer token (handled by accessManagementApiClient interceptor)
 */

import { accessManagementApiClient } from '@/src/common/config/access-management-api-client';
import {
  Admin,
  PaginatedResponse,
  CreateAdminDto,
  UpdateAdminDto,
  PaginationParams,
} from '@/src/common/@types/@access-management';

/**
 * Fetch paginated list of admins with optional search
 * 
 * @param page - Page number (default: 1)
 * @param perPage - Items per page (default: 10)
 * @param search - Optional search term for filtering by name or email
 * @returns Promise<PaginatedResponse<Admin>>
 * 
 * API Endpoint: GET /api/admins
 * Query Parameters: page, per_page, search
 * 
 * Validates: Requirements 1.1, 1.2, 7.2
 */
export const fetchAdmins = async (
  page: number = 1,
  perPage: number = 10,
  search?: string
): Promise<PaginatedResponse<Admin>> => {
  // Backend uses /admin/list endpoint (not paginated in current implementation)
  const response = await accessManagementApiClient.get<Admin[]>('/admin/list');
  
  // Transform to paginated response format
  const allAdmins = response.data;
  const filteredAdmins = search 
    ? allAdmins.filter(admin => 
        admin.name.toLowerCase().includes(search.toLowerCase()) ||
        admin.email.toLowerCase().includes(search.toLowerCase())
      )
    : allAdmins;
  
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedData = filteredAdmins.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    meta: {
      page,
      per_page: perPage,
      total: filteredAdmins.length,
      total_pages: Math.ceil(filteredAdmins.length / perPage),
    },
  };
};

/**
 * Fetch a single admin by ID with detailed information
 * 
 * @param id - Admin ID
 * @returns Promise<Admin>
 * 
 * API Endpoint: GET /api/admins/:id
 * Response includes: admin details + assigned tenants with roles
 * 
 * Validates: Requirements 3.1, 3.2, 3.3
 */
export const fetchAdminById = async (id: number): Promise<Admin> => {
  const response = await accessManagementApiClient.get<Admin>(`/admin/${id}`);
  return response.data;
};

/**
 * Create a new admin account
 * 
 * @param data - Admin creation data (name, email, password, role)
 * @returns Promise<Admin>
 * 
 * API Endpoint: POST /api/admins
 * Request Body: CreateAdminDto
 * 
 * Validates: Requirements 2.6, 2.7
 */
export const createAdmin = async (data: CreateAdminDto): Promise<Admin> => {
  const response = await accessManagementApiClient.post<Admin>('/admin/register', data);
  return response.data;
};

/**
 * Update an existing admin's information
 * 
 * @param id - Admin ID
 * @param data - Admin update data (name, email, role - all optional)
 * @returns Promise<Admin>
 * 
 * API Endpoint: PATCH /api/admins/:id
 * Request Body: UpdateAdminDto
 * 
 * Validates: Requirements 4.4, 4.5
 */
export const updateAdmin = async (
  id: number,
  data: UpdateAdminDto
): Promise<Admin> => {
  const response = await accessManagementApiClient.patch<Admin>(`/admin/${id}`, data);
  return response.data;
};

/**
 * Activate an admin account
 * 
 * @param id - Admin ID
 * @returns Promise<Admin>
 * 
 * API Endpoint: PATCH /api/admins/:id/activate
 * Sets is_active to true
 * 
 * Validates: Requirements 5.5, 5.7
 */
export const activateAdmin = async (id: number): Promise<Admin> => {
  const response = await accessManagementApiClient.patch<Admin>(`/admin/${id}/activate`);
  return response.data;
};

/**
 * Deactivate an admin account
 * 
 * @param id - Admin ID
 * @returns Promise<Admin>
 * 
 * API Endpoint: PATCH /api/admins/:id/deactivate
 * Sets is_active to false
 * 
 * Note: Self-deactivation prevention should be handled at the UI layer
 * 
 * Validates: Requirements 5.4, 5.7
 */
export const deactivateAdmin = async (id: number): Promise<Admin> => {
  const response = await accessManagementApiClient.patch<Admin>(`/admin/${id}/deactivate`);
  return response.data;
};

/**
 * Delete an admin account permanently
 * 
 * @param id - Admin ID
 * @returns Promise<void>
 * 
 * API Endpoint: DELETE /api/admins/:id
 * 
 * Note: Self-deletion prevention should be handled at the UI layer
 * 
 * Validates: Requirements 6.2, 6.4
 */
export const deleteAdmin = async (id: number): Promise<void> => {
  await accessManagementApiClient.delete(`/admin/${id}`);
};
