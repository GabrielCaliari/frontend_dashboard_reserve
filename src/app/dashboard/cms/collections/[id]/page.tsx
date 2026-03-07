"use client";

import { useRouter, useParams } from "next/navigation";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AlertCircle, ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader, Button, Spinner } from "@nextui-org/react";
import { CollectionForm } from "@/src/components/cms/collection-form";
import {
  useCollection,
  useUpdateCollection,
  useDeleteCollection,
} from "@/src/common/hooks/cms/use-collections";
import { useHasSelectedTenant } from "@/src/common/stores/tenant-store";
import { toast } from "sonner";

export default function EditCollectionPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = parseInt(params.id as string);

  const hasSelectedTenant = useHasSelectedTenant();
  const { data: collection, isLoading } = useCollection(collectionId);
  const updateCollectionMutation = useUpdateCollection();
  const deleteCollectionMutation = useDeleteCollection();

  const handleSubmit = async (data: any) => {
    try {
      await updateCollectionMutation.mutateAsync({
        id: collectionId,
        data,
      });
      toast.success("Collection updated successfully");
      router.push("/dashboard/cms/collections");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update collection");
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete "${collection?.name}"? This will not delete the assets, only the collection.`
      )
    ) {
      try {
        await deleteCollectionMutation.mutateAsync(collectionId);
        toast.success("Collection deleted successfully");
        router.push("/dashboard/cms/collections");
      } catch (error: any) {
        toast.error(error?.message || "Failed to delete collection");
      }
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/cms/collections");
  };

  // Show tenant selection warning
  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="collections">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Card className="max-w-md border-warning/20 bg-warning/5">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Tenant Selected
                </h3>
                <p className="text-muted-foreground">
                  Please select a tenant from the sidebar to edit collections.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <LayoutScopeRoot routeActive="collections">
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
          <div className="flex justify-center items-center py-16">
            <Spinner size="lg" />
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  // Not found
  if (!collection) {
    return (
      <LayoutScopeRoot routeActive="collections">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Card className="max-w-md border-danger/20 bg-danger/5">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-danger" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Collection Not Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  The collection you're looking for doesn't exist or has been deleted.
                </p>
                <Button
                  color="primary"
                  onPress={() => router.push("/dashboard/cms/collections")}
                >
                  Back to Collections
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="collections">
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={() => router.push("/dashboard/cms/collections")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Collection</h1>
              <p className="text-muted-foreground mt-1">
                Update collection settings and validation rules
              </p>
            </div>
          </div>
          <Button
            color="danger"
            variant="flat"
            startContent={<Trash2 className="w-4 h-4" />}
            onPress={handleDelete}
            isLoading={deleteCollectionMutation.isPending}
          >
            Delete Collection
          </Button>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader className="pb-0">
            <h2 className="text-xl font-semibold">Collection Details</h2>
          </CardHeader>
          <CardBody className="pt-6">
            <CollectionForm
              collection={collection}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={updateCollectionMutation.isPending}
            />
          </CardBody>
        </Card>
      </div>
    </LayoutScopeRoot>
  );
}
