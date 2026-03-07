'use server';

import { addLeadAttachmentService } from '@/src/common/services/leads/add-lead-attachment-service';
import type { LeadAttachment, AddAttachmentDto } from '@/src/common/@types/@lead';

export async function addLeadAttachmentAction(leadId: string, data: AddAttachmentDto): Promise<LeadAttachment> {
  try {
    return await addLeadAttachmentService(leadId, data);
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to add attachment');
  }
}
