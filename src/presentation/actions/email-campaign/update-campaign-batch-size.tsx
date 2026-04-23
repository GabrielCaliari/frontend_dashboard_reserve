"use server";

import { updateCampaignBatchSizeService } from "@/src/modules/mailer/infrastructure/adapters";

export async function updateCampaignBatchSize(
  campaignId: string,
  batchSize: number,
) {
  const response = await updateCampaignBatchSizeService(campaignId, batchSize);

  if (response?.error) {
    return response;
  }

  return {
    id: response.id,
  };
}
