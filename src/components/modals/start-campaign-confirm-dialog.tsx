"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { startCampaignService } from "@/src/common/services/email-campaign/start-campaign-service"
import { toast } from "sonner"

interface Props {
  isOpen: boolean
  onClose: () => void
  campaignId: string
}

export function StartCampaignConfirmDialog({ isOpen, onClose, campaignId }: Props) {
  const [isStarting, setIsStarting] = useState(false)

  const handleConfirm = async () => {
    setIsStarting(true)
    try {
      const res = await startCampaignService(campaignId)
      if (res?.error) {
        toast.error(res.message || 'Erro ao iniciar campanha')
      } else {
        toast.success('Campanha iniciada com sucesso')
        onClose()
        // reload page to reflect new state
        setTimeout(() => window.location.reload(), 300)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao iniciar campanha')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar campanha</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p>Deseja realmente iniciar a campanha agora? Isso fará com que os disparos comecem conforme a configuração.</p>
          <p className="text-sm text-gray-500 mt-2">ID da campanha: <span className="font-medium">{campaignId}</span></p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isStarting}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isStarting}>
            {isStarting ? 'Iniciando...' : 'Iniciar campanha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
