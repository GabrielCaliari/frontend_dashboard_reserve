"use client";

import * as React from "react";
import { Loader2, Link2, Upload } from "lucide-react";
import { useBlogs } from "@/src/shared/hooks/cms/useBlogs";
import { useCollection } from "@/src/shared/hooks/cms/use-collections";
import { useCollectionAssets } from "@/src/shared/hooks/cms/use-assets";
import { AssetGrid } from "@/src/presentation/components/organisms/cms/asset-grid";
import { UploadModal } from "@/src/presentation/components/organisms/cms/upload-modal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/presentation/components/atoms/shadcn-ui/sheet";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";
import { Pagination, Chip } from "@heroui/react";
import { formatFileSize } from "@/src/shared/utils/format-file-size";
import type {
  CollectionType,
  MediaAsset,
} from "@/src/shared/domain/types/@cms-media";

const TYPE_BADGES: Partial<
  Record<
    CollectionType,
    { color: "success" | "primary" | "secondary" | "warning" }
  >
> = {
  image: { color: "success" },
  document: { color: "primary" },
  video: { color: "secondary" },
  audio: { color: "primary" },
  mixed: { color: "warning" },
};

interface BlogImageInsertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert?: (url: string, alt: string) => void;
  onSelectAsset?: (asset: MediaAsset) => void;
  blogId?: string | number;
  title?: string;
  insertLabel?: string;
  allowExternalUrl?: boolean;
}

