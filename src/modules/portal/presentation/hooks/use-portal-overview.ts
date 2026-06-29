"use client";

import { useQuery } from "@tanstack/react-query";
import { portalStatsService } from "@/src/modules/portal/infrastructure/portal-stats-service";

export function usePortalOverview() {
  return useQuery({
    queryKey: ["portal", "overview"],
    queryFn: () => portalStatsService.getOverview(),
  });
}
