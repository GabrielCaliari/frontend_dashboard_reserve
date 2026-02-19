/**
 * React Query Hooks for Tenant Management
 * 
 * This file contains React Query hooks for fetching tenant data.
 * Implements caching, pagination, and search functionality.
 * 
 * Validates: Requirements 8.1, 10.2, 17.2
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchTenants, 
  fetchTenantById, 
  createTenant, 
  updateTenant, 
  activateTenant, 
  deactivateTenant, 
  deleteTenant 
} from '@/src/common/services/access-management/tenant-service';
import type { 
  PaginatedResponse, 
  Tenant, 
  CreateTenantDto, 
  UpdateTenantDto, 
  ApiErrorResponse 
} from '@/src/common/@types/@access-management';
import type { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

// ============================================================================
// Query Key Factory
// ============================================================================

/**
 * Centralized query key factory for tenant queries
 * Ensures consistent cache key structure across the application
 */
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (page: number, perPage: number, search?: string) => 
    [...tenantKeys.lists(), { page, perPage, search }] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: number) => [...tenantKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook for fetching paginated list of tenants with optional search
 * 
 * @param params - Query parameters
 * @param params.page - Page number (default: 1)
 * @param params.perPage - Items per page (default: 10)
 * @param params.search - Optional search term for filtering by name, slug, or domain
 * @param params.enabled - Whether the query should run (default: true)
 * 
 * @returns React Query result with paginated tenant data
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
 * const { data, isLoading, error } = useTenants({ 
 *   page: 1, 
 *   perPage: 10, 
 *   search: 'acme' 
 * });
 * ```
 * 
 * Validates: Requirements 8.1, 8.2, 17.2
 */
export interface UseTenantsParams {
  page?: number;
  perPage?: number;
  search?: string;
  enabled?: boolean;
}

export function useTenants(params: UseTenantsParams = {}) {
  const { 
    page = 1, 
    perPage = 10, 
    search, 
    enabled = true 
  } = params;

  return useQuery<PaginatedResponse<Tenant>>({
    queryKey: tenantKeys.list(page, perPage, search),
    queryFn: () => fetchTenants(page, perPage, search),
    enabled,
    staleTime: 30000, // 30 seconds - data is considered fresh for this duration
    gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection time
    refetchOnWindowFocus: true,
    retry: 2, // Retry failed requests twice
  });
}

/**
 * Hook for fetching a single tenant by ID with detailed information
 * 
 * @param params - Query parameters
 * @param params.id - Tenant ID to fetch
 * @param params.enabled - Whether the query should run (default: true)
 * 
 * @returns React Query result with tenant detail data
 * 
 * Features:
 * - Automatic caching with 30 second stale time
 * - Includes assigned admins with roles
 * - Loading and error states
 * - Automatic refetch on window focus
 * 
 * @example
 * ```tsx
 * const { data: tenant, isLoading, error } = useTenantById({ id: 123 });
 * 
 * if (tenant) {
 *   console.log(tenant.name, tenant.admins);
 * }
 * ```
 * 
 * Validates: Requirements 10.1, 10.2, 10.3
 */
export interface UseTenantByIdParams {
  id: number;
  enabled?: boolean;
}

export function useTenantById(params: UseTenantByIdParams) {
  const { id, enabled = true } = params;

  return useQuery<Tenant>({
    queryKey: tenantKeys.detail(id),
    queryFn: () => fetchTenantById(id),
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
 * Hook for creating a new tenant with optimistic updates
 * 
 * @returns React Query mutation result
 * 
 * Features:
 * - Optimistic UI update (adds tenant to cache immediately)
 * - Automatic cache invalidation on success
 * - Rollback on error
 * - Toast notifications for success/error
 * 
 * @example
 * ```tsx
 * const createTenantMutation = useCreateTenant();
 * 
 * const handleCreate = async (data: CreateTenantDto) => {
 *   await createTenantMutation.mutateAsync(data);
 * };
 * ```
 * 
 * Validates: Requirements 9.6, 9.7, 27.1, 27.2, 27.3
 */
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation<Tenant, AxiosError<ApiErrorResponse>, CreateTenantDto>({
    mutationFn: createTenant,
    
    // Optimistic update: Add tenant to cache before API responds
    onMutate: async (newTenant) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: tenantKeys.lists() });

      // Snapshot previous value for rollback
      const previousTenants = queryClient.getQueriesData({ queryKey: tenantKeys.lists() });

      // Optimistically update all tenant list queries
      queryClient.setQueriesData<PaginatedResponse<Tenant>>(
        { queryKey: tenantKeys.lists() },
        (old) => {
          if (!old) return old;
          
          // Create optimistic tenant with temporary ID
          const optimisticTenant: Tenant = {
            id: Date.now(), // Temporary ID
            name: newTenant.name,
            slug: newTenant.slug,
            domain: newTenant.domain,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          return {
            ...old,
            data: [optimisticTenant, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        }
      );

      return { previousTenants };
    },

    // On success: Invalidate queries to refetch with real data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      toast.success('Tenant created successfully');
    },

    // On error: Rollback optimistic update
    onError: (error, _, context) => {
      // Restore previous data
      if (context?.previousTenants) {
        context.previousTenants.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const errorMessage = error.response?.data?.message || 'Failed to create tenant';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for updating an existing tenant with optimistic updates
 * 
 * @returns React Query mutation result
 * 
 * Features:
 * - Optimistic UI update (updates tenant in cache immediately)
 * - Automatic cache invalidation on success
 * - Rollback on error
 * - Toast notifications for success/error
 * 
 * @example
 * ```tsx
 * const updateTenantMutation = useUpdateTenant();
 * 
 * const handleUpdate = async (id: number, data: UpdateTenantDto) => {
 *   await updateTenantMutation.mutateAsync({ id, data });
 * };
 * ```
 * 
 * Validates: Requirements 11.5, 11.6, 27.1, 27.2, 27.3
 */
export interface UpdateTenantParams {
  id: number;
  data: UpdateTenantDto;
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation<Tenant, AxiosError<ApiErrorResponse>, UpdateTenantParams>({
    mutationFn: ({ id, data }) => updateTenant(id, data),
    
    // Optimistic update: Update tenant in cache before API responds
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tenantKeys.lists() });
      await queryClient.cancelQueries({ queryKey: tenantKeys.detail(id) });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: tenantKeys.lists() });
      const previousDetail = queryClient.getQueryData(tenantKeys.detail(id));

      // Optimistically update list queries
      queryClient.setQueriesData<PaginatedResponse<Tenant>>(
        { queryKey: tenantKeys.lists() },
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            data: old.data.map((tenant) =>
              tenant.id === id
                ? { ...tenant, ...data, updated_at: new Date().toISOString() }
                : tenant
            ),
          };
        }
      );

      // Optimistically update detail query
      queryClient.setQueryData<Tenant>(
        tenantKeys.detail(id),
        (old) => {
          if (!old) return old;
          return { ...old, ...data, updated_at: new Date().toISOString() };
        }
      );

      return { previousLists, previousDetail, id };
    },

    // On success: Invalidate queries to refetch with real data
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.id) });
      toast.success('Tenant updated successfully');
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
        queryClient.setQueryData(tenantKeys.detail(context.id), context.previousDetail);
      }

      const errorMessage = error.response?.data?.message || 'Failed to update tenant';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for toggling tenant status (activate/deactivate) with optimistic updates
 * 
 * @returns React Query mutation result
 * 
 * Features:
 * - Optimistic UI update (toggles status in cache immediately)
 * - Automatic cache invalidation on success
 * - Rollback on error
 * - Toast notifications for success/error
 * 
 * @example
 * ```tsx
 * const toggleStatusMutation = useToggleTenantStatus();
 * 
 * const handleToggle = async (id: number, isActive: boolean) => {
 *   await toggleStatusMutation.mutateAsync({ id, isActive });
 * };
 * ```
 * 
 * Validates: Requirements 12.4, 12.5, 13.2, 27.1, 27.2, 27.3
 */
export interface ToggleTenantStatusParams {
  id: number;
  isActive: boolean; // Current status (will be toggled)
}

export function useToggleTenantStatus() {
  const queryClient = useQueryClient();

  return useMutation<Tenant, AxiosError<ApiErrorResponse>, ToggleTenantStatusParams>({
    mutationFn: ({ id, isActive }) => 
      isActive ? deactivateTenant(id) : activateTenant(id),
    
    // Optimistic update: Toggle status in cache before API responds
    onMutate: async ({ id, isActive }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tenantKeys.lists() });
      await queryClient.cancelQueries({ queryKey: tenantKeys.detail(id) });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: tenantKeys.lists() });
      const previousDetail = queryClient.getQueryData(tenantKeys.detail(id));

      const newStatus = !isActive;

      // Optimistically update list queries
      queryClient.setQueriesData<PaginatedResponse<Tenant>>(
        { queryKey: tenantKeys.lists() },
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            data: old.data.map((tenant) =>
              tenant.id === id
                ? { ...tenant, is_active: newStatus, updated_at: new Date().toISOString() }
                : tenant
            ),
          };
        }
      );

      // Optimistically update detail query
      queryClient.setQueryData<Tenant>(
        tenantKeys.detail(id),
        (old) => {
          if (!old) return old;
          return { ...old, is_active: newStatus, updated_at: new Date().toISOString() };
        }
      );

      return { previousLists, previousDetail, id };
    },

    // On success: Invalidate queries to refetch with real data
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.id) });
      
      const message = variables.isActive 
        ? 'Tenant deactivated successfully' 
        : 'Tenant activated successfully';
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
        queryClient.setQueryData(tenantKeys.detail(context.id), context.previousDetail);
      }

      const errorMessage = error.response?.data?.message || 'Failed to update tenant status';
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for deleting a tenant with optimistic updates
 * 
 * @returns React Query mutation result
 * 
 * Features:
 * - Optimistic UI update (removes tenant from cache immediately)
 * - Automatic cache invalidation on success
 * - Rollback on error
 * - Toast notifications for success/error
 * 
 * @example
 * ```tsx
 * const deleteTenantMutation = useDeleteTenant();
 * 
 * const handleDelete = async (id: number) => {
 *   await deleteTenantMutation.mutateAsync(id);
 * };
 * ```
 * 
 * Validates: Requirements 13.2, 13.3, 27.1, 27.2, 27.3
 */
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiErrorResponse>, number>({
    mutationFn: deleteTenant,
    
    // Optimistic update: Remove tenant from cache before API responds
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tenantKeys.lists() });
      await queryClient.cancelQueries({ queryKey: tenantKeys.detail(id) });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: tenantKeys.lists() });
      const previousDetail = queryClient.getQueryData(tenantKeys.detail(id));

      // Optimistically remove from list queries
      queryClient.setQueriesData<PaginatedResponse<Tenant>>(
        { queryKey: tenantKeys.lists() },
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            data: old.data.filter((tenant) => tenant.id !== id),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
        }
      );

      // Remove detail query
      queryClient.removeQueries({ queryKey: tenantKeys.detail(id) });

      return { previousLists, previousDetail, id };
    },

    // On success: Invalidate queries to refetch with real data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      toast.success('Tenant deleted successfully');
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
        queryClient.setQueryData(tenantKeys.detail(context.id), context.previousDetail);
      }

      const errorMessage = error.response?.data?.message || 'Failed to delete tenant';
      toast.error(errorMessage);
    },
  });
}
