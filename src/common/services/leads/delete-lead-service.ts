import { apiClient } from '@/src/common/config/api';

export async function deleteLeadService(id: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/leads/${id}`);
  return response.data;
}
