/**
 * User Service — all IDs are strings (UUIDs)
 */
import { apiClient } from '@/src/common/config/api';
import { User, PaginatedResponse, UpdateUserDto } from '@/src/common/@types/@access-management';

export const fetchUsers = async (
  page: number = 1,
  perPage: number = 10,
  search?: string,
): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get<{ users: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('/admin/users', { params: { page, limit: perPage } });
  let users = response.data.users;
  if (search) {
    users = users.filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
    );
  }
  return {
    data: users,
    meta: {
      current_page: response.data.pagination.page,
      per_page: response.data.pagination.limit,
      total: search ? users.length : response.data.pagination.total,
      total_pages: search ? Math.ceil(users.length / perPage) : response.data.pagination.totalPages,
    },
  };
};

export const fetchUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get<User>(`/admin/users/${id}`);
  return response.data;
};

export const updateUser = async (id: string, data: UpdateUserDto): Promise<User> => {
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
