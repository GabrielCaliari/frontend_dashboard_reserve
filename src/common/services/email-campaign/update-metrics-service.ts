import api from "@/src/infraestructure/axios/api";

interface IUpdateMetricsResponse {
  error?: boolean;
  message?: string;
  data?: any;
}

export async function updateMetricsService(
  campaignId: string,
): Promise<IUpdateMetricsResponse> {
  try {
    const url = `/mailer/campaigns/${campaignId}/metrics`;
    const resp = await api.put(url);
    return resp.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Erro ao atualizar métricas";
    return { error: true, message };
  }
}
