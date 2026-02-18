'use server';

import { createCollectionService } from '@/src/common/services/leads/create-collection-service';
import type { CreateCollectionDto, CollectionDetailResponse } from '@/src/common/@types/@lead';

export async function createCollectionAction(
  data: CreateCollectionDto
): Promise<CollectionDetailResponse> {
  try {
    return await createCollectionService(data);
  } catch (error: any) {
    console.error('Error creating collection:', error);
    throw new Error(
      error?.response?.data?.message || 'Failed to create collection'
    );
  }
}
