"use server";

import { uploadLeadsService } from "../../services/email-campaign/upload-leads-service";

export async function uploadLeads(campaignId: string, file: File) {
  return await uploadLeadsService(campaignId, file);
}
