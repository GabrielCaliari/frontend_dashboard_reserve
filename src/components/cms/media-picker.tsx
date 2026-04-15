"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Button,
  Input,
  Tabs,
  Tab,
  Card,
  CardBody,
  Spinner,
  Select,
  SelectItem,
  Pagination,
} from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/src/presentation/components/atoms/reserve/modal";
import { Search } from "lucide-react";
import { AssetGrid } from "./asset-grid";
import { AssetUpload } from "./asset-upload";
import { useAssets } from "@/src/common/hooks/cms/use-assets";
import { useCollections } from "@/src/common/hooks/cms/use-collections";
import type {
  CmsMediaId,
  MediaAsset,
  MediaCollection,
} from "@/src/shared/domain/types/@cms-media";
import { useDebounce } from "@/src/shared/hooks/use-debounce";

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assets: MediaAsset[]) => void;
  selectionMode?: "single" | "multiple";
  defaultCollection?: CmsMediaId;
}

/**
 * Media Picker Modal Component
 *
 * A modal component for browsing and selecting media assets from the library
 * or uploading new assets. Supports both single and multiple selection modes.
 *
 * Features:
 * - Two tabs: Browse Library and Upload New
 * - Collection filtering
 * - Search functionality with debounce
 * - Pagination for large asset lists
 * - Asset selection with visual feedback
 * - Auto-select newly uploaded assets
 * - Automatic tab switching after upload
 *
 * @param isOpen - Controls modal visibility
 * @param onClose - Callback when modal is closed
 * @param onSelect - Callback with selected assets array
 * @param selectionMode -'single' or'multiple' selection mode
 * @param defaultCollection - Optional default collection ID to filter by
 *
 * @example
 *```tsx
 * import { MediaPicker } from'@/src/components/cms/media-picker';
 * import { useState } from'react';
 *
 * function MyComponent() {
 * const [isOpen, setIsOpen] = useState(false);
 *
 * const handleSelect = (assets) => {
 * console.log('Selected assets:', assets);
 * setIsOpen(false);
 * };
 *
 * return (
 * <>
 * <Button onPress={() => setIsOpen(true)}>Select Media</Button>
 * <MediaPicker
 * isOpen={isOpen}
 * onClose={() => setIsOpen(false)}
 * onSelect={handleSelect}
 * selectionMode="multiple"
 * />
 * </>
 * );
 * }
 *```
 */
