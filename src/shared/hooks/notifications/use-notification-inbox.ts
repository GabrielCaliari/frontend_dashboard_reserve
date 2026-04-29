"use client";
import { useState, useEffect, useCallback } from "react";
import {
  listTenantNotifications,
  markNotificationViewed,
} from "@/src/modules/notifications/infrastructure/adapters";

export function useNotificationInbox(
  tenantId: string | null,
  page = 1,
  limit = 20,
) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await listTenantNotifications(tenantId, page, limit);
      setData(res.data ?? []);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, limit]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [load]);

  const markAsViewed = async (notificationId: string) => {
    await markNotificationViewed(tenantId!, notificationId);
    load();
  };

  return { data, total, loading, refetch: load, markAsViewed };
}
