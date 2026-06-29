import api from "@/src/infraestructure/axios/api";
import type {
  OverviewResponse,
  PeriodComparisonQuery,
  PeriodComparisonResponse,
} from "@/src/modules/portal/domain/portal-stats";

export const portalStatsService = {
  async getComparativo(query: PeriodComparisonQuery): Promise<PeriodComparisonResponse> {
    const response = await api.get<PeriodComparisonResponse>("/portal/stats/comparativo", {
      params: {
        metric_keys: query.metric_keys.join(","),
        period: query.period,
        from: query.from,
        to: query.to,
      },
    });
    return response.data;
  },

  async getOverview(): Promise<OverviewResponse> {
    const response = await api.get<OverviewResponse>("/portal/overview");
    return response.data;
  },
};
