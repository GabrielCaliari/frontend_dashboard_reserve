"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Button, Skeleton, Tooltip,
} from "@heroui/react";
import { Edit, Power, Trash2, ExternalLink } from "lucide-react";
import { User } from "@/src/common/@types/@access-management";
import { formatDate } from "@/src/lib/utils";
import { EntityAvatar } from "@/src/components/access-management/shared/entity-avatar";

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onRowClick: (userId: string) => void;
  onDeactivate: (userId: string) => void;
  onDelete: (userId: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, isLoading, onEdit, onRowClick, onDeactivate, onDelete }) => {
  const t = useTranslations("accessManagement");

  const columns = [
    { key: "name",       label: t("table.columns.name")      },
    { key: "email",      label: t("table.columns.email")     },
    { key: "phone",      label: t("table.columns.phone")     },
    { key: "status",     label: t("table.columns.status")    },
    { key: "created_at", label: t("table.columns.createdAt") },
    { key: "actions",    label: t("table.columns.actions")   },
  ];

  const renderCell = (user: User, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onRowClick(user.id)}>
            <EntityAvatar name={user.name} size="sm" />
            <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">{user.name}</span>
          </div>
        );
      case "email":
        return <span className="text-sm text-foreground-400">{user.email}</span>;
      case "phone":
        return <span className="text-sm text-foreground-400">{user.phone_number || "—"}</span>;
      case "status":
        return (
          <Chip color={user.is_active ? "success" : "danger"} size="sm" variant="dot">
            {user.is_active ? t("table.status.active") : t("table.status.inactive")}
          </Chip>
        );
      case "created_at":
        return <span className="text-sm text-foreground-400">{formatDate(user.created_at)}</span>;
      case "actions":
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Tooltip content={t("table.tooltips.viewDetails")}>
              <Button isIconOnly size="sm" variant="light" onPress={() => onRowClick(user.id)} aria-label={t("table.ariaLabels.viewUser")}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content={t("table.tooltips.editUser")}>
              <Button isIconOnly size="sm" variant="light" onPress={() => onEdit(user)} aria-label={t("table.ariaLabels.editUser")}>
                <Edit className="w-4 h-4" />
              </Button>
            </Tooltip>
            {user.is_active && (
              <Tooltip content={t("table.tooltips.deactivateUser")}>
                <Button isIconOnly size="sm" variant="light" color="warning" onPress={() => onDeactivate(user.id)} aria-label={t("table.ariaLabels.deactivateUser")}>
                  <Power className="w-4 h-4" />
                </Button>
              </Tooltip>
            )}
            <Tooltip content={t("table.tooltips.deleteUser")} color="danger">
              <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onDelete(user.id)} aria-label={t("table.ariaLabels.deleteUser")}>
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

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-500 text-lg">{t("table.empty.noUsersFound")}</p>
        <p className="text-foreground-400 text-sm mt-2">{t("table.empty.usersWillAppear")}</p>
      </div>
    );
  }

  return (
    <Table
      aria-label={t("table.ariaLabels.userTable")}
      classNames={{
        wrapper: "shadow-none border border-divider bg-content1 rounded-lg overflow-x-auto",
        th: "bg-content2 text-foreground font-semibold",
        td: "py-3",
        tr: "hover:bg-content2/50 transition-colors cursor-pointer",
      }}
    >
      <TableHeader columns={columns}>
        {(col) => <TableColumn key={col.key} align={col.key === "actions" ? "center" : "start"}>{col.label}</TableColumn>}
      </TableHeader>
      <TableBody items={users}>
        {(user) => (
          <TableRow key={user.id} onClick={() => onRowClick(user.id)}>
            {(columnKey) => <TableCell onClick={columnKey === "actions" ? (e) => e.stopPropagation() : undefined}>{renderCell(user, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default UserTable;
