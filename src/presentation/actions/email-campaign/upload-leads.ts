"use server";

import { uploadLeadsService } from "@/src/modules/mailer/infrastructure/adapters";

export async function uploadLeads(campaignId: string, file: File) {
  return await uploadLeadsService(campaignId, file);
}
