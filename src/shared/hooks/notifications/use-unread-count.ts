"use client";
import { useState, useEffect } from "react";
import { getUnreadCount } from "@/src/modules/notifications/infrastructure/adapters";

export function useUnreadCount(tenantId: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!tenantId) return;
    const load = async () => {
      try {
        const result = await getUnreadCount(tenantId);
        setCount(result ?? 0);
      } catch {}
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [tenantId]);

  return count;
}
