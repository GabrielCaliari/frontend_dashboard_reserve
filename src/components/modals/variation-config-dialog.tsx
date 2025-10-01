"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group"
import { Label } from "@/src/components/ui/label"
import { Cpu, Edit, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { updateEmailCampaignCopyVariant } from "@/src/common/actions/email-campaign/update-email-campaign-copy-variant"
import { ECopyVariationType } from "@/src/common/@types/@email-campaign"
import toast from "react-hot-toast"

interface VariationConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  campaignId: string
  copyVariationType: ECopyVariationType
}

export function VariationConfigDialog({ isOpen, onClose, campaignId, copyVariationType }: VariationConfigDialogProps) {
  const router = useRouter()
  const [variationType, setVariationType] = useState<ECopyVariationType | null>(copyVariationType)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Atualizar a função handleSubmit para passar o tipo de variação
  const handleSubmit = async () => {
    if (!variationType) return

    setIsSubmitting(true)

    try {
      const response = await updateEmailCampaignCopyVariant(campaignId, variationType)

      if (response?.error) {
        toast.error(response.message);

        setIsSubmitting(false)
        return;
      }

      // Simular um delay para dar feedback ao usuário
      setSuccess(true)
      setIsSubmitting(false)

      // Atualizar a UI após um breve delay
      setTimeout(() => {
        router.refresh()
        onClose()
        setSuccess(false)
      }, 1500)
    } catch (err) {
      console.error("Erro ao salvar configuração:", err)
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setVariationType(null)
    setSuccess(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
        if (!isSubmitting && !open) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Configuração de Variação
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {!success ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Escolha como você deseja criar variações para o conteúdo do seu email:
              </p>

              <RadioGroup
                value={String(variationType) || ""}
                onValueChange={(value) => setVariationType(value as unknown as ECopyVariationType)}
                className="space-y-3"
              >
                <div className="flex items-start space-x-2 rounded-md border p-3 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value={String(ECopyVariationType.ai)} id="ai" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="ai" className="space-y-1.5 cursor-pointer">
                      <div className="flex items-center">
                        <Cpu className="h-4 w-4 mr-2 text-emerald-600" />
                        Usar IA para gerar variações
                      </div>
                      <p className="text-xs text-gray-500">
                        Nossa IA criará automaticamente variações do seu conteúdo para melhorar as taxas de conversão.
                      </p>
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-2 rounded-md border p-3 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value={String(ECopyVariationType.manual)} id="manual" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="manual" className="space-y-1.5 cursor-pointer">
                      <span className="flex items-center">
                        <Edit className="h-4 w-4 mr-2 text-blue-600" />
                        Escrever variações manualmente
                      </span>
                      <p className="text-xs text-gray-500">
                        Você criará suas próprias variações de conteúdo para testar diferentes abordagens.
                      </p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
              <h3 className="text-lg font-medium text-emerald-700">Configuração salva!</h3>
              <p className="text-sm text-gray-600 mt-1">
                {variationType === ECopyVariationType.ai
                  ? "A IA será usada para gerar variações do seu conteúdo."
                  : "Você poderá criar variações manualmente."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!success ? (
            <>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={!variationType || isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar configuração"}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={onClose} className="mx-auto">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
