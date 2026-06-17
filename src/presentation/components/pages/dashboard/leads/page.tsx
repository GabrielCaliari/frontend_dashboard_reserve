"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Chip } from "@heroui/react";
import { ListChecks, Plus, Users } from "lucide-react";

import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { EntityList } from "@/src/presentation/components/organisms/entity-list";
import type { EntityListDefinition } from "@/src/presentation/components/organisms/entity-list";
import { LeadDrawer } from "@/src/presentation/components/organisms/leads/lead-drawer";
import { CreateLeadDialog } from "@/src/presentation/components/organisms/leads/create-lead-dialog";
import {
  queryLeadEntityList,
  type LeadEntityFilters,
} from "@/src/modules/leads/infrastructure/lead-entity-list-adapter";
import type { Lead } from "@/src/shared/domain/types/@lead";
import { ELeadStatus, EOriginLead } from "@/src/shared/domain/types/@lead";
import { formatDate } from "@/src/shared/lib/utils";

export default function LeadsPage() {
  const t = useTranslations("leads");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

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

  const definition: EntityListDefinition<Lead, LeadEntityFilters> = {
    id: "leads",
    ariaLabel: t("title"),
    getKey: (lead) => lead.id,
    dataSource: {
      capabilities: { search: false, sort: false, pagination: "server", selection: "none" },
      query: queryLeadEntityList,
    },
    initialState: { pageSize: 30, filters: { status: "", origin: "" } },
    filters: [
      {
        key: "status",
        label: t("allStatuses"),
        kind: "single",
        options: [
          { value: String(ELeadStatus.new), label: t("statusNew") },
          { value: String(ELeadStatus.archived), label: t("statusArchived") },
        ],
      },
      {
        key: "origin",
        label: t("allOrigins"),
        kind: "single",
        options: Object.entries(ORIGIN_LABELS).map(([value, label]) => ({ value, label })),
      },
    ],
    sorts: [],
    variant: "table",
    columns: [
      {
        key: "name",
        header: t("columnName"),
        render: (lead) => <p className="font-medium text-foreground">{lead.name || "—"}</p>,
      },
      {
        key: "email",
        header: t("columnEmail"),
        render: (lead) => (
          <span className="text-sm text-muted-foreground">{lead.email || "—"}</span>
        ),
      },
      {
        key: "phone",
        header: t("columnPhone"),
        render: (lead) => <span className="text-sm">{lead.phone_number || "—"}</span>,
      },
      {
        key: "origin",
        header: t("columnOrigin"),
        render: (lead) => (
          <span className="text-sm text-muted-foreground">
            {ORIGIN_LABELS[lead.origin] ?? t("originUnknown")}
          </span>
        ),
      },
      {
        key: "status",
        header: t("columnStatus"),
        render: (lead) => (
          <Chip color={STATUS_COLORS[lead.status] ?? "default"} variant="flat" size="sm">
            {STATUS_LABELS[lead.status] ?? t("statusUnknown")}
          </Chip>
        ),
      },
      {
        key: "created_at",
        header: t("columnCreated"),
        render: (lead) => (
          <span className="text-sm text-muted-foreground">{formatDate(lead.created_at)}</span>
        ),
      },
    ],
    onActivate: (lead) => setSelectedLeadId(lead.id),
    primaryActions: (
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-default-100"
        href="/dashboard/leads/collections"
      >
        <ListChecks className="h-4 w-4" />
        {t("viewByCollection")}
      </Link>
    ),
  };

  return (
    <LayoutScopeRoot routeActive="leads">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6" />
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t("manageLeads")}</p>
          </div>
          <button
            type="button"
            className="btn-pill btn-primary inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" />
            {t("newLead")}
          </button>
        </div>

        <EntityList definition={definition} stateMode="url" />
      </div>

      <LeadDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onDeleted={() => setSelectedLeadId(null)}
      />

      <CreateLeadDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </LayoutScopeRoot>
  );
}
