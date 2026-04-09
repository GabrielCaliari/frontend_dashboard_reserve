/**
 * React Query Hooks for Tenant Management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTenants,
  fetchTenantById,
  createTenant,
  updateTenant,
  activateTenant,
  deactivateTenant,
  deleteTenant,
  assignAdminToTenant,
  unassignAdminFromTenant,
  updateAdminTenantRole,
  scheduleTenantDeletion,
  restoreTenantDeletion,
  getTenantDeletionStatus,
} from "@/src/common/services/access-management/tenant-service";
import type {
  PaginatedResponse,
  Tenant,
  CreateTenantDto,
  UpdateTenantDto,
  ApiErrorResponse,
  AssignAdminDto,
  UpdateAdminRoleDto,
} from "@/src/common/@types/@access-management";
import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { adminKeys } from "@/src/common/hooks/access-management/useAdmins";

// ============================================================================
// Query Key Factory
// ============================================================================

export const tenantKeys = {
  all: ["tenants"] as const,
  lists: () => [...tenantKeys.all, "list"] as const,
  list: (page: number, perPage: number, search?: string) =>
    [...tenantKeys.lists(), { page, perPage, search }] as const,
  details: () => [...tenantKeys.all, "detail"] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export interface UseTenantsParams {
  page?: number;
  perPage?: number;
  search?: string;
  enabled?: boolean;
}

export function useTenants(params: UseTenantsParams = {}) {
  const { page = 1, perPage = 10, search, enabled = true } = params;

  return useQuery<PaginatedResponse<Tenant>>({
    queryKey: tenantKeys.list(page, perPage, search),
    queryFn: () => fetchTenants(page, perPage, search),
    enabled,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export interface UseTenantByIdParams {
  id: string;
  enabled?: boolean;
}

export function useTenantById(params: UseTenantByIdParams) {
  const { id, enabled = true } = params;

  return useQuery<Tenant>({
    queryKey: tenantKeys.detail(id),
    queryFn: () => fetchTenantById(id),
    enabled: enabled && !!id,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation<Tenant, AxiosError<ApiErrorResponse>, CreateTenantDto>({
    mutationFn: createTenant,

    onMutate: async (newTenant) => {
      await queryClient.cancelQueries({ queryKey: tenantKeys.lists() });
      const previousTenants = queryClient.getQueriesData({
        queryKey: tenantKeys.lists(),
      });

      queryClient.setQueriesData<PaginatedResponse<Tenant>>(
        { queryKey: tenantKeys.lists() },
        (old) => {
          if (!old) return old;

          const optimisticTenant: Tenant = {
            id: `temp-${Date.now()}`,
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
        },
      );

      return { previousTenants };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      toast.success("Tenant created successfully");
    },

    onError: (error, _, context: any) => {
      if (context?.previousTenants) {
        context.previousTenants.forEach(([k, d]: any) =>
          queryClient.setQueryData(k, d),
        );
      }
      const errorMessage =
        error.response?.data?.message || "Failed to create tenant";
      toast.error(errorMessage);
    },
  });
}

export interface UpdateTenantParams {
  id: string;
  data: UpdateTenantDto;
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation<Tenant, AxiosError<ApiErrorResponse>, UpdateTenantParams>({
    mutationFn: ({ id, data }) => updateTenant(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: tenantKeys.lists() });
      await queryClient.cancelQueries({ queryKey: tenantKeys.detail(id) });

      const previousLists = queryClient.getQueriesData({
        queryKey: tenantKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData(tenantKeys.detail(id));

      queryClient.setQueriesData<PaginatedResponse<Tenant>>(
        { queryKey: tenantKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((tenant) =>
              tenant.id === id
                ? { ...tenant, ...data, updated_at: new Date().toISOString() }
                : tenant,
            ),
          };
        },
      );

      queryClient.setQueryData<Tenant>(tenantKeys.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...data, updated_at: new Date().toISOString() };
      });

      return { previousLists, previousDetail, id };
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: tenantKeys.detail(variables.id),
      });
      toast.success("Tenant updated successfully");
    },

    onError: (error, _, context: any) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([k, d]: any) =>
          queryClient.setQueryData(k, d),
        );
      }
      if (context?.previousDetail && context?.id) {
        queryClient.setQueryData(
          tenantKeys.detail(context.id),
          context.previousDetail,
        );
      }
      const errorMessage =
        error.response?.data?.message || "Failed to update tenant";
      toast.error(errorMessage);
    },
  });
}

export interface ToggleTenantStatusParams {
  id: string;
  isActive: boolean;
}

export function useToggleTenantStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    Tenant,
    AxiosError<ApiErrorResponse>,
    ToggleTenantStatusParams
  >({
    mutationFn: ({ id, isActive }) =>
      isActive ? deactivateTenant(id) : activateTenant(id),

    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: tenantKeys.lists() });
      await queryClient.cancelQueries({ queryKey: tenantKeys.detail(id) });

      const previousLists = queryClient.getQueriesData({
        queryKey: tenantKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData(tenantKeys.detail(id));
      const newStatus = !isActive;

      queryClient.setQueriesData<PaginatedResponse<Tenant>>(
        { queryKey: tenantKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((tenant) =>
              tenant.id === id
                ? {
                    ...tenant,
                    is_active: newStatus,
                    updated_at: new Date().toISOString(),
                  }
                : tenant,
            ),
          };
        },
      );

      queryClient.setQueryData<Tenant>(tenantKeys.detail(id), (old) => {
        if (!old) return old;
        return {
          ...old,
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        };
      });

      return { previousLists, previousDetail, id };
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: tenantKeys.detail(variables.id),
      });

      const message = variables.isActive
        ? "Tenant deactivated successfully"
        : "Tenant activated successfully";
      toast.success(message);
    },

    onError: (error, _, context: any) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([k, d]: any) =>
          queryClient.setQueryData(k, d),
        );
      }
      if (context?.previousDetail && context?.id) {
        queryClient.setQueryData(
          tenantKeys.detail(context.id),
          context.previousDetail,
        );
      }
      const errorMessage =
        error.response?.data?.message || "Failed to update tenant status";
      toast.error(errorMessage);
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiErrorResponse>, string>({
    mutationFn: deleteTenant,

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: tenantKeys.lists() });
      await queryClient.cancelQueries({ queryKey: tenantKeys.detail(id) });

      const previousLists = queryClient.getQueriesData({
        queryKey: tenantKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData(tenantKeys.detail(id));

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
        },
      );

      queryClient.removeQueries({ queryKey: tenantKeys.detail(id) });
      return { previousLists, previousDetail, id };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      toast.success("Tenant deleted successfully");
    },

    onError: (error, _, context: any) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([k, d]: any) =>
          queryClient.setQueryData(k, d),
        );
      }
      if (context?.previousDetail && context?.id) {
        queryClient.setQueryData(
          tenantKeys.detail(context.id),
          context.previousDetail,
        );
      }
      const errorMessage =
        error.response?.data?.message || "Failed to delete tenant";
      toast.error(errorMessage);
    },
  });
}

export interface ScheduleTenantDeletionParams {
  id: string;
  reason?: string;
}

export function useScheduleTenantDeletion() {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    AxiosError<ApiErrorResponse>,
    ScheduleTenantDeletionParams
  >({
    mutationFn: ({ id, reason }) => scheduleTenantDeletion(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast.success("Tenant deletion scheduled successfully");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to schedule tenant deletion";
      toast.error(errorMessage);
    },
  });
}

export function useRestoreTenantDeletion() {
  const queryClient = useQueryClient();

  return useMutation<Tenant, AxiosError<ApiErrorResponse>, string>({
    mutationFn: restoreTenantDeletion,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast.success("Tenant restored successfully");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to restore tenant";
      toast.error(errorMessage);
    },
  });
}

export function useAssignAdminToTenant() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiErrorResponse>, AssignAdminDto>({
    mutationFn: assignAdminToTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success("Admin assigned to tenant successfully");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to assign admin to tenant";
      toast.error(errorMessage);
    },
  });
}

export interface UnassignAdminFromTenantParams {
  tenantId: string;
  adminId: string;
}

export function useUnassignAdminFromTenant() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    AxiosError<ApiErrorResponse>,
    UnassignAdminFromTenantParams
  >({
    mutationFn: ({ tenantId, adminId }) =>
      unassignAdminFromTenant(tenantId, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success("Admin removed from tenant successfully");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to remove admin from tenant";
      toast.error(errorMessage);
    },
  });
}

export interface UpdateAdminTenantRoleParams {
  tenantId: string;
  adminId: string;
  data: UpdateAdminRoleDto;
}

export function useUpdateAdminTenantRole() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    AxiosError<ApiErrorResponse>,
    UpdateAdminTenantRoleParams
  >({
    mutationFn: ({ tenantId, adminId, data }) =>
      updateAdminTenantRole(tenantId, adminId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success("Admin role updated successfully");
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "Failed to update admin role";
      toast.error(errorMessage);
    },
  });
}
