"use client";

import { useEffect, useState, useCallback } from "react";
import { Select, SelectItem } from "@heroui/react";
import { useTranslations } from "next-intl";
import useAdminDetails from "@/src/common/hooks/useUserDatails";
import usePermissions from "@/src/common/hooks/use-permissions";
import { useRouter } from "nextjs-toploader/app";
import {
  useDashboardScope,
  useTenantStore,
} from "@/src/common/stores/tenant-store";

const GLOBAL_VIEW_KEY = "__global_view__";

export default function TenantSelector() {
  const { push } = useRouter();
  const t = useTranslations("sidebar");
  const [isMounted, setIsMounted] = useState(false);
  const { data: adminData, isLoading } = useAdminDetails();
  const { isSuperAdmin } = usePermissions();
  const dashboardScope = useDashboardScope();
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const setSelectedTenant = useTenantStore((state) => state.setSelectedTenant);
  const setDashboardScope = useTenantStore((state) => state.setDashboardScope);

  const tenants = adminData?.tenants || [];

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-select first tenant if none selected and tenants are loaded
  useEffect(() => {
    if (!selectedTenant && tenants.length > 0) {
      setSelectedTenant(tenants[0]);
    }
  }, [tenants, selectedTenant, setSelectedTenant]);

  const handleSelectionChange = useCallback(
    (keys: Iterable<React.Key>) => {
      const selectedKey = Array.from(keys)[0] as string | undefined;
      if (!selectedKey) return;

      if (selectedKey === GLOBAL_VIEW_KEY && isSuperAdmin) {
        setDashboardScope("global");
        push("/dashboard/global");
        return;
      }

      const tenant = tenants.find((t) => t.id.toString() === selectedKey);
      if (tenant) {
        setSelectedTenant(tenant);
        setDashboardScope("tenant");
        push("/dashboard");
      }
    },
    [isSuperAdmin, tenants, setDashboardScope, setSelectedTenant, push],
  );

  // Prevent hydration mismatch - render placeholder on server
  if (!isMounted || isLoading) {
    return (
      <Select
        label={t("tenantLabel")}
        placeholder={t("tenantLoading")}
        isLoading={true}
        isDisabled={true}
        className="max-w-xs"
        classNames={{
          trigger: "bg-white/5 border-gray-800",
          label: "text-gray-400",
        }}
      >
        <SelectItem key="loading">{t("tenantLoading")}</SelectItem>
      </Select>
    );
  }

  if (tenants.length === 0 && !isSuperAdmin) {
    return (
      <Select
        label={t("tenantLabel")}
        placeholder={t("noTenantsAvailable")}
        isDisabled={true}
        className="max-w-xs"
        classNames={{
          trigger: "bg-white/5 border-gray-800",
          label: "text-gray-400",
        }}
      >
        <SelectItem key="empty">{t("noTenants")}</SelectItem>
      </Select>
    );
  }

  return (
    <Select
      label={t("tenantLabel")}
      placeholder={t("selectTenantPlaceholder")}
      selectedKeys={
        dashboardScope === "global"
          ? new Set([GLOBAL_VIEW_KEY])
          : selectedTenant
            ? new Set([selectedTenant.id.toString()])
            : new Set()
      }
      onSelectionChange={handleSelectionChange}
      className="max-w-xs"
      classNames={{
        trigger:
          "bg-white/5 border-gray-800 hover:bg-white/10 transition-colors",
        value: "text-gray-200 group-data-[has-value=true]:text-gray-200",
        popoverContent: "bg-[#16162a] border-gray-800 text-gray-200",
        label: "text-gray-400",
      }}
      listboxProps={{
        itemClasses: {
          base: [
            "text-gray-400",
            "data-[hover=true]:text-gray-100",
            "data-[hover=true]:bg-[#1e1e3a]",
            "data-[selectable=true]:focus:bg-[#1e1e3a]",
          ],
        },
      }}
    >
      {isSuperAdmin && (
        <SelectItem
          key={GLOBAL_VIEW_KEY}
          value={GLOBAL_VIEW_KEY}
          textValue={t("globalViewOption")}
        >
          {t("globalViewOption")}
        </SelectItem>
      )}
      {tenants.map((tenant) => (
        <SelectItem
          key={tenant.id.toString()}
          value={tenant.id.toString()}
          textValue={tenant.name}
        >
          {tenant.name}
        </SelectItem>
      ))}
    </Select>
  );
}
