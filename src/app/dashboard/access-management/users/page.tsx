"use client";

import { useState } from "react";
import { Button } from "@nextui-org/react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import UserTable from "@/src/components/access-management/users/UserTable";
import { UserFormModal } from "@/src/components/access-management/users/UserFormModal";
import { SearchInput } from "@/src/components/access-management/shared/search-input";
import { PaginationControls } from "@/src/components/access-management/shared/pagination-controls";
import { ConfirmationDialog } from "@/src/components/access-management/shared/confirmation-dialog";
import {
  useUsers,
  useUpdateUser,
  useDeactivateUser,
  useDeleteUser,
} from "@/src/common/hooks/access-management/useUsers";
import type {
  User,
  UpdateUserDto,
} from "@/src/common/@types/@access-management";
import type {
  UpdateUserFormData,
} from "@/src/common/schemas/access-management/user-schema";

/**
 * UserListPage Component
 * 
 * Main page for user management with edit, deactivate, and delete operations.
 * 
 * Features:
 * - Paginated list of users with search functionality
 * - Edit existing user information (name and email only)
 * - Deactivate user accounts
 * - Delete user accounts with confirmation
 * - Loading and error states
 * - Toast notifications for user feedback
 * 
 * Note: Users are NOT created through this interface. User creation
 * happens through other flows (e.g., registration, invitation).
 * 
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 23.1, 23.2, 23.3
 */
export default function UserListPage() {
  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const perPage = 10;

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

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

  // Fetch users with pagination and search
  const { data, isLoading, error } = useUsers({
    page: currentPage,
    perPage,
    search: searchTerm || undefined,
  });

  // Mutations
  const updateUserMutation = useUpdateUser();
  const deactivateUserMutation = useDeactivateUser();
  const deleteUserMutation = useDeleteUser();

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
   * Open edit user modal
   */
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsFormModalOpen(true);
  };

  /**
   * Handle form submission (update user)
   */
  const handleFormSubmit = async (formData: UpdateUserFormData) => {
    if (!selectedUser) return;

    try {
      const updateData: UpdateUserDto = {
        name: formData.name,
        email: formData.email,
      };

      await updateUserMutation.mutateAsync({
        id: selectedUser.id,
        data: updateData,
      });

      setIsFormModalOpen(false);
      setSelectedUser(undefined);
    } catch (error) {
      // Error is already handled by the mutation hooks with toast
      throw error; // Re-throw to keep modal open
    }
  };

  /**
   * Handle deactivate user
   */
  const handleDeactivateClick = (userId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Deactivate User",
      message:
        "Are you sure you want to deactivate this user? They will lose access to the system.",
      variant: "warning",
      onConfirm: async () => {
        try {
          await deactivateUserMutation.mutateAsync(userId);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          // Error is already handled by the mutation hook
        }
      },
    });
  };

  /**
   * Handle delete user
   */
  const handleDeleteClick = (userId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete User",
      message:
        "Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user and all associated data.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteUserMutation.mutateAsync(userId);
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
              Error Loading Users
            </h2>
            <p className="text-red-400 mb-4">
              {error.message || "Failed to load user data. Please try again."}
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
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage user accounts and access
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
          </div>

          {/* User Table */}
          <div className="bg-content1 rounded-lg border border-border">
            <UserTable
              users={data?.data || []}
              isLoading={isLoading}
              onEdit={handleEditClick}
              onDeactivate={handleDeactivateClick}
              onDelete={handleDeleteClick}
            />
          </div>

          {/* Pagination */}
          {!isLoading && data?.data && data.data.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {data.data.length} of {data.meta.total} users
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

      {/* User Form Modal (Edit Only) */}
      {selectedUser && (
        <UserFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedUser(undefined);
          }}
          user={selectedUser}
          onSubmit={handleFormSubmit}
          isLoading={updateUserMutation.isPending}
        />
      )}

      {/* Confirmation Dialog (Deactivate/Delete) */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.variant === "danger" ? "Delete" : "Confirm"}
        isLoading={
          deactivateUserMutation.isPending || deleteUserMutation.isPending
        }
      />
    </>
  );
}
