"use client";

import {
  Button,
  Chip,
  Tabs,
  Tab,
  ScrollShadow,
  Divider,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/src/presentation/components/atoms/reserve/modal";
import { Lead, LeadOrigin, LeadStatus } from "@/src/shared/domain/types/@lead";
import { useUpdateLeadStatus } from "@/src/shared/hooks/leads/use-update-lead-status";
import { format } from "date-fns";
import { Mail, Phone, Calendar, Tag } from "lucide-react";
import { useState } from "react";

interface LeadDetailModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
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

export function LeadDetailModal({
  lead,
  isOpen,
  onClose,
}: LeadDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    lead.status.toString(),
  );
  const updateStatus = useUpdateLeadStatus();

  const handleStatusUpdate = () => {
    updateStatus.mutate(
      {
        id: lead.id,
        data: { status: parseInt(selectedStatus) as LeadStatus },
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Lead Details</h2>
          <p className="text-sm text-muted-foreground">ID: {lead.id}</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Contact Information
              </h3>
              <div className="space-y-2">
                {lead.name && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm">{lead.name}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{lead.email}</span>
                  </div>
                )}
                {lead.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{lead.phone_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Origin & Status */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Lead Information
              </h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Origin:</span>
                  <Chip size="sm" variant="flat">
                    {originLabels[lead.origin]}
                  </Chip>
                </div>
                {lead.origin_font && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Source:</span>
                    <span className="text-sm font-medium">
                      {lead.origin_font}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {lead.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Description
                </h3>
                <p className="text-sm">{lead.description}</p>
              </div>
            )}

            {/* Additional Data */}
            {lead.data && Object.keys(lead.data).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Additional Data
                </h3>
                <div className="bg-default-100 rounded-lg p-3">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(lead.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Status Update */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Update Status
              </h3>
              <Select
                label="Status"
                selectedKeys={[selectedStatus]}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Created: {format(new Date(lead.created_at), "PPp")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Updated: {format(new Date(lead.updated_at), "PPp")}</span>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Close
          </Button>
          <Button
            color="primary"
            onPress={handleStatusUpdate}
            isLoading={updateStatus.isPending}
            isDisabled={selectedStatus === lead.status.toString()}
          >
            Update Status
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
