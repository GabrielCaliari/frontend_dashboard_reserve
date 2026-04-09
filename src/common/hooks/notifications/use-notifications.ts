"use client";
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/src/common/config/api";

interface NotificationsFilter {
  type?: string;
  scope?: string;
  published?: boolean;
  page?: number;
  limit?: number;
}

export function useNotifications(filters: NotificationsFilter = {}) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/notifications", { params: filters });
      setData(res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, total, loading, refetch: load };
}
