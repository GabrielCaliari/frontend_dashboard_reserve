/**
 * React Query Hooks for Admin Management
 * 
 * This file contains React Query hooks for fetching admin data.
 * Implements caching, pagination, and search functionality.
 * 
 * Validates: Requirements 1.1, 3.2, 7.2
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchAdmins, 
  fetchAdminById, 
  createAdmin, 
  updateAdmin, 
  activateAdmin, 
  deactivateAdmin, 
  deleteAdmin 
} from '@/src/common/services/access-management/admin-service';
import type { 
  PaginatedResponse, 
  Admin, 
  CreateAdminDto, 
  UpdateAdminDto, 
  ApiErrorResponse 
} from '@/src/common/@types/@access-management';
import type { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

// ============================================================================
// Query Key Factory
// ============================================================================

/**
 * Centralized query key factory for admin queries
 * Ensures consistent cache key structure across the application
 */
export const adminKeys = {
  all: ['admins'] as const,
  lists: () => [...adminKeys.all, 'list'] as const,
  list: (page: number, perPage: number, search?: string) => 
    [...adminKeys.lists(), { page, perPage, search }] as const,
  details: () => [...adminKeys.all, 'detail'] as const,
  detail: (id: number) => [...adminKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook for fetching paginated list of admins with optional search
 * 
 * @param params - Query parameters
 * @param params.page - Page number (default: 1)
 * @param params.perPage - Items per page (default: 10)
 * @param params.search - Optional search term for filtering by name or email
 * @param params.enabled - Whether the query should run (default: true)
 * 
 * @returns React Query result with paginated admin data
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
 * const { data, isLoading, error } = useAdmins({ 
 *   page: 1, 
 *   perPage: 10, 
 *   search: 'john' 
 * });
 * ```
 * 
 * Validates: Requirements 1.1, 1.2, 7.2
 */
export interface UseAdminsParams {
  page?: number;
  perPage?: number;
  search?: string;
  enabled?: boolean;
}

export function useAdmins(params: UseAdminsParams = {}) {
  const { 
    page = 1, 
    perPage = 10, 
    search, 
    enabled = true 
  } = params;

  return useQuery<PaginatedResponse<Admin>>({
    queryKey: adminKeys.list(page, perPage, search),
    queryFn: () => fetchAdmins(page, perPage, search),
    enabled,
    staleTime: 30000, // 30 seconds - data is considered fresh for this duration
    gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection time
    refetchOnWindowFocus: true,
    retry: 2, // Retry failed requests twice
  });
}

/**
 * Hook for fetching a single admin by ID with detailed information
 * 
 * @param params - Query parameters
 * @param params.id - Admin ID to fetch
 * @param params.enabled - Whether the query should run (default: true)
 * 
 * @returns React Query result with admin detail data
 * 
 * Features:
 * - Automatic caching with 30 second stale time
 * - Includes assigned tenants with roles
 * - Loading and error states
 * - Automatic refetch on window focus
 * 
 * @example
 * ```tsx
 * const { data: admin, isLoading, error } = useAdminById({ id: 123 });
 * 
 * if (admin) {
 *   console.log(admin.name, admin.tenants);
 * }
 * ```
 * 
 * Validates: Requirements 3.1, 3.2, 3.3
 */
export interface UseAdminByIdParams {
  id: number;
  enabled?: boolean;
}

export function useAdminById(params: UseAdminByIdParams) {
  const { id, enabled = true } = params;

  return useQuery<Admin>({
    queryKey: adminKeys.detail(id),
    queryFn: () => fetchAdminById(id),
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
 * Hook for creating a new admin with optimistic updates
 * 
 * @returns React Query mutation result
 * 
 * Features:
 * - Optimistic UI update (adds admin to cache immediately)
 * - Automatic cache invalidation on success
 * - Rollback on error
 * - Toast notifications for success/error
 * 
 * @example
 * ```tsx
 * const createAdminMutation = useCreateAdmin();
 * 
 * const handleCreate = async (data: CreateAdminDto) => {
 *   await createAdminMutation.mutateAsync(data);
 * };
 * ```
 * 
 * Validates: Requirements 2.6, 2.7, 4.4, 4.5, 27.1, 27.2, 27.3
 */
export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation<Admin, AxiosError<ApiErrorResponse>, CreateAdminDto>({
    mutationFn: createAdmin,
    
    // Optimistic update: Add admin to cache before API responds
    onMutate: async (newAdmin) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: adminKeys.lists() });

      // Snapshot previous value for rollback
      const previousAdmins = queryClient.getQueriesData({ queryKey: adminKeys.lists() });

      // Optimistically update all admin list queries
      queryClient.setQueriesData<PaginatedResponse<Admin>>(
        { queryKey: adminKeys.lists() },
        (old) => {
          if (!old) return old;
          
          // Create optimistic admin with temporary ID
          const optimisticAdmin: Admin = {
            id: Date.now(), // Temporary ID
            name: newAdmin.name,
            email: newAdmin.email,
            role: newAdmin.role,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          return {
            ...old,
            data: [optimisticAdmin, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        }
      );

      return { previousAdmins };
    },

    // On success: Invalidate queries to refetch with real data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      toast.success('Admin created successfully');
    },

    // On error: Rollback optimistic update
    onError: (error, _, context) => {
      // Restore previous data
      if (context?.previousAdmins) {
        context.previousAdmins.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const errorMessage = error.response?.data?.message || 'Failed to create admin';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for updating an existing admin with optimistic updates
 * 
 * @returns React Query mutation result
 * 
 * Features:
 * - Optimistic UI update (updates admin in cache immediately)
 * - Automatic cache invalidation on success
 * - Rollback on error
 * - Toast notifications for success/error
 * 
 * @example
 * ```tsx
 * const updateAdminMutation = useUpdateAdmin();
 * 
 * const handleUpdate = async (id: number, data: UpdateAdminDto) => {
 *   await updateAdminMutation.mutateAsync({ id, data });
 * };
 * ```
 * 
 * Validates: Requirements 4.4, 4.5, 27.1, 27.2, 27.3
 */
export interface UpdateAdminParams {
  id: number;
  data: UpdateAdminDto;
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();

  return useMutation<Admin, AxiosError<ApiErrorResponse>, UpdateAdminParams>({
    mutationFn: ({ id, data }) => updateAdmin(id, data),
    
    // Optimistic update: Update admin in cache before API responds
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminKeys.lists() });
      await queryClient.cancelQueries({ queryKey: adminKeys.detail(id) });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: adminKeys.lists() });
      const previousDetail = queryClient.getQueryData(adminKeys.detail(id));

      // Optimistically update list queries
      queryClient.setQueriesData<PaginatedResponse<Admin>>(
        { queryKey: adminKeys.lists() },
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            data: old.data.map((admin) =>
              admin.id === id
                ? { ...admin, ...data, updated_at: new Date().toISOString() }
                : admin
            ),
          };
        }
      );

      // Optimistically update detail query
      queryClient.setQueryData<Admin>(
        adminKeys.detail(id),
        (old) => {
          if (!old) return old;
          return { ...old, ...data, updated_at: new Date().toISOString() };
        }
      );

      return { previousLists, previousDetail, id };
    },

    // On success: Invalidate queries to refetch with real data
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(variables.id) });
      toast.success('Admin updated successfully');
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
        queryClient.setQueryData(adminKeys.detail(context.id), context.previousDetail);
      }

      const errorMessage = error.response?.data?.message || 'Failed to update admin';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for toggling admin status (activate/deactivate) with optimistic updates
 * 
 * @returns React Query mutation result
 * 
 * Features:
 * - Optimistic UI update (toggles status in cache immediately)
 * - Automatic cache invalidation on success
 * - Rollback on error
 * - Toast notifications for success/error
 * - Self-action prevention should be handled at UI layer
 * 
 * @example
 * ```tsx
 * const toggleStatusMutation = useToggleAdminStatus();
 * 
 * const handleToggle = async (id: number, isActive: boolean) => {
 *   await toggleStatusMutation.mutateAsync({ id, isActive });
 * };
 * ```
 * 
 * Validates: Requirements 5.4, 5.5, 6.2, 27.1, 27.2, 27.3
 */
export interface ToggleAdminStatusParams {
  id: number;
  isActive: boolean; // Current status (will be toggled)
}

export function useToggleAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation<Admin, AxiosError<ApiErrorResponse>, ToggleAdminStatusParams>({
    mutationFn: ({ id, isActive }) => 
      isActive ? deactivateAdmin(id) : activateAdmin(id),
    
    // Optimistic update: Toggle status in cache before API responds
    onMutate: async ({ id, isActive }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminKeys.lists() });
      await queryClient.cancelQueries({ queryKey: adminKeys.detail(id) });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: adminKeys.lists() });
      const previousDetail = queryClient.getQueryData(adminKeys.detail(id));

      const newStatus = !isActive;

      // Optimistically update list queries
      queryClient.setQueriesData<PaginatedResponse<Admin>>(
        { queryKey: adminKeys.lists() },
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            data: old.data.map((admin) =>
              admin.id === id
                ? { ...admin, is_active: newStatus, updated_at: new Date().toISOString() }
                : admin
            ),
          };
        }
      );

      // Optimistically update detail query
      queryClient.setQueryData<Admin>(
        adminKeys.detail(id),
        (old) => {
          if (!old) return old;
          return { ...old, is_active: newStatus, updated_at: new Date().toISOString() };
        }
      );

      return { previousLists, previousDetail, id };
    },

    // On success: Invalidate queries to refetch with real data
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(variables.id) });
      
      const message = variables.isActive 
        ? 'Admin deactivated successfully' 
        : 'Admin activated successfully';
      toast.success(message);
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
        queryClient.setQueryData(adminKeys.detail(context.id), context.previousDetail);
      }

      const errorMessage = error.response?.data?.message || 'Failed to update admin status';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for deleting an admin with optimistic updates
 * 
 * @returns React Query mutation result
 * 
 * Features:
 * - Optimistic UI update (removes admin from cache immediately)
 * - Automatic cache invalidation on success
 * - Rollback on error
 * - Toast notifications for success/error
 * - Self-deletion prevention should be handled at UI layer
 * 
 * @example
 * ```tsx
 * const deleteAdminMutation = useDeleteAdmin();
 * 
 * const handleDelete = async (id: number) => {
 *   await deleteAdminMutation.mutateAsync(id);
 * };
 * ```
 * 
 * Validates: Requirements 6.2, 6.4, 27.1, 27.2, 27.3
 */
export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiErrorResponse>, number>({
    mutationFn: deleteAdmin,
    
    // Optimistic update: Remove admin from cache before API responds
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminKeys.lists() });
      await queryClient.cancelQueries({ queryKey: adminKeys.detail(id) });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: adminKeys.lists() });
      const previousDetail = queryClient.getQueryData(adminKeys.detail(id));

      // Optimistically remove from list queries
      queryClient.setQueriesData<PaginatedResponse<Admin>>(
        { queryKey: adminKeys.lists() },
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            data: old.data.filter((admin) => admin.id !== id),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      // Remove detail query
      queryClient.removeQueries({ queryKey: adminKeys.detail(id) });

      return { previousLists, previousDetail, id };
    },

    // On success: Invalidate queries to refetch with real data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      toast.success('Admin deleted successfully');
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
        queryClient.setQueryData(adminKeys.detail(context.id), context.previousDetail);
      }

      const errorMessage = error.response?.data?.message || 'Failed to delete admin';
      toast.error(errorMessage);
    },
  });
}
