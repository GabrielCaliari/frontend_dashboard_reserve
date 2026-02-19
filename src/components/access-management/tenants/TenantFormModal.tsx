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
} from "@nextui-org/react";
import { useEffect } from "react";
import {
  createTenantSchema,
  updateTenantSchema,
  type CreateTenantFormData,
  type UpdateTenantFormData,
} from "@/src/common/schemas/access-management/tenant-schema";
import { Tenant } from "@/src/common/@types/@access-management";

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant; // undefined for create, defined for edit
  onSubmit: (data: CreateTenantFormData | UpdateTenantFormData) => Promise<void>;
  isLoading?: boolean;
}

export function TenantFormModal({
  isOpen,
  onClose,
  tenant,
  onSubmit,
  isLoading = false,
}: TenantFormModalProps) {
  const isEditMode = !!tenant;
  const schema = isEditMode ? updateTenantSchema : createTenantSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateTenantFormData | UpdateTenantFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? {
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
        }
      : {
          name: "",
          slug: "",
          domain: "",
        },
  });

  // Reset form when modal opens/closes or tenant changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && tenant) {
        reset({
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
        });
      } else {
        reset({
          name: "",
          slug: "",
          domain: "",
        });
      }
    }
  }, [isOpen, isEditMode, tenant, reset]);

  const handleFormSubmit = async (
    data: CreateTenantFormData | UpdateTenantFormData
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
              {isEditMode ? "Edit Tenant" : "Create Tenant"}
            </h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="Enter tenant name"
                {...register("name")}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
                isRequired
                autoComplete="organization"
              />

              <Input
                label="Slug"
                placeholder="tenant-slug"
                {...register("slug")}
                isInvalid={!!errors.slug}
                errorMessage={errors.slug?.message}
                isRequired
                description="Lowercase letters, numbers, and hyphens only"
              />

              <Input
                label="Domain"
                placeholder="example.com"
                {...register("domain")}
                isInvalid={!!errors.domain}
                errorMessage={errors.domain?.message}
                isRequired
                description="Valid domain format (e.g., example.com)"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={handleClose}
              isDisabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isSubmitting || isLoading}
            >
              {isEditMode ? "Save Changes" : "Create"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
