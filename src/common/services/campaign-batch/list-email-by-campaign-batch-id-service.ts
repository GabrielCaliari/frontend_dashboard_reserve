import api from "../../config/api"

export default async function listEmailByCampaignBatchIdService(campaignBatchId: string) {
    try {
        const response = await api.get(`/mailer/batches/${campaignBatchId}/emails`)
        return response.data
    } catch (error) {
        // TODO: Adicionar mensagem de erro para tratamento
        return {
            error: true,
            message: 'Erro ao listar os emails do disparo.',
        }
    }
}