export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  selectionMode = "multiple",
  defaultCollection,
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<string>("browse");
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    CmsMediaId | undefined
  >(defaultCollection);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadCollection, setUploadCollection] =
    useState<MediaCollection | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch collections for filter dropdown
  const { data: collectionsData } = useCollections({ limit: 100 });
  const collections = collectionsData?.data || [];

  // Fetch assets with filters
  const { data: assetsData, isLoading } = useAssets(
    {
      collection_id: selectedCollectionId,
      search: debouncedSearch || undefined,
    },
    {
      page: currentPage,
      limit: 20,
    },
  );

  const assets = assetsData?.data || [];
  const totalPages = assetsData?.meta?.totalPages || 1;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedAssets([]);
      setActiveTab("browse");
      setSearchQuery("");
      setCurrentPage(1);
      if (defaultCollection) {
        setSelectedCollectionId(defaultCollection);
      }
    }
  }, [isOpen, defaultCollection]);

  // Set upload collection when collection is selected
  useEffect(() => {
    if (selectedCollectionId) {
      const collection = collections.find((c) => c.id === selectedCollectionId);
      if (collection) {
        setUploadCollection(collection);
      }
    } else {
      setUploadCollection(collections[0] || null);
    }
  }, [selectedCollectionId, collections]);

  // Handle asset selection
  const handleAssetSelect = useCallback(
    (asset: MediaAsset) => {
      if (selectionMode === "single") {
        setSelectedAssets([asset]);
      } else {
        setSelectedAssets((prev) => {
          const isSelected = prev.some((a) => a.id === asset.id);
          if (isSelected) {
            return prev.filter((a) => a.id !== asset.id);
          } else {
            return [...prev, asset];
          }
        });
      }
    },
    [selectionMode],
  );

  // Handle upload complete
  const handleUploadComplete = useCallback(() => {
    // Switch to browse tab after successful upload
    setActiveTab("browse");
    // Reset to first page to show newly uploaded assets
    setCurrentPage(1);
  }, []);

  // Handle confirm selection
  const handleConfirm = useCallback(() => {
    onSelect(selectedAssets);
    onClose();
  }, [selectedAssets, onSelect, onClose]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setSelectedAssets([]);
    onClose();
  }, [onClose]);

  // Handle collection filter change
  const handleCollectionChange = useCallback((value: string) => {
    const collectionId = value === "all" ? undefined : value;
    setSelectedCollectionId(collectionId);
    setCurrentPage(1);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const selectedIds = selectedAssets.map((a) => a.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-foreground">
            Select Media
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectionMode === "single"
              ? "Select one asset from the library"
              : "Select one or more assets from the library"}
          </p>
        </ModalHeader>

        <ModalBody>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            classNames={{
              tabList: "bg-card border border-border",
              cursor: "bg-blue-600",
              tab: "text-muted-foreground data-[selected=true]:text-white",
            }}
          >
            <Tab key="browse" title="Browse Library">
              <div className="space-y-4 mt-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select
                    label="Collection"
                    placeholder="All Collections"
                    selectedKeys={
                      selectedCollectionId ? [selectedCollectionId] : ["all"]
                    }
                    onChange={(e) => handleCollectionChange(e.target.value)}
                    classNames={{
                      trigger: "bg-card border border-border",
                      value: "text-foreground",
                      label: "text-muted-foreground",
                    }}
                    className="sm:w-64"
                  >
                    <SelectItem key="all" value="all">
                      All Collections
                    </SelectItem>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    placeholder="Search by filename..."
                    value={searchQuery}
                    onValueChange={handleSearchChange}
                    startContent={
                      <Search className="h-4 w-4 text-muted-foreground" />
                    }
                    classNames={{
                      input: "bg-card text-foreground",
                      inputWrapper: "bg-card border border-border",
                    }}
                    className="flex-1"
                  />
                </div>

                {/* Asset Grid */}
                <AssetGrid
                  assets={assets}
                  isLoading={isLoading}
                  selectable
                  selectedIds={selectedIds}
                  onSelect={handleAssetSelect}
                  emptyMessage={
                    searchQuery || selectedCollectionId
                      ? "No assets found matching your filters"
                      : "No assets in library. Upload some assets to get started."
                  }
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      total={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      showControls
                      classNames={{
                        cursor: "bg-blue-600 text-white",
                        item: "bg-card text-muted-foreground border border-border",
                      }}
                    />
                  </div>
                )}
              </div>
            </Tab>

            <Tab key="upload" title="Upload New">
              <div className="mt-4">
                {uploadCollection ? (
                  <>
                    <div className="mb-4">
                      <Select
                        label="Upload to Collection"
                        selectedKeys={[uploadCollection.id]}
                        onChange={(e) => {
                          const collection = collections.find(
                            (c) => c.id === e.target.value,
                          );
                          if (collection) {
                            setUploadCollection(collection);
                          }
                        }}
                        classNames={{
                          trigger: "bg-card border border-border",
                          value: "text-foreground",
                          label: "text-muted-foreground",
                        }}
                      >
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    <AssetUpload
                      collection={uploadCollection}
                      onUploadComplete={handleUploadComplete}
                    />
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No collections available. Create a collection first to
                      upload assets.
                    </p>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={handleCancel}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onPress={handleConfirm}
            isDisabled={selectedAssets.length === 0}
          >
            Confirm ({selectedAssets.length} selected)
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
