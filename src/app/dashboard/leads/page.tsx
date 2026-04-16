"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Button, Select, SelectItem, Skeleton,
} from "@heroui/react";
import { RefreshCw, Users, Plus, Download, X, ChevronLeft, ChevronRight, FileX } from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useListLeads } from "@/src/common/hooks/leads/use-list-leads";
import { useGetCollectionLeads } from "@/src/common/hooks/leads/use-get-collection-leads";
import { useListCollections } from "@/src/common/hooks/leads/use-list-collections";
import { listLeadsService } from "@/src/common/services/leads/list-leads-service";
import { getCollectionLeadsService } from "@/src/common/services/leads/get-collection-leads-service";
import { LeadDrawer } from "@/src/components/leads/lead-drawer";
import { CreateLeadDialog } from "@/src/components/leads/create-lead-dialog";
import type { Lead } from "@/src/common/@types/@lead";
import { ELeadStatus, EOriginLead } from "@/src/common/@types/@lead";
import { formatDate } from "@/src/common/lib/utils";

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("leads");

  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "30");
  const statusFilter = searchParams.get("status") || "";
  const originFilter = searchParams.get("origin") || "";
  const collectionFilter = searchParams.get("collection") || "";

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const hasCollectionFilter = collectionFilter !== "";
  const hasAnyFilter = hasCollectionFilter || statusFilter !== "" || originFilter !== "";

  const { data: collectionsData } = useListCollections({ limit: 100 });
  const collections = collectionsData?.data?.collections ?? [];

  const { data: allLeadsData, isLoading: isLoadingAll, refetch: refetchAll } = useListLeads({
    page,
    limit,
    status: statusFilter ? Number(statusFilter) : undefined,
    origin: originFilter ? Number(originFilter) : undefined,
    enabled: !hasCollectionFilter,
  });

  const { data: collectionLeadsData, isLoading: isLoadingCollection, refetch: refetchCollection } = useGetCollectionLeads({
    collectionId: collectionFilter,
    page,
    limit,
    enabled: hasCollectionFilter,
  });

  const activeData = hasCollectionFilter ? collectionLeadsData : allLeadsData;
  const isLoading = hasCollectionFilter ? isLoadingCollection : isLoadingAll;
  const refetch = hasCollectionFilter ? refetchCollection : refetchAll;

  const leads: Lead[] = activeData?.data?.leads ?? [];
  const meta = activeData?.data?.page;
  const totalPages = meta?.count_pages ?? 1;
  const totalCount = meta?.count ?? 0;

  const STATUS_LABELS: Record<number, string> = {
    [ELeadStatus.new]: t("statusNew"),
    [ELeadStatus.archived]: t("statusArchived"),
  };

  const STATUS_COLORS: Record<number, "success" | "default"> = {
    [ELeadStatus.new]: "success",
    [ELeadStatus.archived]: "default",
  };

  const ORIGIN_LABELS: Record<number, string> = {
    [EOriginLead.seo_tool]: t("originSeoTool"),
    [EOriginLead.seo_archive]: t("originSeoArchive"),
    [EOriginLead.email]: t("originEmail"),
    [EOriginLead.facebook_ads]: t("originFacebookAds"),
    [EOriginLead.google_ads]: t("originGoogleAds"),
    [EOriginLead.page]: t("originPage"),
  };

  const STATUS_OPTIONS = [
    { value: "", label: t("allStatuses") },
    { value: String(ELeadStatus.new), label: t("statusNew") },
    { value: String(ELeadStatus.archived), label: t("statusArchived") },
  ];

  const ORIGIN_OPTIONS = [
    { value: "", label: t("allOrigins") },
    { value: String(EOriginLead.seo_tool), label: t("originSeoTool") },
    { value: String(EOriginLead.seo_archive), label: t("originSeoArchive") },
    { value: String(EOriginLead.email), label: t("originEmail") },
    { value: String(EOriginLead.facebook_ads), label: t("originFacebookAds") },
    { value: String(EOriginLead.google_ads), label: t("originGoogleAds") },
    { value: String(EOriginLead.page), label: t("originPage") },
  ];

  const LIMIT_OPTIONS = [
    { value: "15", label: t("perPage", { count: 15 }) },
    { value: "30", label: t("perPage", { count: 30 }) },
    { value: "50", label: t("perPage", { count: 50 }) },
  ];

  const COLUMNS = [
    { key: "name", label: t("columnName") },
    { key: "email", label: t("columnEmail") },
    { key: "phone", label: t("columnPhone") },
    { key: "origin", label: t("columnOrigin") },
    { key: "status", label: t("columnStatus") },
    { key: "created_at", label: t("columnCreated") },
  ];

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/dashboard/leads?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/dashboard/leads");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/dashboard/leads?${params.toString()}`);
  };

  const handleExportCSV = async () => {
    if (totalCount === 0) return;
    setIsExporting(true);
    try {
      let allLeads: Lead[] = [];

      if (hasCollectionFilter) {
        const res = await getCollectionLeadsService(collectionFilter, { page: 1, limit: totalCount });
        allLeads = res.data.leads;
      } else {
        const res = await listLeadsService({
          page: 1,
          limit: totalCount,
          status: statusFilter ? Number(statusFilter) : undefined,
          origin: originFilter ? Number(originFilter) : undefined,
        });
        allLeads = res.data.leads;
      }

      const headers = ["Name", "Email", "Phone", "Origin", "Status", "City", "Region", "Country", "Created At"];
      const rows = allLeads.map((lead) => [
        lead.name || "",
        lead.email || "",
        lead.phone_number || "",
        ORIGIN_LABELS[lead.origin] || String(lead.origin),
        STATUS_LABELS[lead.status] || String(lead.status),
        lead.city || "",
        lead.region || "",
        lead.country || "",
        formatDate(lead.created_at),
      ]);

      const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const csv = [headers, ...rows].map((row) => row.map((c) => escape(String(c))).join(",")).join("\n");

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  // Page number list with ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return pages;
  }, [page, totalPages]);

  const renderCell = (lead: Lead, key: string) => {
    switch (key) {
      case "name":
        return <p className="font-medium text-foreground">{lead.name || "—"}</p>;
      case "email":
        return <span className="text-sm text-muted-foreground">{lead.email || "—"}</span>;
      case "phone":
        return <span className="text-sm">{lead.phone_number || "—"}</span>;
      case "origin":
        return (
          <span className="text-sm text-muted-foreground">
            {ORIGIN_LABELS[lead.origin] || String(lead.origin)}
          </span>
        );
      case "status":
        return (
          <Chip color={STATUS_COLORS[lead.status] ?? "default"} variant="flat" size="sm">
            {STATUS_LABELS[lead.status] || String(lead.status)}
          </Chip>
        );
      case "created_at":
        return (
          <span className="text-sm text-muted-foreground">{formatDate(lead.created_at)}</span>
        );
      default:
        return null;
    }
  };

  const firstItem = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, totalCount);

  return (
    <LayoutScopeRoot routeActive="leads">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6" />
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {meta ? t("subtitle", { count: meta.count }) : t("manageLeads")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="flat"
              startContent={<RefreshCw className="w-4 h-4" />}
              onPress={() => refetch()}
              isLoading={isLoading}
              size="sm"
            >
              {t("refresh")}
            </Button>
            <Button
              variant="flat"
              startContent={<Download className="w-4 h-4" />}
              onPress={handleExportCSV}
              isLoading={isExporting}
              isDisabled={totalCount === 0}
              size="sm"
            >
              {t("exportCsv")}
            </Button>
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => setShowCreate(true)}
              size="sm"
            >
              {t("newLead")}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[collectionFilter]}
            onChange={(e) => updateParam("collection", e.target.value)}
            aria-label={t("filterByCollection")}
            className="w-52"
            classNames={{ trigger: "border-gray-700 bg-gray-900/50" }}
          >
            {[
              <SelectItem key="" value="">{t("allCollections")}</SelectItem>,
              ...collections.map((c) => (
                <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>
              )),
            ]}
          </Select>

          {!hasCollectionFilter && (
            <Select
              size="sm"
              variant="bordered"
              selectedKeys={[statusFilter]}
              onChange={(e) => updateParam("status", e.target.value)}
              aria-label={t("allStatuses")}
              className="w-44"
              classNames={{ trigger: "border-gray-700 bg-gray-900/50" }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>
          )}

          {!hasCollectionFilter && (
            <Select
              size="sm"
              variant="bordered"
              selectedKeys={[originFilter]}
              onChange={(e) => updateParam("origin", e.target.value)}
              aria-label={t("allOrigins")}
              className="w-48"
              classNames={{ trigger: "border-gray-700 bg-gray-900/50" }}
            >
              {ORIGIN_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>
          )}

          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[String(limit)]}
            onChange={(e) => updateParam("limit", e.target.value)}
            aria-label={t("rowsPerPage")}
            className="w-36"
            classNames={{ trigger: "border-gray-700 bg-gray-900/50" }}
          >
            {LIMIT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </Select>

          {hasAnyFilter && (
            <Button
              size="sm"
              variant="light"
              color="danger"
              startContent={<X className="w-3.5 h-3.5" />}
              onPress={clearFilters}
            >
              {t("clearFilters")}
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <Table
            aria-label="Leads table"
            selectionMode="single"
            classNames={{
              wrapper: "rounded-xl border border-divider",
              th: "bg-default-100 text-xs font-semibold uppercase tracking-wider",
              tr: "cursor-pointer hover:bg-default-50 transition-colors",
            }}
          >
            <TableHeader columns={COLUMNS}>
              {(col) => <TableColumn key={col.key}>{col.label}</TableColumn>}
            </TableHeader>
            <TableBody
              items={leads}
              isLoading={isLoading}
              loadingContent={
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              }
              emptyContent={
                <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
                  <FileX className="w-10 h-10 opacity-40" />
                  <p className="text-sm font-medium">
                    {hasCollectionFilter ? t("noLeadsInCollection") : t("noLeadsFound")}
                  </p>
                  {hasAnyFilter && (
                    <Button size="sm" variant="flat" onPress={clearFilters} startContent={<X className="w-3.5 h-3.5" />}>
                      {t("clearFilters")}
                    </Button>
                  )}
                </div>
              }
            >
              {(lead) => (
                <TableRow key={lead.id} onClick={() => setSelectedLeadId(lead.id)}>
                  {(col) => <TableCell>{renderCell(lead, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination + results info */}
        {!isLoading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t("showingResults", { first: firstItem, last: lastItem, total: totalCount })}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  isDisabled={page <= 1}
                  onPress={() => handlePageChange(page - 1)}
                  aria-label={t("previous")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {pageNumbers.map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground select-none">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      isIconOnly
                      size="sm"
                      variant={p === page ? "solid" : "flat"}
                      color={p === page ? "primary" : "default"}
                      onPress={() => handlePageChange(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}

                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  isDisabled={page >= totalPages}
                  onPress={() => handlePageChange(page + 1)}
                  aria-label={t("next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <LeadDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onDeleted={() => refetch()}
      />

      <CreateLeadDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        collectionId={hasCollectionFilter ? collectionFilter : undefined}
      />
    </LayoutScopeRoot>
  );
}
