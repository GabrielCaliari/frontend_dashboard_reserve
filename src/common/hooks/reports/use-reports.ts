/**
 * React Query Hooks for Analytics Reports
 * Only accessible by super_admin users.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportService } from "@/src/common/services/report-service";
import type {
  Report,
  CreateReportDto,
  UpdateReportDto,
  ReportsListResponse,
} from "@/src/common/@types/@report";
import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { mapErrorMessage } from "@/src/common/utils/error-message-mapper";

export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  list: (page: number, limit: number) =>
    [...reportKeys.lists(), { page, limit }] as const,
};

export interface UseReportsParams {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export function useReports(params: UseReportsParams = {}) {
  const { page = 1, limit = 20, enabled = true } = params;
  return useQuery<ReportsListResponse>({
    queryKey: reportKeys.list(page, limit),
    queryFn: () => reportService.list(page, limit),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation<Report, AxiosError, CreateReportDto>({
    mutationFn: reportService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      toast.success("Report created successfully");
    },
    onError: (error) => {
      toast.error(mapErrorMessage(error, "Failed to create report"));
    },
  });
}

export interface UpdateReportParams {
  id: string;
  data: UpdateReportDto;
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation<Report, AxiosError, UpdateReportParams>({
    mutationFn: ({ id, data }) => reportService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      toast.success("Report updated successfully");
    },
    onError: (error) => {
      toast.error(mapErrorMessage(error, "Failed to update report"));
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, string>({
    mutationFn: reportService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      toast.success("Report deleted successfully");
    },
    onError: (error) => {
      toast.error(mapErrorMessage(error, "Failed to delete report"));
    },
  });
}
