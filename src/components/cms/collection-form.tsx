"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Button,
  Card,
  CardBody,
  Chip,
} from "@nextui-org/react";
import { Save, X } from "lucide-react";
import {
  collectionFormSchema,
  type CollectionFormData,
  MIME_TYPES_BY_CATEGORY,
  FILE_SIZE_UNITS,
} from "@/src/common/schemas/collection-schema";
import type { MediaCollection, CollectionType } from "@/src/common/@types/@cms-media";

interface CollectionFormProps {
  initialData?: MediaCollection;
  onSubmit: (data: CollectionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CollectionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: CollectionFormProps) {
  const t = useTranslations();
  
  // File size state (separate from form for unit conversion)
  const [fileSizeValue, setFileSizeValue] = useState<number>(10);
  const [fileSizeUnit, setFileSizeUnit] = useState<number>(1024 * 1024); // Default: MB

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description || "",
          type: initialData.type,
          allowed_mime_types: initialData.allowed_mime_types,
          max_file_size: initialData.max_file_size,
          max_items: initialData.max_items || null,
        }
      : {
          name: "",
          slug: "",
          description: "",
          type: "images",
          allowed_mime_types: [],
          max_file_size: 10 * 1024 * 1024, // 10 MB default
          max_items: null,
        },
  });

  // Watch type to update available MIME types
  const selectedType = watch("type");
  const selectedMimeTypes = watch("allowed_mime_types");

  // Initialize file size display from initial data
  useEffect(() => {
    if (initialData?.max_file_size) {
      // Determine best unit for display
      const sizeInBytes = initialData.max_file_size;
      if (sizeInBytes >= 1024 * 1024 * 1024) {
        setFileSizeValue(sizeInBytes / (1024 * 1024 * 1024));
        setFileSizeUnit(1024 * 1024 * 1024);
      } else if (sizeInBytes >= 1024 * 1024) {
        setFileSizeValue(sizeInBytes / (1024 * 1024));
        setFileSizeUnit(1024 * 1024);
      } else {
        setFileSizeValue(sizeInBytes / 1024);
        setFileSizeUnit(1024);
      }
    }
  }, [initialData]);

  // Update max_file_size when value or unit changes
  useEffect(() => {
    const sizeInBytes = fileSizeValue * fileSizeUnit;
    setValue("max_file_size", sizeInBytes);
  }, [fileSizeValue, fileSizeUnit, setValue]);

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!initialData) {
      // Only auto-generate slug for new collections
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setValue("slug", slug);
    }
  };

  // Get available MIME types based on selected type
  const availableMimeTypes = MIME_TYPES_BY_CATEGORY[selectedType] || [];

  // Handle MIME type selection
  const handleMimeTypeToggle = (mimeType: string) => {
    const current = selectedMimeTypes || [];
    const updated = current.includes(mimeType)
      ? current.filter((t) => t !== mimeType)
      : [...current, mimeType];
    setValue("allowed_mime_types", updated);
  };

  const handleFormSubmit = async (data: CollectionFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card className="bg-gray-800/50 border border-gray-700">
        <CardBody className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">
            {t("cms.collections.basicInfo") || "Basic Information"}
          </h3>

          {/* Name */}
          <Input
            label={t("cms.collections.nameLabel") || "Collection Name"}
            placeholder={t("cms.collections.namePlaceholder") || "Enter collection name"}
            {...register("name")}
            onChange={handleNameChange}
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message}
            isRequired
            classNames={{
              input: "bg-transparent",
              inputWrapper: "bg-gray-800/50 border-gray-700",
            }}
          />

          {/* Slug */}
          <Input
            label={t("cms.collections.slugLabel") || "Slug"}
            placeholder={t("cms.collections.slugPlaceholder") || "collection-slug"}
            {...register("slug")}
            isInvalid={!!errors.slug}
            errorMessage={errors.slug?.message}
            isRequired
            isDisabled={!!initialData} // Disable slug editing for existing collections
            description={
              initialData
                ? t("cms.collections.slugDisabledHint") || "Slug cannot be changed after creation"
                : t("cms.collections.slugHint") || "Auto-generated from name, lowercase with hyphens"
            }
            classNames={{
              input: "bg-transparent",
              inputWrapper: "bg-gray-800/50 border-gray-700",
            }}
          />

          {/* Description */}
          <Textarea
            label={t("cms.collections.descriptionLabel") || "Description"}
            placeholder={t("cms.collections.descriptionPlaceholder") || "Optional description"}
            {...register("description")}
            isInvalid={!!errors.description}
            errorMessage={errors.description?.message}
            minRows={3}
            classNames={{
              input: "bg-transparent",
              inputWrapper: "bg-gray-800/50 border-gray-700",
            }}
          />

          {/* Type */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                label={t("cms.collections.typeLabel") || "Collection Type"}
                placeholder={t("cms.collections.typePlaceholder") || "Select type"}
                selectedKeys={field.value ? [field.value] : []}
                onChange={(e) => {
                  field.onChange(e.target.value as CollectionType);
                  // Reset MIME types when type changes
                  setValue("allowed_mime_types", []);
                }}
                isInvalid={!!errors.type}
                errorMessage={errors.type?.message}
                isRequired
                classNames={{
                  trigger: "bg-gray-800/50 border-gray-700",
                }}
              >
                <SelectItem key="images" value="images">
                  {t("cms.collections.typeImages") || "Images"}
                </SelectItem>
                <SelectItem key="documents" value="documents">
                  {t("cms.collections.typeDocuments") || "Documents"}
                </SelectItem>
                <SelectItem key="videos" value="videos">
                  {t("cms.collections.typeVideos") || "Videos"}
                </SelectItem>
                <SelectItem key="mixed" value="mixed">
                  {t("cms.collections.typeMixed") || "Mixed"}
                </SelectItem>
              </Select>
            )}
          />
        </CardBody>
      </Card>

      {/* File Constraints */}
      <Card className="bg-gray-800/50 border border-gray-700">
        <CardBody className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100">
            {t("cms.collections.fileConstraints") || "File Constraints"}
          </h3>

          {/* Allowed MIME Types */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t("cms.collections.allowedMimeTypes") || "Allowed File Types"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg min-h-[60px]">
              {availableMimeTypes.map((mimeType) => (
                <Chip
                  key={mimeType.value}
                  variant={
                    selectedMimeTypes?.includes(mimeType.value) ? "solid" : "bordered"
                  }
                  color={
                    selectedMimeTypes?.includes(mimeType.value) ? "primary" : "default"
                  }
                  onClick={() => handleMimeTypeToggle(mimeType.value)}
                  className="cursor-pointer"
                >
                  {mimeType.label}
                </Chip>
              ))}
            </div>
            {errors.allowed_mime_types && (
              <p className="text-xs text-red-500 mt-1">
                {errors.allowed_mime_types.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {t("cms.collections.mimeTypesHint") || "Click to select/deselect file types"}
            </p>
          </div>

          {/* Max File Size */}
          <div className="flex gap-2">
            <Input
              type="number"
              label={t("cms.collections.maxFileSizeLabel") || "Max File Size"}
              placeholder="10"
              value={fileSizeValue.toString()}
              onChange={(e) => setFileSizeValue(Number(e.target.value))}
              min={1}
              isRequired
              classNames={{
                input: "bg-transparent",
                inputWrapper: "bg-gray-800/50 border-gray-700",
              }}
              className="flex-1"
            />
            <Select
              label={t("cms.collections.unitLabel") || "Unit"}
              selectedKeys={[fileSizeUnit.toString()]}
              onChange={(e) => setFileSizeUnit(Number(e.target.value))}
              classNames={{
                trigger: "bg-gray-800/50 border-gray-700",
              }}
              className="w-32"
            >
              {FILE_SIZE_UNITS.map((unit) => (
                <SelectItem key={unit.value.toString()} value={unit.value.toString()}>
                  {unit.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          {errors.max_file_size && (
            <p className="text-xs text-red-500">{errors.max_file_size.message}</p>
          )}

          {/* Max Items */}
          <Input
            type="number"
            label={t("cms.collections.maxItemsLabel") || "Max Items (Optional)"}
            placeholder={t("cms.collections.maxItemsPlaceholder") || "Leave empty for unlimited"}
            {...register("max_items", {
              setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
            })}
            isInvalid={!!errors.max_items}
            errorMessage={errors.max_items?.message}
            min={1}
            classNames={{
              input: "bg-transparent",
              inputWrapper: "bg-gray-800/50 border-gray-700",
            }}
          />
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="light"
          startContent={<X size={18} />}
          onPress={onCancel}
          isDisabled={isLoading}
        >
          {t("common.cancel") || "Cancel"}
        </Button>
        <Button
          type="submit"
          color="primary"
          startContent={<Save size={18} />}
          isLoading={isLoading}
        >
          {initialData
            ? t("common.saveChanges") || "Save Changes"
            : t("cms.collections.createButton") || "Create Collection"}
        </Button>
      </div>
    </form>
  );
}
