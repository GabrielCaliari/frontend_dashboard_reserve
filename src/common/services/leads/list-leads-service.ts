import { apiClient } from "@/src/common/config/api";
import type { LeadListResponse } from "@/src/common/@types/@lead";

interface ListLeadsParams {
  page?: number;
  limit?: number;
  status?: number;
  origin?: number;
}

export async function listLeadsService(
  params: ListLeadsParams = {},
): Promise<LeadListResponse> {
  const { page = 1, limit = 30, status, origin } = params;

  const queryParams: Record<string, any> = { page, limit };
  if (status !== undefined) queryParams.status = status;
  if (origin !== undefined) queryParams.origin = origin;

  const response = await apiClient.get<LeadListResponse>("/leads", {
    params: queryParams,
  });

  return response.data;
}
