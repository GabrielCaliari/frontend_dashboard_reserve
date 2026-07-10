"use client";

import { useQuery } from "@tanstack/react-query";
import { portalAttendanceService } from "@/src/modules/portal/infrastructure/portal-attendance-service";

export function useAttendanceFunnel() {
  return useQuery({
    queryKey: ["portal", "attendance", "funnel"],
    queryFn: () => portalAttendanceService.getFunnel(),
  });
}
