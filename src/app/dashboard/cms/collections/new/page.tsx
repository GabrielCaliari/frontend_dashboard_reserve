"use client";

import { useRouter } from "next/navigation";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { CollectionForm } from "@/src/components/cms/collection-form";
import { useCreateCollection } from "@/src/common/hooks/cms/use-collections";
import { useHasSelectedTenant } from "@/src/common/stores/tenant-store";
import { toast } from "sonner";

export default function CreateCollectionPage() {
  const router = useRouter();
  const hasSelectedTenant = useHasSelectedTenant();
  const createCollectionMutation = useCreateCollection();

  const handleSubmit = async (data: any) => {
    try {
      await createCollectionMutation.mutateAsync(data);
      toast.success("Collection created successfully");
      router.push("/dashboard/cms/collections");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create collection");
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
                  Please select a tenant from the sidebar to create collections.
                </p>
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
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => router.push("/dashboard/cms/collections")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Collection</h1>
            <p className="text-muted-foreground mt-1">
              Set up a new media collection with validation rules
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader className="pb-0">
            <h2 className="text-xl font-semibold">Collection Details</h2>
          </CardHeader>
          <CardBody className="pt-6">
            <CollectionForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={createCollectionMutation.isPending}
            />
          </CardBody>
        </Card>
      </div>
    </LayoutScopeRoot>
  );
}
