"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select, SelectItem, Spinner } from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/src/components/ui/modal";
import { PasswordInput } from "@/src/components/ui/password-input";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  createAdminSchema,
  updateAdminSchema,
  type CreateAdminFormData,
  type UpdateAdminFormData,
  type AdminRoleType,
} from "@/src/shared/schemas/access-management/admin-schema";
import {
  TenantScopedRole,
  type TenantScopedRoleType,
} from "@/src/shared/schemas/access-management/tenant-schema";
import {
  Admin,
  AdminRole,
  TenantAssignmentChange,
} from "@/src/shared/domain/types/@access-management";
import usePermissions from "@/src/shared/hooks/use-permissions";
import { useTenants } from "@/src/common/hooks/access-management/useTenants";
import { fetchAdminById } from "@/src/common/services/access-management/admin-service";
import { Plus, Building2, Trash2 } from "lucide-react";

interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin?: Admin;
  onSubmit: (
    data: CreateAdminFormData | UpdateAdminFormData,
    tenantChanges?: TenantAssignmentChange,
  ) => Promise<string | void>;
  isLoading?: boolean;
}

interface TenantEntry {
  tenant_id: string;
  tenant_name: string;
  role: TenantScopedRoleType;
  isNew?: boolean;
  removed?: boolean;
  originalRole?: TenantScopedRoleType;
}

