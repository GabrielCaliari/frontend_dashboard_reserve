"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import UserTable from "@/src/components/access-management/users/UserTable";
import { UserFormModal } from "@/src/components/access-management/users/UserFormModal";
import { SearchInput } from "@/src/components/access-management/shared/search-input";
import { PaginationControls } from "@/src/components/access-management/shared/pagination-controls";
import { ConfirmationDialog } from "@/src/components/access-management/shared/confirmation-dialog";
import {
  StatusFilterControl,
  type StatusFilter,
} from "@/src/components/access-management/shared/status-filter";
import { Breadcrumbs } from "@/src/components/access-management/shared/breadcrumbs";
import {
  useUsers,
  useUpdateUser,
  useDeactivateUser,
  useDeleteUser,
} from "@/src/common/hooks/access-management/useUsers";
import type {
  User,
  UpdateUserDto,
} from "@/src/shared/domain/types/@access-management";
import type { UpdateUserFormData } from "@/src/shared/schemas/access-management/user-schema";
import { Button } from "@heroui/react";

export default function UserListPage() {
  const router = useRouter();
  const t = useTranslations("accessManagement");

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
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

  const { data, isLoading, error } = useUsers({
    page: currentPage,
    perPage,
    search: searchTerm || undefined,
  });
  const updateUserMutation = useUpdateUser();
  const deactivateUserMutation = useDeactivateUser();
  const deleteUserMutation = useDeleteUser();

  const filteredUsers = (data?.data || []).filter((u) => {
    if (statusFilter === "active") return u.is_active;
    if (statusFilter === "inactive") return !u.is_active;
    return true;
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFormSubmit = async (formData: UpdateUserFormData) => {
    if (!selectedUser) return;
    try {
      await updateUserMutation.mutateAsync({
        id: selectedUser.id,
        data: formData as UpdateUserDto,
      });
      setIsFormModalOpen(false);
      setSelectedUser(undefined);
    } catch {}
  };

  const handleDeactivate = (userId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t("users.management.deactivateConfirmTitle"),
      message: t("users.management.deactivateConfirmMessage"),
      variant: "warning",
      onConfirm: async () => {
        try {
          await deactivateUserMutation.mutateAsync(userId);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch {}
      },
    });
  };

  const handleDelete = (userId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t("users.management.deleteConfirmTitle"),
      message: t("users.management.deleteConfirmMessage"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteUserMutation.mutateAsync(userId);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch {}
      },
    });
  };

  if (error) {
    return (
      <LayoutScopeRoot routeActive="users">
        <div className="p-6">
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-danger mb-2">
              {t("users.management.errorTitle")}
            </h2>
            <p className="text-danger-500 mb-4">
              {error.message || t("users.management.errorMessage")}
            </p>
            <Button
              color="danger"
              variant="flat"
              onPress={() => window.location.reload()}
            >
              {t("users.management.retry")}
            </Button>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <>
      <LayoutScopeRoot routeActive="users">
        <div className="p-6">
          <Breadcrumbs
            items={[
              { label: t("breadcrumbs.dashboard"), href: "/dashboard" },
              { label: t("breadcrumbs.accessManagement") },
              { label: t("breadcrumbs.users") },
            ]}
          />

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {t("users.management.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("users.management.description")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={t("users.management.searching")}
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
          </div>

          <UserTable
            users={filteredUsers}
            isLoading={isLoading}
            onEdit={(user) => {
              setSelectedUser(user);
              setIsFormModalOpen(true);
            }}
            onRowClick={(id) =>
              router.push(`/dashboard/access-management/users/${id}`)
            }
            onDeactivate={handleDeactivate}
            onDelete={handleDelete}
          />

          {!isLoading && filteredUsers.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {t("users.management.showing", {
                  count: filteredUsers.length,
                  total: data?.meta.total || 0,
                })}
              </p>
              <PaginationControls
                currentPage={currentPage}
                totalPages={data?.meta.total_pages || 1}
                onPageChange={(p) => setCurrentPage(p)}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </LayoutScopeRoot>

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

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText={
          confirmDialog.variant === "danger"
            ? t("users.management.confirmDelete")
            : t("users.management.confirmAction")
        }
        isLoading={
          deactivateUserMutation.isPending || deleteUserMutation.isPending
        }
      />
    </>
  );
}
