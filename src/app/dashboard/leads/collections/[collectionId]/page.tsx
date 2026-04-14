"use client";

import { use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Select,
  SelectItem,
  Skeleton,
  Spinner,
} from "@heroui/react";
import { ArrowLeft, RefreshCw, ChevronDown, Plus } from "lucide-react";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { useGetCollectionLeads } from "@/src/common/hooks/leads/use-get-collection-leads";
import { useListCollections } from "@/src/common/hooks/leads/use-list-collections";
import { useGetCollection } from "@/src/common/hooks/leads/use-get-collection";
import { LeadDrawer } from "@/src/components/leads/lead-drawer";
import { CreateLeadDialog } from "@/src/components/leads/create-lead-dialog";
import type { Lead } from "@/src/shared/domain/types/@lead";
import { ELeadStatus, EOriginLead } from "@/src/shared/domain/types/@lead";
import { formatDate } from "@/src/shared/lib/utils";

const LIMIT_OPTIONS = [
  { value: "15", label: "15 per page" },
  { value: "30", label: "30 per page" },
  { value: "50", label: "50 per page" },
];

const STATUS_LABELS: Record<number, string> = {
  [ELeadStatus.new]: "New",
  [ELeadStatus.archived]: "Archived",
};

const STATUS_COLORS: Record<number, "success" | "default"> = {
  [ELeadStatus.new]: "success",
  [ELeadStatus.archived]: "default",
};

const ORIGIN_LABELS: Record<number, string> = {
  [EOriginLead.seo_tool]: "SEO Tool",
  [EOriginLead.seo_archive]: "SEO Archive",
  [EOriginLead.email]: "Email",
  [EOriginLead.facebook_ads]: "Facebook Ads",
  [EOriginLead.google_ads]: "Google Ads",
  [EOriginLead.page]: "Landing Page",
};

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "origin", label: "Origin" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created" },
];

export default function CollectionLeadsPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = use(params);

  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "30");

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: collectionData } = useGetCollection({ id: collectionId });
  const { data: collectionsData } = useListCollections({ limit: 100 });
  const { data, isLoading, refetch } = useGetCollectionLeads({
    collectionId: collectionId,
    page,
    limit,
  });

  const collection = collectionData?.data;
  const collections = collectionsData?.data?.collections ?? [];
  const leads: Lead[] = data?.data?.leads ?? [];
  const meta = data?.data?.page;
  const totalPages = meta?.count_pages ?? 1;

  const handlePageChange = (newPage: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(newPage));
    router.push(`/dashboard/leads/collections/${collectionId}?${p.toString()}`);
  };

  const handleLimitChange = (newLimit: string) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("limit", newLimit);
    p.set("page", "1");
    router.push(`/dashboard/leads/collections/${collectionId}?${p.toString()}`);
  };

  const handleSwitchCollection = (newId: string) => {
    if (newId && newId !== collectionId) {
      router.push(`/dashboard/leads/collections/${newId}`);
    }
  };

  const renderCell = (lead: Lead, key: string) => {
    switch (key) {
      case "name":
        return (
          <p className="font-medium text-foreground">{lead.name || "—"}</p>
        );
      case "email":
        return (
          <span className="text-sm text-muted-foreground">
            {lead.email || "—"}
          </span>
        );
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
          <Chip
            color={STATUS_COLORS[lead.status] ?? "default"}
            variant="flat"
            size="sm"
          >
            {STATUS_LABELS[lead.status] || String(lead.status)}
          </Chip>
        );
      case "created_at":
        return (
          <span className="text-sm text-muted-foreground">
            {formatDate(lead.created_at)}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <LayoutScopeRoot routeActive="lead-collections">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={() => router.push("/dashboard/leads/collections")}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {collection?.name ?? "Collection"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {meta
                  ? `${meta.count} lead${meta.count !== 1 ? "s" : ""}`
                  : "Loading..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Collection switcher */}
            {collections.length > 1 && (
              <Select
                size="sm"
                variant="bordered"
                selectedKeys={[collectionId]}
                onChange={(e) => handleSwitchCollection(e.target.value)}
                aria-label="Switch collection"
                className="w-52"
                classNames={{ trigger: "border-border bg-default-100/50" }}
                startContent={
                  <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                }
              >
                {collections.map((c) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </Select>
            )}

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
              New Lead
            </Button>
          </div>
        </div>

        {/* Limit selector */}
        <div className="flex gap-3">
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[String(limit)]}
            onChange={(e) => handleLimitChange(e.target.value)}
            aria-label="Rows per page"
            className="w-36"
            classNames={{ trigger: "border-border bg-default-100/50" }}
          >
            {LIMIT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Table */}
        <Table
          aria-label="Collection leads table"
          selectionMode="single"
          classNames={{
            wrapper: "rounded-xl border border-divider",
            th: "bg-default-100 text-xs font-semibold uppercase tracking-wider",
            tr: "cursor-pointer hover:bg-default-100 transition-colors",
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
              <div className="py-12 text-center text-muted-foreground">
                No leads in this collection
              </div>
            }
          >
            {(lead) => (
              <TableRow
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
              >
                {(col) => (
                  <TableCell>{renderCell(lead, col as string)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="flat"
                isDisabled={page <= 1}
                onPress={() => handlePageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="flat"
                isDisabled={page >= totalPages}
                onPress={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lead detail drawer (same component as all-leads page) */}
      <LeadDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onDeleted={() => refetch()}
      />

      {/* Create lead dialog — pre-fills collection_id */}
      <CreateLeadDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        collectionId={collectionId}
      />
    </LayoutScopeRoot>
  );
}
