import api from "@/src/infraestructure/axios/api";
import type {
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
};
