"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/src/infraestructure/axios/api";

export function useUnreadCount(tenantId: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!tenantId) return;
    const load = async () => {
      try {
        const res = await apiClient.get(
          "/notifications/tenant/me/unread-count",
          {
            headers: { "x-tenant-id": tenantId },
          },
        );
        setCount(res.data?.count ?? 0);
      } catch {}
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [tenantId]);

  return count;
}
