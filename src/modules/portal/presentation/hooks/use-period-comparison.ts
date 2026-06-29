"use client";

import { useQuery } from "@tanstack/react-query";
import { portalStatsService } from "@/src/modules/portal/infrastructure/portal-stats-service";
import type { PeriodComparisonQuery } from "@/src/modules/portal/domain/portal-stats";

export function usePeriodComparison(query: PeriodComparisonQuery) {
  return useQuery({
    queryKey: ["portal", "stats", "comparativo", query],
    queryFn: () => portalStatsService.getComparativo(query),
  });
}
