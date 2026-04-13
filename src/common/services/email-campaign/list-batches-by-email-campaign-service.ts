import api from "../../../infraestructure/axios/api";

export default async function listBatchesByEmailCampaignService(
  emailCampaignId: string,
) {
  try {
    const response = await api.get(
      `/mailer/campaigns/${emailCampaignId}/batches`,
    );
    return response.data;
  } catch (err: any) {
    // TODO: Adicionar mensagem de erro para tratamento
    return {
      error: true,
      message: "Erro ao listar os disparos da campanha de e-mail.",
    };
  }
}
