"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group"
import { Label } from "@/src/components/ui/label"
import { Filter, Zap, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { FunnelBuilder } from "./funnel-builder"
import { useTranslations } from "next-intl"

interface FunnelConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  campaignId: string
}

export function FunnelConfigDialog({ isOpen, onClose, campaignId }: FunnelConfigDialogProps) {
  const t = useTranslations()
  const router = useRouter()
  const [funnelType, setFunnelType] = useState<"single" | "funnel" | null>(null)
  const [showFunnelBuilder, setShowFunnelBuilder] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!funnelType) return

    if (funnelType === "funnel") {
      // Se o usuário escolher criar um funil, mostrar o construtor de funil
      setShowFunnelBuilder(true)
      return
    }

    // Se o usuário escolher disparo único, salvar a configuração
    setIsSubmitting(true)

    try {
      // Atualizar a configuração da campanha com o tipo de funil

      // Simular um delay para dar feedback ao usuário
      await new Promise((resolve) => setTimeout(resolve, 800))

      setSuccess(true)
      setIsSubmitting(false)

      // Atualizar a UI após um breve delay
      setTimeout(() => {
        router.refresh()
        onClose()
      }, 1500)
    } catch (err) {
      console.error("Erro ao salvar configuração:", err)
      setIsSubmitting(false)
    }
  }

  const handleFunnelComplete = async (funnel) => {
    setIsSubmitting(true)

    try {
      // Atualizar a configuração da campanha com o tipo de funil e a configuração do funil

      // Simular um delay para dar feedback ao usuário
      await new Promise((resolve) => setTimeout(resolve, 800))

      setSuccess(true)
      setIsSubmitting(false)
      setShowFunnelBuilder(false)

      // Atualizar a UI após um breve delay
      setTimeout(() => {
        router.refresh()
        onClose()
      }, 1500)
    } catch (err) {
      console.error("Erro ao salvar configuração:", err)
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFunnelType(null)
    setShowFunnelBuilder(false)
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
      <DialogContent
        className={`${showFunnelBuilder ? "sm:max-w-4xl" : "sm:max-w-md"} max-h-[90vh]`}
        style={{ overflow: "visible" }}
      >
        {!showFunnelBuilder ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t("funnelConfig.title")}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {!success ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {t("funnelConfig.description")}
                  </p>

                  <RadioGroup
                    value={funnelType || ""}
                    onValueChange={(value) => setFunnelType(value as "single" | "funnel")}
                    className="space-y-3"
                  >
                    <div className="flex items-start space-x-2 rounded-md border p-3 hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="single" id="single" className="mt-1" />
                      <div className="space-y-1.5 flex-1">
                        <Label htmlFor="single" className="flex items-center cursor-pointer">
                          <Zap className="h-4 w-4 mr-2 text-amber-500" />
                          {t("funnelConfig.singleBatch")}
                        </Label>
                        <p className="text-xs text-gray-500">{t("funnelConfig.singleBatchDesc")}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2 rounded-md border p-3 hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value="funnel" id="funnel" className="mt-1" />
                      <div className="space-y-1.5 flex-1">
                        <Label htmlFor="funnel" className="flex items-center cursor-pointer">
                          <Filter className="h-4 w-4 mr-2 text-purple-600" />
                          {t("funnelConfig.createFunnel")}
                        </Label>
                        <p className="text-xs text-gray-500">
                          {t("funnelConfig.createFunnelDesc")}
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                  <h3 className="text-lg font-medium text-emerald-700">{t("funnelConfig.savedSuccess")}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {funnelType === "single"
                      ? t("funnelConfig.singleBatchSaved")
                      : t("funnelConfig.funnelSaved")}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              {!success ? (
                <>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="button" onClick={handleSubmit} disabled={!funnelType || isSubmitting}>
                    {isSubmitting ? t("common.saving") : funnelType === "funnel" ? t("funnelConfig.createFunnel") : t("common.save")}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={onClose} className="mx-auto">
                  {t("common.close")}
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col max-h-[calc(90vh-2rem)]">
            <FunnelBuilder
              onComplete={handleFunnelComplete}
              onCancel={() => setShowFunnelBuilder(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
