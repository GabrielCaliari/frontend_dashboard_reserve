"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@heroui/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import AdminTable from "@/src/presentation/components/organisms/access-management/admins/AdminTable";
import { AdminFormModal } from "@/src/presentation/components/organisms/access-management/admins/AdminFormModal";
import { SearchInput } from "@/src/presentation/components/organisms/access-management/shared/search-input";
import { PaginationControls } from "@/src/presentation/components/organisms/access-management/shared/pagination-controls";
import { ConfirmationDialog } from "@/src/presentation/components/organisms/access-management/shared/confirmation-dialog";
import {
  StatusFilterControl,
  type StatusFilter,
} from "@/src/presentation/components/organisms/access-management/shared/status-filter";
import { Breadcrumbs } from "@/src/presentation/components/organisms/access-management/shared/breadcrumbs";
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  useUpdateAdminRole,
  useToggleAdminStatus,
  useDeleteAdmin,
  useScheduleAdminDeletion,
  useRestoreAdminDeletion,
} from "@/src/common/hooks/access-management/useAdmins";
import {
  useAssignAdminToTenant,
  useUnassignAdminFromTenant,
  useUpdateAdminTenantRole,
} from "@/src/common/hooks/access-management/useTenants";
import { useCurrentAdmin } from "@/src/shared/hooks/use-current-admin";
import type {
  Admin,
  CreateAdminDto,
  UpdateAdminDto,
  TenantAssignmentChange,
} from "@/src/shared/domain/types/@access-management";
import { AdminRole } from "@/src/shared/domain/types/@access-management";
import type {
  CreateAdminFormData,
  UpdateAdminFormData,
} from "@/src/shared/schemas/access-management/admin-schema";
import { toast } from "react-hot-toast";

