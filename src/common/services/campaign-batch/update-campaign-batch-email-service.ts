import { ICreatePrimaryCopy } from "@/src/shared/domain/types/@email-builder";
import api from "../../config/api";
import { errorTypes } from "../../config/error-types";

export default async function updateCampaignBatchEmailService(
  campaignBatchId: string,
  data: ICreatePrimaryCopy,
) {
  try {
    const response = await api.put(
      `/mailer/batches/${campaignBatchId}/email`,
      data,
    );

    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data.code) {
      let message = "";

      switch (error.response.data.code) {
        case errorTypes._404.email_campaign_not_found:
          message = "Disparo não encontrado.";
          break;
        default:
          message = "Erro ao atualizar email do disparo.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao atualizar email do disparo.",
    };
  }
}
