"use client";

import React from"react";
import { useTranslations } from"next-intl";
import {
 Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
 Chip, Button, Skeleton, Tooltip,
} from"@heroui/react";
import { Edit, Power, Trash2, ExternalLink, RotateCcw } from"lucide-react";
import { Admin, AdminRole } from"@/src/common/@types/@access-management";
import { formatDate } from"@/src/common/lib/utils";
import { RoleBadge } from"@/src/components/access-management/shared/role-badge";
import { EntityAvatar } from"@/src/components/access-management/shared/entity-avatar";
import usePermissions from"@/src/common/hooks/use-permissions";

interface AdminTableProps {
 admins: Admin[];
 isLoading: boolean;
 currentAdminId: string;
 onEdit: (admin: Admin) => void;
 onRowClick: (adminId: string) => void;
 onToggleActive: (adminId: string, isActive: boolean) => void;
 onDelete: (adminId: string) => void;
 onRestore?: (adminId: string) => void;
}

const AdminTable: React.FC<AdminTableProps> = ({
 admins, isLoading, currentAdminId, onEdit, onRowClick, onToggleActive, onDelete, onRestore
}) => {
 const t = useTranslations("accessManagement");
 const { isSuperAdmin } = usePermissions();

 // Managers cannot act on super_admin or owner accounts
 const canActOn = (admin: Admin) =>
 isSuperAdmin || (admin.role !== AdminRole.super_admin && admin.role !== AdminRole.owner);

 const columns = [
 { key:"name", label: t("table.columns.name") },
 { key:"email", label: t("table.columns.email") },
 { key:"role", label: t("table.columns.role") },
 { key:"status", label: t("table.columns.status") },
 { key:"created_at", label: t("table.columns.createdAt") },
 { key:"actions", label: t("table.columns.actions") },
 ];

 const renderCell = (admin: Admin, columnKey: React.Key) => {
 switch (columnKey) {
 case"name":
 return (
 <div className="flex items-center gap-3 cursor-pointer" onClick={() => onRowClick(admin.id)}>
 <EntityAvatar name={admin.name} size="sm" />
 <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">{admin.name}</span>
 </div>
 );
 case"email":
 return <span className="text-sm text-foreground-400">{admin.email}</span>;
 case"role":
 return <RoleBadge role={admin.role} showTooltip />;
 case"status":
 if (admin.scheduled_for_deletion) {
 return (
 <Chip color="warning" size="sm" variant="dot">
 {t("table.status.scheduledForDeletion")}
 </Chip>
 );
 }
 return (
 <Chip color={admin.is_active ?"success" :"danger"} size="sm" variant="dot">
 {admin.is_active ? t("table.status.active") : t("table.status.inactive")}
 </Chip>
 );
 case"created_at":
 return <span className="text-sm text-foreground-400">{formatDate(admin.created_at)}</span>;
 case"actions":
 const isSelf = admin.id === currentAdminId;
 const canAct = canActOn(admin);
 return (
 <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
 <Tooltip content={t("table.tooltips.viewDetails")}>
 <Button isIconOnly size="sm" variant="light" onPress={() => onRowClick(admin.id)} aria-label={t("table.ariaLabels.viewAdmin")}>
 <ExternalLink className="w-4 h-4" />
 </Button>
 </Tooltip>
 <Tooltip content={!canAct ? t("table.tooltips.insufficientPermissions") ||"Insufficient permissions" : t("table.tooltips.editAdmin")}>
 <Button isIconOnly size="sm" variant="light" onPress={() => onEdit(admin)} isDisabled={!canAct || admin.scheduled_for_deletion} aria-label={t("table.ariaLabels.editAdmin")}>
 <Edit className="w-4 h-4" />
 </Button>
 </Tooltip>
 <Tooltip content={isSelf ? t("table.tooltips.cannotDeactivateSelf") : !canAct ? t("table.tooltips.insufficientPermissions") ||"Insufficient permissions" : (admin.is_active ? t("table.tooltips.deactivate") : t("table.tooltips.activate"))}>
 <Button
 isIconOnly size="sm" variant="light"
 color={admin.is_active ?"warning" :"success"}
 onPress={() => onToggleActive(admin.id, admin.is_active)}
 isDisabled={(isSelf && admin.is_active) || !canAct || admin.scheduled_for_deletion}
 aria-label={admin.is_active ? t("table.ariaLabels.deactivateAdmin") : t("table.ariaLabels.activateAdmin")}
 >
 <Power className="w-4 h-4" />
 </Button>
 </Tooltip>
 {admin.scheduled_for_deletion ? (
 <Tooltip content={t("table.tooltips.restoreAdmin")} color="primary">
 <Button
 isIconOnly size="sm" variant="light" color="primary"
 onPress={() => onRestore ? onRestore(admin.id) : onDelete(admin.id)}
 isDisabled={isSelf || !canAct}
 aria-label={t("table.ariaLabels.restoreAdmin")}
 >
 <RotateCcw className="w-4 h-4" />
 </Button>
 </Tooltip>
 ) : (
 <Tooltip content={isSelf ? t("table.tooltips.cannotDeleteSelf") : !canAct ? t("table.tooltips.insufficientPermissions") ||"Insufficient permissions" : t("table.tooltips.deleteAdmin")} color="danger">
 <Button
 isIconOnly size="sm" variant="light" color="danger"
 onPress={() => onDelete(admin.id)}
 isDisabled={isSelf || !canAct}
 aria-label={t("table.ariaLabels.deleteAdmin")}
 >
 <Trash2 className="w-4 h-4" />
 </Button>
 </Tooltip>
 )}
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

 if (admins.length === 0) {
 return (
 <div className="text-center py-12">
 <p className="text-foreground-500 text-lg">{t("table.empty.noAdminsFound")}</p>
 <p className="text-foreground-400 text-sm mt-2">{t("table.empty.createNewAdmin")}</p>
 </div>
 );
 }

 return (
 <Table
 aria-label={t("table.ariaLabels.adminTable")}
 classNames={{
 wrapper:" border border-divider bg-content1 rounded-lg overflow-x-auto",
 th:"bg-content2 text-foreground font-semibold",
 td:"py-3",
 tr:"hover:bg-content2/50 transition-colors cursor-pointer",
 }}
 >
 <TableHeader columns={columns}>
 {(col) => <TableColumn key={col.key} align={col.key ==="actions" ?"center" :"start"}>{col.label}</TableColumn>}
 </TableHeader>
 <TableBody items={admins}>
 {(admin) => (
 <TableRow key={admin.id} onClick={() => onRowClick(admin.id)}>
 {(columnKey) => <TableCell onClick={columnKey ==="actions" ? (e) => e.stopPropagation() : undefined}>{renderCell(admin, columnKey)}</TableCell>}
 </TableRow>
 )}
 </TableBody>
 </Table>
 );
};

export default AdminTable;
