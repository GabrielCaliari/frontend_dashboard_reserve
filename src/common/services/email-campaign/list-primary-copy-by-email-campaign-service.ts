import apiEmail from "../../config/api-email";
import { errorTypes } from "../../config/error-types";

export default async function listPrimaryCopyByEmailCampaignService(id: string) {
    try {
        const response = await apiEmail.get(`/email-campaign/primary-copy-variant/${id}`);
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data.code) {
            let message = '';

            switch (error.response.data.code) {
                case errorTypes._404.email_campaign_not_found:
                    message = 'Campanha não encontrada.';
                    break;
                case errorTypes._404.primary_copy_variant_not_found:
                    return null;
                    break;
                default:
                    message = 'Erro ao listar copy primária.';
                    break;
            }

            return {
                error: true,
                message: message,
            }
        }

        return {
            error: true,
            message: 'Erro ao listar copy primária.',
        }
    }
}

