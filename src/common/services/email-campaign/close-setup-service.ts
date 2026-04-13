import api from "../../../infraestructure/axios/api";

export const closeSetupService = async (campaignId: string) => {
  try {
    const response = await api.post(
      `/mailer/campaigns/${campaignId}/close-setup`,
    );

    return {
      id: response.data.id,
    };
  } catch (err: any) {
    if (err.response && err.response.data.code) {
      let message = "";

      switch (err.response.data.code) {
        default:
          message = "Erro ao fechar setup da campanha.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao fechar setup da campanha.",
    };
  }
};
