import { ICreateEmailCampaign } from "@/src/shared/domain/types/@email-campaign";
import api from "../../../infraestructure/axios/api";
import { errorTypes } from "../../../infraestructure/axios/error-types";

export const createEmailCampaignService = async (
  data: ICreateEmailCampaign,
) => {
  try {
    const response = await api.post("/mailer/campaigns", data);

    return {
      id: response.data.id,
    };
  } catch (err: any) {
    if (err.response && err.response.data.code) {
      let message = "";

      switch (err.response.data.code) {
        case errorTypes._400.smtp_server_not_found:
          message = "Nenhum servidor SMTP encontrado.";
          break;
        default:
          message = "Erro ao criar campanha.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao criar campanha.",
    };
  }
};
