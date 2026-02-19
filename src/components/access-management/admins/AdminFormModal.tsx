"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { useEffect } from "react";
import {
  createAdminSchema,
  updateAdminSchema,
  type CreateAdminFormData,
  type UpdateAdminFormData,
  type AdminRoleType,
} from "@/src/common/schemas/access-management/admin-schema";
import { Admin, AdminRole } from "@/src/common/@types/@access-management";

interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin?: Admin; // undefined for create, defined for edit
  onSubmit: (data: CreateAdminFormData | UpdateAdminFormData) => Promise<void>;
  isLoading?: boolean;
}

const roleLabels: Record<AdminRole, string> = {
  [AdminRole.super_admin]: "Super Admin",
  [AdminRole.owner]: "Owner",
  [AdminRole.manager]: "Manager",
  [AdminRole.editor]: "Editor",
  [AdminRole.viewer]: "Viewer",
};

const roleDescriptions: Record<AdminRole, string> = {
  [AdminRole.super_admin]: "Full system access and control",
  [AdminRole.owner]: "Manage tenants and admins",
  [AdminRole.manager]: "Manage campaigns and content",
  [AdminRole.editor]: "Create and edit content",
  [AdminRole.viewer]: "Read-only access",
};

export function AdminFormModal({
  isOpen,
  onClose,
  admin,
  onSubmit,
  isLoading = false,
}: AdminFormModalProps) {
  const isEditMode = !!admin;
  const schema = isEditMode ? updateAdminSchema : createAdminSchema;

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

  // Reset form when modal opens/closes or admin changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && admin) {
        reset({
          name: admin.name,
          email: admin.email,
          role: admin.role,
        });
      } else {
        reset({
          name: "",
          email: "",
          password: "",
          role: AdminRole.viewer,
        });
      }
    }
  }, [isOpen, isEditMode, admin, reset]);

  const handleFormSubmit = async (
    data: CreateAdminFormData | UpdateAdminFormData
  ) => {
    try {
      await onSubmit(data);
      handleClose();
    } catch (error) {
      // Error handling is done by the parent component
      // Modal stays open to allow user to correct errors
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>
            <h2 className="text-xl font-semibold">
              {isEditMode ? "Edit Admin" : "Create New Admin"}
            </h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="Enter admin name"
                {...register("name")}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
                isRequired
                autoComplete="name"
              />

              <Input
                label="Email"
                type="email"
                placeholder="admin@example.com"
                {...register("email")}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
                isRequired
                autoComplete="email"
              />

              {!isEditMode && (
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  {...register("password")}
                  isInvalid={!!errors.password}
                  errorMessage={errors.password?.message}
                  isRequired
                  autoComplete="new-password"
                  description="Minimum 8 characters, at least one uppercase letter and one digit"
                />
              )}

              {isEditMode && (
                <Input
                  label="Password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  {...register("password")}
                  isInvalid={!!errors.password}
                  errorMessage={errors.password?.message}
                  autoComplete="new-password"
                  description="Optional: Enter new password to change it"
                />
              )}

              <Select
                label="Role"
                placeholder="Select admin role"
                selectedKeys={selectedRole ? [selectedRole] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as AdminRoleType;
                  setValue("role", selected, { shouldValidate: true });
                }}
                isInvalid={!!errors.role}
                errorMessage={errors.role?.message}
                isRequired
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </Select>

              {selectedRole && (
                <div className="p-3 bg-default-100 rounded-lg">
                  <p className="text-sm text-default-600">
                    {roleDescriptions[selectedRole as AdminRole]}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleClose} isDisabled={isSubmitting || isLoading}>
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isSubmitting || isLoading}
            >
              {isEditMode ? "Update Admin" : "Create Admin"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
