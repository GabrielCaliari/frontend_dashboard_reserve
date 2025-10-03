import apiEmail from "@/src/common/config/api-email"

interface IUpdateMetricsResponse {
  error?: boolean
  message?: string
  data?: any
}

export async function updateMetricsService(campaignId: string): Promise<IUpdateMetricsResponse> {
  try {
    const url = `/email-campaign/update-metrics/${campaignId}`
    const resp = await apiEmail.put(url)
    return resp.data
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.message || 'Erro ao atualizar métricas'
    return { error: true, message }
  }
}
