"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from"@/src/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from"@/src/components/ui/table"
import { Input } from"@/src/components/ui/input"
import { useState } from"react"
import { Eye, MousePointer } from"lucide-react"
import { IDelivery } from"@/src/common/@types/@delivery"
import listDeliveriesByCampaignBatchIdService from"@/src/common/services/campaign-batch/list-deliveries-by-campaign-batch-id-service"
import { EDeliveryStatus } from"@/src/common/@types/@delivery"
import { useTranslations } from"next-intl"
import { useQuery } from"@tanstack/react-query"

interface LeadListDialogProps {
 isOpen: boolean
 onClose: () => void
 batchId: string
}

function StatusBadge({ status }: { status: string }) {
 const t = useTranslations("leadList")
 const statusConfig = {
 pending: { label: t("statusPending"), color:"bg-yellow-100 text-yellow-800" },
 sent: { label: t("statusSent"), color:"bg-purple-100 text-purple-800" },
 failed: { label: t("statusFailed"), color:"bg-red-100 text-red-800" },
 }

 const config = statusConfig[status] || statusConfig.pending

 return (
 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
 {config.label}
 </span>
 )
}

export function LeadListDialog({ isOpen, onClose, batchId }: LeadListDialogProps) {
 const [searchTerm, setSearchTerm] = useState("")
 const t = useTranslations()

 const { data: deliveries = [], isLoading } = useQuery<IDelivery[]>({
 queryKey: ["batch-deliveries", batchId],
 queryFn: () => listDeliveriesByCampaignBatchIdService(batchId) as Promise<IDelivery[]>,
 enabled: isOpen && !!batchId,
 staleTime: 30 * 1000,
 })

 const filtered = searchTerm
 ? deliveries.filter((d) =>
 d.email_sent_to?.toLowerCase().includes(searchTerm.toLowerCase()),
 )
 : deliveries

 return (
 <Dialog key={batchId} open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
 <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
 <DialogHeader>
 <DialogTitle>{t("leadList.title")}{batchId}</DialogTitle>
 </DialogHeader>
 <div className="mb-4">
 <Input
 placeholder={t("leads.searchPlaceholder")}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="max-w-sm"
 />
 </div>
 <div className="overflow-y-auto flex-1">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>{t("common.email")}</TableHead>
 <TableHead>{t("common.status")}</TableHead>
 <TableHead>{t("leadList.metrics")}</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {isLoading ? (
 <TableRow>
 <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
 {t("common.loading")}...
 </TableCell>
 </TableRow>
 ) : filtered.length > 0 ? (
 filtered.map((lead) => (
 <TableRow key={lead.id}>
 <TableCell>{lead.email_sent_to}</TableCell>
 <TableCell>
 <StatusBadge status={EDeliveryStatus[lead.status]} />
 </TableCell>
 <TableCell>
 <div className="flex items-center gap-2">
 {lead.opened && (
 <div className="flex items-center text-emerald-600" title={t("leadList.emailOpened")}>
 <Eye className="h-4 w-4 mr-1" />
 </div>
 )}
 {lead.clicked && (
 <div className="flex items-center text-blue-600" title={t("leadList.linkClicked")}>
 <MousePointer className="h-4 w-4 mr-1" />
 </div>
 )}
 {!lead.opened && !lead.clicked && (
 <span className="text-muted-foreground">{t("leadList.notOpened")}</span>
 )}
 </div>
 </TableCell>
 </TableRow>
 ))
 ) : (
 <TableRow>
 <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
 {t("leadList.noLeadsFound")}
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </DialogContent>
 </Dialog>
 )
}
