import { ICreatePrimaryCopy } from "../../@types/@email-builder";
import apiEmail from "../../config/api-email";
import { errorTypes } from "../../config/error-types";

export default async function updateCampaignBatchEmailService(campaignBatchId: string, data: ICreatePrimaryCopy) {
    try {
        const response = await apiEmail.put(`/campaign-batch/email/${campaignBatchId}`, data);

        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data.code) {
            let message = '';

            switch (error.response.data.code) {
                case errorTypes._404.email_campaign_not_found:
                    message = 'Disparo não encontrado.';
                    break;
                default:
                    message = 'Erro ao atualizar email do disparo.';
                    break;
            }

            return {
                error: true,
                message: message,
            }
        }

        return {
            error: true,
            message: 'Erro ao atualizar email do disparo.',
        }
    }
}