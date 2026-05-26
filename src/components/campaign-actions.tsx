"use client";

import { useState } from"react";
import { IEmail } from"../common/@types/@email";
import { ISmtpServer } from"../common/@types/@smtp-server";
import { EEmailCampaignStatus } from"../common/enums/email-campaign";
import { Button } from"./ui/button";
import { StartCampaignConfirmDialog } from"./email-builder/modals/start-campaign-confirm-dialog";
import { updateMetricsService } from"@/src/common/services/email-campaign/update-metrics-service";
import { toast } from"sonner";
import { useTranslations } from"next-intl";

interface CampaignActionsProps {
 config: any;
 campaignId: string;
 totalLeads: number;
 batchSize?: number;
 smtpServer: ISmtpServer;
 smtpServers: ISmtpServer[];
 primaryCopy: IEmail;
}

export default function CampaignActions({
 primaryCopy,
 smtpServer,
 smtpServers,
 config,
 campaignId,
 totalLeads,
 batchSize = 300,
}: CampaignActionsProps) {
 const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false);
 const [isUpdatingMetrics, setIsUpdatingMetrics] = useState(false);
 const t = useTranslations("campaign");

 return (
 <div className="flex flex-row gap-2">
 {/* Show start campaign button only when campaign status is'pending' */}
 <Button
 disabled={config?.status !== EEmailCampaignStatus.pending}
 variant="default"
 onClick={() => setIsStartConfirmOpen(true)}
 >
 {t("startCampaign")}
 </Button>

 {/* Atualizar métricas - only when campaign is active */}
 {/* TODO: Adicionar validação para status da campanha */}
 <Button
 disabled={isUpdatingMetrics}
 variant="outline"
 onClick={async () => {
 try {
 setIsUpdatingMetrics(true);
 const res = await updateMetricsService(campaignId);
 if (res?.error) {
 toast.error(res.message || t("metricsUpdateError"));
 } else {
 toast.success(t("metricsUpdated"));
 // optional: reload to reflect new metrics
 setTimeout(() => window.location.reload(), 300);
 }
 } catch (err: any) {
 toast.error(err?.message || t("metricsUpdateError"));
 } finally {
 setIsUpdatingMetrics(false);
 }
 }}
 >
 {isUpdatingMetrics ? t("updatingMetrics") : t("updateMetrics")}
 </Button>

 <StartCampaignConfirmDialog
 isOpen={isStartConfirmOpen}
 onClose={() => setIsStartConfirmOpen(false)}
 campaignId={campaignId}
 />
 </div>
 );
}
