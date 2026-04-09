/**
 * Report Service
 *
 * Service layer for analytics reports CRUD operations.
 * Only accessible by super_admin users.
 */

import { apiClient } from "@/src/common/config/api";
import type {
  Report,
  CreateReportDto,
  UpdateReportDto,
  ReportsListResponse,
} from "@/src/common/@types/@report";

export const reportService = {
  async list(
    page: number = 1,
    limit: number = 20,
  ): Promise<ReportsListResponse> {
    const response = await apiClient.get<ReportsListResponse>("/reports", {
      params: { page, limit },
    });
    return response.data;
  },

  async create(data: CreateReportDto): Promise<Report> {
    const response = await apiClient.post<Report>("/reports", data);
    return response.data;
  },

  async update(id: string, data: UpdateReportDto): Promise<Report> {
    const response = await apiClient.patch<Report>(`/reports/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/reports/${id}`);
  },
};
