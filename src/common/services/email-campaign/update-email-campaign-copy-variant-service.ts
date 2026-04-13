import { ECopyVariationType } from "@/src/shared/domain/types/@email-campaign";
import api from "../../../infraestructure/axios/api";
import { errorTypes } from "../../../infraestructure/axios/error-types";

export const updateEmailCampaignCopyVariantService = async (
  campaignId: string,
  copyVariant: ECopyVariationType,
) => {
  try {
    const response = await api.put(
      `/mailer/campaigns/${campaignId}/copy-variant`,
      {
        copy_variation_type: +copyVariant,
      },
    );

    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data.code) {
      let message = "";

      switch (err.response.data.code) {
        case errorTypes._404.email_campaign_not_found:
          message = "Campanha de e-mail não encontrada.";
          break;
        default:
          message =
            "Erro ao atualizar a variante de cópia da campanha de e-mail.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao atualizar a variante de cópia da campanha de e-mail.",
    };
  }
};
