"use client";

import { useQuery } from "@tanstack/react-query";
import { portalAttendanceService } from "@/src/modules/portal/infrastructure/portal-attendance-service";
import type { ConversationFilters } from "@/src/modules/portal/domain/portal-attendance";

export function usePortalConversations(filters: ConversationFilters) {
  return useQuery({
    queryKey: ["portal", "attendance", "conversations", filters],
    queryFn: () => portalAttendanceService.getConversations(filters),
  });
}
