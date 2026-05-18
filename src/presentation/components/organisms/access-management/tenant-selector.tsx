"use client";

import { useEffect, useState, useCallback } from "react";
import { Select, SelectItem } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "nextjs-toploader/app";

import useAdminDetails from "@/src/shared/hooks/useUserDatails";
import { useTenantStore } from "@/src/shared/stores/tenant-store";

export default function TenantSelector() {
  const { push } = useRouter();
  const t = useTranslations("sidebar");
  const [isMounted, setIsMounted] = useState(false);
  const { data: adminData, isLoading } = useAdminDetails();
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const setSelectedTenant = useTenantStore((state) => state.setSelectedTenant);

  const tenants = adminData?.tenants ?? [];

  // Evita divergencia de hidratacao: o cookie so e lido depois da montagem.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-seleciona o primeiro tenant do admin quando nenhum esta selecionado ou
  // quando o tenant do cookie nao pertence mais a este admin.
  useEffect(() => {
    if (isLoading || !isMounted || tenants.length === 0) return;

    const tenantBelongsToAdmin = selectedTenant
      ? tenants.some(
          (tenant: { id: string | number }) =>
            tenant.id.toString() === selectedTenant.id.toString(),
        )
      : false;

    if (!selectedTenant || !tenantBelongsToAdmin) {
      setSelectedTenant(tenants[0]);
    }
  }, [tenants, selectedTenant, setSelectedTenant, isLoading, isMounted]);

  const handleSelectionChange = useCallback(
    (keys: Iterable<React.Key>) => {
      const selectedKey = Array.from(keys)[0] as string | undefined;
      if (!selectedKey) return;

      const tenant = tenants.find(
        (candidate: { id: string | number }) =>
          candidate.id.toString() === selectedKey,
      );
      if (tenant) {
        setSelectedTenant(tenant);
        push("/dashboard");
      }
    },
    [tenants, setSelectedTenant, push],
  );

  if (!isMounted || isLoading) {
    return (
      <Select
        label={t("tenantLabel")}
        placeholder={t("tenantLoading")}
        isLoading
        isDisabled
        className="max-w-xs"
        classNames={{
          trigger: "bg-white/5 border-border",
          label: "text-muted-foreground",
        }}
      >
        <SelectItem key="loading">{t("tenantLoading")}</SelectItem>
      </Select>
    );
  }

  if (tenants.length === 0) {
    return (
      <Select
        label={t("tenantLabel")}
        placeholder={t("noTenantsAvailable")}
        isDisabled
        className="max-w-xs"
        classNames={{
          trigger: "bg-white/5 border-border",
          label: "text-muted-foreground",
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
        selectedTenant ? new Set([selectedTenant.id.toString()]) : new Set()
      }
      onSelectionChange={handleSelectionChange}
      className="max-w-xs"
      classNames={{
        trigger: "bg-white/5 border-border hover:bg-white/10 transition-colors",
        value: "text-foreground group-data-[has-value=true]:text-foreground",
        popoverContent: "bg-card border-border text-foreground",
        label: "text-muted-foreground",
      }}
      listboxProps={{
        itemClasses: {
          base: [
            "text-muted-foreground",
            "data-[hover=true]:text-foreground",
            "data-[hover=true]:bg-default-100",
            "data-[selectable=true]:focus:bg-default-100",
          ],
        },
      }}
    >
      {tenants.map((tenant: { id: string | number; name: string }) => (
        <SelectItem key={tenant.id.toString()} textValue={tenant.name}>
          {tenant.name}
        </SelectItem>
      ))}
    </Select>
  );
}
