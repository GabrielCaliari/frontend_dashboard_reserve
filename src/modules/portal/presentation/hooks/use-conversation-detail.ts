"use client";

import { useQuery } from "@tanstack/react-query";
import { portalAttendanceService } from "@/src/modules/portal/infrastructure/portal-attendance-service";

export function useConversationDetail(id: string) {
  return useQuery({
    queryKey: ["portal", "attendance", "conversation", id],
    queryFn: () => portalAttendanceService.getConversationDetail(id),
    enabled: Boolean(id),
  });
}
