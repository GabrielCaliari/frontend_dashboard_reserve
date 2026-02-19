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
  userSchema,
  type UpdateUserFormData,
} from "@/src/common/schemas/access-management/user-schema";
import { User } from "@/src/common/@types/@access-management";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User; // Always defined - users are only edited, not created
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
    },
  });

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: user.name,
        email: user.email,
      });
    }
  }, [isOpen, user, reset]);

  const handleFormSubmit = async (data: UpdateUserFormData) => {
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
            <h2 className="text-xl font-semibold">Edit User</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="Enter user name"
                {...register("name")}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
                isRequired
                autoComplete="name"
              />

              <Input
                label="Email"
                type="email"
                placeholder="user@example.com"
                {...register("email")}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
                isRequired
                autoComplete="email"
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
              Save Changes
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
