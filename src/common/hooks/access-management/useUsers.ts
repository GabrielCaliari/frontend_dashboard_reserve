/**
 * React Query Hooks for User Management
 * 
 * This file contains React Query hooks for fetching user data.
 * Implements caching, pagination, and search functionality.
 * 
 * Validates: Requirements 18.1, 19.2, 23.2
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchUsers, 
  fetchUserById, 
  updateUser, 
  deactivateUser, 
  deleteUser 
} from '@/src/common/services/access-management/user-service';
import type { 
  PaginatedResponse, 
  User, 
  UpdateUserDto, 
  ApiErrorResponse 
} from '@/src/common/@types/@access-management';
import type { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

// ============================================================================
// Query Key Factory
// ============================================================================

/**
 * Centralized query key factory for user queries
 * Ensures consistent cache key structure across the application
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (page: number, perPage: number, search?: string) => 
    [...userKeys.lists(), { page, perPage, search }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook for fetching paginated list of users with optional search
 * 
 * @param params - Query parameters
 * @param params.page - Page number (default: 1)
 * @param params.perPage - Items per page (default: 10)
 * @param params.search - Optional search term for filtering by name or email
 * @param params.enabled - Whether the query should run (default: true)
 * 
 * @returns React Query result with paginated user data
 * 
 * Features:
 * - Automatic caching with 30 second stale time
 * - Pagination support
 * - Search filtering
 * - Loading and error states
 * - Automatic refetch on window focus
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useUsers({ 
 *   page: 1, 
 *   perPage: 10, 
 *   search: 'john' 
 * });
 * ```
 * 
 * Validates: Requirements 18.1, 18.2, 23.2
 */
export interface UseUsersParams {
  page?: number;
  perPage?: number;
  search?: string;
  enabled?: boolean;
}

export function useUsers(params: UseUsersParams = {}) {
  const { 
    page = 1, 
    perPage = 10, 
    search, 
    enabled = true 
  } = params;

  return useQuery<PaginatedResponse<User>>({
    queryKey: userKeys.list(page, perPage, search),
    queryFn: () => fetchUsers(page, perPage, search),
    enabled,
    staleTime: 30000, // 30 seconds - data is considered fresh for this duration
    gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection time
    refetchOnWindowFocus: true,
    retry: 2, // Retry failed requests twice
  });
}

/**
 * Hook for fetching a single user by ID with detailed information
 * 
 * @param params - Query parameters
 * @param params.id - User ID to fetch
 * @param params.enabled - Whether the query should run (default: true)
 * 
 * @returns React Query result with user detail data
 * 
 * Features:
 * - Automatic caching with 30 second stale time
 * - Loading and error states
 * - Automatic refetch on window focus
 * 
 * @example
 * ```tsx
 * const { data: user, isLoading, error } = useUserById({ id: 123 });
 * 
 * if (user) {
 *   console.log(user.name, user.email);
 * }
 * ```
 * 
 * Validates: Requirements 19.1, 19.2, 19.3
 */
export interface UseUserByIdParams {
  id: number;
  enabled?: boolean;
}

