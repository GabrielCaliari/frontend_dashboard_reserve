"use client";

import { useQuery } from "@tanstack/react-query";
import { portalActivityService } from "@/src/modules/portal/infrastructure/portal-activity-service";

export function useActivityFeed(limit?: number) {
  return useQuery({
    queryKey: ["portal", "activity", limit ?? "all"],
    queryFn: () => portalActivityService.getFeed(limit),
  });
}
