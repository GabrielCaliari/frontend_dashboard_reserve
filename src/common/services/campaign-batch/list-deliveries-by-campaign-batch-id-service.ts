import apiEmail from "../../config/api-email";

export default async function listDeliveriesByCampaignBatchIdService(campaignBatchId: string) {
    try {
        const response = await apiEmail.get(`/campaign-batch/deliveries/${campaignBatchId}`);
        return response.data;
    } catch (error) {
        // TODO: Adicionar mensagem de erro para tratamento
        return {
            error: true,
            message: 'Erro ao listar as entregas do disparo.',
        };
    }
}