export function AdminFormModal({
  isOpen,
  onClose,
  admin,
  onSubmit,
  isLoading = false,
}: AdminFormModalProps) {
  const isEditMode = !!admin;
  const t = useTranslations("accessManagement.adminForm");
  const { isSuperAdmin } = usePermissions();
  const schema = isEditMode ? updateAdminSchema : createAdminSchema;

  const allowedRoles = isSuperAdmin
    ? Object.values(AdminRole)
    : [AdminRole.manager, AdminRole.editor, AdminRole.viewer];

  const [fullAdmin, setFullAdmin] = useState<Admin | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  useEffect(() => {
    if (isOpen && isEditMode && admin) {
      setLoadingAdmin(true);
      setFullAdmin(null);
      fetchAdminById(admin.id)
        .then((data) => setFullAdmin(data))
        .catch(() => setFullAdmin(null))
        .finally(() => setLoadingAdmin(false));
    } else {
      setFullAdmin(null);
    }
  }, [isOpen, isEditMode, admin]);

  const resolvedAdmin = isEditMode ? (fullAdmin ?? admin) : undefined;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateAdminFormData | UpdateAdminFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? {
          name: admin.name,
          email: admin.email,
          role: admin.role,
        }
      : {
          name: "",
          email: "",
          password: "",
          role: AdminRole.viewer,
        },
  });

  const selectedRole = watch("role");

  const { data: tenantsData } = useTenants({
    perPage: 100,
    enabled: isOpen && isSuperAdmin,
  });
  const allTenants = tenantsData?.data ?? [];

  const [tenantEntries, setTenantEntries] = useState<TenantEntry[]>([]);
  const [addingTenant, setAddingTenant] = useState(false);
  const [selectedNewTenant, setSelectedNewTenant] = useState<string>("");
  const [selectedNewRole, setSelectedNewRole] = useState<TenantScopedRoleType>(
    AdminRole.viewer,
  );

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && resolvedAdmin) {
        reset({
          name: resolvedAdmin.name,
          email: resolvedAdmin.email,
          role: resolvedAdmin.role,
        });
        setTenantEntries(
          (resolvedAdmin.tenants ?? [])
            .filter((rel) => rel.tenant)
            .map((rel) => ({
              tenant_id: rel.tenant_id,
              tenant_name: rel.tenant?.name ?? "Unknown",
              role: (rel.role as TenantScopedRoleType) ?? AdminRole.viewer,
              originalRole:
                (rel.role as TenantScopedRoleType) ?? AdminRole.viewer,
            })),
        );
      } else if (!isEditMode) {
        reset({
          name: "",
          email: "",
          password: "",
          role: AdminRole.viewer,
        });
        setTenantEntries([]);
      }
      setAddingTenant(false);
      setSelectedNewTenant("");
      setSelectedNewRole(AdminRole.viewer);
    }
  }, [isOpen, isEditMode, resolvedAdmin, reset]);

  const assignedTenantIds = useMemo(
    () =>
      new Set(tenantEntries.filter((e) => !e.removed).map((e) => e.tenant_id)),
    [tenantEntries],
  );

  const availableTenants = useMemo(
    () => allTenants.filter((t) => !assignedTenantIds.has(t.id)),
    [allTenants, assignedTenantIds],
  );

  const computeTenantChanges = useCallback((): TenantAssignmentChange => {
    const add: TenantAssignmentChange["add"] = [];
    const remove: TenantAssignmentChange["remove"] = [];
    const updateRole: TenantAssignmentChange["updateRole"] = [];

    for (const entry of tenantEntries) {
      if (entry.removed && !entry.isNew) {
        remove.push(entry.tenant_id);
      } else if (entry.isNew && !entry.removed) {
        add.push({ tenant_id: entry.tenant_id, role: entry.role });
      } else if (
        !entry.isNew &&
        !entry.removed &&
        entry.originalRole !== undefined &&
        entry.originalRole !== entry.role
      ) {
        updateRole.push({ tenant_id: entry.tenant_id, role: entry.role });
      }
    }

    return { add, remove, updateRole };
  }, [tenantEntries]);

  const hasTenantChanges = useMemo(() => {
    const changes = computeTenantChanges();
    return (
      changes.add.length > 0 ||
      changes.remove.length > 0 ||
      changes.updateRole.length > 0
    );
  }, [computeTenantChanges]);

  const handleFormSubmit = async (
    data: CreateAdminFormData | UpdateAdminFormData,
  ) => {
    try {
      const tenantChanges =
        isSuperAdmin && hasTenantChanges ? computeTenantChanges() : undefined;
      await onSubmit(data, tenantChanges);
      handleClose();
    } catch (error) {}
  };

  const handleClose = () => {
    reset();
    setTenantEntries([]);
    setAddingTenant(false);
    onClose();
  };

  const handleAddTenant = () => {
    if (!selectedNewTenant) return;
    const tenant = allTenants.find((t) => t.id === selectedNewTenant);
    if (!tenant) return;

    setTenantEntries((prev) => [
      ...prev,
      {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        role: selectedNewRole,
        isNew: true,
      },
    ]);
    setSelectedNewTenant("");
    setSelectedNewRole(AdminRole.viewer);
    setAddingTenant(false);
  };

  const handleRemoveTenant = (tenantId: string) => {
    setTenantEntries((prev) => {
      const entry = prev.find((e) => e.tenant_id === tenantId);
      if (!entry) return prev;
      if (entry.isNew) {
        return prev.filter((e) => e.tenant_id !== tenantId);
      }
      return prev.map((e) =>
        e.tenant_id === tenantId ? { ...e, removed: !e.removed } : e,
      );
    });
  };

  const handleTenantRoleChange = (
    tenantId: string,
    newRole: TenantScopedRoleType,
  ) => {
    setTenantEntries((prev) =>
      prev.map((e) => (e.tenant_id === tenantId ? { ...e, role: newRole } : e)),
    );
  };

  const visibleEntries = tenantEntries.filter((e) => !e.removed);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>
            <h2 className="text-xl font-semibold">
              {isEditMode ? t("editTitle") : t("createTitle")}
            </h2>
          </ModalHeader>
          <ModalBody>
            {isEditMode && loadingAdmin ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="sm" color="primary" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-4">
                  <Input
                    label={t("nameLabel")}
                    placeholder={t("namePlaceholder")}
                    {...register("name")}
                    isInvalid={!!errors.name}
                    errorMessage={errors.name?.message}
                    isRequired
                    autoComplete="name"
                  />

                  <Input
                    label={t("emailLabel")}
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    {...register("email")}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email?.message}
                    isRequired
                    autoComplete="email"
                  />

                  {!isEditMode && (
                    <PasswordInput
                      label={t("passwordLabel")}
                      placeholder={t("passwordPlaceholder")}
                      {...register("password")}
                      isInvalid={!!errors.password}
                      errorMessage={errors.password?.message}
                      isRequired
                      autoComplete="new-password"
                      description={t("passwordHint")}
                    />
                  )}

                  {isEditMode && (
                    <PasswordInput
                      label={t("passwordEditLabel")}
                      placeholder={t("passwordEditPlaceholder")}
                      {...register("password")}
                      isInvalid={!!errors.password}
                      errorMessage={errors.password?.message}
                      autoComplete="new-password"
                      description={t("passwordEditHint")}
                    />
                  )}

                  <Select
                    label={t("roleLabel")}
                    placeholder={t("rolePlaceholder")}
                    selectedKeys={selectedRole ? [selectedRole] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as AdminRoleType;
                      setValue("role", selected, { shouldValidate: true });
                    }}
                    isInvalid={!!errors.role}
                    errorMessage={errors.role?.message}
                    isRequired
                    description={t("roleHint")}
                  >
                    {allowedRoles.map((value) => (
                      <SelectItem key={value}>
                        {t(`roles.${value}` as any)}
                      </SelectItem>
                    ))}
                  </Select>

                  {selectedRole && (
                    <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg">
                      <p className="text-sm text-foreground-600">
                        {t(`roleDescriptions.${selectedRole}` as any)}
                      </p>
                    </div>
                  )}
                </div>

                {isSuperAdmin && (
                  <div className="space-y-3 pt-3 border-t border-divider">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">
                          {t("tenantAssignmentsTitle")}
                        </h3>
                      </div>
                      <p className="text-xs text-foreground-400 mb-3">
                        {t("tenantAssignmentsHint")}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<Plus className="w-3 h-3" />}
                        onPress={() => setAddingTenant(true)}
                        isDisabled={availableTenants.length === 0}
                      >
                        {t("addTenant")}
                      </Button>
                    </div>

                    {addingTenant && (
                      <div className="p-4 bg-content2 rounded-lg space-y-3 border border-border">
                        <Select
                          label={t("selectTenant")}
                          placeholder={t("selectTenantPlaceholder")}
                          selectedKeys={
                            selectedNewTenant ? [selectedNewTenant] : []
                          }
                          onSelectionChange={(keys) => {
                            const val = Array.from(keys)[0] as string;
                            setSelectedNewTenant(val);
                          }}
                          size="sm"
                        >
                          {availableTenants.map((tenant) => (
                            <SelectItem key={tenant.id}>
                              {tenant.name}
                            </SelectItem>
                          ))}
                        </Select>

                        <div>
                          <Select
                            label={t("tenantRole")}
                            placeholder={t("tenantRolePlaceholder")}
                            selectedKeys={[selectedNewRole]}
                            onSelectionChange={(keys) => {
                              const val = Array.from(
                                keys,
                              )[0] as TenantScopedRoleType;
                              setSelectedNewRole(val);
                            }}
                            size="sm"
                          >
                            {TenantScopedRole.options.map((role) => (
                              <SelectItem key={role}>
                                {t(`tenantRoles.${role}` as any)}
                              </SelectItem>
                            ))}
                          </Select>
                          <p className="text-xs text-foreground-400 mt-1.5">
                            {t("tenantRoleHint")}
                          </p>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => {
                              setAddingTenant(false);
                              setSelectedNewTenant("");
                            }}
                          >
                            {t("cancel")}
                          </Button>
                          <Button
                            size="sm"
                            color="primary"
                            onPress={handleAddTenant}
                            isDisabled={!selectedNewTenant}
                          >
                            {t("confirm")}
                          </Button>
                        </div>
                      </div>
                    )}

                    {visibleEntries.length > 0 ? (
                      <div className="space-y-2">
                        {visibleEntries.map((entry) => (
                          <div
                            key={entry.tenant_id}
                            className="flex items-center justify-between p-3 bg-content2 rounded-lg border border-border"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {entry.tenant_name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <Select
                                selectedKeys={[entry.role]}
                                onSelectionChange={(keys) => {
                                  const val = Array.from(
                                    keys,
                                  )[0] as TenantScopedRoleType;
                                  handleTenantRoleChange(entry.tenant_id, val);
                                }}
                                size="sm"
                                className="w-36"
                                classNames={{
                                  trigger: "min-h-7 h-7",
                                  value: "text-xs",
                                }}
                              >
                                {TenantScopedRole.options.map((role) => (
                                  <SelectItem key={role}>
                                    {t(`tenantRoles.${role}` as any)}
                                  </SelectItem>
                                ))}
                              </Select>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() =>
                                  handleRemoveTenant(entry.tenant_id)
                                }
                                title={t("removeTenant")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-foreground-400">
                        <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{t("noTenantsAssigned")}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={handleClose}
              isDisabled={isSubmitting || isLoading || loadingAdmin}
            >
              {t("cancel")}
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isSubmitting || isLoading}
            >
              {isEditMode ? t("saveChanges") : t("create")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
