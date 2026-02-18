import { apiClient } from '@/src/common/config/api';

export async function deleteCollectionService(id: number): Promise<void> {
  await apiClient.delete(`/leads/leads/collections/${id}`);
}
