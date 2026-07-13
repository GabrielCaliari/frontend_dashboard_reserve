"use client";

import { useQuery } from "@tanstack/react-query";
import { portalInstagramService } from "@/src/modules/portal/infrastructure/portal-instagram-service";
import type { InstagramQuery } from "@/src/modules/portal/domain/portal-instagram";

export function usePortalInstagram(query: InstagramQuery) {
  return useQuery({
    queryKey: ["portal", "instagram", query],
    queryFn: () => portalInstagramService.getOverview(query),
  });
}
