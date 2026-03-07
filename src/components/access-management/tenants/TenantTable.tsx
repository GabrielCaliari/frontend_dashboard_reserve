"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Button, Skeleton, Tooltip,
} from "@nextui-org/react";
import { Edit, Power, Trash2 } from "lucide-react";
import { Tenant } from "@/src/common/@types/@access-management";
import { formatDate } from "@/src/lib/utils";
import { EntityAvatar } from "@/src/components/access-management/shared/entity-avatar";

interface TenantTableProps {
  tenants: Tenant[];
  isLoading: boolean;
  onEdit: (tenant: Tenant) => void;
  onToggleActive: (tenantId: string, isActive: boolean) => void;
  onDelete: (tenantId: string) => void;
}

const TenantTable: React.FC<TenantTableProps> = ({
  tenants, isLoading, onEdit, onToggleActive, onDelete,
}) => {
  const t = useTranslations("accessManagement");

  const columns = [
    { key: "name",       label: t("table.columns.name")      },
    { key: "slug",       label: t("table.columns.slug")      },
    { key: "domain",     label: t("table.columns.domain")    },
    { key: "status",     label: t("table.columns.status")    },
    { key: "created_at", label: t("table.columns.createdAt") },
    { key: "actions",    label: t("table.columns.actions")   },
  ];

  const renderCell = (tenant: Tenant, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-3">
            <EntityAvatar name={tenant.name} size="sm" />
            <span className="text-sm font-medium text-foreground">{tenant.name}</span>
          </div>
        );
      case "slug":
        return <span className="text-sm text-foreground-400 font-mono">{tenant.slug}</span>;
      case "domain":
        return <span className="text-sm text-foreground-400">{tenant.domain}</span>;
      case "status":
        return (
          <Chip color={tenant.is_active ? "success" : "danger"} size="sm" variant="dot">
            {tenant.is_active ? t("table.status.active") : t("table.status.inactive")}
          </Chip>
        );
      case "created_at":
        return <span className="text-sm text-foreground-400">{formatDate(tenant.created_at)}</span>;
      case "actions":
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Tooltip content={t("table.tooltips.editTenant")}>
              <Button isIconOnly size="sm" variant="light" onPress={() => onEdit(tenant)} aria-label={t("table.ariaLabels.editTenant")}>
                <Edit className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content={tenant.is_active ? t("table.tooltips.deactivate") : t("table.tooltips.activate")}>
              <Button
                isIconOnly size="sm" variant="light"
                color={tenant.is_active ? "warning" : "success"}
                onPress={() => onToggleActive(tenant.id, tenant.is_active)}
                aria-label={tenant.is_active ? t("table.ariaLabels.deactivateTenant") : t("table.ariaLabels.activateTenant")}
              >
                <Power className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content={t("table.tooltips.deleteTenant")} color="danger">
              <Button
                isIconOnly size="sm" variant="light" color="danger"
                onPress={() => onDelete(tenant.id)}
                aria-label={t("table.ariaLabels.deleteTenant")}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center"><Skeleton className="h-12 w-full rounded-lg" /></div>
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-500 text-lg">{t("table.empty.noTenantsFound")}</p>
        <p className="text-foreground-400 text-sm mt-2">{t("table.empty.createNewTenant")}</p>
      </div>
    );
  }

  return (
    <Table
      aria-label={t("table.ariaLabels.tenantTable")}
      classNames={{
        wrapper: "shadow-none border border-divider bg-content1 rounded-lg overflow-x-auto",
        th: "bg-content2 text-foreground font-semibold",
        td: "py-3",
        tr: "hover:bg-content2/50 transition-colors",
      }}
    >
      <TableHeader columns={columns}>
        {(col) => <TableColumn key={col.key} align={col.key === "actions" ? "center" : "start"}>{col.label}</TableColumn>}
      </TableHeader>
      <TableBody items={tenants}>
        {(tenant) => (
          <TableRow key={tenant.id}>
            {(columnKey) => <TableCell onClick={columnKey === "actions" ? (e) => e.stopPropagation() : undefined}>{renderCell(tenant, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default TenantTable;
