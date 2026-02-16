import api from "../../config/api";
import { errorTypes } from "../../config/error-types";

export default async function listEmailCampaignByIdService(id: string) {
    try {
        const response = await api.get(`/mailer/campaigns/${id}`);
        return response.data;
    } catch (err: any) {
        if (err.response && err.response.data.code) {
            let message = '';

            switch (err.response.data.code) {
                case errorTypes._404.email_campaign_not_found:
                default:
                    message = 'Campanha de e-mail não encontrada.';
                    break;
            }

            return {
                error: true,
                message: message,
            };
        }

        return {
            error: true,
            message: 'Erro ao listar a campanha de e-mail.',
        };
    }
}

