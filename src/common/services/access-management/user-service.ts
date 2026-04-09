/**
 * User Service — all IDs are strings (UUIDs)
 */
import { apiClient } from "@/src/common/config/api";
import {
  User,
  PaginatedResponse,
  UpdateUserDto,
} from "@/src/common/@types/@access-management";

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
