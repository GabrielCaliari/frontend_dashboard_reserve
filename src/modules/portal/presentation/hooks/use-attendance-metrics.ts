"use client";

import { useQuery } from "@tanstack/react-query";
import { portalAttendanceService } from "@/src/modules/portal/infrastructure/portal-attendance-service";

export function useAttendanceMetrics() {
  return useQuery({ queryKey: ["portal", "attendance", "metrics"], queryFn: () => portalAttendanceService.getMetrics() });
}
