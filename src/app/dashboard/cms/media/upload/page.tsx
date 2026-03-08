"use client";

import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useCollections } from "@/src/common/hooks/cms/use-collections";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AssetUpload } from "@/src/components/cms/asset-upload";
import { Button, Select, SelectItem, Spinner, Card, CardBody } from "@heroui/react";
import { ArrowLeft, FolderOpen, Upload } from "lucide-react";
import type { MediaCollection } from "@/src/common/@types/@cms-media";

/**
 * Asset Upload Page
 * 
 * Page for uploading media assets to a collection.
 * Features:
 * - Collection selection dropdown (required)
 * - Asset upload component with drag-and-drop
 * - Upload queue with progress tracking
 * - Success/error messages per file
 * - "Upload More Files" button to reset
 * - "View Library" button to navigate back
 * - Disabled upload until collection is selected
 */
export default function MediaUploadPage() {
  const t = useTranslations("cms.media.upload");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [uploadKey, setUploadKey] = useState(0);

  // Fetch collections
  const {
    data: collectionsData,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useCollections({
    page: 1,
    limit: 100,
  });

  const collections = collectionsData?.data || [];
  const selectedCollection = collections.find(
    c => c.id === selectedCollectionId
  );

  // Handlers
  const handleViewLibrary = useCallback(() => {
    router.push("/dashboard/cms/media");
  }, [router]);

  const handleUploadMore = useCallback(() => {
    setUploadKey(prev => prev + 1);
  }, []);

  const handleUploadComplete = useCallback(() => {
    // Optional: Add any post-upload logic here
  }, []);

  // Loading state
  if (collectionsLoading) {
    return (
      <LayoutScopeRoot routeActive="media">
        <div className="p-4">
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" label={tCommon("loading")} />
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  // Error state
  if (collectionsError) {
    return (
      <LayoutScopeRoot routeActive="media">
        <div className="p-4">
          <div className="text-center py-8">
            <p className="text-red-400">{t("errorLoadingCollections")}</p>
            <Button
              onClick={handleViewLibrary}
              className="mt-4"
              variant="flat"
            >
              {t("backToLibrary")}
            </Button>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  // No collections state
  if (collections.length === 0) {
    return (
      <LayoutScopeRoot routeActive="media">
        <div className="p-4">
          <div className="mb-6">
            <Button
              onClick={handleViewLibrary}
              variant="light"
              startContent={<ArrowLeft className="h-4 w-4" />}
              className="text-gray-400 hover:text-gray-200"
            >
              {t("backToLibrary")}
            </Button>
          </div>

          <h1 className="text-2xl font-bold mb-6 text-gray-100">
            {t("uploadAssets")}
          </h1>

          <Card className="bg-[#12121f] border border-gray-800">
            <CardBody className="text-center py-12">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg mb-2">{t("noCollectionsFound")}</p>
              <p className="text-gray-500 text-sm mb-6">
                {t("createCollectionFirst")}
              </p>
              <Button
                onClick={() => router.push("/dashboard/cms/collections")}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {t("createCollection")}
              </Button>
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="media">
      <div className="p-4">
        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleViewLibrary}
              variant="light"
              startContent={<ArrowLeft className="h-4 w-4" />}
              className="text-gray-400 hover:text-gray-200"
            >
              {t("backToLibrary")}
            </Button>
            <h1 className="text-2xl font-bold text-gray-100">
              {t("uploadAssets")}
            </h1>
          </div>

          <Button
            onClick={handleViewLibrary}
            variant="flat"
            className="text-gray-300"
          >
            {t("viewLibrary")}
          </Button>
        </div>

        <div className="bg-[#12121f] rounded-lg shadow-lg border border-gray-800 p-6">
          {/* Collection selector */}
          <div className="mb-8">
            <Select
              label={t("selectCollection")}
              placeholder={t("chooseCollection")}
              selectedKeys={selectedCollectionId ? [selectedCollectionId] : []}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              classNames={{
                base: "max-w-md",
                trigger: "bg-[#1a1a2e] border border-gray-700 hover:border-gray-600",
                value: "text-gray-200",
                label: "text-gray-400",
              }}
              isRequired
            >
              {collections.map((collection) => (
                <SelectItem
                  key={collection.id}
                  value={collection.id}
                  textValue={collection.name}
                >
                  <div className="flex flex-col">
                    <span className="text-gray-200">{collection.name}</span>
                    {collection.description && (
                      <span className="text-xs text-gray-500">
                        {collection.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </Select>

            {selectedCollection && (
              <div className="mt-3 text-sm text-gray-500 space-y-1">
                <p>
                  {t("collectionType")}: <span className="text-gray-400">{selectedCollection.type}</span>
                </p>
                <p>
                  {t("allowedTypes")}: <span className="text-gray-400">{selectedCollection.allowed_mime_types.join(", ")}</span>
                </p>
                <p>
                  {t("maxFileSize")}: <span className="text-gray-400">
                    {(selectedCollection.max_file_size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Upload component */}
          {!selectedCollection && (
            <Card className="bg-[#1a1a2e] border border-gray-700">
              <CardBody className="text-center py-12">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg mb-2">
                  {t("selectCollectionToUpload")}
                </p>
                <p className="text-gray-500 text-sm">
                  {t("chooseCollectionAbove")}
                </p>
              </CardBody>
            </Card>
          )}

          {selectedCollection && (
            <div key={uploadKey}>
              <AssetUpload
                collection={selectedCollection}
                onUploadComplete={handleUploadComplete}
              />

              {/* Action buttons */}
              <div className="mt-8 flex items-center justify-between gap-4 pt-6 border-t border-gray-800">
                <Button
                  onClick={handleUploadMore}
                  variant="flat"
                  className="text-gray-300"
                  startContent={<Upload className="h-4 w-4" />}
                >
                  {t("uploadMoreFiles")}
                </Button>

                <Button
                  onClick={handleViewLibrary}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {t("viewLibrary")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
