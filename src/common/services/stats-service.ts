import api from '@/src/common/config/api';
import type {
  DashboardResponse,
  StatsIntegration,
  AvailableIntegration,
  CreateStatsIntegrationDto,
  UpdateStatsIntegrationDto,
} from '@/src/common/@types/@stats';

export const statsService = {
  // ── Dashboard ─────────────────────────────────

  async getDashboard(from?: string, to?: string): Promise<DashboardResponse> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get<DashboardResponse>('/stats/dashboard', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  async getAvailableIntegrations(): Promise<AvailableIntegration[]> {
    const response = await api.get<AvailableIntegration[]>('/stats/available-integrations');
    return response.data;
  },

  // ── Integrations CRUD ─────────────────────────

  async listIntegrations(): Promise<StatsIntegration[]> {
    const response = await api.get<StatsIntegration[]>('/stats/integrations');
    return response.data;
  },

  async getProviders(): Promise<AvailableIntegration[]> {
    const response = await api.get<AvailableIntegration[]>('/stats/integrations/providers');
    return response.data;
  },

  async getIntegration(id: string): Promise<StatsIntegration> {
    const response = await api.get<StatsIntegration>(`/stats/integrations/${id}`);
    return response.data;
  },

  async createIntegration(data: CreateStatsIntegrationDto): Promise<StatsIntegration> {
    const response = await api.post<StatsIntegration>('/stats/integrations', data);
    return response.data;
  },

  async updateIntegration(id: string, data: UpdateStatsIntegrationDto): Promise<StatsIntegration> {
    const response = await api.patch<StatsIntegration>(`/stats/integrations/${id}`, data);
    return response.data;
  },

  async deleteIntegration(id: string): Promise<void> {
    await api.delete(`/stats/integrations/${id}`);
  },
};
