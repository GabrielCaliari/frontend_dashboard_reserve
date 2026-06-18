"use client";
import { useQuery } from "@tanstack/react-query";

import { notificationKeys } from "./notification-query-keys";

import { apiClient } from "@/src/infraestructure/axios/api";

const STALE_TIME = 30_000;

interface TenantNotificationDetail {
  id: string;
  notificationId?: string;
  viewed: boolean;
  firstViewedAt?: string | null;
  Notification?: Record<string, unknown>;
  [key: string]: unknown;
}

async function fetchTenantNotification(tenantId: string, id: string): Promise<TenantNotificationDetail> {
  const res = await apiClient.get(`/notifications/tenant/${id}`, { headers: { "x-tenant-id": tenantId } });
  return res.data as TenantNotificationDetail;
}

export function useTenantNotification(tenantId: string | null, id: string | null) {
  const query = useQuery({
    queryKey: notificationKeys.detail(tenantId, id ?? ""),
    queryFn: () => fetchTenantNotification(tenantId as string, id as string),
    enabled: Boolean(tenantId && id),
    staleTime: STALE_TIME,
  });

  return {
    notification: query.data ?? null,
    loading: query.isPending && Boolean(tenantId && id),
    error: query.error,
  };
}
