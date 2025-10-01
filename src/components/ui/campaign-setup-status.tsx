"use client"

// import type { CampaignConfig } from "@/lib/data"
import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { CheckCircle, Circle, Upload, FileText, Cpu, Settings, Filter } from "lucide-react"
import { VariationConfigDialog } from "../modals/variation-config-dialog"
import { LeadUploadDialog } from "../modals/lead-upload-dialog"
import { FunnelConfigDialog } from "../modals/funnel-config-dialog"
import { BatchSizeConfigDialog } from "../modals/batch-size-config-dialog"
import { CopyCreatedDialog } from "../modals/copy-created-dialog"
import { Input } from "./input"
import { Label } from "./label"
import { ISmtpServer } from "@/src/common/@types/@smtp-server"
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "./select"
import { IEmail } from "@/src/common/@types/@email"
import { Button } from "./button"
import { CampaignSetupStatusDialog } from "../modals/campaign-setup-status-dialog"
import { BatchTable } from "../tables/batch-table"
import { CampaignBatch } from "@/src/common/@types/@campaign-batch"
import { closeSetupService } from "@/src/common/services/email-campaign/close-setup-service"
import { toast } from "sonner"

interface CampaignSetupStatusProps {
  config: any
  campaignId: string
  totalLeads: number
  batchSize?: number
  smtpServer: ISmtpServer
  smtpServers: ISmtpServer[]
  primaryCopy: IEmail
}

export function CampaignSetupStatus({  primaryCopy, smtpServer, smtpServers, config, campaignId, totalLeads, batchSize = 300 }: CampaignSetupStatusProps) {
  const [isLeadUploadOpen, setIsLeadUploadOpen] = useState(false)
  const [isVariationConfigOpen, setIsVariationConfigOpen] = useState(false)
  const [isFunnelConfigOpen, setIsFunnelConfigOpen] = useState(false)
  const [isBatchSizeConfigOpen, setIsBatchSizeConfigOpen] = useState(false)
  const [isCopyCreatedOpen, setIsCopyCreatedOpen] = useState(false)
  const [isCampaignSetupStatusOpen, setIsCampaignSetupStatusOpen] = useState(false)

  const setupSteps = [
    {
      id: "leadsUploaded",
      label: "Upload de Leads (CSV)",
      description: "Faça upload da lista de leads para a campanha",
      completed: config.total_leads > 0,
      icon: Upload,
      can_update: true,
      action: () => setIsLeadUploadOpen(true),
    },
    {
      id: "copyCreated",
      label: "Criação da Copy Principal",
      description: "Crie o conteúdo HTML que será enviado no email",
      completed: config.main_email_id,
      icon: FileText,
      can_update: true,
      action: () => setIsCopyCreatedOpen(true),
    },
    {
      id: "aiVariationConfigured",
      label: "Configuração de Variação",
      description: "Configure se a copy será variada por IA ou manual",
      completed: config.copy_variation_type,
      icon: Cpu,
      can_update: true,
      action: () => setIsVariationConfigOpen(true),
    },
    {
      id: "funnelConfigured",
      label: "Configuração de Funil",
      description: "Especifique se a campanha usará um funil ou disparo único",
      completed: config.funnelConfigured,
      disabled: true,
      icon: Filter,
      can_update: true,
      action: () => setIsFunnelConfigOpen(true),
    },
    {
      id: "batchSizeConfirmed",
      label: "Tamanho dos Disparos",
      description: "Confirme o tamanho dos conjuntos de disparos (padrão: 300)",
      completed: config.campaign_batch_size,
      icon: Settings,
      can_update: true,
      action: () => setIsBatchSizeConfigOpen(true),
    },
  ]

  const handleUpdateSmtpServer = (v: string) => {
    console.log(v)
  }

  const campaignSetupStatusSubmit = async () => {
    try {
      const response = await closeSetupService(campaignId);

      if (response?.error) {
        toast.error(response.message);
      } else {
        toast.success('Configuração finalizada com sucesso.');
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  return (
    <>
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Configuração da Campanha</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {setupSteps.map((step) => (
              <div key={step.id} className={`flex items-start ${step.disabled ? "opacity-50 pointer-events-auto !cursor-not-allowed" : ""}`}>
                <div className="mr-3 mt-0.5">
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    {step.label}
                    <step.icon className="h-4 w-4 ml-1.5 text-gray-500" />
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  {(!step.completed) && (
                    <button
                      className="text-xs text-emerald-600 font-medium mt-1 hover:text-emerald-700"
                      onClick={step.action}
                      disabled={step.disabled}
                    >
                      Configurar agora
                    </button>
                  )}
                  {(step.completed && step.can_update) && (
                    <button
                      className="text-xs text-emerald-600 font-medium mt-1 hover:text-emerald-700"
                      onClick={step.action}
                      disabled={step.disabled}
                    >
                      Atualizar agora
                    </button>
                  )}
                </div>
              </div>
            ))}

            <h2 className="text-lg font-medium mt-4">Configuração do Servidor SMTP</h2>

            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="smtp-server">E-mail</Label>
                <Input className="w-[200px]" type="text" value={smtpServer?.email} disabled />
              </div>

              <div>
                <Label htmlFor="smtp-server">Servidor SMTP</Label>
                <Select defaultValue={smtpServer?.id.toString()}>
                  <SelectTrigger className="w-[200px] capitalize">
                    <SelectValue placeholder="Selecione o servidor SMTP" />
                  </SelectTrigger>

                  <SelectContent onChange={(v) => handleUpdateSmtpServer(String(v.currentTarget.value))}>
                    {smtpServers.map((smtpServer) => (
                      <SelectItem key={smtpServer.id} value={smtpServer.id.toString()} className="cursor-pointer capitalize">
                        {smtpServer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-start">
          <Button disabled={
            !config.main_email_id ||
            !config.total_leads ||
            !config.copy_variation_type ||
            !config.campaign_batch_size
          }
            onClick={() => setIsCampaignSetupStatusOpen(true)}>
            Finalizar configuração
          </Button>
        </CardFooter>
      </Card>

      <LeadUploadDialog
        isOpen={isLeadUploadOpen}
        onClose={() => setIsLeadUploadOpen(false)}
        campaignId={campaignId}
      />
      <VariationConfigDialog
        isOpen={isVariationConfigOpen}
        onClose={() => setIsVariationConfigOpen(false)}
        campaignId={campaignId}
        copyVariationType={config.copy_variation_type}
      />
      <FunnelConfigDialog
        isOpen={isFunnelConfigOpen}
        onClose={() => setIsFunnelConfigOpen(false)}
        campaignId={campaignId}
      />
      <BatchSizeConfigDialog
        isOpen={isBatchSizeConfigOpen}
        onClose={() => setIsBatchSizeConfigOpen(false)}
        campaignId={campaignId}
        currentBatchSize={batchSize}
        totalLeads={totalLeads}
      />
      <CopyCreatedDialog
        primaryCopy={primaryCopy}
        email={smtpServer?.email}
        campaign={config}
        isOpen={isCopyCreatedOpen}
        onClose={() => setIsCopyCreatedOpen(false)}
      />
      <CampaignSetupStatusDialog
        isOpen={isCampaignSetupStatusOpen}
        onClose={() => setIsCampaignSetupStatusOpen(false)}
        onConfirm={() => campaignSetupStatusSubmit()}
      />
    </>
  )
}
