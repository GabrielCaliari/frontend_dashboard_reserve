import api from "../../config/api";
import { errorTypes } from "../../config/error-types";

export async function updateCampaignBatchSizeService(campaignId: string, batchSize: number) {
    try {
        const response = await api.put(`/mailer/campaigns/${campaignId}/batch-size`, { campaign_batch_size: batchSize })
        return response.data
    } catch (err: any) {
        if (err.response && err.response.data.code) {
            let message = '';
            
            switch (err.response.data.code) {
                case errorTypes._404.email_campaign_not_found:
                    message = 'Campanha de e-mail não encontrada.';
                    break;
                default:
                    message = 'Erro ao atualizar o tamanho do lote da campanha de e-mail.';
                    break;
            }

            return {
                error: true,
                message: message,
            };
        }

        return {
            error: true,
            message: 'Erro ao atualizar o tamanho do lote da campanha de e-mail.',
        };
    }
}