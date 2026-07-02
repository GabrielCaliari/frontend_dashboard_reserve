"use client";

import { useQuery } from "@tanstack/react-query";
import { portalTrafficService } from "@/src/modules/portal/infrastructure/portal-traffic-service";
import type { TrafficQuery } from "@/src/modules/portal/domain/portal-traffic";

export function usePortalTraffic(query: TrafficQuery) {
  return useQuery({
    queryKey: ["portal", "traffic", query],
    queryFn: () => portalTrafficService.getTraffic(query),
  });
}
