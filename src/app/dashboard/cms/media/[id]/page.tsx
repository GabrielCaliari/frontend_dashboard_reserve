"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useCollection, useDeleteCollection } from "@/src/common/hooks/cms/use-collections";
import { useAssets } from "@/src/common/hooks/cms/use-assets";
import { AssetGrid } from "@/src/components/cms/asset-grid";
import { AssetDrawer } from "@/src/components/cms/asset-drawer";
import { CollectionModal } from "@/src/components/cms/collection-modal";
import { UploadModal } from "@/src/components/cms/upload-modal";
import {
  Button,
  Pagination,
  Spinner,
  Chip,
  Breadcrumbs,
  BreadcrumbItem,
  useDisclosure,
} from "@nextui-org/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/src/components/ui/modal";
import { Upload, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { formatFileSize } from "@/src/common/utils/format-file-size";
import type { MediaAsset, CollectionType } from "@/src/common/@types/@cms-media";

const TYPE_BADGES: Partial<Record<CollectionType, { color: "success" | "primary" | "secondary" | "warning" }>> = {
  image: { color: "success" },
  document: { color: "primary" },
  video: { color: "secondary" },
  audio: { color: "primary" },
  mixed: { color: "warning" },
};

/**
 * Collection Asset Browser
 *
 * Displays all assets belonging to a specific collection, along with
 * collection metadata and management actions.
 *
 * Features:
 * - Breadcrumb navigation back to Media Library
 * - Collection name, type badge, and constraints info bar
 * - Asset grid with thumbnail previews
 * - Upload modal for adding new assets
 * - Asset detail drawer (slides over the grid, preserving context)
 * - Edit collection inline modal
 * - Delete collection with navigation back on success
 * - Pagination
 */
export default function CollectionAssetBrowserPage() {
  const t = useTranslations("cms.media");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const collectionId = parseInt(params.id as string);

  // Page state
  const [page, setPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editCollectionOpen, setEditCollectionOpen] = useState(false);

  const {
    isOpen: deleteCollectionOpen,
    onOpen: openDeleteCollection,
    onClose: closeDeleteCollection,
  } = useDisclosure();

  // Data
  const { data: collection, isLoading: collectionLoading, error: collectionError } = useCollection(collectionId);
  const {
    data: assetsData,
    isLoading: assetsLoading,
  } = useAssets(
    { collection_id: collectionId },
    { page, limit: 20 }
  );

  const deleteCollectionMutation = useDeleteCollection();

  // Handlers
  const handleBack = useCallback(() => {
    router.push("/dashboard/cms/media");
  }, [router]);

  const handleViewAsset = useCallback((asset: MediaAsset) => {
    setSelectedAsset(asset);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    // Keep selectedAsset set briefly so the close animation looks smooth
    setTimeout(() => setSelectedAsset(null), 300);
  }, []);

  const handleAssetDeleted = useCallback(() => {
    setDrawerOpen(false);
    setSelectedAsset(null);
  }, []);

  const handleConfirmDeleteCollection = useCallback(async () => {
    if (!collection) return;
    try {
      await deleteCollectionMutation.mutateAsync(collection.id);
      toast.success(t("collectionDeleteSuccess", { name: collection.name }));
      closeDeleteCollection();
      router.push("/dashboard/cms/media");
    } catch (err: any) {
      toast.error(err?.message || t("collectionDeleteError"));
    }
  }, [collection, deleteCollectionMutation, closeDeleteCollection, router]);

  // Loading state
  if (collectionLoading) {
    return (
      <LayoutScopeRoot routeActive="media">
        <div className="p-4 flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </LayoutScopeRoot>
    );
  }

  // Not found / error state
  if (collectionError || !collection) {
    return (
      <LayoutScopeRoot routeActive="media">
        <div className="p-4">
          <div className="text-center py-16 bg-[#12121f] rounded-lg border border-gray-800">
            <div className="text-5xl mb-4">📂</div>
            <p className="text-gray-300 text-lg mb-2">{t("collectionNotFound")}</p>
            <p className="text-gray-500 text-sm mb-6">
              {t("collectionNotFoundMessage")}
            </p>
            <Button
              onClick={handleBack}
              startContent={<ArrowLeft className="w-4 h-4" />}
              variant="flat"
            >
              {t("backToLibrary")}
            </Button>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  const assets = assetsData?.data || [];
  const meta = assetsData?.meta;
  const typeBadge = TYPE_BADGES[collection.type] ?? { color: "default" as const };

  return (
    <LayoutScopeRoot routeActive="media">
      <div className="p-4">
        {/* Breadcrumbs */}
        <Breadcrumbs className="mb-4">
          <BreadcrumbItem onPress={handleBack} className="cursor-pointer">
            {t("libraryTitle")}
          </BreadcrumbItem>
          <BreadcrumbItem>{collection.name}</BreadcrumbItem>
        </Breadcrumbs>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="light"
              isIconOnly
              size="sm"
              onPress={handleBack}
              aria-label={t("backToLibrary")}
              className="text-gray-400 hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-100">{collection.name}</h1>
                <Chip
                  size="sm"
                  color={typeBadge.color}
                  variant="flat"
                  className="capitalize"
                >
                  {collection.type}
                </Chip>
              </div>
              {collection.description && (
                <p className="text-sm text-gray-500 mt-0.5">{collection.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="flat"
              size="sm"
              startContent={<Pencil className="w-3.5 h-3.5" />}
              onPress={() => setEditCollectionOpen(true)}
            >
              {tCommon("edit")}
            </Button>
            <Button
              variant="flat"
              color="danger"
              size="sm"
              startContent={<Trash2 className="w-3.5 h-3.5" />}
              onPress={openDeleteCollection}
            >
              {tCommon("delete")}
            </Button>
            <Button
              color="primary"
              size="sm"
              startContent={<Upload className="w-4 h-4" />}
              onPress={() => setUploadOpen(true)}
            >
              {t("uploadButton")}
            </Button>
          </div>
        </div>

        {/* Collection constraints bar */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-6 text-xs text-gray-500">
          <span>
            {t("constraintMaxSize")}:{" "}
            <span className="text-gray-400 font-medium">
              {formatFileSize(collection.max_file_size)}
            </span>
          </span>
          {collection.max_items && (
            <span>
              {t("constraintMaxItems")}:{" "}
              <span className="text-gray-400 font-medium">{collection.max_items}</span>
            </span>
          )}
          <span>
            {t("constraintAllowedTypes")}:{" "}
            <span className="text-gray-400 font-medium">
              {collection.allowed_mime_types.join(", ")}
            </span>
          </span>
        </div>

        {/* Assets grid */}
        <div className="bg-[#12121f] rounded-lg shadow-lg border border-gray-800 p-6">
          <AssetGrid
            assets={assets}
            isLoading={assetsLoading}
            onView={handleViewAsset}
            emptyMessage={t("noAssetsInCollection")}
          />

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400">
                {t("showingAssets", { count: assets.length, total: meta.total })}
              </p>
              <Pagination
                total={meta.totalPages}
                page={page}
                onChange={setPage}
                showControls
                classNames={{
                  wrapper: "gap-2",
                  item: "bg-[#1a1a2e] text-gray-300 border border-gray-700",
                  cursor: "bg-blue-600 text-white",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Asset detail drawer */}
      <AssetDrawer
        asset={selectedAsset}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        onDeleted={handleAssetDeleted}
      />

      {/* Upload modal */}
      {uploadOpen && (
        <UploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          collection={collection}
        />
      )}

      {/* Edit collection modal */}
      <CollectionModal
        isOpen={editCollectionOpen}
        onClose={() => setEditCollectionOpen(false)}
        collection={collection}
      />

      {/* Delete collection confirmation */}
      <Modal isOpen={deleteCollectionOpen} onClose={closeDeleteCollection} variant="danger">
        <ModalContent>
          <ModalHeader>{t("deleteCollectionTitle")}</ModalHeader>
          <ModalBody>
            <p className="text-gray-300">
              {t("deleteCollectionConfirm", { name: collection.name })}
            </p>
            <p className="text-gray-500 text-sm">
              {t("collectionMustBeEmpty")}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closeDeleteCollection}>
              {tCommon("cancel")}
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmDeleteCollection}
              isLoading={deleteCollectionMutation.isPending}
              startContent={
                !deleteCollectionMutation.isPending && <Trash2 className="w-4 h-4" />
              }
            >
              {tCommon("delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutScopeRoot>
  );
}
