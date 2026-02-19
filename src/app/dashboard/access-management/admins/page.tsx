"use client";

import { useState } from "react";
import { Button } from "@nextui-org/react";
import { Plus } from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import AdminTable from "@/src/components/access-management/admins/AdminTable";
import { AdminFormModal } from "@/src/components/access-management/admins/AdminFormModal";
import { SearchInput } from "@/src/components/access-management/shared/search-input";
import { PaginationControls } from "@/src/components/access-management/shared/pagination-controls";
import { ConfirmationDialog } from "@/src/components/access-management/shared/confirmation-dialog";
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  useToggleAdminStatus,
  useDeleteAdmin,
} from "@/src/common/hooks/access-management/useAdmins";
import type {
  Admin,
  CreateAdminDto,
  UpdateAdminDto,
} from "@/src/common/@types/@access-management";
import type {
  CreateAdminFormData,
  UpdateAdminFormData,
} from "@/src/common/schemas/access-management/admin-schema";
import { toast } from "react-hot-toast";

/**
 * AdminListPage Component
 * 
 * Main page for admin management with CRUD operations.
 * 
 * Features:
 * - Paginated list of admins with search functionality
 * - Create new admin with role selection
 * - Edit existing admin information
 * - Activate/deactivate admin accounts
 * - Delete admin accounts with confirmation
 * - Self-action prevention (cannot deactivate/delete own account)
 * - Loading and error states
 * - Toast notifications for user feedback
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1-2.9, 
 *            4.1-4.6, 5.1-5.8, 6.1-6.5, 7.1-7.4
 */
export default function AdminListPage() {
  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const perPage = 10;

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | undefined>(undefined);

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

  // Fetch admins with pagination and search
  const { data, isLoading, error } = useAdmins({
    page: currentPage,
    perPage,
    search: searchTerm || undefined,
  });

  // Mutations
  const createAdminMutation = useCreateAdmin();
  const updateAdminMutation = useUpdateAdmin();
  const toggleStatusMutation = useToggleAdminStatus();
  const deleteAdminMutation = useDeleteAdmin();

  // Get current logged-in admin ID (you may need to adjust this based on your auth implementation)
  // For now, we'll use a placeholder - replace with actual auth context
  const currentAdminId = 1; // TODO: Get from auth context

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
   * Open create admin modal
   */
  const handleCreateClick = () => {
    setSelectedAdmin(undefined);
    setIsFormModalOpen(true);
  };

  /**
   * Open edit admin modal
   */
  const handleEditClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsFormModalOpen(true);
  };

  /**
   * Handle form submission (create or update)
   */
  const handleFormSubmit = async (
    formData: CreateAdminFormData | UpdateAdminFormData
  ) => {
    try {
      if (selectedAdmin) {
        // Update existing admin
        const updateData: UpdateAdminDto = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };

        // Add password if provided
        if ("password" in formData && formData.password) {
          updateData.password = formData.password;
        }

        await updateAdminMutation.mutateAsync({
          id: selectedAdmin.id,
          data: updateData,
        });
      } else {
        // Create new admin
        const createData = formData as CreateAdminFormData;
        await createAdminMutation.mutateAsync(createData);
      }

      setIsFormModalOpen(false);
      setSelectedAdmin(undefined);
    } catch (error) {
      // Error is already handled by the mutation hooks with toast
      throw error; // Re-throw to keep modal open
    }
  };

  /**
   * Handle toggle admin status (activate/deactivate)
   */
  const handleToggleStatus = (adminId: number, isActive: boolean) => {
    // Prevent self-deactivation
    if (adminId === currentAdminId && isActive) {
      toast.error("You cannot deactivate your own account");
      return;
    }

    const action = isActive ? "deactivate" : "activate";
    const actionTitle = isActive ? "Deactivate Admin" : "Activate Admin";
    const actionMessage = isActive
      ? "Are you sure you want to deactivate this admin? They will lose access to the system."
      : "Are you sure you want to activate this admin? They will regain access to the system.";

    setConfirmDialog({
      isOpen: true,
      title: actionTitle,
      message: actionMessage,
      variant: isActive ? "warning" : "default",
      onConfirm: async () => {
        try {
          await toggleStatusMutation.mutateAsync({ id: adminId, isActive });
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          // Error is already handled by the mutation hook
        }
      },
    });
  };

  /**
   * Handle delete admin
   */
  const handleDeleteClick = (adminId: number) => {
    // Prevent self-deletion
    if (adminId === currentAdminId) {
      toast.error("You cannot delete your own account");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Delete Admin",
      message:
        "Are you sure you want to delete this admin? This action cannot be undone and will permanently remove the admin and all associated data.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteAdminMutation.mutateAsync(adminId);
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
              Error Loading Admins
            </h2>
            <p className="text-red-400 mb-4">
              {error.message || "Failed to load admin data. Please try again."}
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
              Admin Management
            </h1>
            <p className="text-muted-foreground">
              Manage admin accounts, roles, and permissions
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name or email..."
                className="max-w-md"
              />
            </div>
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={handleCreateClick}
              className="sm:w-auto w-full"
            >
              Create Admin
            </Button>
          </div>

          {/* Admin Table */}
          <div className="bg-content1 rounded-lg border border-border">
            <AdminTable
              admins={data?.data || []}
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
                Showing {data.data.length} of {data.meta.total} admins
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

      {/* Admin Form Modal (Create/Edit) */}
      <AdminFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedAdmin(undefined);
        }}
        admin={selectedAdmin}
        onSubmit={handleFormSubmit}
        isLoading={
          createAdminMutation.isPending || updateAdminMutation.isPending
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
          toggleStatusMutation.isPending || deleteAdminMutation.isPending
        }
      />
    </>
  );
}
