import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/src/common/services/stats-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useStatsDashboard(from?: string, to?: string) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['stats-dashboard', tenantId, from, to],
    queryFn: () => statsService.getDashboard(from, to),
    enabled: !!tenantId,
  });
}
