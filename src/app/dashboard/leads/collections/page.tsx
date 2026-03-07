"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button, Chip, Spinner, Switch,
} from "@nextui-org/react";
import {
  Plus, Pencil, Trash2, RefreshCw, Key, ExternalLink, FolderOpen,
} from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useListCollections } from "@/src/common/hooks/leads/use-list-collections";
import { useCreateCollection } from "@/src/common/hooks/leads/use-create-collection";
import { useUpdateCollection } from "@/src/common/hooks/leads/use-update-collection";
import { useDeleteCollection } from "@/src/common/hooks/leads/use-delete-collection";
import { useRegenerateCollectionKey } from "@/src/common/hooks/leads/use-regenerate-collection-key";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/src/components/ui/dialog";
import { Input } from "@nextui-org/react";
import { useForm } from "react-hook-form";
import type { LeadCollection, CreateCollectionDto, UpdateCollectionDto } from "@/src/common/@types/@lead";
import { formatDate } from "@/src/lib/utils";
import { toast } from "react-hot-toast";

type CollectionFormValues = {
  name: string;
  source: string;
};

function CollectionFormDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: LeadCollection;
}) {
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<CollectionFormValues>({
    defaultValues: { name: initial?.name ?? "", source: initial?.source ?? "" },
  });

  const onSubmit = (values: CollectionFormValues) => {
    if (initial) {
      updateCollection.mutate(
        { id: initial.id, data: { name: values.name, source: values.source } },
        { onSuccess: () => { reset(); onClose(); } }
      );
    } else {
      createCollection.mutate(values, {
        onSuccess: () => { reset(); onClose(); },
      });
    }
  };

  const isPending = createCollection.isPending || updateCollection.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Collection" : "New Collection"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <Input
            label="Name"
            variant="bordered"
            isRequired
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message}
            classNames={{ inputWrapper: "border-gray-700 bg-gray-900" }}
            {...register("name", { required: "Name is required" })}
          />
          <Input
            label="Source"
            variant="bordered"
            isRequired
            isInvalid={!!errors.source}
            errorMessage={errors.source?.message}
            classNames={{ inputWrapper: "border-gray-700 bg-gray-900" }}
            {...register("source", { required: "Source is required" })}
          />
          <DialogFooter className="gap-2 pt-2">
            <Button variant="flat" type="button" onPress={onClose}>Cancel</Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isPending}
              isDisabled={initial ? !isDirty : false}
            >
              {initial ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CollectionsPage() {
  const router = useRouter();
  const { data, isLoading, refetch } = useListCollections({ limit: 100 });
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const regenerateKey = useRegenerateCollectionKey();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<LeadCollection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadCollection | null>(null);
  const [regenTarget, setRegenTarget] = useState<LeadCollection | null>(null);

  const collections = data?.data?.collections ?? [];

  const handleToggleActive = (collection: LeadCollection) => {
    updateCollection.mutate({
      id: collection.id,
      data: { active: !collection.active },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCollection.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleRegenKey = () => {
    if (!regenTarget) return;
    regenerateKey.mutate(regenTarget.id, {
      onSuccess: (res) => {
        toast.success(`New key: ${res.data.secretKey}`, { duration: 15000 });
        setRegenTarget(null);
      },
    });
  };

  return (
    <LayoutScopeRoot routeActive="lead-collections">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="w-6 h-6" />
              Lead Collections
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {data ? `${data.data.meta.total} collection${data.data.meta.total !== 1 ? "s" : ""}` : "Manage your lead collections"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="flat"
              size="sm"
              startContent={<RefreshCw className="w-4 h-4" />}
              onPress={() => refetch()}
              isLoading={isLoading}
            >
              Refresh
            </Button>
            <Button
              color="primary"
              size="sm"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => setShowCreate(true)}
            >
              New Collection
            </Button>
          </div>
        </div>

        {/* Collections grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : collections.length === 0 ? (
          <div className="rounded-xl border border-divider py-16 text-center text-muted-foreground">
            No collections yet. Create one to start capturing leads.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <div
                key={col.id}
                className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-3 hover:border-gray-700 transition-colors"
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-100 truncate">{col.name}</p>
                    <p className="text-xs text-gray-500 truncate">{col.slug}</p>
                  </div>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={col.active ? "success" : "default"}
                  >
                    {col.active ? "Active" : "Inactive"}
                  </Chip>
                </div>

                {/* Source */}
                <p className="text-sm text-gray-400">
                  Source: <span className="text-gray-200">{col.source}</span>
                </p>

                <p className="text-xs text-gray-600">
                  Created {formatDate(col.created_at)}
                </p>

                {/* Active toggle */}
                <div className="flex items-center gap-2">
                  <Switch
                    size="sm"
                    isSelected={col.active}
                    onValueChange={() => handleToggleActive(col)}
                    isDisabled={updateCollection.isPending}
                  />
                  <span className="text-xs text-gray-400">
                    {col.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1 border-t border-gray-800">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<ExternalLink className="w-3.5 h-3.5" />}
                    onPress={() => router.push(`/dashboard/leads/collections/${col.id}`)}
                    className="flex-1 text-xs"
                  >
                    View Leads
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-gray-400 hover:text-gray-100"
                    onPress={() => setEditTarget(col)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-gray-400 hover:text-yellow-400"
                    onPress={() => setRegenTarget(col)}
                  >
                    <Key className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-gray-400 hover:text-red-400"
                    onPress={() => setDeleteTarget(col)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <CollectionFormDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      {/* Edit dialog */}
      {editTarget && (
        <CollectionFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initial={editTarget}
        />
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate <strong>{deleteTarget?.name}</strong>?
              New leads will stop being collected. Existing leads are preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="flat" onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              color="danger"
              isLoading={deleteCollection.isPending}
              onPress={handleDelete}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate key confirm */}
      <Dialog open={!!regenTarget} onOpenChange={(o) => !o && setRegenTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Secret Key</DialogTitle>
            <DialogDescription>
              This will invalidate the current key for <strong>{regenTarget?.name}</strong>.
              Any integrations using the old key will stop working.
              Save the new key — it will only be shown once.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="flat" onPress={() => setRegenTarget(null)}>Cancel</Button>
            <Button
              color="warning"
              isLoading={regenerateKey.isPending}
              onPress={handleRegenKey}
            >
              Regenerate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutScopeRoot>
  );
}
