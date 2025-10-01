import apiEmail from "../../config/api-email";

export default async function listBatchesByEmailCampaignService(emailCampaignId: string) {
    try {
        const response = await apiEmail.get(`/email-campaign/batches/${emailCampaignId}`);
        return response.data;
    } catch (err: any) {
        // TODO: Adicionar mensagem de erro para tratamento
        return {
            error: true,
            message: 'Erro ao listar os disparos da campanha de e-mail.',
        };
    }
}

