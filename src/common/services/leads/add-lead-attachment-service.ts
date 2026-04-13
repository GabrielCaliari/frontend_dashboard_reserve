import { apiClient } from "@/src/infraestructure/axios/api";
import type {
  LeadAttachment,
  AddAttachmentDto,
} from "@/src/shared/domain/types/@lead";

export async function addLeadAttachmentService(
  leadId: string,
  data: AddAttachmentDto,
): Promise<LeadAttachment> {
  const response = await apiClient.post<LeadAttachment>(
    `/leads/${leadId}/attachments`,
    data,
  );
  return response.data;
}