export function BlogImageInsertDialog({
  open,
  onOpenChange,
  onInsert,
  onSelectAsset,
  blogId,
  title = "Insert Image",
  insertLabel = "Insert",
  allowExternalUrl = true,
}: BlogImageInsertDialogProps) {
  const [page, setPage] = React.useState(1);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState("");
  const [altText, setAltText] = React.useState("");

  const { data: blogsData, isLoading: isLoadingBlogs } = useBlogs();

  const blogs = React.useMemo(
    () => (Array.isArray(blogsData) ? blogsData : []),
    [blogsData],
  );

  const blog = React.useMemo(
    () => blogs.find((item) => String(item.id) === String(blogId)),
    [blogs, blogId],
  );

  const mediaCollectionId = blog?.mediaCollectionId ?? undefined;

  const { data: collection, isLoading: isLoadingCollection } = useCollection(
    mediaCollectionId ?? "",
  );

  const { data: assetsData, isLoading: isLoadingAssets } = useCollectionAssets(
    mediaCollectionId ?? "",
    {
      page,
      limit: 20,
    },
  );

  const assets =
    assetsData?.data?.filter((asset) => asset.mime_type.startsWith("image/")) ??
    [];
  const meta = assetsData?.meta;
  const selectedAsset = React.useMemo(
    () => assets.find((asset) => asset.url === imageUrl) ?? null,
    [assets, imageUrl],
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setPage(1);
    setUploadOpen(false);
    setImageUrl("");
    setAltText("");
  }, [open, blogId]);

  const handleAssetSelect = React.useCallback((asset: MediaAsset) => {
    setImageUrl(asset.url);
    setAltText(asset.alt_text || "");
  }, []);

  const handleInsert = React.useCallback(() => {
    if (selectedAsset) {
      onSelectAsset?.(selectedAsset);
      onInsert?.(
        selectedAsset.url,
        altText.trim() || selectedAsset.alt_text || "",
      );
      onOpenChange(false);
      return;
    }

    if (allowExternalUrl && imageUrl.trim() && onInsert) {
      onInsert(imageUrl.trim(), altText.trim());
      onOpenChange(false);
    }
  }, [
    allowExternalUrl,
    altText,
    imageUrl,
    onInsert,
    onOpenChange,
    onSelectAsset,
    selectedAsset,
  ]);

  const handleUploadComplete = React.useCallback(() => {
    React.startTransition(() => {
      setUploadOpen(false);
      setPage(1);
    });
  }, []);

  const totalPages = Math.max(meta?.totalPages ?? 1, 1);
  const isLoadingContext = isLoadingBlogs || isLoadingCollection;
  const hasLinkedCollection = !!mediaCollectionId;
  const typeBadge = collection
    ? (TYPE_BADGES[collection.type] ?? { color: "primary" as const })
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-full border-l border-border bg-card p-0 sm:max-w-[94vw] xl:max-w-[1280px]"
      >
        <SheetHeader className="shrink-0 border-b border-border bg-card pr-14">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="space-y-6">
            {hasLinkedCollection ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                <div className="space-y-6 min-w-0">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {collection?.name ?? "Blog collection"}
                        </h3>
                        {collection && typeBadge && (
                          <Chip
                            size="sm"
                            color={typeBadge.color}
                            variant="flat"
                            className="capitalize"
                          >
                            {collection.type}
                          </Chip>
                        )}
                      </div>
                      {collection?.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {collection.description}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setUploadOpen(true)}
                      disabled={!collection}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                  </div>

                  {collection && (
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                      <span>
                        Max size:{""}
                        <span className="font-medium text-foreground/80">
                          {formatFileSize(collection.max_file_size)}
                        </span>
                      </span>
                      {collection.max_items && (
                        <span>
                          Max items:{""}
                          <span className="font-medium text-foreground/80">
                            {collection.max_items}
                          </span>
                        </span>
                      )}
                      <span>
                        Allowed types:{""}
                        <span className="font-medium text-foreground/80">
                          {collection.allowed_mime_types.join(",")}
                        </span>
                      </span>
                    </div>
                  )}

                  <div className="rounded-md border border-border bg-default-100/20 p-4">
                    <div className="mb-4 text-xs text-muted-foreground">
                      Click an image to select it for insertion.
                    </div>

                    <div className="rounded-md border border-border p-3 bg-background">
                      {isLoadingContext ? (
                        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading blog collection...
                        </div>
                      ) : !hasLinkedCollection ? (
                        <div className="py-20 text-center text-sm text-muted-foreground">
                          This blog does not have a media collection configured.
                        </div>
                      ) : (
                        <AssetGrid
                          assets={assets}
                          isLoading={isLoadingAssets}
                          selectable
                          selectedIds={selectedAsset ? [selectedAsset.id] : []}
                          onSelect={handleAssetSelect}
                          emptyMessage="No images available in this collection yet."
                        />
                      )}
                    </div>

                    {meta && totalPages > 1 && (
                      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                          Showing {assets.length} of {meta.total} images
                        </p>
                        <Pagination
                          total={totalPages}
                          page={page}
                          onChange={setPage}
                          showControls
                          classNames={{
                            wrapper: "gap-2",
                            item: "bg-background text-foreground border border-border",
                            cursor: "bg-primary text-primary-foreground",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 rounded-md border border-border bg-default-100/30 p-4 xl:sticky xl:top-0">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Selected image
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Images are loaded from the media collection configured on
                      the blog. You can also paste an external URL below if
                      needed.
                    </div>
                  </div>

                  {selectedAsset ? (
                    <>
                      <img
                        src={selectedAsset.url}
                        alt={selectedAsset.alt_text || selectedAsset.filename}
                        className="h-44 w-full rounded-md object-cover"
                      />
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="truncate text-sm font-medium text-foreground">
                          {selectedAsset.filename}
                        </div>
                        <div>{selectedAsset.mime_type}</div>
                        {selectedAsset.width && selectedAsset.height && (
                          <div>
                            {selectedAsset.width} x {selectedAsset.height}px
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-44 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                      Select an image from the collection
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Alt Text</label>
                    <Input
                      placeholder="Describe the image"
                      value={altText}
                      onChange={(event) => setAltText(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-default-100/20 p-4 text-sm text-muted-foreground">
                This article's blog does not have a media collection configured.
                Use an external URL below, or configure a collection on the blog
                first.
              </div>
            )}

            {allowExternalUrl && (
              <div className="rounded-md border border-border bg-default-100/20 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Link2 className="h-4 w-4" />
                  External URL fallback
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Image URL</label>
                      <Input
                        placeholder="https://example.com/image.webp"
                        value={imageUrl}
                        onChange={(event) => setImageUrl(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Alt Text</label>
                      <Input
                        placeholder="Describe the image"
                        value={altText}
                        onChange={(event) => setAltText(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
                    Keep this as a fallback only. The primary authoring flow is
                    the blog collection above, because it preserves CMS
                    validation and media governance.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-card px-4 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleInsert}
              disabled={
                !selectedAsset && (!allowExternalUrl || !imageUrl.trim())
              }
            >
              {insertLabel}
            </Button>
          </div>
        </div>
      </SheetContent>

      {collection && (
        <UploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          collection={collection}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </Sheet>
  );
}
