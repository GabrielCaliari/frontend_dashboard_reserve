'use server'

import { createEmailCampaignService } from "../../services/email-campaign/create-email-campaign-service";

export async function createEmailCampaign(name: string) {
    const response = await createEmailCampaignService({ name });

    if (response?.error) {
        return response;
    }

    return {
        id: response.id,
    }
}
