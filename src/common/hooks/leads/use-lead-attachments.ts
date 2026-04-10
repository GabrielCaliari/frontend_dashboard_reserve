import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listLeadAttachmentsAction } from "@/src/common/actions/leads/list-lead-attachments";
import { addLeadAttachmentAction } from "@/src/common/actions/leads/add-lead-attachment";
import { removeLeadAttachmentAction } from "@/src/common/actions/leads/remove-lead-attachment";
import type {
  LeadAttachment,
  AddAttachmentDto,
} from "@/src/shared/domain/types/@lead";
import { toast } from "react-hot-toast";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

export function useLeadAttachments(leadId: string) {
  const tenantId = useSelectedTenantId();

  return useQuery<{ data: LeadAttachment[] }>({
    queryKey: ["leads", "attachments", tenantId, leadId],
    queryFn: () => listLeadAttachmentsAction(leadId),
    enabled: !!tenantId && !!leadId,
    staleTime: 30000,
  });
}

export function useAddLeadAttachment() {
  const queryClient = useQueryClient();

  return useMutation<
    LeadAttachment,
    Error,
    { leadId: string; data: AddAttachmentDto }
  >({
    mutationFn: ({ leadId, data }) => addLeadAttachmentAction(leadId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["leads", "attachments", variables.leadId],
      });
      toast.success("Attachment added");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add attachment");
    },
  });
}

export function useRemoveLeadAttachment() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { leadId: string; attachmentId: number }
  >({
    mutationFn: ({ leadId, attachmentId }) =>
      removeLeadAttachmentAction(leadId, attachmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["leads", "attachments", variables.leadId],
      });
      toast.success("Attachment removed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove attachment");
    },
  });
}
