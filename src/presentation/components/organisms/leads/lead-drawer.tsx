"use client";

import { useState } from "react";
import {
  Button,
  Chip,
  Select,
  SelectItem,
  Spinner,
  Divider,
} from "@heroui/react";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Pencil,
  Trash2,
  Archive,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/src/presentation/components/atoms/shadcn-ui/sheet";
import { ConfirmationDialog } from "@/src/presentation/components/organisms/access-management/shared/confirmation-dialog";
import { useGetLead } from "@/src/common/hooks/leads/use-get-lead";
import { useUpdateLeadStatus } from "@/src/common/hooks/leads/use-update-lead-status";
import { useDeleteLead } from "@/src/common/hooks/leads/use-delete-lead";
import { LeadEditForm } from "./lead-edit-form";
import { LeadAttachments } from "./lead-attachments";
import { ELeadStatus, EOriginLead } from "@/src/shared/domain/types/@lead";

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

type DrawerTab = "data" | "attachments";

interface LeadDrawerProps {
  leadId: string | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function LeadDrawer({ leadId, onClose, onDeleted }: LeadDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>("data");
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading } = useGetLead({
    id: leadId ?? "",
    enabled: !!leadId,
  });
  const updateStatus = useUpdateLeadStatus();
  const deleteLead = useDeleteLead();

  const lead = data?.data;

  const handleStatusChange = (value: string) => {
    if (!lead) return;
    const newStatus = parseInt(value) as ELeadStatus;
    if (newStatus === lead.status) return;
    updateStatus.mutate({ id: lead.id, data: { status: newStatus } });
  };

  const handleDelete = () => {
    if (!lead) return;
    deleteLead.mutate(lead.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        onClose();
        onDeleted?.();
      },
    });
  };

  const handleEditSuccess = () => {
    setEditing(false);
  };

  return (
    <>
      <Sheet open={!!leadId} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="flex flex-col w-full sm:max-w-[95vw] md:max-w-xl overflow-hidden">
          {/* Header */}
          <SheetHeader>
            <div className="flex items-start justify-between pr-8">
              <div>
                <SheetTitle>
                  {isLoading ? "Loading..." : lead?.name || "Unnamed Lead"}
                </SheetTitle>
                {lead && (
                  <SheetDescription className="mt-0.5">
                    ID: {lead.id}
                  </SheetDescription>
                )}
              </div>
              {lead && (
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => {
                      setEditing(!editing);
                      setTab("data");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="text-muted-foreground hover:text-red-400"
                    onPress={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Tabs */}
            {lead && (
              <div className="flex gap-1 mt-3">
                {(["data", "attachments"] as DrawerTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTab(t);
                      setEditing(false);
                    }}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      tab === t
                        ? "bg-primary/20 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-default-100"
                    }`}
                  >
                    {t === "data" ? "Data" : "Attachments"}
                  </button>
                ))}
              </div>
            )}
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {isLoading && (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            )}

            {!isLoading && lead && tab === "data" && (
              <div className="space-y-5">
                {/* Status selector */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Status
                  </p>
                  <Select
                    size="sm"
                    variant="bordered"
                    selectedKeys={[String(lead.status)]}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    isDisabled={updateStatus.isPending}
                    classNames={{ trigger: "border-border bg-default-100" }}
                    aria-label="Lead status"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <Divider className="bg-default-100" />

                {editing ? (
                  <LeadEditForm
                    lead={lead}
                    onSuccess={handleEditSuccess}
                    onCancel={() => setEditing(false)}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Contact info */}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        Contact
                      </p>
                      <div className="space-y-2">
                        {lead.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-foreground">
                              {lead.email}
                            </span>
                          </div>
                        )}
                        {lead.phone_number && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-foreground">
                              {lead.phone_number}
                            </span>
                          </div>
                        )}
                        {!lead.email && !lead.phone_number && (
                          <p className="text-sm text-muted-foreground italic">
                            No contact info
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Origin */}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        Origin
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Chip size="sm" variant="flat">
                          {ORIGIN_LABELS[lead.origin] || String(lead.origin)}
                        </Chip>
                        {lead.origin_font && (
                          <span className="text-sm text-muted-foreground">
                            {lead.origin_font}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {lead.description && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                          Description
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {lead.description}
                        </p>
                      </div>
                    )}

                    {/* Location */}
                    {(lead.city || lead.country) && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                          Location
                        </p>
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span>
                            {[lead.city, lead.region, lead.country]
                              .filter(Boolean)
                              .join(",")}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Extra data */}
                    {lead.data && Object.keys(lead.data).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                          Additional Data
                        </p>
                        <div className="rounded-lg bg-default-100 border border-border p-3">
                          <pre className="text-xs text-foreground overflow-auto max-h-40">
                            {JSON.stringify(lead.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <Divider className="bg-default-100" />
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Created{" "}
                          {format(
                            new Date(lead.created_at),
                            "dd MMM yyyy, HH:mm",
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Updated{" "}
                          {format(
                            new Date(lead.updated_at),
                            "dd MMM yyyy, HH:mm",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isLoading && lead && tab === "attachments" && (
              <LeadAttachments leadId={lead.id} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to permanently delete"${lead?.name || "this lead"}"? This action cannot be undone and all associated data will be lost.`}
        confirmText="Delete permanently"
        variant="danger"
        isLoading={deleteLead.isPending}
      />
    </>
  );
}
