"use client";
import { useState, useEffect, useCallback } from "react";
import {
  listNotifications,
  NotificationsFilter,
} from "@/src/modules/notifications/infrastructure/adapters";

export function useNotifications(filters: NotificationsFilter = {}) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await listNotifications(filters);
      setData(res?.data ?? []);
      setTotal(res?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, total, loading, refetch: load };
}
