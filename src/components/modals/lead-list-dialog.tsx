"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { Input } from "@/src/components/ui/input"
import { useEffect, useState } from "react"
import { Eye, MousePointer } from "lucide-react"
import { IDelivery } from "@/src/common/@types/@delivery"
import listDeliveriesByCampaignBatchIdService from "@/src/common/services/campaign-batch/list-deliveries-by-campaign-batch-id-service"
import { EDeliveryStatus } from "@/src/common/@types/@delivery"

interface LeadListDialogProps {
  isOpen: boolean
  onClose: () => void
  batchId: string
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    sent: { label: "Enviada", color: "bg-purple-100 text-purple-800" },
    failed: { label: "Falha", color: "bg-red-100 text-red-800" },
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
  const [deliveries, setDeliveries] = useState<IDelivery[]>([])

  useEffect(() => {
    listDeliveriesByCampaignBatchIdService(batchId)
      .then((deliveries) => setDeliveries(deliveries as IDelivery[]))

    return () => {
      setDeliveries([])
    }
  }, [batchId])

  return (
    <Dialog key={batchId} open={isOpen} onOpenChange={(isOpen) => {
      if (!isOpen) onClose()
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Lista de Leads - Disparo #{batchId}</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-y-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead>Nome</TableHead> */}
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Métricas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.length > 0 ? (
                deliveries.map((lead) => (
                  <TableRow key={lead.id}>
                    {/* <TableCell className="font-medium">{lead.name}</TableCell> */}
                    <TableCell>{lead.email_sent_to}</TableCell>
                    <TableCell>
                      <StatusBadge status={EDeliveryStatus[lead.status]} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {lead.opened && (
                          <div className="flex items-center text-emerald-600" title="Email aberto">
                            <Eye className="h-4 w-4 mr-1" />
                          </div>
                        )}
                        {lead.clicked && (
                          <div className="flex items-center text-blue-600" title="Link clicado">
                            <MousePointer className="h-4 w-4 mr-1" />
                          </div>
                        )}
                        {!lead.opened && !lead.clicked && <span className="text-gray-400">Não abriu</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                    Nenhum lead encontrado.
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
