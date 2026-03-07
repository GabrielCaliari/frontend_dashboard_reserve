import { apiClient } from '@/src/common/config/api';
import type { LeadListResponse } from '@/src/common/@types/@lead';

interface ListAllCollectionLeadsParams {
  page?: number;
  limit?: number;
}

export async function listAllCollectionLeadsService(
  params: ListAllCollectionLeadsParams = {}
): Promise<LeadListResponse> {
  const { page = 1, limit = 30 } = params;
  const response = await apiClient.get<LeadListResponse>('/leads/collections/leads', {
    params: { page, limit },
  });
  return response.data;
}
