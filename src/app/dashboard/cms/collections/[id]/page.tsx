"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { Button } from "@nextui-org/react";
import { CollectionForm } from "@/src/components/cms/collection-form";
import {
  useCollection,
  useUpdateCollection,
  useDeleteCollection,
} from "@/src/common/hooks/cms/use-collections";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import type { CollectionFormData } from "@/src/common/schemas/collection-schema";
import { toast } from "sonner";

export default function EditCollectionPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = parseInt(params.id as string);
  const t = useTranslations();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch collection data
  const {
    data: collection,
    isLoading: isLoadingCollection,
    error: collectionError,
  } = useCollection(collectionId);

  // Mutations
  const { mutate: updateCollection, isPending: isUpdating } = useUpdateCollection();
  const { mutate: deleteCollection, isPending: isDeleting } = useDeleteCollection();

  const handleSubmit = async (data: CollectionFormData) => {
    updateCollection(
      { id: collectionId, data },
      {
        onSuccess: () => {
          toast.success(
            t("cms.collections.updateSuccess") || "Collection updated successfully"
          );
          router.push("/dashboard/cms/collections");
        },
        onError: (error: any) => {
          toast.error(
            error?.message || t("cms.collections.updateError") || "Failed to update collection"
          );
        },
      }
    );
  };

  const handleDelete = () => {
    deleteCollection(collectionId, {
      onSuccess: () => {
        toast.success(
          t("cms.collections.deleteSuccess") || "Collection deleted successfully"
        );
        router.push("/dashboard/cms/collections");
      },
      onError: (error: any) => {
        toast.error(
          error?.message || t("cms.collections.deleteError") || "Failed to delete collection"
        );
        setShowDeleteDialog(false);
      },
    });
  };

  const handleCancel = () => {
    router.push("/dashboard/cms/collections");
  };

  // Loading state
  if (isLoadingCollection) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error state
  if (collectionError || !collection) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-2">
            Failed to load collection
          </h2>
          <p className="text-muted-foreground mb-4">
            {collectionError?.message || "The collection could not be found."}
          </p>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/cms/collections")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collections
          </Button>
        </div>
      </div>
    );
  }

  // Prepare default values for the form
  const initialData = collection
    ? {
        ...collection,
        description: collection.description || "",
        max_items: collection.max_items || null,
      }
    : undefined;

  return (
    <>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="light"
            onClick={() => router.push("/dashboard/cms/collections")}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back") || "Back to Collections"}
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t("cms.collections.editTitle") || "Edit Collection"}
              </h1>
              <p className="text-muted-foreground">
                {t("cms.collections.editDescription") ||
                  "Update collection settings and constraints. The slug cannot be changed."}
              </p>
            </div>

            <Button
              color="danger"
              variant="flat"
              onClick={() => setShowDeleteDialog(true)}
              isDisabled={isUpdating || isDeleting}
              startContent={<Trash2 className="w-4 h-4" />}
            >
              {t("cms.collections.deleteButton") || "Delete Collection"}
            </Button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-content1 border border-border rounded-lg p-6 shadow-sm">
          <CollectionForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isUpdating}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-content1 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {t("cms.collections.deleteDialogTitle") || "Delete Collection"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("cms.collections.deleteDialogDescription") ||
                `Are you sure you want to delete the collection "${collection?.name}"? This action cannot be undone. All assets in this collection will remain but will no longer be associated with this collection.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="light"
              onClick={() => setShowDeleteDialog(false)}
              isDisabled={isDeleting}
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              color="danger"
              onClick={handleDelete}
              isDisabled={isDeleting}
              startContent={
                isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )
              }
            >
              {isDeleting
                ? t("cms.collections.deleting") || "Deleting..."
                : t("cms.collections.deleteButton") || "Delete Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
