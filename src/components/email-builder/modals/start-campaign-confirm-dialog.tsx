"use client"

import { useState } from"react"
import { Button } from"@/src/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from"@/src/components/ui/dialog"
import { startCampaignService } from"@/src/common/services/email-campaign/start-campaign-service"
import { toast } from"sonner"
import { useTranslations } from"next-intl"

interface Props {
 isOpen: boolean
 onClose: () => void
 campaignId: string
}

export function StartCampaignConfirmDialog({ isOpen, onClose, campaignId }: Props) {
 const [isStarting, setIsStarting] = useState(false)
 const t = useTranslations()

 const handleConfirm = async () => {
 setIsStarting(true)
 try {
 const res = await startCampaignService(campaignId)
 if (res?.error) {
 toast.error(res.message || t("campaign.campaignStartError"))
 } else {
 toast.success(t("campaign.campaignStarted"))
 onClose()
 // reload page to reflect new state
 setTimeout(() => window.location.reload(), 300)
 }
 } catch (err: any) {
 toast.error(err?.message || t("campaign.campaignStartError"))
 } finally {
 setIsStarting(false)
 }
 }

 return (
 <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>{t("campaign.startCampaign")}</DialogTitle>
 </DialogHeader>

 <div className="py-4">
 <p>{t("campaign.confirmStartCampaign")}</p>
 <p className="text-sm text-muted-foreground mt-2">{t("campaign.campaignId")} <span className="font-medium">{campaignId}</span></p>
 </div>

 <DialogFooter>
 <Button variant="ghost" onClick={onClose} disabled={isStarting}>{t("common.cancel")}</Button>
 <Button onClick={handleConfirm} disabled={isStarting}>
 {isStarting ? t("campaign.startingCampaign") : t("campaign.startCampaign")}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 )
}
