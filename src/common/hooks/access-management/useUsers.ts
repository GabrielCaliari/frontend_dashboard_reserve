/**
 * React Query Hooks for User Management
 * All user IDs are strings (UUIDs).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUsers, fetchUserById, updateUser, deactivateUser, deleteUser,
} from '@/src/common/services/access-management/user-service';
import type {
  PaginatedResponse, User, UpdateUserDto, ApiErrorResponse,
} from '@/src/common/@types/@access-management';
import type { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { mapErrorMessage } from '@/src/common/utils/error-message-mapper';

export const userKeys = {
  all:     ['users'] as const,
  lists:   () => [...userKeys.all, 'list'] as const,
  list:    (page: number, perPage: number, search?: string) =>
             [...userKeys.lists(), { page, perPage, search }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail:  (id: string) => [...userKeys.details(), id] as const,
};

export interface UseUsersParams { page?: number; perPage?: number; search?: string; enabled?: boolean; }

export function useUsers(params: UseUsersParams = {}) {
  const { page = 1, perPage = 10, search, enabled = true } = params;
  return useQuery<PaginatedResponse<User>>({
    queryKey: userKeys.list(page, perPage, search),
    queryFn:  () => fetchUsers(page, perPage, search),
    enabled,
    staleTime: 30_000,
    gcTime:    5 * 60_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export interface UseUserByIdParams { id: string; enabled?: boolean; }

export function useUserById(params: UseUserByIdParams) {
  const { id, enabled = true } = params;
  return useQuery<User>({
    queryKey: userKeys.detail(id),
    queryFn:  () => fetchUserById(id),
    enabled:  enabled && !!id,
    staleTime: 30_000,
    gcTime:    5 * 60_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export interface UpdateUserParams { id: string; data: UpdateUserDto; }

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, AxiosError<ApiErrorResponse>, UpdateUserParams>({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });
      const previousLists  = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      const previousDetail = queryClient.getQueryData(userKeys.detail(id));
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: userKeys.lists() },
        (old) => old ? { ...old, data: old.data.map((u) => u.id === id ? { ...u, ...data, updated_at: new Date().toISOString() } : u) } : old,
      );
      queryClient.setQueryData<User>(userKeys.detail(id), (old) => old ? { ...old, ...data, updated_at: new Date().toISOString() } : old);
      return { previousLists, previousDetail, id };
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      toast.success('User updated successfully');
    },
    onError: (error, _, context: any) => {
      if (context?.previousLists) { context.previousLists.forEach(([k, d]: any) => queryClient.setQueryData(k, d)); }
      if (context?.previousDetail && context?.id) { queryClient.setQueryData(userKeys.detail(context.id), context.previousDetail); }
      toast.error(mapErrorMessage(error, 'Failed to update user'));
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, AxiosError<ApiErrorResponse>, string>({
    mutationFn: (id) => deactivateUser(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });
      const previousLists  = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      const previousDetail = queryClient.getQueryData(userKeys.detail(id));
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: userKeys.lists() },
        (old) => old ? { ...old, data: old.data.map((u) => u.id === id ? { ...u, is_active: false, updated_at: new Date().toISOString() } : u) } : old,
      );
      queryClient.setQueryData<User>(userKeys.detail(id), (old) => old ? { ...old, is_active: false, updated_at: new Date().toISOString() } : old);
      return { previousLists, previousDetail, id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('User deactivated successfully');
    },
    onError: (error, _, context: any) => {
      if (context?.previousLists) { context.previousLists.forEach(([k, d]: any) => queryClient.setQueryData(k, d)); }
      if (context?.previousDetail && context?.id) { queryClient.setQueryData(userKeys.detail(context.id), context.previousDetail); }
      toast.error(mapErrorMessage(error, 'Failed to deactivate user'));
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<ApiErrorResponse>, string>({
    mutationFn: deleteUser,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      const previousLists = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: userKeys.lists() },
        (old) => old ? { ...old, data: old.data.filter((u) => u.id !== id), meta: { ...old.meta, total: old.meta.total - 1 } } : old,
      );
      queryClient.removeQueries({ queryKey: userKeys.detail(id) });
      return { previousLists, id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('User deleted successfully');
    },
    onError: (error, _, context: any) => {
      if (context?.previousLists) { context.previousLists.forEach(([k, d]: any) => queryClient.setQueryData(k, d)); }
      toast.error(mapErrorMessage(error, 'Failed to delete user'));
    },
  });
}
