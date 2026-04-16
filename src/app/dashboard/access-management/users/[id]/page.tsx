"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Skeleton,
} from "@heroui/react";
import {
  ArrowLeft,
  Edit,
  Power,
  Trash2,
  Calendar,
  Mail,
  User,
  Phone,
  CreditCard,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { UserFormModal } from "@/src/presentation/components/organisms/access-management/users/UserFormModal";
import { ConfirmationDialog } from "@/src/presentation/components/organisms/access-management/shared/confirmation-dialog";
import { Breadcrumbs } from "@/src/presentation/components/organisms/access-management/shared/breadcrumbs";
import { EntityAvatar } from "@/src/presentation/components/organisms/access-management/shared/entity-avatar";
import {
  useUserById,
  useUpdateUser,
  useDeactivateUser,
  useDeleteUser,
} from "@/src/common/hooks/access-management/useUsers";
import type { UpdateUserDto } from "@/src/shared/domain/types/@access-management";
import type { UpdateUserFormData } from "@/src/shared/schemas/access-management/user-schema";
import { formatDate } from "@/src/shared/lib/utils";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const t = useTranslations("accessManagement");

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

  const { data: user, isLoading, error } = useUserById({ id: userId });
  const updateUserMutation = useUpdateUser();
  const deactivateUserMutation = useDeactivateUser();
  const deleteUserMutation = useDeleteUser();

  const handleBack = () => router.push("/dashboard/access-management/users");

  const handleEditSubmit = async (formData: UpdateUserFormData) => {
    if (!user) return;
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: formData as UpdateUserDto,
      });
      setIsEditModalOpen(false);
    } catch {}
  };

  const handleDeactivate = () => {
    if (!user) return;
    setConfirmDialog({
      isOpen: true,
      title: t("users.management.deactivateConfirmTitle"),
      message: t("users.management.deactivateConfirmMessage"),
      variant: "warning",
      onConfirm: async () => {
        try {
          await deactivateUserMutation.mutateAsync(user.id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch {}
      },
    });
  };

  const handleDelete = () => {
    if (!user) return;
    setConfirmDialog({
      isOpen: true,
      title: t("users.management.deleteConfirmTitle"),
      message: t("users.management.deleteConfirmMessage"),
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteUserMutation.mutateAsync(user.id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          router.push("/dashboard/access-management/users");
        } catch {}
      },
    });
  };

  if (isLoading) {
    return (
      <LayoutScopeRoot routeActive="users">
        <div className="p-6">
          <Skeleton className="w-32 h-10 rounded-lg mb-6" />
          <Card>
            <CardBody className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-6 rounded-lg" />
              ))}
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  if (error || !user) {
    return (
      <LayoutScopeRoot routeActive="users">
        <div className="p-6">
          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={handleBack}
            className="mb-6"
          >
            {t("userDetail.backToUsers")}
          </Button>
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-danger mb-2">
              {error
                ? t("userDetail.errorTitle")
                : t("userDetail.userNotFound")}
            </h2>
            <p className="text-danger-500 mb-4">
              {error?.message || t("userDetail.userNotFoundMessage")}
            </p>
            <Button
              color="danger"
              variant="flat"
              onPress={error ? () => window.location.reload() : handleBack}
            >
              {error ? t("userDetail.retry") : t("userDetail.returnToList")}
            </Button>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  const infoFields = [
    {
      icon: <User className="w-4 h-4" />,
      label: t("table.columns.name"),
      value: user.name,
    },
    {
      icon: <Mail className="w-4 h-4" />,
      label: t("table.columns.email"),
      value: user.email,
    },
    {
      icon: <Phone className="w-4 h-4" />,
      label: t("table.columns.phone"),
      value: user.phone_number || "—",
    },
    {
      icon: <CreditCard className="w-4 h-4" />,
      label: "CPF",
      value: user.cpf || "—",
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: t("userDetail.dateOfBirth"),
      value: user.date_of_birth ? formatDate(user.date_of_birth) : "—",
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: t("userDetail.expires"),
      value: user.date_expires_in ? formatDate(user.date_expires_in) : "—",
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: t("userDetail.created"),
      value: formatDate(user.created_at),
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: t("userDetail.updated"),
      value: formatDate(user.updated_at),
    },
  ];

  return (
    <>
      <LayoutScopeRoot routeActive="users">
        <div className="p-6 max-w-4xl">
          <Breadcrumbs
            items={[
              { label: t("breadcrumbs.dashboard"), href: "/dashboard" },
              { label: t("breadcrumbs.accessManagement") },
              {
                label: t("breadcrumbs.users"),
                href: "/dashboard/access-management/users",
              },
              { label: user.name },
            ]}
          />

          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={handleBack}
            className="mb-6"
          >
            {t("userDetail.backToUsers")}
          </Button>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <EntityAvatar name={user.name} size="lg" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {user.name}
                </h1>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <Chip
                  color={user.is_active ? "success" : "danger"}
                  size="sm"
                  variant="flat"
                  className="mt-1"
                  startContent={
                    user.is_active ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )
                  }
                >
                  {user.is_active
                    ? t("table.status.active")
                    : t("table.status.inactive")}
                </Chip>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                color="primary"
                variant="flat"
                startContent={<Edit className="w-4 h-4" />}
                onPress={() => setIsEditModalOpen(true)}
              >
                {t("userDetail.editButton")}
              </Button>
              {user.is_active && (
                <Button
                  color="warning"
                  variant="flat"
                  startContent={<Power className="w-4 h-4" />}
                  onPress={handleDeactivate}
                >
                  {t("table.tooltips.deactivateUser")}
                </Button>
              )}
              <Button
                color="danger"
                variant="flat"
                startContent={<Trash2 className="w-4 h-4" />}
                onPress={handleDelete}
              >
                {t("table.tooltips.deleteUser")}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {t("userDetail.userInformation")}
              </h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {infoFields.map(({ icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 p-3 bg-content2 rounded-lg"
                  >
                    <div className="flex items-center gap-2 w-28 text-muted-foreground text-sm flex-shrink-0">
                      {icon}
                      {label}
                    </div>
                    <div className="text-sm text-foreground">{value}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>

      <UserFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSubmit={handleEditSubmit}
        isLoading={updateUserMutation.isPending}
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
