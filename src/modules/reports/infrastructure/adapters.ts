/**
 * Reports — Infrastructure Adapters
 *
 * Ports `src/common/services/report-service.ts` (Analytics Reports, super_admin
 * only) to `src/modules/reports/infrastructure/`. Function names and the
 * `reportService` object shape are preserved unchanged so `use-reports.ts`
 * (now under `src/shared/hooks/reports/`) only needs its import path updated.
 *
 * Generated typed client inspected: `src/infraestructure/server/services/
 * analytics-reports/index.ts` (backend module "Analytics Reports", Task 24
 * codegen). NOT delegated to here because:
 *   - Every generated response type (`CreateResponse`, `FindAllResponse`,
 *     `UpdateResponse`, `DeleteResponse`) is `unknown` — delegating would lose
 *     the strong typing (`Report`, `ReportsListResponse`) this module returns
 *     today, requiring an unchecked cast at every call site with no
 *     behavioral gain.
 *   - Method name mismatch: generated exposes `findAll`, this module exposes
 *     `list`.
 *   - Signature mismatch: `list(page = 1, limit = 20)` takes positional args
 *     with defaults; generated `findAll(params: FindAllParams = {})` takes an
 *     object with no defaults.
 * Request paths do line up: the generated client calls `/api/reports`, and
 * `normalizeApiRequestUrl` (see `src/infraestructure/axios/normalize-api-
 * request-url.ts`) strips the `/api` prefix whenever `baseURL` already ends
 * in `/api` (always true per `buildApiBaseUrl`), so the effective request
 * path matches this module's `/reports` verbatim. Only the typing/signature
 * mismatches above drove the verbatim decision.
 */

import { apiClient } from "@/src/infraestructure/axios/api";
import type {
  Report,
  CreateReportDto,
  UpdateReportDto,
  ReportsListResponse,
} from "@/src/shared/domain/types/@report";

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
