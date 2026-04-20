"use server";

import { listLeadAttachmentsService } from "@/src/modules/leads/infrastructure/adapters";
import type { LeadAttachment } from "@/src/shared/domain/types/@lead";

export async function listLeadAttachmentsAction(
  leadId: string,
): Promise<{ data: LeadAttachment[] }> {
  try {
    return await listLeadAttachmentsService(leadId);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to list attachments",
    );
  }
}
