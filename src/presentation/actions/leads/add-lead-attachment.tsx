"use server";

import { addLeadAttachmentService } from "@/src/modules/leads/infrastructure/adapters";
import type {
  LeadAttachment,
  AddAttachmentDto,
} from "@/src/shared/domain/types/@lead";

export async function addLeadAttachmentAction(
  leadId: string,
  data: AddAttachmentDto,
): Promise<LeadAttachment> {
  try {
    return await addLeadAttachmentService(leadId, data);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to add attachment",
    );
  }
}
