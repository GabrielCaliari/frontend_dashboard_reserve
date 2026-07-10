"use client";

import { useQuery } from "@tanstack/react-query";
import { portalLeadsService } from "@/src/modules/portal/infrastructure/portal-leads-service";
import type { LeadsCamada1Query } from "@/src/modules/portal/domain/portal-leads";

export function useLinkConversionRate(query: LeadsCamada1Query) {
  return useQuery({
    queryKey: ["portal", "leads", "link-conversion-rate", query],
    queryFn: () => portalLeadsService.getLinkConversionRates(query),
  });
}
