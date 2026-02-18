'use server';

import { getLeadService } from '@/src/common/services/leads/get-lead-service';
import type { LeadDetailResponse } from '@/src/common/@types/@lead';

export async function getLeadAction(id: number): Promise<LeadDetailResponse> {
  try {
    return await getLeadService(id);
  } catch (error: any) {
    console.error('Error getting lead:', error);
    throw new Error(error?.response?.data?.message || 'Failed to get lead');
  }
}
