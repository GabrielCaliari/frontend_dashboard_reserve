import api from "../../config/api";

export default async function updateCopyEmailByCampaignBatchIdService(campaignBatchId: string, data: any) {
    try {
        const response = await api.put(`/mailer/batches/${campaignBatchId}/copy`, data);
        return response.data;
    } catch (error) {
        // TODO: Adicionar mensagem de erro para tratamento
        return {
            error: true,
            message: 'Erro ao atualizar o email do disparo.',
        };
    }
}


