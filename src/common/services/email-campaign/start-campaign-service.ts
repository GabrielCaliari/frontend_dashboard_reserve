import apiEmail from "@/src/common/config/api-email"

interface IStartCampaignResponse {
  error?: boolean
  message?: string
  data?: any
}

export async function startCampaignService(campaignId: string): Promise<IStartCampaignResponse> {
  try {
    const url = `/email-campaign/start-campaign/${campaignId}`
    const resp = await apiEmail.post(url)
    return resp.data
  } catch (err: any) {
    // Try to extract message from axios error
    const message = err?.response?.data?.message || err?.message || 'Erro ao iniciar campanha'
    return { error: true, message }
  }
}
