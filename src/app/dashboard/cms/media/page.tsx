"use client";

import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useAssets } from "@/src/common/hooks/cms/use-assets";
import { useCollections } from "@/src/common/hooks/cms/use-collections";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AssetGrid } from "@/src/components/cms/asset-grid";
import { Button, Select, SelectItem, Input, Pagination, Spinner } from "@nextui-org/react";
import { Upload, Search } from "lucide-react";
import type { AssetStatus } from "@/src/common/@types/@cms-media";

/**
 * Assets List Page
 * 
 * Main page for browsing and managing media assets.
 * Features:
 * - Grid view of assets with thumbnails
 * - Filter by collection
 * - Filter by status (active, archived, failed, all)
 * - Search by filename with debounce
 * - Pagination (20 items per page)
 * - Upload button navigation
 * - Loading skeleton
 * - Empty state
 */
export default function MediaAssetsPage() {
  const t = useTranslations("cms.media");
  const router = useRouter();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch collections for filter dropdown
  const { data: collectionsData, isLoading: collectionsLoading } = useCollections({
    page: 1,
    limit: 100, // Get all collections for filter
  });

  // Build filters for assets query
  const assetFilters = useMemo(() => {
    const filters: {
      collection_id?: number;
      status?: AssetStatus;
      search?: string;
    } = {};

    if (collectionFilter !== "all") {
      filters.collection_id = parseInt(collectionFilter);
    }

    if (statusFilter !== "all") {
      filters.status = statusFilter;
    }

    if (debouncedSearch.trim()) {
      filters.search = debouncedSearch.trim();
    }

    return filters;
  }, [collectionFilter, statusFilter, debouncedSearch]);

  // Fetch assets with filters and pagination
  const {
    data: assetsData,
    isLoading: assetsLoading,
    error: assetsError,
  } = useAssets(assetFilters, {
    page: currentPage,
    limit: 20,
  });

  // Handlers
  const handleUploadClick = useCallback(() => {
    router.push("/dashboard/cms/media/upload");
  }, [router]);

  const handleAssetView = useCallback((asset: any) => {
    router.push(`/dashboard/cms/media/${asset.id}`);
  }, [router]);

  const handleAssetEdit = useCallback((asset: any) => {
    router.push(`/dashboard/cms/media/${asset.id}/edit`);
  }, [router]);

  // Loading state
  if (assetsLoading && currentPage === 1) {
    return (
      <LayoutScopeRoot routeActive="cms">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-6 text-gray-100">
            {t("assetsTitle")}
          </h1>
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" label={t("loading")} />
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  // Error state
  if (assetsError) {
    return (
      <LayoutScopeRoot routeActive="cms">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-6 text-gray-100">
            {t("assetsTitle")}
          </h1>
          <div className="text-center py-8">
            <p className="text-red-400">{t("errorLoading")}</p>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  const assets = assetsData?.data || [];
  const meta = assetsData?.meta;
  const collections = collectionsData?.data || [];

  return (
    <LayoutScopeRoot routeActive="cms">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-100">
          {t("assetsTitle")}
        </h1>

        <div className="bg-[#12121f] rounded-lg shadow-lg border border-gray-800 p-6">
          {/* Filters and actions bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search input */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search className="h-5 w-5 text-gray-400" />}
                classNames={{
                  base: "w-full",
                  input: "bg-[#1a1a2e] text-gray-200",
                  inputWrapper: "bg-[#1a1a2e] border border-gray-700 hover:border-gray-600",
                }}
              />
            </div>

            {/* Collection filter */}
            <div className="w-full lg:w-64">
              <Select
                label={t("collectionFilter")}
                placeholder={t("allCollections")}
                selectedKeys={[collectionFilter]}
                onChange={(e) => {
                  setCollectionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                classNames={{
                  base: "w-full",
                  trigger: "bg-[#1a1a2e] border border-gray-700 hover:border-gray-600",
                  value: "text-gray-200",
                  label: "text-gray-400",
                }}
                isLoading={collectionsLoading}
              >
                <SelectItem key="all" value="all">
                  {t("allCollections")}
                </SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection.id.toString()} value={collection.id.toString()}>
                    {collection.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Status filter */}
            <div className="w-full lg:w-48">
              <Select
                label={t("statusFilter")}
                placeholder={t("allStatuses")}
                selectedKeys={[statusFilter]}
                onChange={(e) => {
                  setStatusFilter(e.target.value as AssetStatus | "all");
                  setCurrentPage(1);
                }}
                classNames={{
                  base: "w-full",
                  trigger: "bg-[#1a1a2e] border border-gray-700 hover:border-gray-600",
                  value: "text-gray-200",
                  label: "text-gray-400",
                }}
              >
                <SelectItem key="all" value="all">
                  {t("allStatuses")}
                </SelectItem>
                <SelectItem key="active" value="active">
                  {t("statusActive")}
                </SelectItem>
                <SelectItem key="archived" value="archived">
                  {t("statusArchived")}
                </SelectItem>
                <SelectItem key="failed" value="failed">
                  {t("statusFailed")}
                </SelectItem>
              </Select>
            </div>

            {/* Upload button */}
            <Button
              onClick={handleUploadClick}
              className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 lg:w-auto w-full"
              startContent={<Upload className="h-5 w-5" />}
            >
              {t("uploadAssets")}
            </Button>
          </div>

          {/* Assets grid */}
          {assetsLoading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" label={t("loading")} />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-gray-400 text-lg mb-2">{t("noAssetsFound")}</p>
              <p className="text-gray-500 text-sm mb-6">{t("uploadFirstAsset")}</p>
              <Button
                onClick={handleUploadClick}
                className="bg-blue-600 text-white hover:bg-blue-700"
                startContent={<Upload className="h-5 w-5" />}
              >
                {t("uploadAssets")}
              </Button>
            </div>
          ) : (
            <AssetGrid
              assets={assets}
              onView={handleAssetView}
              onEdit={handleAssetEdit}
              emptyMessage={t("noAssetsFound")}
            />
          )}

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                {t("showingResults", {
                  count: assets.length,
                  total: meta.total,
                  page: meta.page,
                  totalPages: meta.total_pages,
                })}
              </div>

              <Pagination
                total={meta.total_pages}
                page={currentPage}
                onChange={setCurrentPage}
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
    </LayoutScopeRoot>
  );
}
