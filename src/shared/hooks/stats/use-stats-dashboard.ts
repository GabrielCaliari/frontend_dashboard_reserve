import { useQueries, useQuery } from "@tanstack/react-query";
import { statsService } from "@/src/modules/stats/infrastructure/adapters";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";
import type {
  StatsTimeseriesItem,
  StatsDashboardQuery,
  StatsTimeseriesQuery,
} from "@/src/shared/domain/types/@stats";

export function useStatsDashboard(query: StatsDashboardQuery = {}) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: [
      "stats-dashboard",
      "tenant-current",
      tenantId,
      query.from,
      query.to,
    ],
    queryFn: () => statsService.getDashboard(query),
    enabled: !!tenantId,
  });
}

export function useStatsTenantDashboard(
  tenantId: string | null,
  query: StatsDashboardQuery = {},
) {
  return useQuery({
    queryKey: [
      "stats-dashboard",
      "tenant-specific",
      tenantId,
      query.from,
      query.to,
    ],
    queryFn: () => statsService.getTenantDashboard(tenantId!, query),
    enabled: !!tenantId,
  });
}

export function useStatsGlobalDashboard(query: StatsDashboardQuery = {}) {
  return useQuery({
    queryKey: ["stats-dashboard", "global", query.from, query.to],
    queryFn: () => statsService.getGlobalDashboard(query),
  });
}

export function useStatsTimeseries(query: StatsTimeseriesQuery = {}) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: [
      "stats-timeseries",
      tenantId,
      query.module,
      query.granularity,
      query.from,
      query.to,
    ],
    queryFn: () => statsService.getTimeseries(query),
    enabled: !!tenantId,
  });
}

export function useStatsTimeseriesModules(
  modules: string[],
  query: StatsTimeseriesQuery = {},
) {
  const tenantId = useSelectedTenantId();

  return useQueries({
    queries: modules.map((moduleKey) => ({
      queryKey: [
        "stats-timeseries",
        tenantId,
        moduleKey,
        query.granularity,
        query.from,
        query.to,
      ],
      queryFn: () =>
        statsService.getTimeseries({
          ...query,
          module: moduleKey,
        }),
      enabled: !!tenantId && !!moduleKey,
    })),
    combine: (results) =>
      results.map((result, index) => ({
        moduleKey: modules[index],
        data: result.data,
        error: result.error,
        isLoading: result.isLoading,
        isError: result.isError,
        seriesItem: result.data?.series[0] as StatsTimeseriesItem | undefined,
      })),
  });
}

export function useStatsModule(moduleKey: string | null) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ["stats-module", tenantId, moduleKey],
    queryFn: () => statsService.getModuleStats(moduleKey!),
    enabled: !!tenantId && !!moduleKey,
  });
}
