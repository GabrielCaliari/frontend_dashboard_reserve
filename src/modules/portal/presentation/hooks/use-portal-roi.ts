"use client";

import { useQuery } from "@tanstack/react-query";
import { portalRoiService } from "@/src/modules/portal/infrastructure/portal-roi-service";
import type { RoiQuery } from "@/src/modules/portal/domain/portal-roi";

export function useRoiLevel1(query: RoiQuery) {
  return useQuery({ queryKey: ["portal", "roi", "level1", query], queryFn: () => portalRoiService.getLevel1(query) });
}

export function useRoiLevel2(query: RoiQuery, enabled: boolean) {
  return useQuery({
    queryKey: ["portal", "roi", "level2", query],
    queryFn: () => portalRoiService.getLevel2(query),
    enabled,
  });
}

export function useRoiLevel3(query: RoiQuery) {
  return useQuery({ queryKey: ["portal", "roi", "level3", query], queryFn: () => portalRoiService.getLevel3(query) });
}
