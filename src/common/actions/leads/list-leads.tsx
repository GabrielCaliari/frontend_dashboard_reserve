'use server';

import { listLeadsService } from '@/src/common/services/leads/list-leads-service';
import type { LeadListResponse } from '@/src/common/@types/@lead';

interface ListLeadsParams {
  page?: number;
  limit?: number;
}

export async function listLeadsAction(
  params: ListLeadsParams = {}
): Promise<LeadListResponse> {
  try {
    return await listLeadsService(params);
  } catch (error: any) {
    console.error('Error listing leads:', error);
    throw new Error(error?.response?.data?.message || 'Failed to list leads');
  }
}
