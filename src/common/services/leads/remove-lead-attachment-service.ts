import { apiClient } from "@/src/infraestructure/axios/api";

export async function removeLeadAttachmentService(
  leadId: string,
  attachmentId: number,
): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(
    `/leads/${leadId}/attachments/${attachmentId}`,
  );
  return response.data;
}
