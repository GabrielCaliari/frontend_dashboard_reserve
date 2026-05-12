"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import {
  useCollections,
  useDeleteCollection,
} from "@/src/shared/hooks/cms/use-collections";
import { CollectionCard } from "@/src/presentation/components/organisms/cms/collection-card";
import { CollectionModal } from "@/src/presentation/components/organisms/cms/collection-modal";
import { Button, Pagination, Spinner, useDisclosure } from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/src/presentation/components/atoms/reserve/modal";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
  CollectionType,
  MediaCollection,
} from "@/src/shared/domain/types/@cms-media";

/**
 * Media Library Page
 *
 * Shows all media collections belonging to the selected tenant in a grid layout.
 * Collections act as folders organizing assets by type and rules.
 *
 * Features:
 * - Collections grid with type-specific icons and metadata
 * - Type filter tabs (All / Images / Documents / Videos / Mixed)
 * - Create collection modal
 * - Inline edit collection modal
 * - Delete collection with confirmation
 * - Pagination
 * - Empty state with call-to-action
 */
export default function MediaLibraryPage() {
  const t = useTranslations("cms.media");
  const tCollections = useTranslations("cms.collections");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const TYPE_FILTERS: { label: string; value: CollectionType | "all" }[] = [
    { label: t("filterAll"), value: "all" },
    { label: tCollections("typeImages"), value: "image" },
    { label: tCollections("typeDocuments"), value: "document" },
    { label: tCollections("typeVideos"), value: "video" },
    { label: tCollections("typeAudio"), value: "audio" },
    { label: tCollections("typeMixed"), value: "mixed" },
  ];

  // Filter and pagination state
  const [typeFilter, setTypeFilter] = useState<CollectionType | "all">("all");
  const [page, setPage] = useState(1);

  // Modal state
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MediaCollection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaCollection | null>(
    null,
  );
  const {
    isOpen: deleteOpen,
    onOpen: openDeleteDialog,
    onClose: closeDeleteDialog,
  } = useDisclosure();

  // Data
  const {
    data: collectionsData,
    isLoading,
    error,
  } = useCollections({
    page,
    limit: 20,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  const deleteMutation = useDeleteCollection();

  // Handlers
  const handleCollectionClick = useCallback(
    (collection: MediaCollection) => {
      router.push(`/dashboard/cms/media/${collection.id}`);
    },
    [router],
  );

  const handleEditCollection = useCallback((collection: MediaCollection) => {
    setEditTarget(collection);
    setCollectionModalOpen(true);
  }, []);

  const handleDeleteCollection = useCallback(
    (collection: MediaCollection) => {
      setDeleteTarget(collection);
      openDeleteDialog();
    },
    [openDeleteDialog],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(t("collectionDeleteSuccess", { name: deleteTarget.name }));
      closeDeleteDialog();
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message || t("collectionDeleteError"));
    }
  }, [deleteTarget, deleteMutation, closeDeleteDialog]);

  const handleOpenCreate = useCallback(() => {
    setEditTarget(null);
    setCollectionModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setCollectionModalOpen(false);
    setEditTarget(null);
  }, []);

  const handleTypeFilter = useCallback((value: CollectionType | "all") => {
    setTypeFilter(value);
    setPage(1);
  }, []);

  const collections = Array.isArray(collectionsData?.data)
    ? collectionsData.data
    : [];
  const meta = collectionsData?.meta;

  return (
    <LayoutScopeRoot routeActive="media">
      <div className="p-4">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("libraryTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("librarySubtitle")}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={handleOpenCreate}
          >
            {t("newCollection")}
          </Button>
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleTypeFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-default-100 text-muted-foreground hover:text-foreground border border-border hover:border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="bg-card rounded-lg border border-border p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              <Spinner size="lg" label={t("loadingCollections")} />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400">{t("errorLoadingCollections")}</p>
            </div>
          ) : collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-default-100 rounded-2xl flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t("noCollectionsYet")}
              </h3>
              <p className="text-muted-foreground text-sm mb-6 text-center max-w-xs">
                {t("noCollectionsDescription")}
              </p>
              <Button
                color="primary"
                startContent={<Plus className="w-4 h-4" />}
                onPress={handleOpenCreate}
              >
                {t("createFirstCollection")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onClick={handleCollectionClick}
                  onEdit={handleEditCollection}
                  onDelete={handleDeleteCollection}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                total={meta.totalPages}
                page={page}
                onChange={setPage}
                showControls
                classNames={{
                  wrapper: "gap-2",
                  item: "bg-default-100 text-foreground border border-border",
                  cursor: "bg-blue-600 text-white",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit collection modal */}
      <CollectionModal
        isOpen={collectionModalOpen}
        onClose={handleCloseModal}
        collection={editTarget ?? undefined}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          closeDeleteDialog();
          setDeleteTarget(null);
        }}
        variant="danger"
      >
        <ModalContent>
          <ModalHeader>{t("deleteCollectionTitle")}</ModalHeader>
          <ModalBody>
            <p className="text-foreground">
              {t("deleteCollectionConfirm", { name: deleteTarget?.name || "" })}
            </p>
            <p className="text-muted-foreground text-sm">
              {t("collectionMustBeEmpty")}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                closeDeleteDialog();
                setDeleteTarget(null);
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmDelete}
              isLoading={deleteMutation.isPending}
              startContent={
                !deleteMutation.isPending && <Trash2 className="w-4 h-4" />
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
