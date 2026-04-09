import api from "../config/api";

export const brandAnalyticsDetailService = async (
  id: number,
  token: string,
  session: string,
) => {
  try {
    const response = await api.get(`/brand-analysis/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "session-id": session,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Erro os relatórios de análise de marca:", error);
    throw error;
  }
};
