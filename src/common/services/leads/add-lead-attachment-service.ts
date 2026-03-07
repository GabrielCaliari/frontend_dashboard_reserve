import { apiClient } from '@/src/common/config/api';
import type { LeadAttachment, AddAttachmentDto } from '@/src/common/@types/@lead';

export async function addLeadAttachmentService(
  leadId: string,
  data: AddAttachmentDto
): Promise<LeadAttachment> {
  const response = await apiClient.post<LeadAttachment>(`/leads/${leadId}/attachments`, data);
  return response.data;
}
