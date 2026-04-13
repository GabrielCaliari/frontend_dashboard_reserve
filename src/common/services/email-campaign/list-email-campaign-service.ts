import api from "../../../infraestructure/axios/api";
import { errorTypes } from "../../../infraestructure/axios/error-types";

export default async function listEmailCampaignService() {
  try {
    const response = await api.get("/mailer/campaigns");
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data.code) {
      let message = "";

      switch (err.response.data.code) {
        case errorTypes._500.get_all_email_campaign:
        default:
          message = "Houve um erro ao listar as campanhas de e-mail.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao listar as campanhas de e-mail.",
    };
  }
}
