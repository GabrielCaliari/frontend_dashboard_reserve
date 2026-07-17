"use client";

import { useQuery } from "@tanstack/react-query";
import { portalReportsService } from "@/src/modules/portal/infrastructure/portal-reports-service";

export function usePortalReports() {
  return useQuery({ queryKey: ["portal", "reports"], queryFn: () => portalReportsService.list() });
}

export function usePortalReport(id: string) {
  return useQuery({
    queryKey: ["portal", "reports", id],
    queryFn: () => portalReportsService.getById(id),
    enabled: Boolean(id),
  });
}
