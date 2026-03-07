"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Button,
  Chip,
} from "@nextui-org/react";
import { MIME_TYPE_GROUPS } from "@/src/common/utils/validate-file";
import type { MediaCollection, CollectionType } from "@/src/common/@types/@cms-media";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255, "Slug must be less than 255 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  type: z.enum(["image", "document", "video", "audio", "mixed"]),
  allowed_mime_types: z.array(z.string()).min(1, "At least one MIME type is required"),
  max_file_size: z.number().min(1, "Max file size must be at least 1 byte"),
  max_file_size_unit: z.enum(["KB", "MB", "GB"]),
  max_items: z.number().optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

interface CollectionFormProps {
  collection?: MediaCollection;
  onSubmit: (data: Omit<CollectionFormData, "max_file_size_unit"> & { max_file_size: number }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const COLLECTION_TYPES: { value: CollectionType; label: string }[] = [
  { value: "image", label: "Images" },
  { value: "document", label: "Documents" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "mixed", label: "Mixed" },
];

const FILE_SIZE_UNITS = [
  { value: "KB", multiplier: 1024 },
  { value: "MB", multiplier: 1024 * 1024 },
  { value: "GB", multiplier: 1024 * 1024 * 1024 },
];

const COMMON_MIME_TYPES = [
  { value: "image/jpeg", label: "JPEG Image" },
  { value: "image/png", label: "PNG Image" },
  { value: "image/gif", label: "GIF Image" },
  { value: "image/webp", label: "WebP Image" },
  { value: "image/svg+xml", label: "SVG Image" },
  { value: "application/pdf", label: "PDF Document" },
  { value: "application/msword", label: "Word Document (.doc)" },
  { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word Document (.docx)" },
  { value: "video/mp4", label: "MP4 Video" },
  { value: "video/webm", label: "WebM Video" },
];

function bytesToUnit(bytes: number): { value: number; unit: "KB" | "MB" | "GB" } {
  if (bytes >= 1024 * 1024 * 1024) {
    return { value: bytes / (1024 * 1024 * 1024), unit: "GB" };
  }
  if (bytes >= 1024 * 1024) {
    return { value: bytes / (1024 * 1024), unit: "MB" };
  }
  return { value: bytes / 1024, unit: "KB" };
}

export function CollectionForm({
  collection,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CollectionFormProps) {
  const isEditMode = !!collection;

  const defaultMaxFileSize = collection
    ? bytesToUnit(collection.max_file_size)
    : { value: 10, unit: "MB" as const };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name || "",
      slug: collection?.slug || "",
      description: collection?.description || "",
      type: collection?.type || "image",
      allowed_mime_types: collection?.allowed_mime_types || MIME_TYPE_GROUPS.image,
      max_file_size: defaultMaxFileSize.value,
      max_file_size_unit: defaultMaxFileSize.unit,
      max_items: collection?.max_items,
    },
  });

  const selectedType = watch("type");
  const selectedMimeTypes = watch("allowed_mime_types");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEditMode) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", slug);
    }
  };

  // Update MIME types when collection type changes
  const handleTypeChange = (value: string) => {
    const type = value as CollectionType;
    setValue("type", type);
    setValue("allowed_mime_types", MIME_TYPE_GROUPS[type] || []);
  };

  const handleFormSubmit = (data: CollectionFormData) => {
    const unit = FILE_SIZE_UNITS.find((u) => u.value === data.max_file_size_unit);
    const maxFileSizeBytes = Math.round(data.max_file_size * (unit?.multiplier || 1));

    onSubmit({
      name: data.name,
      slug: data.slug,
      description: data.description,
      type: data.type,
      allowed_mime_types: data.allowed_mime_types,
      max_file_size: maxFileSizeBytes,
      max_items: data.max_items,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Name */}
      <Input
        label="Collection Name"
        placeholder="e.g., Product Images"
        {...register("name")}
        onChange={handleNameChange}
        isInvalid={!!errors.name}
        errorMessage={errors.name?.message}
        isRequired
      />

      {/* Slug */}
      <Input
        label="Slug"
        placeholder="e.g., product-images"
        {...register("slug")}
        isInvalid={!!errors.slug}
        errorMessage={errors.slug?.message}
        description="URL-friendly identifier (lowercase, hyphens only)"
        isRequired
        isDisabled={isEditMode}
      />

      {/* Description */}
      <Textarea
        label="Description"
        placeholder="Optional description for this collection"
        {...register("description")}
        isInvalid={!!errors.description}
        errorMessage={errors.description?.message}
        minRows={2}
      />

      {/* Type */}
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <Select
            label="Collection Type"
            placeholder="Select type"
            selectedKeys={[field.value]}
            onChange={(e) => handleTypeChange(e.target.value)}
            isInvalid={!!errors.type}
            errorMessage={errors.type?.message}
            isRequired
          >
            {COLLECTION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </Select>
        )}
      />

      {/* Allowed MIME Types */}
      <Controller
        name="allowed_mime_types"
        control={control}
        render={({ field }) => (
          <Select
            label="Allowed File Types"
            placeholder="Select allowed MIME types"
            selectedKeys={field.value}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys) as string[];
              field.onChange(selected);
            }}
            isInvalid={!!errors.allowed_mime_types}
            errorMessage={errors.allowed_mime_types?.message}
            selectionMode="multiple"
            isRequired
            renderValue={(items) => (
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <Chip key={item.key} size="sm">
                    {COMMON_MIME_TYPES.find((m) => m.value === item.key)?.label || item.key}
                  </Chip>
                ))}
              </div>
            )}
          >
            {COMMON_MIME_TYPES.map((mimeType) => (
              <SelectItem key={mimeType.value} value={mimeType.value}>
                {mimeType.label}
              </SelectItem>
            ))}
          </Select>
        )}
      />

      {/* Max File Size */}
      <div className="flex gap-4">
        <Input
          label="Max File Size"
          type="number"
          placeholder="10"
          {...register("max_file_size", { valueAsNumber: true })}
          isInvalid={!!errors.max_file_size}
          errorMessage={errors.max_file_size?.message}
          className="flex-1"
          isRequired
        />
        <Controller
          name="max_file_size_unit"
          control={control}
          render={({ field }) => (
            <Select
              label="Unit"
              selectedKeys={[field.value]}
              onChange={(e) => field.onChange(e.target.value)}
              className="w-32"
              isRequired
            >
              {FILE_SIZE_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.value}
                </SelectItem>
              ))}
            </Select>
          )}
        />
      </div>

      {/* Max Items */}
      <Input
        label="Max Items (Optional)"
        type="number"
        placeholder="Leave empty for unlimited"
        {...register("max_items", { valueAsNumber: true })}
        isInvalid={!!errors.max_items}
        errorMessage={errors.max_items?.message}
        description="Maximum number of assets allowed in this collection"
      />

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        <Button variant="flat" onPress={onCancel} isDisabled={isSubmitting}>
          Cancel
        </Button>
        <Button color="primary" type="submit" isLoading={isSubmitting}>
          {isEditMode ? "Update Collection" : "Create Collection"}
        </Button>
      </div>
    </form>
  );
}
