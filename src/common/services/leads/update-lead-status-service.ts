import { apiClient } from '@/src/common/config/api';
import type { UpdateLeadStatusDto, LeadDetailResponse } from '@/src/common/@types/@lead';

export async function updateLeadStatusService(
  id: number,
  data: UpdateLeadStatusDto
): Promise<LeadDetailResponse> {
  const response = await apiClient.put<LeadDetailResponse>(
    `/leads/${id}/status`,
    data
  );
  return response.data;
}
