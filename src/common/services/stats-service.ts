import api from "@/src/infraestructure/axios/api";
import type {
  DashboardResponse,
  StatsIntegration,
  AvailableIntegration,
  CreateStatsIntegrationDto,
  UpdateStatsIntegrationDto,
  StatsDashboardQuery,
  StatsTimeseriesQuery,
  StatsTimeseriesResponse,
  StatsModuleResponse,
} from "@/src/shared/domain/types/@stats";

function buildDashboardParams(query: StatsDashboardQuery = {}) {
  const params: Record<string, string> = {};

  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;

  return Object.keys(params).length > 0 ? params : undefined;
}

export const statsService = {
  // ── Dashboard ─────────────────────────────────

  async getDashboard(
    query: StatsDashboardQuery = {},
  ): Promise<DashboardResponse> {
    const response = await api.get<DashboardResponse>("/stats/dashboard", {
      params: buildDashboardParams(query),
    });
    return response.data;
  },

  async getTenantDashboard(
    tenantId: string,
    query: StatsDashboardQuery = {},
  ): Promise<DashboardResponse> {
    const response = await api.get<DashboardResponse>(
      `/stats/dashboard/tenants/${tenantId}`,
      {
        params: buildDashboardParams(query),
        skipTenantHeader: true,
      } as never,
    );
    return response.data;
  },

  async getGlobalDashboard(
    query: StatsDashboardQuery = {},
  ): Promise<DashboardResponse> {
    const response = await api.get<DashboardResponse>(
      "/stats/dashboard/global",
      {
        params: buildDashboardParams(query),
        skipTenantHeader: true,
      } as never,
    );
    return response.data;
  },

  async getTimeseries(
    query: StatsTimeseriesQuery = {},
  ): Promise<StatsTimeseriesResponse> {
    const params: Record<string, string> = {};

    if (query.from) params.from = query.from;
    if (query.to) params.to = query.to;
    if (query.granularity) params.granularity = query.granularity;
    if (query.module) params.module = query.module;

    const response = await api.get<StatsTimeseriesResponse>(
      "/stats/timeseries",
      {
        params: Object.keys(params).length > 0 ? params : undefined,
      },
    );
    return response.data;
  },

  async getModuleStats(moduleKey: string): Promise<StatsModuleResponse> {
    const response = await api.get<StatsModuleResponse>(
      `/stats/module/${moduleKey}`,
    );
    return response.data;
  },

  async getAvailableIntegrations(): Promise<AvailableIntegration[]> {
    const response = await api.get<AvailableIntegration[]>(
      "/stats/available-integrations",
    );
    return response.data;
  },

  // ── Integrations CRUD ─────────────────────────

  async listIntegrations(): Promise<StatsIntegration[]> {
    const response = await api.get<StatsIntegration[]>("/stats/integrations");
    return response.data;
  },

  async getProviders(): Promise<AvailableIntegration[]> {
    const response = await api.get<AvailableIntegration[]>(
      "/stats/available-integrations",
      {
        skipTenantHeader: true,
      } as never,
    );
    return response.data;
  },

  async getIntegration(id: string): Promise<StatsIntegration> {
    const response = await api.get<StatsIntegration>(
      `/stats/integrations/${id}`,
    );
    return response.data;
  },

  async createIntegration(
    data: CreateStatsIntegrationDto,
  ): Promise<StatsIntegration> {
    const response = await api.post<StatsIntegration>(
      "/stats/integrations",
      data,
    );
    return response.data;
  },

  async updateIntegration(
    id: string,
    data: UpdateStatsIntegrationDto,
  ): Promise<StatsIntegration> {
    const response = await api.patch<StatsIntegration>(
      `/stats/integrations/${id}`,
      data,
    );
    return response.data;
  },

  async deleteIntegration(id: string): Promise<void> {
    await api.delete(`/stats/integrations/${id}`);
  },
};
