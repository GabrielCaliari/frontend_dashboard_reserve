"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea } from "@nextui-org/react";
import { User, FileText } from "lucide-react";
import type { Author } from "@/src/common/@types/@cms-author";
import type { CreateAuthorDto, UpdateAuthorDto } from "@/src/common/@types/@cms-author";
import {
  createAuthorSchema,
  updateAuthorSchema,
  type CreateAuthorInput,
  type UpdateAuthorInput,
} from "@/src/common/schemas/cms-author-schema";

interface AuthorFormProps {
  author?: Author;
  onSubmit: (data: CreateAuthorDto | UpdateAuthorDto) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function AuthorForm({
  author,
  onSubmit,
  onCancel,
  isSubmitting,
}: AuthorFormProps) {
  const isEditMode = !!author;
  const schema = isEditMode ? updateAuthorSchema : createAuthorSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateAuthorInput | UpdateAuthorInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: author?.firstName || "",
      lastName: author?.lastName || "",
      biography: author?.biography || "",
      avatarId: author?.avatarId || "",
    },
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const biography = watch("biography");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          placeholder="Enter first name"
          isRequired={!isEditMode}
          isDisabled={isSubmitting}
          isInvalid={!!errors.firstName}
          errorMessage={errors.firstName?.message}
          startContent={<User className="w-4 h-4 text-default-400" />}
          variant="bordered"
          {...register("firstName")}
          description={`${(firstName?.length || 0)}/100 characters`}
        />

        <Input
          label="Last Name"
          placeholder="Enter last name"
          isRequired={!isEditMode}
          isDisabled={isSubmitting}
          isInvalid={!!errors.lastName}
          errorMessage={errors.lastName?.message}
          startContent={<User className="w-4 h-4 text-default-400" />}
          variant="bordered"
          {...register("lastName")}
          description={`${(lastName?.length || 0)}/100 characters`}
        />
      </div>

      <Textarea
        label="Biography"
        placeholder="Brief biography or description"
        isDisabled={isSubmitting}
        isInvalid={!!errors.biography}
        errorMessage={errors.biography?.message}
        startContent={<FileText className="w-4 h-4 text-default-400" />}
        variant="bordered"
        minRows={3}
        maxRows={6}
        {...register("biography")}
        description={`${(biography?.length || 0)}/1000 characters`}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="bordered"
          onPress={onCancel}
          isDisabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          type="submit"
          isLoading={isSubmitting}
        >
          {isEditMode ? "Update Author" : "Create Author"}
        </Button>
      </div>
    </form>
  );
}
