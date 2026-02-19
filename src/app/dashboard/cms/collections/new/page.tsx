"use client";

import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { CollectionForm } from "@/src/components/cms/collection-form";
import { useCreateCollection } from "@/src/common/hooks/cms/use-collections";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@nextui-org/react";
import type { CollectionFormData } from "@/src/common/schemas/collection-schema";
import { collectionFormToDto } from "@/src/common/schemas/collection-schema";
import { toast } from "sonner";

export default function NewCollectionPage() {
  const t = useTranslations();
  const router = useRouter();
  const createCollectionMutation = useCreateCollection();

  const handleSubmit = async (data: CollectionFormData) => {
    try {
      const dto = collectionFormToDto(data);
      await createCollectionMutation.mutateAsync(dto);
      
      toast.success(
        t("cms.collections.createSuccess") || "Collection created successfully"
      );
      
      // Navigate back to collections list
      router.push("/dashboard/cms/collections");
    } catch (error: any) {
      console.error("Failed to create collection:", error);
      
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t("cms.collections.createError") ||
        "Failed to create collection";
      
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/cms/collections");
  };

  return (
    <LayoutScopeRoot routeActive="cms">
      <div className="p-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="light"
            startContent={<ArrowLeft size={18} />}
            onPress={handleCancel}
            className="mb-4"
          >
            {t("common.back") || "Back"}
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-100">
            {t("cms.collections.createTitle") || "Create New Collection"}
          </h1>
          <p className="text-gray-400 mt-2">
            {t("cms.collections.createDescription") ||
              "Create a new media collection to organize and manage your assets"}
          </p>
        </div>

        {/* Form */}
        <div className="max-w-4xl">
          <CollectionForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createCollectionMutation.isPending}
          />
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
