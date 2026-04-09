"use client";

import { useState } from "react";
import { useListLeads } from "@/src/common/hooks/leads/use-list-leads";
import { useUpdateLeadStatus } from "@/src/common/hooks/leads/use-update-lead-status";
import { Lead, LeadOrigin, LeadStatus } from "@/src/common/@types/@lead";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Spinner,
} from "@heroui/react";
import { MoreVertical, Eye, Archive } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface LeadsTableProps {
  onViewLead?: (lead: Lead) => void;
}

const originLabels: Record<LeadOrigin, string> = {
  [LeadOrigin.UNKNOWN]: "Unknown",
  [LeadOrigin.WEBSITE]: "Website",
  [LeadOrigin.SOCIAL_MEDIA]: "Social Media",
  [LeadOrigin.EMAIL_CAMPAIGN]: "Email Campaign",
  [LeadOrigin.REFERRAL]: "Referral",
  [LeadOrigin.LANDING_PAGE]: "Landing Page",
};

const statusLabels: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "New",
  [LeadStatus.CONTACTED]: "Contacted",
  [LeadStatus.QUALIFIED]: "Qualified",
  [LeadStatus.CONVERTED]: "Converted",
  [LeadStatus.ARCHIVED]: "Archived",
};

const statusColors: Record<
  LeadStatus,
  "default" | "primary" | "success" | "warning" | "danger"
> = {
  [LeadStatus.NEW]: "primary",
  [LeadStatus.CONTACTED]: "warning",
  [LeadStatus.QUALIFIED]: "success",
  [LeadStatus.CONVERTED]: "success",
  [LeadStatus.ARCHIVED]: "default",
};

export function LeadsTableV2({ onViewLead }: LeadsTableProps) {
  const t = useTranslations("leads");
  const [page, setPage] = useState(1);
  const limit = 30;

  const { data, isLoading, error } = useListLeads({ page, limit });
  const updateStatus = useUpdateLeadStatus();

  const handleStatusChange = (leadId: number, status: LeadStatus) => {
    updateStatus.mutate({ id: leadId, data: { status } });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        Error loading leads: {error.message}
      </div>
    );
  }

  const leads = data?.data?.leads || [];
  const pageInfo = data?.data?.page;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto w-full">
        <Table aria-label="Leads table">
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>EMAIL</TableColumn>
            <TableColumn>PHONE</TableColumn>
            <TableColumn>ORIGIN</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>CREATED</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody
            isLoading={isLoading}
            loadingContent={<Spinner />}
            emptyContent="No leads found"
          >
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{lead.name || "-"}</TableCell>
                <TableCell>{lead.email || "-"}</TableCell>
                <TableCell>{lead.phone_number || "-"}</TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">
                    {originLabels[lead.origin]}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={statusColors[lead.status]}>
                    {statusLabels[lead.status]}
                  </Chip>
                </TableCell>
                <TableCell>
                  {format(new Date(lead.created_at), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Lead actions">
                      <DropdownItem
                        key="view"
                        startContent={<Eye className="w-4 h-4" />}
                        onPress={() => onViewLead?.(lead)}
                      >
                        View Details
                      </DropdownItem>
                      <DropdownItem
                        key="archive"
                        startContent={<Archive className="w-4 h-4" />}
                        onPress={() =>
                          handleStatusChange(lead.id, LeadStatus.ARCHIVED)
                        }
                        className="text-danger"
                        color="danger"
                      >
                        Archive
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pageInfo && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {leads.length} of {pageInfo.count} leads
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              isDisabled={page === 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="flat"
              isDisabled={page >= pageInfo.count_pages}
              onPress={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
