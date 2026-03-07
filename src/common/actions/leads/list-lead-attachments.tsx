'use server';

import { listLeadAttachmentsService } from '@/src/common/services/leads/list-lead-attachments-service';
import type { LeadAttachment } from '@/src/common/@types/@lead';

export async function listLeadAttachmentsAction(leadId: string): Promise<{ data: LeadAttachment[] }> {
  try {
    return await listLeadAttachmentsService(leadId);
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to list attachments');
  }
}
