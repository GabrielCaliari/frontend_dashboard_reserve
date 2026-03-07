'use server';

import { getCollectionService } from '@/src/common/services/leads/get-collection-service';
import type { CollectionDetailResponse } from '@/src/common/@types/@lead';

export async function getCollectionAction(id: number): Promise<CollectionDetailResponse> {
  try {
    return await getCollectionService(id);
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to get collection');
  }
}
