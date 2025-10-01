import apiEmail from "../../config/api-email"

export default async function listEmailByCampaignBatchIdService(campaignBatchId: string) {
    try {
        const response = await apiEmail.get(`/campaign-batch/email/${campaignBatchId}`)
        return response.data
    } catch (error) {
        // TODO: Adicionar mensagem de erro para tratamento
        return {
            error: true,
            message: 'Erro ao listar os emails do disparo.',
        }
    }
}


