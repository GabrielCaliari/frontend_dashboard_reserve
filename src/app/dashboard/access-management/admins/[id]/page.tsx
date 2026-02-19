"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Chip, Spinner, Skeleton } from "@nextui-org/react";
import { ArrowLeft, Edit, Power, Trash2, Calendar, Mail, User, Shield, CheckCircle, XCircle } from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AdminFormModal } from "@/src/components/access-management/admins/AdminFormModal";
import { ConfirmationDialog } from "@/src/components/access-management/shared/confirmation-dialog";
import {
  useAdminById,
  useUpdateAdmin,
  useToggleAdminStatus,
  useDeleteAdmin,
} from "@/src/common/hooks/access-management/useAdmins";
import type { 
  UpdateAdminDto, 
  Admin,
  AdminRole
} from "@/src/common/@types/@access-management";
import type { UpdateAdminFormData } from "@/src/common/schemas/access-management/admin-schema";
import { toast } from "react-hot-toast";
import type { UpdateAdminFormData } from "@/src/common/schemas/access-management/admin-schema";
import { toast } from "react-hot-toast";

/**
 * AdminDetailPage Component
 * 
 * Displays detailed information about a specific admin including:
 * - Basic admin information (id, name, email, role, status)
 * - Timestamps (created_at, updated_at)
 * - List of assigned tenants with roles
 * 
 * Features:
 * - Loading skeleton during data fetch
 * - Error state with retry option
 * - Empty state when admin has no assigned tenants
 * - Back button to return to admin list
 * - Responsive layout with NextUI components
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
export default function AdminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = Number(params.id);

  // Modal and confirmation dialog state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  // Fetch admin details with assigned tenants
  const { data: admin, isLoading, error } = useAdminById({ id: adminId });

  // Mutations
  const updateAdminMutation = useUpdateAdmin();
  const toggleStatusMutation = useToggleAdminStatus();
  const deleteAdminMutation = useDeleteAdmin();

  // Get current logged-in admin ID (placeholder - replace with actual auth context)
  const currentAdminId = 1; // TODO: Get from auth context

  /**
   * Navigate back to admin list
   */
  const handleBack = () => {
    router.push("/dashboard/access-management/admins");
  };

  /**
   * Open edit modal
   */
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  /**
   * Handle edit form submission
   */
  const handleEditSubmit = async (formData: UpdateAdminFormData) => {
    if (!admin) return;

    try {
      const updateData: UpdateAdminDto = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      // Add password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      await updateAdminMutation.mutateAsync({
        id: admin.id,
        data: updateData,
      });

      setIsEditModalOpen(false);
    } catch (error) {
      // Error is already handled by the mutation hook with toast
      throw error; // Re-throw to keep modal open
    }
  };

  /**
   * Handle toggle admin status (activate/deactivate)
   */
  const handleToggleStatus = () => {
    if (!admin) return;

    // Prevent self-deactivation
    if (admin.id === currentAdminId && admin.is_active) {
      toast.error("You cannot deactivate your own account");
      return;
    }

    const action = admin.is_active ? "deactivate" : "activate";
    const actionTitle = admin.is_active ? "Deactivate Admin" : "Activate Admin";
    const actionMessage = admin.is_active
      ? "Are you sure you want to deactivate this admin? They will lose access to the system."
      : "Are you sure you want to activate this admin? They will regain access to the system.";

    setConfirmDialog({
      isOpen: true,
      title: actionTitle,
      message: actionMessage,
      variant: admin.is_active ? "warning" : "default",
      onConfirm: async () => {
        try {
          await toggleStatusMutation.mutateAsync({ 
            id: admin.id, 
            isActive: admin.is_active 
          });
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
  const handleDeleteClick = () => {
    if (!admin) return;

    // Prevent self-deletion
    if (admin.id === currentAdminId) {
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
          await deleteAdminMutation.mutateAsync(admin.id);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          // Navigate back to list after successful deletion
          router.push("/dashboard/access-management/admins");
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

  /**
   * Format date string to readable format
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Get role color for chip display
   */
  const getRoleColor = (role: AdminRole): "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (role) {
      case AdminRole.super_admin:
        return "danger";
      case AdminRole.owner:
        return "warning";
      case AdminRole.manager:
        return "primary";
      case AdminRole.editor:
        return "secondary";
      case AdminRole.viewer:
        return "success";
      default:
        return "primary";
    }
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <LayoutScopeRoot routeActive="access-management">
        <div className="p-6">
          {/* Back Button Skeleton */}
          <Skeleton className="w-32 h-10 rounded-lg mb-6" />

          {/* Header Skeleton */}
          <div className="mb-6">
            <Skeleton className="w-64 h-8 rounded-lg mb-2" />
            <Skeleton className="w-96 h-5 rounded-lg" />
          </div>

          {/* Admin Info Card Skeleton */}
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="w-48 h-6 rounded-lg" />
            </CardHeader>
            <CardBody className="space-y-4">
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-full h-6 rounded-lg" />
              <Skeleton className="w-full h-6 rounded-lg" />
            </CardBody>
          </Card>

          {/* Tenants Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="w-48 h-6 rounded-lg" />
            </CardHeader>
            <CardBody>
              <Skeleton className="w-full h-20 rounded-lg" />
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (error) {
    return (
      <LayoutScopeRoot routeActive="access-management">
        <div className="p-6">
          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={handleBack}
            className="mb-6"
          >
            Back to Admins
          </Button>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-500 mb-2">
              Error Loading Admin Details
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

  // ============================================================================
  // No Data State
  // ============================================================================

  if (!admin) {
    return (
      <LayoutScopeRoot routeActive="access-management">
        <div className="p-6">
          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={handleBack}
            className="mb-6"
          >
            Back to Admins
          </Button>

          <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-warning-500 mb-2">
              Admin Not Found
            </h2>
            <p className="text-warning-400 mb-4">
              The requested admin could not be found.
            </p>
            <Button
              color="warning"
              variant="flat"
              onPress={handleBack}
            >
              Return to Admin List
            </Button>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <>
      <LayoutScopeRoot routeActive="access-management">
        <div className="p-6">
          {/* Back Button */}
          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={handleBack}
            className="mb-6"
          >
            Back to Admins
          </Button>

          {/* Header with Action Buttons */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Admin Details
              </h1>
              <p className="text-muted-foreground">
                View detailed information about this admin account
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                color="primary"
                variant="flat"
                startContent={<Edit className="w-4 h-4" />}
                onPress={handleEditClick}
                isDisabled={isLoading || !admin}
              >
                Edit
              </Button>
              
              <Button
                color={admin?.is_active ? "warning" : "success"}
                variant="flat"
                startContent={<Power className="w-4 h-4" />}
                onPress={handleToggleStatus}
                isDisabled={isLoading || !admin}
              >
                {admin?.is_active ? "Deactivate" : "Activate"}
              </Button>
              
              <Button
                color="danger"
                variant="flat"
                startContent={<Trash2 className="w-4 h-4" />}
                onPress={handleDeleteClick}
                isDisabled={isLoading || !admin}
              >
                Delete
              </Button>
            </div>
          </div>

        {/* Admin Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">Admin Information</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* ID */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium">ID:</div>
              <div className="flex-1 text-foreground">{admin.id}</div>
            </div>

            {/* Name */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Name:
              </div>
              <div className="flex-1 text-foreground font-medium">{admin.name}</div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email:
              </div>
              <div className="flex-1 text-foreground">{admin.email}</div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role:
              </div>
              <div className="flex-1">
                <Chip
                  color={getRoleColor(admin.role)}
                  variant="flat"
                  size="sm"
                >
                  {admin.role.replace("_", " ").toUpperCase()}
                </Chip>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium">Status:</div>
              <div className="flex-1">
                <Chip
                  color={admin.is_active ? "success" : "danger"}
                  variant="flat"
                  size="sm"
                  startContent={
                    admin.is_active ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )
                  }
                >
                  {admin.is_active ? "Active" : "Inactive"}
                </Chip>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Created:
              </div>
              <div className="flex-1 text-foreground">{formatDate(admin.created_at)}</div>
            </div>

            {/* Updated At */}
            <div className="flex items-start gap-3">
              <div className="w-32 text-muted-foreground font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Updated:
              </div>
              <div className="flex-1 text-foreground">{formatDate(admin.updated_at)}</div>
            </div>
          </CardBody>
        </Card>

        {/* Assigned Tenants Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Assigned Tenants</h2>
          </CardHeader>
          <CardBody>
            {admin.tenants && admin.tenants.length > 0 ? (
              <div className="space-y-3">
                {admin.tenants.map((relationship) => (
                  <div
                    key={relationship.tenant_id}
                    className="flex items-center justify-between p-4 bg-content2 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {relationship.tenant?.name || "Unknown Tenant"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Slug: {relationship.tenant?.slug || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Chip
                        color={getRoleColor(relationship.role)}
                        variant="flat"
                        size="sm"
                      >
                        {relationship.role.replace("_", " ").toUpperCase()}
                      </Chip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-2">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No Assigned Tenants</p>
                  <p className="text-sm mt-1">
                    This admin has not been assigned to any tenants yet.
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </LayoutScopeRoot>

    {/* Admin Form Modal (Edit) */}
    <AdminFormModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      admin={admin}
      onSubmit={handleEditSubmit}
      isLoading={updateAdminMutation.isPending}
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
