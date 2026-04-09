"use client";
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/src/common/config/api";

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
      const res = await apiClient.get(`/notifications/tenant`, {
        params: { page, limit },
        headers: { "x-tenant-id": tenantId },
      });
      setData(res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
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
    await apiClient.post(`/notifications/tenant/${notificationId}/view`, null, {
      headers: { "x-tenant-id": tenantId! },
    });
    load();
  };

  return { data, total, loading, refetch: load, markAsViewed };
}
