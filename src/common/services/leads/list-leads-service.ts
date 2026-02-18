import { apiClient } from '@/src/common/config/api';
import type { LeadListResponse } from '@/src/common/@types/@lead';

interface ListLeadsParams {
  page?: number;
  limit?: number;
}

export async function listLeadsService(
  params: ListLeadsParams = {}
): Promise<LeadListResponse> {
  const { page = 1, limit = 30 } = params;

  const response = await apiClient.get<LeadListResponse>('/leads', {
    params: { page, limit },
  });

  return response.data;
}
