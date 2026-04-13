import api from "../../infraestructure/axios/api";

export const createBrandAnalytics = async (
  data: {
    brand: string;
    niche: string;
    description: string;
  },
  token: string,
  session: string,
) => {
  try {
    const response = await api.post(
      "/brand-analysis",
      {
        ...data,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "session-id": session,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Erro os relatórios de análise de marca:", error);
    throw error;
  }
};
