"use client";

import { useQuery } from "@tanstack/react-query";
import { portalContentService } from "@/src/modules/portal/infrastructure/portal-content-service";

export function useContentCalendar(month: string) {
  return useQuery({
    queryKey: ["portal", "content", "calendar", month],
    queryFn: () => portalContentService.getCalendar(month),
  });
}
