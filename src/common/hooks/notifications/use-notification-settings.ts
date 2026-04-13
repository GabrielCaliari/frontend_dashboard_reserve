"use client";
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/src/infraestructure/axios/api";

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
      const url = isSuperAdmin
        ? `/notifications/settings/${tenantId}`
        : `/notifications/settings`;
      const headers: Record<string, string> = {};
      if (!isSuperAdmin) headers["x-tenant-id"] = tenantId;
      const res = await apiClient.get(url, { headers });
      setSettings(res.data);
    } finally {
      setLoading(false);
    }
  }, [tenantId, isSuperAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const updateSettings = async (data: any) => {
    const url = isSuperAdmin
      ? `/notifications/settings/${tenantId}`
      : `/notifications/settings`;
    const headers: Record<string, string> = {};
    if (!isSuperAdmin) headers["x-tenant-id"] = tenantId!;
    await apiClient.patch(url, data, { headers });
    load();
  };

  return { settings, loading, refetch: load, updateSettings };
}
