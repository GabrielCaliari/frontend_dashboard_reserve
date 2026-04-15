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
import { useTranslations } from "next-intl";
import {
  userSchema,
  type UpdateUserFormData,
} from "@/src/shared/schemas/access-management/user-schema";
import { User } from "@/src/shared/domain/types/@access-management";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSubmit: (data: UpdateUserFormData) => Promise<void>;
  isLoading?: boolean;
}

export function UserFormModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading = false,
}: UserFormModalProps) {
  const t = useTranslations("accessManagement.userForm");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone_number: user.phone_number || "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: user.name,
        email: user.email,
        phone_number: user.phone_number || "",
      });
    }
  }, [isOpen, user, reset]);

  const handleFormSubmit = async (data: UpdateUserFormData) => {
    try {
      await onSubmit(data);
      handleClose();
    } catch {}
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
            <h2 className="text-xl font-semibold">{t("editTitle")}</h2>
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
              <Input
                label={t("phoneLabel")}
                placeholder={t("phonePlaceholder")}
                {...register("phone_number")}
                isInvalid={!!errors.phone_number}
                errorMessage={errors.phone_number?.message}
                autoComplete="tel"
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
              {t("saveChanges")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
