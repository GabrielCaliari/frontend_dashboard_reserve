/**
 * User Service
 * 
 * Service layer for user management operations.
 * Handles all API calls related to user operations.
 * 
 * API Base URL: http://localhost:3000/api
 * Authentication: Bearer token (handled by accessManagementApiClient interceptor)
 */

import { accessManagementApiClient } from '@/src/common/config/access-management-api-client';
import {
  User,
  PaginatedResponse,
  UpdateUserDto,
  PaginationParams,
} from '@/src/common/@types/@access-management';

/**
 * Fetch paginated list of users with optional search
 * 
 * @param page - Page number (default: 1)
 * @param perPage - Items per page (default: 10)
 * @param search - Optional search term for filtering by name or email
 * @returns Promise<PaginatedResponse<User>>
 * 
 * API Endpoint: GET /api/users
 * Query Parameters: page, per_page, search
 * 
 * Validates: Requirements 18.1, 18.2, 23.2
 */
export const fetchUsers = async (
  page: number = 1,
  perPage: number = 10,
  search?: string
): Promise<PaginatedResponse<User>> => {
  // Backend uses /admin/users with pagination
  const params = {
    page,
    limit: perPage,
  };

  const response = await accessManagementApiClient.get<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>('/admin/users', { params });

  // Filter by search if provided (client-side filtering)
  let users = response.data.users;
  if (search) {
    users = users.filter(user => 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  return {
    data: users,
    meta: {
      page: response.data.pagination.page,
      per_page: response.data.pagination.limit,
      total: search ? users.length : response.data.pagination.total,
      total_pages: search ? Math.ceil(users.length / perPage) : response.data.pagination.totalPages,
    },
  };
};

/**
 * Fetch a single user by ID with detailed information
 * 
 * @param id - User ID
 * @returns Promise<User>
 * 
 * API Endpoint: GET /api/users/:id
 * Response includes: user details
 * 
 * Validates: Requirements 19.1, 19.2, 19.3
 */
export const fetchUserById = async (id: number): Promise<User> => {
  const response = await accessManagementApiClient.get<User>(`/admin/users/${id}`);
  return response.data;
};

/**
 * Update an existing user's information
 * 
 * @param id - User ID
 * @param data - User update data (name, email - all optional)
 * @returns Promise<User>
 * 
 * API Endpoint: PATCH /api/users/:id
 * Request Body: UpdateUserDto
 * 
 * Validates: Requirements 20.4, 20.5
 */
export const updateUser = async (
  id: number,
  data: UpdateUserDto
): Promise<User> => {
  const response = await accessManagementApiClient.patch<User>(`/admin/users/${id}`, data);
  return response.data;
};

/**
 * Deactivate a user account
 * 
 * @param id - User ID
 * @returns Promise<User>
 * 
 * API Endpoint: PATCH /api/users/:id/deactivate
 * Sets is_active to false
 * 
 * Validates: Requirements 21.3, 21.4
 */
export const deactivateUser = async (id: number): Promise<User> => {
  const response = await accessManagementApiClient.patch<User>(`/admin/users/${id}/deactivate`);
  return response.data;
};

/**
 * Delete a user account permanently
 * 
 * @param id - User ID
 * @returns Promise<void>
 * 
 * API Endpoint: DELETE /api/users/:id
 * 
 * Validates: Requirements 22.2, 22.3
 */
export const deleteUser = async (id: number): Promise<void> => {
  await accessManagementApiClient.delete(`/admin/users/${id}`);
};
