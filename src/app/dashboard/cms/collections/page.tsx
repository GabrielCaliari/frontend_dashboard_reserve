"use client";

import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useCollections, useDeleteCollection } from "@/src/common/hooks/cms/use-collections";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash, Plus, Search } from "lucide-react";
import { MediaCollection, CollectionType } from "@/src/common/@types/@cms-media";
import { Button } from "@nextui-org/react";

// Collection type badge component
function CollectionTypeBadge({ type }: { type: CollectionType }) {
  const typeConfig = {
    images: { label: "Images", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    documents: { label: "Documents", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    videos: { label: "Videos", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
    mixed: { label: "Mixed", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
  };

  const config = typeConfig[type] || typeConfig.mixed;

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
}

// Actions menu component
function ActionsMenu({
  collection,
  onEdit,
  onDelete,
}: {
  collection: MediaCollection;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const t = useTranslations("cms.collections");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex justify-center rounded-md border border-gray-700 shadow-sm px-2 py-2 bg-[#1a1a2e] text-sm font-medium text-gray-300 hover:bg-[#1e1e3a] focus:outline-none">
          <MoreVertical className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-gray-700">
        <DropdownMenuItem
          onClick={() => onEdit(collection.id)}
          className="text-blue-400 cursor-pointer flex items-center hover:bg-[#1e1e3a]"
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>{t("edit")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(collection.id)}
          className="text-red-400 cursor-pointer flex items-center hover:bg-[#1e1e3a]"
        >
          <Trash className="mr-2 h-4 w-4" />
          <span>{t("delete")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Table row component
function CollectionTableRow({
  collection,
  index,
  onEdit,
  onDelete,
}: {
  collection: MediaCollection;
  index: number;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  // Calculate item count (placeholder - will be populated from API in future)
  const itemCount = 0;

  return (
    <tr
      key={collection.id}
      className={
        index % 2 === 0
          ? "bg-[#12121f] hover:bg-[#1e1e3a]"
          : "bg-[#16162a] hover:bg-[#1e1e3a]"
      }
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
        {collection.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
        <CollectionTypeBadge type={collection.type} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
        {itemCount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
        {collection.description || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
        {collection.allowed_mime_types.slice(0, 2).join(", ")}
        {collection.allowed_mime_types.length > 2 && ` +${collection.allowed_mime_types.length - 2}`}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
        {collection.max_items || "∞"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
        <ActionsMenu collection={collection} onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}

// Collections table component
function CollectionsTable({
  collections,
  onEdit,
  onDelete,
}: {
  collections: MediaCollection[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const t = useTranslations("cms.collections");

  if (!collections || collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-[#12121f] rounded-lg">
        <p className="text-gray-400 text-lg mb-2">{t("noCollectionsFound")}</p>
        <p className="text-gray-500 text-sm">{t("createFirstCollection")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="min-w-full bg-[#12121f] divide-y divide-gray-800">
        <thead className="bg-[#1a1a2e]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t("name")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t("type")}
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t("items")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t("description")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t("allowedTypes")}
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t("maxItems")}
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t("actions")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-[#12121f] divide-y divide-gray-800">
          {collections.map((collection, index) => (
            <CollectionTableRow
              key={collection.id}
              collection={collection}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Delete confirmation modal
function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  collectionName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  collectionName: string;
}) {
  const t = useTranslations("cms.collections");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#1a1a2e] rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
        <h3 className="text-xl font-bold text-gray-100 mb-4">{t("deleteConfirmTitle")}</h3>
        <p className="text-gray-400 mb-6">
          {t("deleteConfirmMessage", { name: collectionName })}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="bg-gray-700 text-gray-200 hover:bg-gray-600"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {t("delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function CollectionsPage() {
  const t = useTranslations("cms.collections");
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<CollectionType | "all">("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<MediaCollection | null>(null);

  // Fetch collections
  const { data, isLoading, error } = useCollections({ page: currentPage, limit: 20 });
  const deleteCollectionMutation = useDeleteCollection();

  // Filter collections client-side
  const filteredCollections = useMemo(() => {
    if (!data?.data) return [];

    let filtered = data.data;

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((c) => c.type === typeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [data?.data, typeFilter, searchQuery]);

  // Handlers
  const handleEdit = (id: number) => {
    router.push(`/dashboard/cms/collections/${id}`);
  };

  const handleDeleteClick = (id: number) => {
    const collection = data?.data.find((c) => c.id === id);
    if (collection) {
      setCollectionToDelete(collection);
      setDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!collectionToDelete) return;

    try {
      await deleteCollectionMutation.mutateAsync(collectionToDelete.id);
      setDeleteModalOpen(false);
      setCollectionToDelete(null);
    } catch (error) {
      console.error("Failed to delete collection:", error);
    }
  };

  const handleCreateNew = () => {
    router.push("/dashboard/cms/collections/new");
  };

  return (
    <LayoutScopeRoot routeActive="cms">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-100">
          {t("title")}
        </h1>

        <div className="bg-[#12121f] rounded-lg shadow-lg border border-gray-800 p-6">
          {/* Filters and actions bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as CollectionType | "all")}
              className="px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">{t("allTypes")}</option>
              <option value="images">{t("typeImages")}</option>
              <option value="documents">{t("typeDocuments")}</option>
              <option value="videos">{t("typeVideos")}</option>
              <option value="mixed">{t("typeMixed")}</option>
            </select>

            {/* Create button */}
            <Button
              onClick={handleCreateNew}
              className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {t("createCollection")}
            </Button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">{t("loading")}</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-400">{t("errorLoading")}</p>
            </div>
          )}

          {/* Collections table */}
          {!isLoading && !error && (
            <CollectionsTable
              collections={filteredCollections}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )}

          {/* Pagination and results count */}
          {!isLoading && !error && data && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                {t("showingResults", { count: filteredCollections.length, total: data.meta.total })}
              </div>
              
              {data.meta.total_pages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    isDisabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="bg-[#1a1a2e] text-gray-300 border border-gray-700 hover:bg-[#1e1e3a]"
                  >
                    {t("previous")}
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, data.meta.total_pages) }, (_, i) => {
                      let pageNum: number;
                      if (data.meta.total_pages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= data.meta.total_pages - 2) {
                        pageNum = data.meta.total_pages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-[#1a1a2e] text-gray-300 border border-gray-700 hover:bg-[#1e1e3a]"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    size="sm"
                    isDisabled={currentPage === data.meta.total_pages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="bg-[#1a1a2e] text-gray-300 border border-gray-700 hover:bg-[#1e1e3a]"
                  >
                    {t("next")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCollectionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        collectionName={collectionToDelete?.name || ""}
      />
    </LayoutScopeRoot>
  );
}
