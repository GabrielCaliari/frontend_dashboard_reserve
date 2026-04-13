import { apiClient } from "@/src/infraestructure/axios/api";
import type { LeadAttachment } from "@/src/shared/domain/types/@lead";

export async function listLeadAttachmentsService(
  leadId: string,
): Promise<{ data: LeadAttachment[] }> {
  const response = await apiClient.get<{ data: LeadAttachment[] }>(
    `/leads/${leadId}/attachments`,
  );
  return response.data;
}
