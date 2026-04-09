"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Input as ShadInput } from "@/src/components/ui/input";
import {
  Input,
  Textarea,
  Avatar,
  Pagination,
  Select,
  SelectItem,
  Progress,
} from "@heroui/react";
import { User, Search, X, Upload } from "lucide-react";
import { AssetGrid } from "@/src/components/cms/asset-grid";
import {
  useAssets,
  useAsset,
  useUploadAsset,
} from "@/src/common/hooks/cms/use-assets";
import { useCollections } from "@/src/common/hooks/cms/use-collections";
import {
  createAuthorSchema,
  updateAuthorSchema,
  type CreateAuthorInput,
  type UpdateAuthorInput,
} from "@/src/common/schemas/cms-author-schema";
import type {
  Author,
  CreateAuthorDto,
  UpdateAuthorDto,
} from "@/src/common/@types/@cms-author";
import type { MediaAsset } from "@/src/common/@types/@cms-media";
import { toast } from "sonner";

type Tab = "library" | "upload";

interface AuthorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  author?: Author | null;
  onSubmit: (data: CreateAuthorDto | UpdateAuthorDto) => Promise<void>;
  isSubmitting: boolean;
}

export function AuthorDrawer({
  open,
  onOpenChange,
  author,
  onSubmit,
  isSubmitting,
}: AuthorDrawerProps) {
  const isEditMode = !!author;
  const schema = isEditMode ? updateAuthorSchema : createAuthorSchema;

  const [activeTab, setActiveTab] = React.useState<Tab>("library");
  const [page, setPage] = React.useState(1);
  const [assetSearch, setAssetSearch] = React.useState("");
  const [selectedAsset, setSelectedAsset] = React.useState<MediaAsset | null>(
    null,
  );

  // Upload state
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadCollectionId, setUploadCollectionId] =
    React.useState<string>("");
  const [uploadAltText, setUploadAltText] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    mutateAsync: uploadAsset,
    isPending: isUploading,
    uploadProgress,
  } = useUploadAsset();

  // When the author has an avatarId but the list endpoint didn't return the
  // expanded avatar object, fetch the asset directly to get the URL.
  const avatarAssetId =
    open && author?.avatarId && !author?.avatar?.url ? author.avatarId : "";
  const { data: fetchedAvatarAsset } = useAsset(avatarAssetId);
  const { data: collectionsData } = useCollections({ limit: 100 });

  const currentAvatarUrl =
    selectedAsset?.url ??
    author?.avatar?.url ??
    author?.avatar_url ??
    fetchedAvatarAsset?.url ??
    null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAuthorInput | UpdateAuthorInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: author?.firstName ?? "",
      lastName: author?.lastName ?? "",
      biography: author?.biography ?? "",
      avatarId: author?.avatarId ?? "",
    },
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const biography = watch("biography");

  const { data: assetsData, isLoading: isLoadingAssets } = useAssets(
    { search: assetSearch || undefined },
    { page, limit: 18 },
    { enabled: open },
  );

  const allAssets = assetsData?.data ?? [];
  const imageAssets = allAssets.filter((a) => a.mime_type.startsWith("image/"));
  const meta = assetsData?.meta;
  const totalPages = Math.max(meta?.totalPages ?? 1, 1);

  // Collections that accept images
  const allCollections = collectionsData?.data ?? [];
  const imageCollections = allCollections.filter(
    (c) => c.type === "image" || c.type === "mixed",
  );

  // Reset state when drawer opens/closes or author changes
  React.useEffect(() => {
    if (open) {
      reset({
        firstName: author?.firstName ?? "",
        lastName: author?.lastName ?? "",
        biography: author?.biography ?? "",
        avatarId: author?.avatarId ?? "",
      });
      // Pre-populate selectedAsset so the grid highlights the existing avatar
      if (author?.avatarId && author?.avatar) {
        setSelectedAsset({
          id: author.avatarId,
          url: author.avatar.url,
          filename: (author.avatar as any).filename ?? "",
          mime_type: (author.avatar as any).mime_type ?? "image/*",
          alt_text: (author.avatar as any).alt_text ?? "",
          file_size: (author.avatar as any).file_size ?? 0,
          status: "active",
          collection_id: "",
          tenant_id: "",
          created_by: "",
          created_at: "",
          updated_at: "",
        } as any);
      } else {
        setSelectedAsset(null);
      }
      setPage(1);
      setAssetSearch("");
      setActiveTab("library");
      setUploadFile(null);
      setUploadCollectionId("");
      setUploadAltText("");
    }
  }, [open, author, reset]);

  const handleAssetSelect = React.useCallback(
    (asset: MediaAsset) => {
      const next = selectedAsset?.id === asset.id ? null : asset;
      setSelectedAsset(next);
      setValue("avatarId", next?.id ?? "");
    },
    [selectedAsset, setValue],
  );

  const handleRemoveAvatar = React.useCallback(() => {
    setSelectedAsset(null);
    setValue("avatarId", "");
  }, [setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadCollectionId) return;
    try {
      const asset = await uploadAsset({
        file: uploadFile,
        collection_id: uploadCollectionId,
        alt_text: uploadAltText.trim() || undefined,
      });
      setSelectedAsset(asset);
      setValue("avatarId", asset.id);
      setActiveTab("library");
      setUploadFile(null);
      setUploadCollectionId("");
      setUploadAltText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Image uploaded", {
        description: `"${asset.filename}" uploaded and selected as avatar.`,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err.message || "Upload failed";
      toast.error("Upload failed", {
        description: Array.isArray(msg) ? msg.join(",") : msg,
      });
    }
  };

  const handleFormSubmit = React.useCallback(
    async (data: CreateAuthorInput | UpdateAuthorInput) => {
      await onSubmit(data as CreateAuthorDto | UpdateAuthorDto);
    },
    [onSubmit],
  );

  const displayName = [author?.firstName, author?.lastName]
    .filter(Boolean)
    .join("");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-full border-l border-border bg-card p-0 sm:max-w-[92vw] xl:max-w-[900px]"
      >
        <SheetHeader className="shrink-0 border-b border-border bg-card pr-14 px-6 py-4">
          <SheetTitle>
            {isEditMode
              ? `Edit Author${displayName ? ` — ${displayName}` : ""}`
              : "Create Author"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex flex-col h-[calc(100%-57px-65px)]"
        >
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
              {/* LEFT: Avatar picker */}
              <div className="space-y-4">
                {/* Section header + tab toggle */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Avatar
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {activeTab === "library"
                        ? "Select an image from your media library."
                        : "Upload a new image to use as avatar."}
                    </p>
                  </div>
                  <div className="flex shrink-0 rounded-md border border-border overflow-hidden text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setActiveTab("library")}
                      className={`px-3 py-1.5 transition-colors ${
                        activeTab === "library"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Library
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("upload")}
                      className={`px-3 py-1.5 transition-colors border-l border-border ${
                        activeTab === "upload"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Upload
                    </button>
                  </div>
                </div>

                {activeTab === "library" ? (
                  <>
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <ShadInput
                        placeholder="Search images..."
                        value={assetSearch}
                        onChange={(e) => {
                          setAssetSearch(e.target.value);
                          setPage(1);
                        }}
                        className="pl-9 pr-9"
                      />
                      {assetSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setAssetSearch("");
                            setPage(1);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Grid */}
                    <div className="rounded-md border border-border bg-background p-3">
                      <AssetGrid
                        assets={imageAssets}
                        isLoading={isLoadingAssets}
                        selectable
                        selectedIds={selectedAsset ? [selectedAsset.id] : []}
                        onSelect={handleAssetSelect}
                        gridCols="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                        emptyMessage={
                          assetSearch
                            ? "No images match your search."
                            : "No images found in your media library."
                        }
                      />
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Showing {imageAssets.length} of {meta?.total ?? 0}{" "}
                          images
                        </p>
                        <Pagination
                          total={totalPages}
                          page={page}
                          onChange={setPage}
                          showControls
                          size="sm"
                          classNames={{
                            wrapper: "gap-1",
                            item: "bg-background text-foreground border border-border",
                            cursor: "bg-primary text-primary-foreground",
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  /* Upload tab */
                  <div className="rounded-md border border-border bg-background p-4 space-y-4">
                    {/* Drop zone / file picker */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) =>
                        e.key === "Enter" && fileInputRef.current?.click()
                      }
                      className={`flex flex-col items-center justify-center rounded-md border-2 border-dashed p-4 sm:p-8 text-center cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        uploadFile
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-default-100/20"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleFileChange}
                        tabIndex={-1}
                      />
                      <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                      {uploadFile ? (
                        <>
                          <p className="text-sm font-medium text-foreground truncate max-w-[220px]">
                            {uploadFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(uploadFile.size / 1024).toFixed(0)} KB — click to
                            change
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-foreground font-medium">
                            Click to select an image
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, WebP, GIF up to 50 MB
                          </p>
                        </>
                      )}
                    </div>

                    {/* Collection selector */}
                    <Select
                      label="Upload to collection"
                      placeholder="Select a collection"
                      isRequired
                      isDisabled={isUploading}
                      selectedKeys={
                        uploadCollectionId
                          ? new Set([uploadCollectionId])
                          : new Set()
                      }
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys as Set<string>)[0] ?? "";
                        setUploadCollectionId(val);
                      }}
                      variant="bordered"
                      size="sm"
                      classNames={{ trigger: "bg-background" }}
                    >
                      {imageCollections.map((col) => (
                        <SelectItem key={col.id}>{col.name}</SelectItem>
                      ))}
                    </Select>

                    {imageCollections.length === 0 && (
                      <p className="text-xs text-warning text-center">
                        No image collections found. Create one in Media first.
                      </p>
                    )}

                    {/* Alt text */}
                    <Input
                      label="Alt text (optional)"
                      placeholder="Describe the image for accessibility"
                      value={uploadAltText}
                      onValueChange={setUploadAltText}
                      isDisabled={isUploading}
                      variant="bordered"
                      size="sm"
                    />

                    {/* Upload progress */}
                    {isUploading && (
                      <Progress
                        value={uploadProgress}
                        size="sm"
                        color="primary"
                        showValueLabel
                        classNames={{ label: "text-xs text-muted-foreground" }}
                        label="Uploading…"
                      />
                    )}

                    <Button
                      type="button"
                      onClick={handleUpload}
                      disabled={
                        !uploadFile || !uploadCollectionId || isUploading
                      }
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading
                        ? `Uploading… ${uploadProgress}%`
                        : "Upload & Use as Avatar"}
                    </Button>
                  </div>
                )}
              </div>

              {/* RIGHT: Author details + avatar preview (sticky) */}
              <div className="space-y-5 rounded-md border border-border bg-default-100/20 p-4 xl:sticky xl:top-0">
                {/* Avatar preview */}
                <div className="flex flex-col items-center gap-3 py-2">
                  <Avatar
                    src={currentAvatarUrl ?? undefined}
                    name={
                      firstName || lastName
                        ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
                        : undefined
                    }
                    size="lg"
                    className="w-20 h-20 text-lg"
                    fallback={
                      <User className="w-8 h-8 text-muted-foreground" />
                    }
                  />
                  <div className="text-center">
                    {currentAvatarUrl ? (
                      <>
                        <p className="text-xs text-muted-foreground mb-1 truncate max-w-[200px]">
                          {selectedAsset?.filename ?? "Current avatar"}
                        </p>
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remove avatar
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No avatar — select or upload an image
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  {/* Name fields */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
                    <Input
                      label="First Name"
                      placeholder="John"
                      isRequired={!isEditMode}
                      isDisabled={isSubmitting}
                      isInvalid={!!errors.firstName}
                      errorMessage={errors.firstName?.message}
                      variant="bordered"
                      size="sm"
                      {...register("firstName")}
                      description={`${firstName?.length ?? 0}/100`}
                    />
                    <Input
                      label="Last Name"
                      placeholder="Doe"
                      isRequired={!isEditMode}
                      isDisabled={isSubmitting}
                      isInvalid={!!errors.lastName}
                      errorMessage={errors.lastName?.message}
                      variant="bordered"
                      size="sm"
                      {...register("lastName")}
                      description={`${lastName?.length ?? 0}/100`}
                    />
                  </div>

                  {/* Biography */}
                  <Textarea
                    label="Biography"
                    placeholder="Brief biography or description"
                    isDisabled={isSubmitting}
                    isInvalid={!!errors.biography}
                    errorMessage={errors.biography?.message}
                    variant="bordered"
                    size="sm"
                    minRows={4}
                    maxRows={8}
                    {...register("biography")}
                    description={`${biography?.length ?? 0}/1000`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border bg-card px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Author"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
