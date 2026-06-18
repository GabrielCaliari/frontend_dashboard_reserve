"use client";
import { useQuery } from "@tanstack/react-query";

import { notificationKeys } from "./notification-query-keys";

import { apiClient } from "@/src/infraestructure/axios/api";

const STALE_TIME = 30_000;
const REFETCH_INTERVAL = 60_000;

async function fetchUnreadCount(tenantId: string): Promise<number> {
  const res = await apiClient.get("/notifications/tenant/me/unread-count", { headers: { "x-tenant-id": tenantId } });
  return res.data?.count ?? 0;
}

export function useUnreadCount(tenantId: string | null) {
  const { data } = useQuery({
    queryKey: notificationKeys.unreadCount(tenantId),
    queryFn: () => fetchUnreadCount(tenantId as string),
    enabled: Boolean(tenantId),
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });

  return data ?? 0;
}