export default function AdminListPage() {
  const router = useRouter();
  const t = useTranslations("accessManagement");
  const currentAdmin = useCurrentAdmin();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | undefined>(
    undefined,
  );
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "default";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "default",
    onConfirm: () => {},
  });

  const perPage = 10;

  const { data, isLoading, error } = useAdmins({
    page: currentPage,
    perPage,
    search: searchTerm || undefined,
  });
  const createAdminMutation = useCreateAdmin();
  const updateAdminMutation = useUpdateAdmin();
  const updateRoleMutation = useUpdateAdminRole();
  const toggleStatusMutation = useToggleAdminStatus();
  const deleteAdminMutation = useDeleteAdmin();
  const scheduleDeletionMutation = useScheduleAdminDeletion();
  const restoreDeletionMutation = useRestoreAdminDeletion();
  const assignTenantMutation = useAssignAdminToTenant();
  const unassignTenantMutation = useUnassignAdminFromTenant();
  const updateTenantRoleMutation = useUpdateAdminTenantRole();

  const filteredAdmins = (data?.data || []).filter((a) => {
    if (statusFilter === "active") return a.is_active;
    if (statusFilter === "inactive") return !a.is_active;
    return true;
  });

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFormSubmit = async (
    formData: CreateAdminFormData | UpdateAdminFormData,
    tenantChanges?: TenantAssignmentChange,
  ) => {
    try {
      let adminId: string | undefined;

      if (selectedAdmin) {
        const { role, ...rest } = formData as UpdateAdminFormData;
        const cleanRest = Object.fromEntries(
          Object.entries(rest).filter(([, v]) => v !== undefined && v !== ""),
        );
        if (Object.keys(cleanRest).length > 0) {
          await updateAdminMutation.mutateAsync({
            id: selectedAdmin.id,
            data: cleanRest as Omit<UpdateAdminDto, "role">,
          });
        }
        if (role && role !== selectedAdmin.role) {
          await updateRoleMutation.mutateAsync({
            id: selectedAdmin.id,
            role: role as AdminRole,
          });
        }
        adminId = selectedAdmin.id;
      } else {
        const created = await createAdminMutation.mutateAsync(
          formData as CreateAdminDto,
        );
        adminId = created.id;
      }

      if (adminId && tenantChanges) {
        for (const add of tenantChanges.add) {
          await assignTenantMutation.mutateAsync({
            admin_id: adminId,
            tenant_id: add.tenant_id,
          });
          if (add.role !== AdminRole.viewer) {
            await updateTenantRoleMutation.mutateAsync({
              tenantId: add.tenant_id,
              adminId,
              data: { role: add.role },
            });
          }
        }
        for (const removeId of tenantChanges.remove) {
          await unassignTenantMutation.mutateAsync({
            tenantId: removeId,
            adminId,
          });
        }
        for (const upd of tenantChanges.updateRole) {
          await updateTenantRoleMutation.mutateAsync({
            tenantId: upd.tenant_id,
            adminId,
            data: { role: upd.role },
          });
        }
      }

      setIsFormModalOpen(false);
      setSelectedAdmin(undefined);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message;
      toast.error(
        Array.isArray(msg)
          ? msg.join(",")
          : msg || t("admins.management.errorMessage"),
      );
    }
  };

  const handleToggleStatus = (adminId: string, isActive: boolean) => {
    if (adminId === currentAdmin.id && isActive) {
      toast.error(t("admins.management.cannotDeactivateSelf"));
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: isActive
        ? t("admins.management.deactivateConfirmTitle")
        : t("admins.management.activateConfirmTitle"),
      message: isActive
        ? t("admins.management.deactivateConfirmMessage")
        : t("admins.management.activateConfirmMessage"),
      variant: isActive ? "warning" : "default",
      onConfirm: async () => {
        try {
          await toggleStatusMutation.mutateAsync({ id: adminId, isActive });
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message;
          toast.error(
            Array.isArray(msg)
              ? msg.join(",")
              : msg || t("admins.management.errorMessage"),
          );
        }
      },
    });
  };

  const handleDeleteClick = (adminId: string) => {
    if (adminId === currentAdmin.id) {
      toast.error(t("admins.management.cannotDeleteSelf"));
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: t("admins.management.scheduleDeletionConfirmTitle"),
      message: t("admins.management.scheduleDeletionConfirmMessage"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await scheduleDeletionMutation.mutateAsync({ id: adminId });
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (error) {
          // Error handled by mutation hook
        }
      },
    });
  };

  const handleRestoreClick = (adminId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t("admins.management.restoreConfirmTitle"),
      message: t("admins.management.restoreConfirmMessage"),
      variant: "warning",
      onConfirm: async () => {
        try {
          await restoreDeletionMutation.mutateAsync({ id: adminId });
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (error) {
          // Error handled by mutation hook
        }
      },
    });
  };

  if (error) {
    return (
      <LayoutScopeRoot routeActive="admins">
        <div className="p-6">
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-danger mb-2">
              {t("admins.management.errorTitle")}
            </h2>
            <p className="text-danger-500 mb-4">
              {error.message || t("admins.management.errorMessage")}
            </p>
            <Button
              color="danger"
              variant="flat"
              onPress={() => window.location.reload()}
            >
              {t("admins.management.retry")}
            </Button>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <>
      <LayoutScopeRoot routeActive="admins">
        <div className="p-6">
          <Breadcrumbs
            items={[
              { label: t("breadcrumbs.dashboard"), href: "/dashboard" },
              { label: t("breadcrumbs.accessManagement") },
              { label: t("breadcrumbs.admins") },
            ]}
          />

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {t("admins.management.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("admins.management.description")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={t("admins.management.searching")}
                className="max-w-md"
              />
            </div>
            <StatusFilterControl
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            />
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => {
                setSelectedAdmin(undefined);
                setIsFormModalOpen(true);
              }}
              className="sm:w-auto w-full"
            >
              {t("admins.management.createButton")}
            </Button>
          </div>

          <AdminTable
            admins={filteredAdmins}
            isLoading={isLoading}
            currentAdminId={currentAdmin.id}
            onEdit={(admin) => {
              setSelectedAdmin(admin);
              setIsFormModalOpen(true);
            }}
            onRowClick={(id) =>
              router.push(`/dashboard/access-management/admins/${id}`)
            }
            onToggleActive={handleToggleStatus}
            onDelete={handleDeleteClick}
            onRestore={handleRestoreClick}
          />

          {!isLoading && filteredAdmins.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {t("admins.management.showing", {
                  count: filteredAdmins.length,
                  total: data?.meta.total || 0,
                })}
              </p>
              <PaginationControls
                currentPage={currentPage}
                totalPages={data?.meta.total_pages || 1}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </LayoutScopeRoot>

      <AdminFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedAdmin(undefined);
        }}
        admin={selectedAdmin}
        onSubmit={handleFormSubmit}
        isLoading={
          createAdminMutation.isPending ||
          updateAdminMutation.isPending ||
          updateRoleMutation.isPending
        }
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={
          confirmDialog.variant === "danger"
            ? t("admins.management.confirmDelete")
            : t("admins.management.confirmAction")
        }
        isLoading={
          toggleStatusMutation.isPending ||
          scheduleDeletionMutation.isPending ||
          deleteAdminMutation.isPending ||
          restoreDeletionMutation.isPending
        }
      />
    </>
  );
}
