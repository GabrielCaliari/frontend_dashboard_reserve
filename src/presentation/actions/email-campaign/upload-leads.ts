"use server";

import { uploadLeadsService } from "@/src/common/services/email-campaign/upload-leads-service";

export async function uploadLeads(campaignId: string, file: File) {
  return await uploadLeadsService(campaignId, file);
}