export function useUserById(params: UseUserByIdParams) {
  const { id, enabled = true } = params;

  return useQuery<User>({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUserById(id),
    enabled: enabled && !!id, // Only run if enabled and id is provided
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook for updating an existing user with optimistic updates
 * 
 * @returns React Query mutation result
 * 
 * Features:
 * - Optimistic UI update (updates user in cache immediately)
 * - Automatic cache invalidation on success
 * - Rollback on error
 * - Toast notifications for success/error
 * 
 * @example
 * ```tsx
 * const updateUserMutation = useUpdateUser();
 * 
 * const handleUpdate = async (id: number, data: UpdateUserDto) => {
 *   await updateUserMutation.mutateAsync({ id, data });
 * };
 * ```
 * 
 * Validates: Requirements 20.4, 20.5, 27.1, 27.2, 27.3
 */
export interface UpdateUserParams {
  id: number;
  data: UpdateUserDto;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, AxiosError<ApiErrorResponse>, UpdateUserParams>({
    mutationFn: ({ id, data }) => updateUser(id, data),
    
    // Optimistic update: Update user in cache before API responds
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      const previousDetail = queryClient.getQueryData(userKeys.detail(id));

      // Optimistically update list queries
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: userKeys.lists() },
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            data: old.data.map((user) =>
              user.id === id
                ? { ...user, ...data, updated_at: new Date().toISOString() }
                : user
            ),
          };
        }
      );

      // Optimistically update detail query
      queryClient.setQueryData<User>(
        userKeys.detail(id),
        (old) => {
          if (!old) return old;
          return { ...old, ...data, updated_at: new Date().toISOString() };
        }
      );

      return { previousLists, previousDetail, id };
    },

    // On success: Invalidate queries to refetch with real data
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      toast.success('User updated successfully');
    },

    // On error: Rollback optimistic update
    onError: (error, _, context) => {
      // Restore previous list data
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Restore previous detail data
      if (context?.previousDetail && context?.id) {
        queryClient.setQueryData(userKeys.detail(context.id), context.previousDetail);
      }

      const errorMessage = error.response?.data?.message || 'Failed to update user';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for deactivating a user with optimistic updates
 * 
 * @returns React Query mutation result
 * 
 * Features:
 * - Optimistic UI update (sets is_active to false in cache immediately)
 * - Automatic cache invalidation on success
 * - Rollback on error
 * - Toast notifications for success/error
 * 
 * @example
 * ```tsx
 * const deactivateUserMutation = useDeactivateUser();
 * 
 * const handleDeactivate = async (id: number) => {
 *   await deactivateUserMutation.mutateAsync(id);
 * };
 * ```
 * 
 * Validates: Requirements 21.3, 21.4, 27.1, 27.2, 27.3
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, AxiosError<ApiErrorResponse>, number>({
    mutationFn: deactivateUser,
    
    // Optimistic update: Deactivate user in cache before API responds
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      const previousDetail = queryClient.getQueryData(userKeys.detail(id));

      // Optimistically update list queries
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: userKeys.lists() },
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            data: old.data.map((user) =>
              user.id === id
                ? { ...user, is_active: false, updated_at: new Date().toISOString() }
                : user
            ),
          };
        }
      );

      // Optimistically update detail query
      queryClient.setQueryData<User>(
        userKeys.detail(id),
        (old) => {
          if (!old) return old;
          return { ...old, is_active: false, updated_at: new Date().toISOString() };
        }
      );

      return { previousLists, previousDetail, id };
    },

    // On success: Invalidate queries to refetch with real data
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      toast.success('User deactivated successfully');
    },

    // On error: Rollback optimistic update
    onError: (error, _, context) => {
      // Restore previous list data
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Restore previous detail data
      if (context?.previousDetail && context?.id) {
        queryClient.setQueryData(userKeys.detail(context.id), context.previousDetail);
      }

      const errorMessage = error.response?.data?.message || 'Failed to deactivate user';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for deleting a user with optimistic updates
 * 
 * @returns React Query mutation result
 * 
 * Features:
 * - Optimistic UI update (removes user from cache immediately)
 * - Automatic cache invalidation on success
 * - Rollback on error
 * - Toast notifications for success/error
 * 
 * @example
 * ```tsx
 * const deleteUserMutation = useDeleteUser();
 * 
 * const handleDelete = async (id: number) => {
 *   await deleteUserMutation.mutateAsync(id);
 * };
 * ```
 * 
 * Validates: Requirements 22.2, 22.3, 27.1, 27.2, 27.3
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiErrorResponse>, number>({
    mutationFn: deleteUser,
    
    // Optimistic update: Remove user from cache before API responds
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      const previousDetail = queryClient.getQueryData(userKeys.detail(id));

      // Optimistically remove from list queries
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: userKeys.lists() },
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            data: old.data.filter((user) => user.id !== id),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      // Remove detail query
      queryClient.removeQueries({ queryKey: userKeys.detail(id) });

      return { previousLists, previousDetail, id };
    },

    // On success: Invalidate queries to refetch with real data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('User deleted successfully');
    },

    // On error: Rollback optimistic update
    onError: (error, _, context) => {
      // Restore previous list data
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Restore previous detail data
      if (context?.previousDetail && context?.id) {
        queryClient.setQueryData(userKeys.detail(context.id), context.previousDetail);
      }

      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      toast.error(errorMessage);
    },
  });
}
