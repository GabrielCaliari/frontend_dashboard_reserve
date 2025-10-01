import apiEmail from "../../config/api-email";

export default async function updateCopyEmailByCampaignBatchIdService(campaignBatchId: string, data: any) {
    try {
        const response = await apiEmail.get(`/campaign-batch/deliveries/${campaignBatchId}`);
        return response.data;
    } catch (error) {
        // TODO: Adicionar mensagem de erro para tratamento
        return {
            error: true,
            message: 'Erro ao atualizar o email do disparo.',
        };
    }
}


