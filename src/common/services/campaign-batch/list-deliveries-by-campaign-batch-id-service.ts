import api from "../../../infraestructure/axios/api";

export default async function listDeliveriesByCampaignBatchIdService(
  campaignBatchId: string,
) {
  try {
    const response = await api.get(
      `/mailer/batches/${campaignBatchId}/deliveries`,
    );
    return response.data;
  } catch (error) {
    // TODO: Adicionar mensagem de erro para tratamento
    return {
      error: true,
      message: "Erro ao listar as entregas do disparo.",
    };
  }
}
