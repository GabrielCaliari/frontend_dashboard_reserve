"use server";

import { updateEmailCampaignCopyVariantService } from "@/src/common/services/email-campaign/update-email-campaign-copy-variant-service";
import { ECopyVariationType } from "@/src/shared/domain/types/@email-campaign";

export async function updateEmailCampaignCopyVariant(
  campaignId: string,
  copyVariant: ECopyVariationType,
) {
  const response = await updateEmailCampaignCopyVariantService(
    campaignId,
    copyVariant,
  );

  if (response?.error) {
    return response;
  }

  return {
    id: response.id,
  };
}
