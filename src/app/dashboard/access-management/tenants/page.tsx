"use client";

import { useState } from "react";
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

/**
 * TenantListPage Component
 * 
 * Main page for tenant management with CRUD operations.
 * 
 * Features:
 * - Paginated list of tenants with search functionality
 * - Create new tenant with name, slug, and domain
 * - Edit existing tenant information
 * - Activate/deactivate tenant accounts
 * - Delete tenant accounts with confirmation
 * - Loading and error states
 * - Toast notifications for user feedback
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 17.1, 17.2, 17.3
 */
export default function TenantListPage() {
  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const perPage = 10;

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>(undefined);

  // Confirmation dialog state
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

  // Fetch tenants with pagination and search
  const { data, isLoading, error } = useTenants({
    page: currentPage,
    perPage,
    search: searchTerm || undefined,
  });

  // Mutations
  const createTenantMutation = useCreateTenant();
  const updateTenantMutation = useUpdateTenant();
  const toggleStatusMutation = useToggleTenantStatus();
  const deleteTenantMutation = useDeleteTenant();

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Handle search input change
   */
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  /**
   * Open create tenant modal
   */
  const handleCreateClick = () => {
    setSelectedTenant(undefined);
    setIsFormModalOpen(true);
  };

  /**
   * Open edit tenant modal
   */
  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsFormModalOpen(true);
  };

  /**
   * Handle form submission (create or update)
   */
  const handleFormSubmit = async (
    formData: CreateTenantFormData | UpdateTenantFormData
  ) => {
    try {
      if (selectedTenant) {
        // Update existing tenant
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
        // Create new tenant
        const createData = formData as CreateTenantFormData;
        await createTenantMutation.mutateAsync(createData);
      }

      setIsFormModalOpen(false);
      setSelectedTenant(undefined);
    } catch (error) {
      // Error is already handled by the mutation hooks with toast
      throw error; // Re-throw to keep modal open
    }
  };

  /**
   * Handle toggle tenant status (activate/deactivate)
   */
  const handleToggleStatus = (tenantId: number, isActive: boolean) => {
    const action = isActive ? "deactivate" : "activate";
    const actionTitle = isActive ? "Deactivate Tenant" : "Activate Tenant";
    const actionMessage = isActive
      ? "Are you sure you want to deactivate this tenant? All associated users will lose access to the system."
      : "Are you sure you want to activate this tenant? All associated users will regain access to the system.";

    setConfirmDialog({
      isOpen: true,
      title: actionTitle,
      message: actionMessage,
      variant: isActive ? "warning" : "default",
      onConfirm: async () => {
        try {
          await toggleStatusMutation.mutateAsync({ id: tenantId, isActive });
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          // Error is already handled by the mutation hook
        }
      },
    });
  };

  /**
   * Handle delete tenant
   */
  const handleDeleteClick = (tenantId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Tenant",
      message:
        "Are you sure you want to delete this tenant? This action cannot be undone and will permanently remove the tenant and all associated data.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteTenantMutation.mutateAsync(tenantId);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          // Error is already handled by the mutation hook
        }
      },
    });
  };

  /**
   * Close confirmation dialog
   */
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  // ============================================================================
  // Render
  // ============================================================================

  // Calculate total pages
  const totalPages = data?.meta?.total_pages || 1;

  // Handle error state
  if (error) {
    return (
      <LayoutScopeRoot routeActive="access-management">
        <div className="p-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-500 mb-2">
              Error Loading Tenants
            </h2>
            <p className="text-red-400 mb-4">
              {error.message || "Failed to load tenant data. Please try again."}
            </p>
            <Button
              color="danger"
              variant="flat"
              onPress={() => window.location.reload()}
            >
              Retry
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
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Tenant Management
            </h1>
            <p className="text-muted-foreground">
              Manage tenant organizations, domains, and access
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name, slug, or domain..."
                className="max-w-md"
              />
            </div>
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={handleCreateClick}
              className="sm:w-auto w-full"
            >
              Create Tenant
            </Button>
          </div>

          {/* Tenant Table */}
          <div className="bg-content1 rounded-lg border border-border">
            <TenantTable
              tenants={data?.data || []}
              isLoading={isLoading}
              onEdit={handleEditClick}
              onToggleActive={handleToggleStatus}
              onDelete={handleDeleteClick}
            />
          </div>

          {/* Pagination */}
          {!isLoading && data?.data && data.data.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {data.data.length} of {data.meta.total} tenants
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

      {/* Tenant Form Modal (Create/Edit) */}
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

      {/* Confirmation Dialog (Delete/Deactivate) */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.variant === "danger" ? "Delete" : "Confirm"}
        isLoading={
          toggleStatusMutation.isPending || deleteTenantMutation.isPending
        }
      />
    </>
  );
}
