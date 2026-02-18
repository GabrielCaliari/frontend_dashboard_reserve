'use server';

import { updateLeadStatusService } from '@/src/common/services/leads/update-lead-status-service';
import type { UpdateLeadStatusDto, LeadDetailResponse } from '@/src/common/@types/@lead';

export async function updateLeadStatusAction(
  id: number,
  data: UpdateLeadStatusDto
): Promise<LeadDetailResponse> {
  try {
    return await updateLeadStatusService(id, data);
  } catch (error: any) {
    console.error('Error updating lead status:', error);
    throw new Error(
      error?.response?.data?.message || 'Failed to update lead status'
    );
  }
}
