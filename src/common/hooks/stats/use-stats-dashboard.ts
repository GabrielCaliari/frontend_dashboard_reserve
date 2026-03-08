import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/src/common/services/stats-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import type {
  StatsDashboardQuery,
  StatsTimeseriesQuery,
} from '@/src/common/@types/@stats';

export function useStatsDashboard(query: StatsDashboardQuery = {}) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['stats-dashboard', 'tenant-current', tenantId, query.from, query.to],
    queryFn: () => statsService.getDashboard(query),
    enabled: !!tenantId,
  });
}

export function useStatsTenantDashboard(
  tenantId: string | null,
  query: StatsDashboardQuery = {},
) {
  return useQuery({
    queryKey: ['stats-dashboard', 'tenant-specific', tenantId, query.from, query.to],
    queryFn: () => statsService.getTenantDashboard(tenantId!, query),
    enabled: !!tenantId,
  });
}

export function useStatsGlobalDashboard(query: StatsDashboardQuery = {}) {
  return useQuery({
    queryKey: ['stats-dashboard', 'global', query.from, query.to],
    queryFn: () => statsService.getGlobalDashboard(query),
  });
}

export function useStatsTimeseries(query: StatsTimeseriesQuery = {}) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: [
      'stats-timeseries',
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

export function useStatsModule(moduleKey: string | null) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['stats-module', tenantId, moduleKey],
    queryFn: () => statsService.getModuleStats(moduleKey!),
    enabled: !!tenantId && !!moduleKey,
  });
}
