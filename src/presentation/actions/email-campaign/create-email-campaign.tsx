"use server";

import { createEmailCampaignService } from "@/src/modules/mailer/infrastructure/adapters";

export async function createEmailCampaign(name: string) {
  const response = await createEmailCampaignService({ name });

  if (response?.error) {
    return response;
  }

  return {
    id: response.id,
  };
}
