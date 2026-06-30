"use client";

import { useQuery } from "@tanstack/react-query";
import { portalLeadsService } from "@/src/modules/portal/infrastructure/portal-leads-service";
import type { LeadsCamada1Query } from "@/src/modules/portal/domain/portal-leads";

export function usePortalLeadsCamada1(query: LeadsCamada1Query) {
  return useQuery({
    queryKey: ["portal", "leads", "camada-1", query],
    queryFn: () => portalLeadsService.getCamada1(query),
  });
}
