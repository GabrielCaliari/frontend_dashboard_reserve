"use server";

import { updateCampaignBatchSizeService } from "@/src/common/services/email-campaign/update-campaign-batch-size-service";

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
