/**
 * Adapter para o domínio `stats` (antigo `common/services/stats-service.ts`).
 *
 * NOTA (Task 25): o codegen (`src/infraestructure/server/services/stats-dashboard`
 * e `.../stats-integrations`) foi inspecionado antes de decidir esta implementação.
 * Optou-se por manter a implementação `apiClient` verbatim em vez de delegar para
 * os serviços gerados, pelas seguintes divergências estruturais e comportamentais
 * encontradas:
 *
 * 1. `skipTenantHeader` (flag custom lida por `injectAuthHeaders` em
 *    `infraestructure/axios/get-auth-headers.ts`) é usada aqui em
 *    `getTenantDashboard`, `getGlobalDashboard` e `getProviders` para suprimir o
 *    header `x-tenant-id` — necessário porque esses endpoints são cross-tenant ou
 *    identificam o tenant via path param. As funções geradas
 *    (`statsDashboardService.getDashboardByTenant/getGlobalDashboard`,
 *    `statsIntegrationsService.listProviders`) não expõem nenhum parâmetro de
 *    config do axios — apenas `params`/`body` — então não há como propagar essa
 *    flag delegando. Delegar quebraria o escopo do tenant nessas chamadas.
 * 2. `getProviders()` aqui bate deliberadamente em `/stats/available-integrations`
 *    (mesmo endpoint de `getAvailableIntegrations`, só que sem o header de
 *    tenant) — não em `/stats/integrations/providers`, que é o endpoint que
 *    `statsIntegrationsService.listProviders()` gerado chama. São endpoints
 *    diferentes; delegar mudaria o comportamento observável.
 * 3. Nomes de método divergem em quase todos os pontos: `getTenantDashboard` vs
 *    `getDashboardByTenant`, `getTimeseries` vs `getTimeSeries`, `getModuleStats`
 *    vs `getModuleMetrics`, `listIntegrations`/`getIntegration` vs `list`/`getById`,
 *    `createIntegration`/`updateIntegration`/`deleteIntegration` vs
 *    `create`/`update`/`delete`. Preservar a shape atual (exigência da Task 25)
 *    exigiria uma camada de renomeação de qualquer forma.
 * 4. Tipos de domínio (`@/src/shared/domain/types/@stats`) não batem 1:1 com os
 *    DTOs gerados: `MetricValueResponse.value` é `number | string` aqui contra
 *    `Record<string, unknown>` no DTO gerado; `AvailableIntegration.configSchema`
 *    é tipado como `Record<string, ConfigSchemaField>` aqui contra
 *    `Record<string, unknown>` no gerado.
 *
 * Dado o volume de divergências (comportamento de header por tenant, endpoints
 * diferentes para "providers", nomes de método e tipagem), a delegação para o
 * código gerado foi descartada. Todos os paths e a lógica de normalização abaixo
 * são idênticos ao `stats-service.ts` pré-migração.
 */
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
