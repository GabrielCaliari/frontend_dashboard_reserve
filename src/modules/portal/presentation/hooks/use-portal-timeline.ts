"use client";

import { useQuery } from "@tanstack/react-query";
import { portalTimelineService } from "@/src/modules/portal/infrastructure/portal-timeline-service";

export function usePortalTimeline() {
  return useQuery({ queryKey: ["portal", "timeline"], queryFn: () => portalTimelineService.getTimeline() });
}
