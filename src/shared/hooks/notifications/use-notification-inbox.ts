"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationKeys } from "./notification-query-keys";

import { apiClient } from "@/src/infraestructure/axios/api";

const STALE_TIME = 30_000;

interface TenantNotificationReceipt {
  id: string;
  notificationId?: string;
  notification_id?: string;
  viewed: boolean;
  firstViewedAt?: string | null;
  first_viewed_at?: string | null;
  Notification?: { id: string; [key: string]: unknown };
  [key: string]: unknown;
}

function resolveNotificationId(item: TenantNotificationReceipt): string | null {
  return item.notificationId ?? item.notification_id ?? item.Notification?.id ?? item.id ?? null;
}

async function fetchInbox(tenantId: string, page: number, limit: number) {
  const res = await apiClient.get("/notifications/tenant", {
    params: { page, limit },
    headers: { "x-tenant-id": tenantId },
  });

  return {
    data: (res.data?.data ?? []) as TenantNotificationReceipt[],
    total: (res.data?.total ?? 0) as number,
  };
}

async function postView(tenantId: string, notificationId: string) {
  await apiClient.post(`/notifications/tenant/${notificationId}/view`, {}, { headers: { "x-tenant-id": tenantId } });
}

export function useNotificationInbox(tenantId: string | null, page = 1, limit = 20) {
  const queryClient = useQueryClient();
  const inboxKey = notificationKeys.inbox(tenantId, page, limit);

  const query = useQuery({
    queryKey: inboxKey,
    queryFn: () => fetchInbox(tenantId as string, page, limit),
    enabled: Boolean(tenantId),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  });

  const data = query.data?.data ?? [];
  const total = query.data?.total ?? 0;

  const invalidateUnreadCount = () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(tenantId) });

  const markAsViewed = useMutation({
    mutationFn: (notificationId: string) => postView(tenantId as string, notificationId),
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: inboxKey });
      const previous = queryClient.getQueryData<{ data: TenantNotificationReceipt[]; total: number }>(inboxKey);
      const nowIso = new Date().toISOString();

      queryClient.setQueryData(inboxKey, (current: typeof previous) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((item) =>
            resolveNotificationId(item) === notificationId
              ? { ...item, viewed: true, firstViewedAt: item.firstViewedAt ?? nowIso }
              : item,
          ),
        };
      });

      return { previous };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previous) queryClient.setQueryData(inboxKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: inboxKey });
      invalidateUnreadCount();
    },
  });

  const markAllAsViewed = useMutation({
    mutationFn: async () => {
      if (!tenantId) return;
      const unreadIds = data
        .filter((item) => !item.viewed)
        .map((item) => resolveNotificationId(item))
        .filter((id): id is string => Boolean(id));

      if (unreadIds.length === 0) return;

      const results = await Promise.allSettled(unreadIds.map((id) => postView(tenantId, id)));
      if (results.some((result) => result.status === "rejected")) {
        throw new Error("Falha ao marcar todas as notificações como vistas");
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: inboxKey });
      const previous = queryClient.getQueryData<{ data: TenantNotificationReceipt[]; total: number }>(inboxKey);
      const nowIso = new Date().toISOString();

      queryClient.setQueryData(inboxKey, (current: typeof previous) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((item) => ({ ...item, viewed: true, firstViewedAt: item.firstViewedAt ?? nowIso })),
        };
      });

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(inboxKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: inboxKey });
      invalidateUnreadCount();
    },
  });

  return {
    data,
    total,
    loading: query.isPending && Boolean(tenantId),
    refetch: query.refetch,
    markAsViewed: (notificationId: string) => {
      if (!tenantId || !notificationId) return;
      markAsViewed.mutate(notificationId);
    },
    markAllAsViewed: () => markAllAsViewed.mutate(),
  };
}
