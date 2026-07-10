"use client";

import { useQuery } from "@tanstack/react-query";
import { portalAttendanceService } from "@/src/modules/portal/infrastructure/portal-attendance-service";

export function usePortalChannels() {
  return useQuery({
    queryKey: ["portal", "attendance", "channels"],
    queryFn: () => portalAttendanceService.getChannels(),
    refetchInterval: 60_000, // heartbeat-driven, matches sistema.heartbeat cadence in master doc §5.6
  });
}
