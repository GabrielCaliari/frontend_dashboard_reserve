/**
 * React Query Hooks for Admin Management
 * All admin IDs are strings (UUIDs).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdmins,
  fetchAdminById,
  createAdmin,
  updateAdmin,
  updateAdminRole,
  activateAdmin,
  deactivateAdmin,
  deleteAdmin,
  scheduleAdminDeletion,
  restoreAdminDeletion,
  getAdminDeletionStatus,
} from "@/src/common/services/access-management/admin-service";
import type {
  PaginatedResponse,
  Admin,
  CreateAdminDto,
  UpdateAdminDto,
  AdminRole,
  ApiErrorResponse,
} from "@/src/common/@types/@access-management";
import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { mapErrorMessage } from "@/src/common/utils/error-message-mapper";

export const adminKeys = {
  all: ["admins"] as const,
  lists: () => [...adminKeys.all, "list"] as const,
  list: (page: number, perPage: number, search?: string) =>
    [...adminKeys.lists(), { page, perPage, search }] as const,
  details: () => [...adminKeys.all, "detail"] as const,
  detail: (id: string) => [...adminKeys.details(), id] as const,
};

export interface UseAdminsParams {
  page?: number;
  perPage?: number;
  search?: string;
  enabled?: boolean;
}

export function useAdmins(params: UseAdminsParams = {}) {
  const { page = 1, perPage = 10, search, enabled = true } = params;
  return useQuery<PaginatedResponse<Admin>>({
    queryKey: adminKeys.list(page, perPage, search),
    queryFn: () => fetchAdmins(page, perPage, search),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export interface UseAdminByIdParams {
  id: string;
  enabled?: boolean;
}

export function useAdminById(params: UseAdminByIdParams) {
  const { id, enabled = true } = params;
  return useQuery<Admin>({
    queryKey: adminKeys.detail(id),
    queryFn: () => fetchAdminById(id),
    enabled: enabled && !!id,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation<Admin, AxiosError<ApiErrorResponse>, CreateAdminDto>({
    mutationFn: createAdmin,
    onMutate: async (newAdmin) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.lists() });
      const previousAdmins = queryClient.getQueriesData({
        queryKey: adminKeys.lists(),
      });
      queryClient.setQueriesData<PaginatedResponse<Admin>>(
        { queryKey: adminKeys.lists() },
        (old) => {
          if (!old) return old;
          const optimistic: Admin = {
            id: String(Date.now()),
            name: newAdmin.name,
            email: newAdmin.email,
            role: newAdmin.role,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return {
            ...old,
            data: [optimistic, ...old.data],
            meta: { ...old.meta, total: old.meta.total + 1 },
          };
        },
      );
      return { previousAdmins };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      toast.success("Admin created successfully");
    },
    onError: (error, _, context: any) => {
      if (context?.previousAdmins) {
        context.previousAdmins.forEach(([k, d]: any) =>
          queryClient.setQueryData(k, d),
        );
      }
      toast.error(mapErrorMessage(error, "Failed to create admin"));
    },
  });
}

export interface UpdateAdminParams {
  id: string;
  data: Omit<UpdateAdminDto, "role">;
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();
  return useMutation<Admin, AxiosError<ApiErrorResponse>, UpdateAdminParams>({
    mutationFn: ({ id, data }) => updateAdmin(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.lists() });
      await queryClient.cancelQueries({ queryKey: adminKeys.detail(id) });
      const previousLists = queryClient.getQueriesData({
        queryKey: adminKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData(adminKeys.detail(id));
      queryClient.setQueriesData<PaginatedResponse<Admin>>(
        { queryKey: adminKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.map((a) =>
                  a.id === id
                    ? { ...a, ...data, updated_at: new Date().toISOString() }
                    : a,
                ),
              }
            : old,
      );
      queryClient.setQueryData<Admin>(adminKeys.detail(id), (old) =>
        old ? { ...old, ...data, updated_at: new Date().toISOString() } : old,
      );
      return { previousLists, previousDetail, id };
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(id) });
      toast.success("Admin updated successfully");
    },
    onError: (error, _, context: any) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([k, d]: any) =>
          queryClient.setQueryData(k, d),
        );
      }
      if (context?.previousDetail && context?.id) {
        queryClient.setQueryData(
          adminKeys.detail(context.id),
          context.previousDetail,
        );
      }
      toast.error(mapErrorMessage(error, "Failed to update admin"));
    },
  });
}

export interface UpdateAdminRoleParams {
  id: string;
  role: AdminRole;
}

export function useUpdateAdminRole() {
  const queryClient = useQueryClient();
  return useMutation<
    Admin,
    AxiosError<ApiErrorResponse>,
    UpdateAdminRoleParams
  >({
    mutationFn: ({ id, role }) => updateAdminRole(id, role),
    onMutate: async ({ id, role }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.lists() });
      await queryClient.cancelQueries({ queryKey: adminKeys.detail(id) });
      const previousLists = queryClient.getQueriesData({
        queryKey: adminKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData(adminKeys.detail(id));
      queryClient.setQueriesData<PaginatedResponse<Admin>>(
        { queryKey: adminKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.map((a) =>
                  a.id === id
                    ? { ...a, role, updated_at: new Date().toISOString() }
                    : a,
                ),
              }
            : old,
      );
      queryClient.setQueryData<Admin>(adminKeys.detail(id), (old) =>
        old ? { ...old, role, updated_at: new Date().toISOString() } : old,
      );
      return { previousLists, previousDetail, id };
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(id) });
      toast.success("Admin role updated successfully");
    },
    onError: (error, _, context: any) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([k, d]: any) =>
          queryClient.setQueryData(k, d),
        );
      }
      if (context?.previousDetail && context?.id) {
        queryClient.setQueryData(
          adminKeys.detail(context.id),
          context.previousDetail,
        );
      }
      toast.error(mapErrorMessage(error, "Failed to update admin role"));
    },
  });
}

export interface ToggleAdminStatusParams {
  id: string;
  isActive: boolean;
}

export function useToggleAdminStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    Admin,
    AxiosError<ApiErrorResponse>,
    ToggleAdminStatusParams
  >({
    mutationFn: ({ id, isActive }) =>
      isActive ? deactivateAdmin(id) : activateAdmin(id),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.lists() });
      await queryClient.cancelQueries({ queryKey: adminKeys.detail(id) });
      const previousLists = queryClient.getQueriesData({
        queryKey: adminKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData(adminKeys.detail(id));
      const newStatus = !isActive;
      queryClient.setQueriesData<PaginatedResponse<Admin>>(
        { queryKey: adminKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.map((a) =>
                  a.id === id
                    ? {
                        ...a,
                        is_active: newStatus,
                        updated_at: new Date().toISOString(),
                      }
                    : a,
                ),
              }
            : old,
      );
      queryClient.setQueryData<Admin>(adminKeys.detail(id), (old) =>
        old
          ? {
              ...old,
              is_active: newStatus,
              updated_at: new Date().toISOString(),
            }
          : old,
      );
      return { previousLists, previousDetail, id };
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      toast.success(
        isActive
          ? "Admin deactivated successfully"
          : "Admin activated successfully",
      );
    },
    onError: (error, _, context: any) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([k, d]: any) =>
          queryClient.setQueryData(k, d),
        );
      }
      if (context?.previousDetail && context?.id) {
        queryClient.setQueryData(
          adminKeys.detail(context.id),
          context.previousDetail,
        );
      }
      toast.error(mapErrorMessage(error, "Failed to update admin status"));
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<ApiErrorResponse>, string>({
    mutationFn: deleteAdmin,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.lists() });
      await queryClient.cancelQueries({ queryKey: adminKeys.detail(id) });
      const previousLists = queryClient.getQueriesData({
        queryKey: adminKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData(adminKeys.detail(id));
      queryClient.setQueriesData<PaginatedResponse<Admin>>(
        { queryKey: adminKeys.lists() },
        (old) =>
          old
            ? {
                ...old,
                data: old.data.filter((a) => a.id !== id),
                meta: { ...old.meta, total: old.meta.total - 1 },
              }
            : old,
      );
      queryClient.removeQueries({ queryKey: adminKeys.detail(id) });
      return { previousLists, previousDetail, id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      toast.success("Admin deleted successfully");
    },
    onError: (error, _, context: any) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([k, d]: any) =>
          queryClient.setQueryData(k, d),
        );
      }
      if (context?.previousDetail && context?.id) {
        queryClient.setQueryData(
          adminKeys.detail(context.id),
          context.previousDetail,
        );
      }
      toast.error(mapErrorMessage(error, "Failed to delete admin"));
    },
  });
}

export interface ScheduleAdminDeletionParams {
  id: string;
  reason?: string;
}

export function useScheduleAdminDeletion() {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    AxiosError<ApiErrorResponse>,
    ScheduleAdminDeletionParams
  >({
    mutationFn: ({ id, reason }) => scheduleAdminDeletion(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast.success("Admin deletion scheduled successfully");
    },
    onError: (error) => {
      toast.error(mapErrorMessage(error, "Failed to schedule admin deletion"));
    },
  });
}

export function useRestoreAdminDeletion() {
  const queryClient = useQueryClient();
  return useMutation<Admin, AxiosError<ApiErrorResponse>, string>({
    mutationFn: restoreAdminDeletion,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast.success("Admin restored successfully");
    },
    onError: (error) => {
      toast.error(mapErrorMessage(error, "Failed to restore admin"));
    },
  });
}
