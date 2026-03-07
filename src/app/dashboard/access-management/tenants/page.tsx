"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@nextui-org/react";
import { Plus } from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import TenantTable from "@/src/components/access-management/tenants/TenantTable";
import { TenantFormModal } from "@/src/components/access-management/tenants/TenantFormModal";
import { SearchInput } from "@/src/components/access-management/shared/search-input";
import { PaginationControls } from "@/src/components/access-management/shared/pagination-controls";
import { ConfirmationDialog } from "@/src/components/access-management/shared/confirmation-dialog";
import {
  useTenants,
  useCreateTenant,
  useUpdateTenant,
  useToggleTenantStatus,
  useDeleteTenant,
} from "@/src/common/hooks/access-management/useTenants";
import type {
  Tenant,
  CreateTenantDto,
  UpdateTenantDto,
} from "@/src/common/@types/@access-management";
import type {
  CreateTenantFormData,
  UpdateTenantFormData,
} from "@/src/common/schemas/access-management/tenant-schema";
import { toast } from "react-hot-toast";

export default function TenantListPage() {
  const t = useTranslations("accessManagement");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const perPage = 10;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>(undefined);

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

  const { data, isLoading, error } = useTenants({
    page: currentPage,
    perPage,
    search: searchTerm || undefined,
  });

  const createTenantMutation = useCreateTenant();
  const updateTenantMutation = useUpdateTenant();
  const toggleStatusMutation = useToggleTenantStatus();
  const deleteTenantMutation = useDeleteTenant();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreateClick = () => {
    setSelectedTenant(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (
    formData: CreateTenantFormData | UpdateTenantFormData,
  ) => {
    try {
      if (selectedTenant) {
        const updateData: UpdateTenantDto = {
          name: formData.name,
          slug: formData.slug,
          domain: formData.domain,
        };
        await updateTenantMutation.mutateAsync({
          id: selectedTenant.id,
          data: updateData,
        });
      } else {
        const createData = formData as CreateTenantFormData;
        await createTenantMutation.mutateAsync(createData);
      }

      setIsFormModalOpen(false);
      setSelectedTenant(undefined);
    } catch (error) {
      throw error;
    }
  };

  const handleToggleStatus = (tenantId: string, isActive: boolean) => {
    const actionTitle = isActive ? t("tenants.management.deactivateConfirmTitle") : t("tenants.management.activateConfirmTitle");
    const actionMessage = isActive
      ? t("tenants.management.deactivateConfirmMessage")
      : t("tenants.management.activateConfirmMessage");

    setConfirmDialog({
      isOpen: true,
      title: actionTitle,
      message: actionMessage,
      variant: isActive ? "warning" : "default",
      onConfirm: async () => {
        try {
          await toggleStatusMutation.mutateAsync({ id: tenantId, isActive });
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (error) {
          // Error is already handled by the mutation hook
        }
      },
    });
  };

  const handleDeleteClick = (tenantId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t("tenants.management.deleteConfirmTitle"),
      message: t("tenants.management.deleteConfirmMessage"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteTenantMutation.mutateAsync(tenantId);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (error) {
          // Error is already handled by the mutation hook
        }
      },
    });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const totalPages = data?.meta?.total_pages || 1;

  if (error) {
    return (
      <LayoutScopeRoot routeActive="access-management">
        <div className="p-6">
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-danger mb-2">
              {t("tenants.management.errorTitle")}
            </h2>
            <p className="text-danger-500 mb-4">
              {error.message || t("tenants.management.errorMessage")}
            </p>
            <Button
              color="danger"
              variant="flat"
              onPress={() => window.location.reload()}
            >
              {t("tenants.management.retry")}
            </Button>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <>
      <LayoutScopeRoot routeActive="access-management">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("tenants.management.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("tenants.management.description")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={t("tenants.management.searching")}
                className="max-w-md"
              />
            </div>
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={handleCreateClick}
              className="sm:w-auto w-full"
            >
              {t("tenants.management.createButton")}
            </Button>
          </div>

          <TenantTable
            tenants={data?.data || []}
            isLoading={isLoading}
            onEdit={handleEditClick}
            onToggleActive={handleToggleStatus}
            onDelete={handleDeleteClick}
          />

          {!isLoading && data?.data && data.data.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {t("tenants.management.showing", { count: data.data.length, total: data.meta.total })}
              </p>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </LayoutScopeRoot>

      <TenantFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedTenant(undefined);
        }}
        tenant={selectedTenant}
        onSubmit={handleFormSubmit}
        isLoading={
          createTenantMutation.isPending || updateTenantMutation.isPending
        }
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.variant === "danger" ? t("tenants.management.confirmDelete") : t("tenants.management.confirmAction")}
        isLoading={
          toggleStatusMutation.isPending || deleteTenantMutation.isPending
        }
      />
    </>
  );
}
