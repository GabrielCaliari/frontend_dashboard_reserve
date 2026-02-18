'use client'

import { SimpleCampaignBatchEditorDialog } from "./simple-campaign-batch-editor-dialog"

export function CopyDeliveryDialog({ isOpen, onClose, campaignBatchId }: CopyDeliveryDialogProps) {
    return (
        <SimpleCampaignBatchEditorDialog 
            isOpen={isOpen} 
            onClose={onClose} 
            campaignBatchId={campaignBatchId} 
        />
    )
}

interface CopyDeliveryDialogProps {
    isOpen: boolean
    onClose: () => void
    campaignBatchId: string
}
