"use client";
import { useState, useEffect, useCallback } from "react";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/src/modules/notifications/infrastructure/adapters";

export function useNotificationSettings(
  tenantId: string | null,
  isSuperAdmin = false,
) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await getNotificationSettings(tenantId, isSuperAdmin);
      setSettings(res);
    } finally {
      setLoading(false);
    }
  }, [tenantId, isSuperAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const updateSettings = async (data: any) => {
    await updateNotificationSettings(tenantId!, data, isSuperAdmin);
    load();
  };

  return { settings, loading, refetch: load, updateSettings };
}
