"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea } from "@nextui-org/react";
import { User, Mail, Link as LinkIcon, FileText } from "lucide-react";
import type { Author } from "@/src/common/@types/@cms-author";
import type { CreateAuthorDto, UpdateAuthorDto } from "@/src/common/services/cms-author-service";
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
      email: author?.email || "",
      bio: author?.bio || "",
      avatar_url: author?.avatar_url || "",
    },
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const email = watch("email");
  const bio = watch("bio");
  const avatarUrl = watch("avatar_url");

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

      <Input
        label="Email"
        placeholder="author@example.com"
        type="email"
        isDisabled={isSubmitting}
        isInvalid={!!errors.email}
        errorMessage={errors.email?.message}
        startContent={<Mail className="w-4 h-4 text-default-400" />}
        variant="bordered"
        {...register("email")}
        description={`${(email?.length || 0)}/255 characters`}
      />

      <Textarea
        label="Bio"
        placeholder="Brief biography or description"
        isDisabled={isSubmitting}
        isInvalid={!!errors.bio}
        errorMessage={errors.bio?.message}
        startContent={<FileText className="w-4 h-4 text-default-400" />}
        variant="bordered"
        minRows={3}
        maxRows={6}
        {...register("bio")}
        description={`${(bio?.length || 0)}/1000 characters`}
      />

      <Input
        label="Avatar URL"
        placeholder="https://example.com/avatar.jpg"
        type="url"
        isDisabled={isSubmitting}
        isInvalid={!!errors.avatar_url}
        errorMessage={errors.avatar_url?.message}
        startContent={<LinkIcon className="w-4 h-4 text-default-400" />}
        variant="bordered"
        {...register("avatar_url")}
        description={`${(avatarUrl?.length || 0)}/500 characters`}
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
