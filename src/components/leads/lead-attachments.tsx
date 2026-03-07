"use client";

import { useState } from "react";
import { Paperclip, Trash2, Plus, ExternalLink } from "lucide-react";
import { Button, Input, Spinner } from "@heroui/react";
import {
  useLeadAttachments,
  useAddLeadAttachment,
  useRemoveLeadAttachment,
} from "@/src/common/hooks/leads/use-lead-attachments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/src/components/ui/dialog";

interface LeadAttachmentsProps {
  leadId: string;
}

export function LeadAttachments({ leadId }: LeadAttachmentsProps) {
  const { data, isLoading } = useLeadAttachments(leadId);
  const addAttachment = useAddLeadAttachment();
  const removeAttachment = useRemoveLeadAttachment();

  const [showAddForm, setShowAddForm] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [label, setLabel] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const attachments = data?.data ?? [];

  const handleAdd = () => {
    const id = parseInt(assetId);
    if (!id) return;
    addAttachment.mutate(
      { leadId, data: { asset_id: id, label: label || undefined } },
      {
        onSuccess: () => {
          setAssetId("");
          setLabel("");
          setShowAddForm(false);
        },
      }
    );
  };

  const handleRemove = () => {
    if (deleteTargetId === null) return;
    removeAttachment.mutate(
      { leadId, attachmentId: deleteTargetId },
      { onSuccess: () => setDeleteTargetId(null) }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attachments.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">No attachments yet</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between rounded-lg border border-gray-800 px-3 py-2 bg-gray-900/40"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-200 truncate">
                  {att.label || `Asset #${att.asset_id}`}
                </span>
                <span className="text-xs text-gray-500">#{att.asset_id}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-gray-400 hover:text-red-400"
                  onPress={() => setDeleteTargetId(att.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showAddForm ? (
        <div className="space-y-2 rounded-lg border border-gray-800 p-3 bg-gray-900/30">
          <Input
            label="Asset ID"
            type="number"
            size="sm"
            value={assetId}
            onValueChange={setAssetId}
            variant="bordered"
            classNames={{ inputWrapper: "border-gray-700 bg-gray-900" }}
          />
          <Input
            label="Label (optional)"
            size="sm"
            value={label}
            onValueChange={setLabel}
            variant="bordered"
            classNames={{ inputWrapper: "border-gray-700 bg-gray-900" }}
          />
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="flat"
              onPress={() => { setShowAddForm(false); setAssetId(""); setLabel(""); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              color="primary"
              isDisabled={!assetId}
              isLoading={addAttachment.isPending}
              onPress={handleAdd}
            >
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="flat"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => setShowAddForm(true)}
          className="w-full"
        >
          Add Attachment
        </Button>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Attachment</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The attachment will be permanently removed from this lead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="flat" onPress={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              isLoading={removeAttachment.isPending}
              onPress={handleRemove}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
