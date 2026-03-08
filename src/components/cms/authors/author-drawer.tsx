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
} from "@heroui/react";
import { User, Search, X } from "lucide-react";
import { AssetGrid } from "@/src/components/cms/asset-grid";
import { useAssets } from "@/src/common/hooks/cms/use-assets";
import {
  createAuthorSchema,
  updateAuthorSchema,
  type CreateAuthorInput,
  type UpdateAuthorInput,
} from "@/src/common/schemas/cms-author-schema";
import type { Author, CreateAuthorDto, UpdateAuthorDto } from "@/src/common/@types/@cms-author";
import type { MediaAsset } from "@/src/common/@types/@cms-media";

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

  const [page, setPage] = React.useState(1);
  const [assetSearch, setAssetSearch] = React.useState("");
  const [selectedAsset, setSelectedAsset] = React.useState<MediaAsset | null>(null);

  // Track the current avatar (existing from edit or newly selected)
  const currentAvatarUrl = selectedAsset?.url ?? author?.avatar_url ?? null;
  const currentAvatarId = selectedAsset?.id ?? author?.avatarId ?? "";

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

  // Reset state when drawer opens/closes or author changes
  React.useEffect(() => {
    if (open) {
      reset({
        firstName: author?.firstName ?? "",
        lastName: author?.lastName ?? "",
        biography: author?.biography ?? "",
        avatarId: author?.avatarId ?? "",
      });
      setSelectedAsset(null);
      setPage(1);
      setAssetSearch("");
    }
  }, [open, author, reset]);

  const handleAssetSelect = React.useCallback(
    (asset: MediaAsset) => {
      const next = selectedAsset?.id === asset.id ? null : asset;
      setSelectedAsset(next);
      setValue("avatarId", next?.id ?? author?.avatarId ?? "");
    },
    [selectedAsset, author?.avatarId, setValue],
  );

  const handleRemoveAvatar = React.useCallback(() => {
    setSelectedAsset(null);
    setValue("avatarId", "");
  }, [setValue]);

  const handleFormSubmit = React.useCallback(
    async (data: CreateAuthorInput | UpdateAuthorInput) => {
      await onSubmit(data as CreateAuthorDto | UpdateAuthorDto);
    },
    [onSubmit],
  );

  const displayName = [author?.firstName, author?.lastName].filter(Boolean).join(" ");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-full border-l border-border bg-[#16162a] p-0 sm:max-w-[92vw] xl:max-w-[900px]"
      >
        <SheetHeader className="shrink-0 border-b border-border bg-[#16162a] pr-14 px-6 py-4">
          <SheetTitle>
            {isEditMode ? `Edit Author${displayName ? ` — ${displayName}` : ""}` : "Create Author"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex flex-col h-[calc(100%-57px-65px)]"
        >
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">

              {/* LEFT: Asset image picker */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Avatar</h3>
                  <p className="text-xs text-muted-foreground">
                    Select an image from your media library to use as the author avatar.
                  </p>
                </div>

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
                    emptyMessage={
                      assetSearch
                        ? "No images match your search."
                        : "No images found in your media library."
                    }
                  />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Showing {imageAssets.length} of {meta?.total ?? 0} images
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
              </div>

              {/* RIGHT: Author details form + avatar preview (sticky) */}
              <div className="space-y-5 rounded-md border border-border bg-muted/20 p-4 xl:sticky xl:top-0">

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
                    fallback={<User className="w-8 h-8 text-default-400" />}
                  />
                  <div className="text-center">
                    {currentAvatarUrl ? (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">
                          {selectedAsset
                            ? selectedAsset.filename
                            : "Current avatar"}
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
                        No avatar — select an image on the left
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  {/* Name fields */}
                  <div className="grid grid-cols-2 gap-3">
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
                      description={`${(firstName?.length ?? 0)}/100`}
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
                      description={`${(lastName?.length ?? 0)}/100`}
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
                    description={`${(biography?.length ?? 0)}/1000`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border bg-[#16162a] px-4 py-4 sm:px-6">
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
