"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/src/presentation/components/atoms/reserve/modal";
import { useEffect } from "react";
import {
  createTenantSchema,
  updateTenantSchema,
  type CreateTenantFormData,
  type UpdateTenantFormData,
} from "@/src/shared/schemas/access-management/tenant-schema";
import { Tenant } from "@/src/shared/domain/types/@access-management";
import { useTranslations } from "next-intl";

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant; // undefined for create, defined for edit
  onSubmit: (
    data: CreateTenantFormData | UpdateTenantFormData,
  ) => Promise<void>;
  isLoading?: boolean;
}

export function TenantFormModal({
  isOpen,
  onClose,
  tenant,
  onSubmit,
  isLoading = false,
}: TenantFormModalProps) {
  const t = useTranslations("accessManagement.tenants.form");
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
    data: CreateTenantFormData | UpdateTenantFormData,
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
              {isEditMode ? t("editTitle") : t("createTitle")}
            </h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label={t("nameLabel")}
                placeholder={t("namePlaceholder")}
                {...register("name")}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
                isRequired
                autoComplete="organization"
              />

              <Input
                label={t("slugLabel")}
                placeholder={t("slugPlaceholder")}
                {...register("slug")}
                isInvalid={!!errors.slug}
                errorMessage={errors.slug?.message}
                isRequired
                description={t("slugDescription")}
              />

              <Input
                label={t("domainLabel")}
                placeholder={t("domainPlaceholder")}
                {...register("domain")}
                isInvalid={!!errors.domain}
                errorMessage={errors.domain?.message}
                isRequired
                description={t("domainDescription")}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={handleClose}
              isDisabled={isSubmitting || isLoading}
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
