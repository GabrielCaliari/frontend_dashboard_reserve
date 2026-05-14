"use server";

import { removeLeadAttachmentService } from "@/src/modules/leads/infrastructure/adapters";

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
