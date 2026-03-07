"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Button, Select, SelectItem, Skeleton,
} from "@nextui-org/react";
import { RefreshCw, Users, Plus } from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useListLeads } from "@/src/common/hooks/leads/use-list-leads";
import { LeadDrawer } from "@/src/components/leads/lead-drawer";
import { CreateLeadDialog } from "@/src/components/leads/create-lead-dialog";
import type { Lead } from "@/src/common/@types/@lead";
import { ELeadStatus, EOriginLead } from "@/src/common/@types/@lead";
import { formatDate } from "@/src/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: String(ELeadStatus.new), label: "New" },
  { value: String(ELeadStatus.archived), label: "Archived" },
];

const ORIGIN_OPTIONS = [
  { value: "", label: "All origins" },
  { value: String(EOriginLead.seo_tool), label: "SEO Tool" },
  { value: String(EOriginLead.seo_archive), label: "SEO Archive" },
  { value: String(EOriginLead.email), label: "Email" },
  { value: String(EOriginLead.facebook_ads), label: "Facebook Ads" },
  { value: String(EOriginLead.google_ads), label: "Google Ads" },
  { value: String(EOriginLead.page), label: "Landing Page" },
];

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

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "30");
  const statusFilter = searchParams.get("status") || "";
  const originFilter = searchParams.get("origin") || "";

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, refetch } = useListLeads({
    page,
    limit,
    status: statusFilter ? Number(statusFilter) : undefined,
    origin: originFilter ? Number(originFilter) : undefined,
  });

  const leads: Lead[] = data?.data?.leads || [];
  const meta = data?.data?.page;
  const totalPages = meta?.count_pages || 1;

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

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/dashboard/leads?${params.toString()}`);
  };

  const renderCell = (lead: Lead, key: string) => {
    switch (key) {
      case "name":
        return (
          <p className="font-medium text-foreground">{lead.name || "—"}</p>
        );
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
    <LayoutScopeRoot routeActive="leads">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6" />
              Leads
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {meta ? `${meta.count} total leads` : "Manage your leads"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="flat"
              startContent={<RefreshCw className="w-4 h-4" />}
              onPress={() => refetch()}
              isLoading={isLoading}
              size="sm"
            >
              Refresh
            </Button>
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => setShowCreate(true)}
              size="sm"
            >
              New Lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[statusFilter]}
            onChange={(e) => updateParam("status", e.target.value)}
            aria-label="Filter by status"
            className="w-44"
            classNames={{ trigger: "border-gray-700 bg-gray-900/50" }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[originFilter]}
            onChange={(e) => updateParam("origin", e.target.value)}
            aria-label="Filter by origin"
            className="w-48"
            classNames={{ trigger: "border-gray-700 bg-gray-900/50" }}
          >
            {ORIGIN_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[String(limit)]}
            onChange={(e) => updateParam("limit", e.target.value)}
            aria-label="Rows per page"
            className="w-36"
            classNames={{ trigger: "border-gray-700 bg-gray-900/50" }}
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
              <div className="py-12 text-center text-muted-foreground">
                No leads found
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

      {/* Lead detail drawer */}
      <LeadDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onDeleted={() => refetch()}
      />

      {/* Create lead dialog */}
      <CreateLeadDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </LayoutScopeRoot>
  );
}
