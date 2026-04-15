"use server";

import { removeLeadAttachmentService } from "@/src/common/services/leads/remove-lead-attachment-service";

export async function removeLeadAttachmentAction(
  leadId: string,
  attachmentId: number,
): Promise<{ success: boolean }> {
  try {
    return await removeLeadAttachmentService(leadId, attachmentId);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to remove attachment",
    );
  }
}
