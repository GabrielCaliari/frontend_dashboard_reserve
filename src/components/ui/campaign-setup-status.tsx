"use client";

// import type { CampaignConfig } from"@/lib/data"
import { useState } from"react";
import {
 Card,
 CardContent,
 CardFooter,
 CardHeader,
 CardTitle,
} from"../ui/card";
import {
 CheckCircle,
 Circle,
 Upload,
 FileText,
 Cpu,
 Settings,
 Filter,
} from"lucide-react";
import { VariationConfigDialog } from"../email-builder/modals/variation-config-dialog";
import { LeadUploadDialog } from"../email-builder/modals/lead-upload-dialog";
import { FunnelConfigDialog } from"../email-builder/modals/funnel-config-dialog";
import { BatchSizeConfigDialog } from"../email-builder/modals/batch-size-config-dialog";
import { CopyCreatedDialog } from"../email-builder/modals/copy-created-dialog";
import { Input } from"./input";
import { Label } from"./label";
import { ISmtpServer } from"@/src/common/@types/@smtp-server";
import {
 Select,
 SelectItem,
 SelectContent,
 SelectTrigger,
 SelectValue,
} from"./select";
import { IEmail } from"@/src/common/@types/@email";
import { Button } from"./button";
import { CampaignSetupStatusDialog } from"../email-builder/modals/campaign-setup-status-dialog";
import { EEmailCampaignStatus } from"@/src/common/enums/email-campaign";
import { StartCampaignConfirmDialog } from"../email-builder/modals/start-campaign-confirm-dialog";
import { BatchTable } from"../tables/batch-table";
import { CampaignBatch } from"@/src/common/@types/@campaign-batch";
import { closeSetupService } from"@/src/common/services/email-campaign/close-setup-service";
import { toast } from"sonner";
import { useTranslations } from"next-intl";

interface CampaignSetupStatusProps {
 config: any;
 campaignId: string;
 totalLeads: number;
 batchSize?: number;
 smtpServer: ISmtpServer;
 smtpServers: ISmtpServer[];
 primaryCopy: IEmail;
}

export function CampaignSetupStatus({
 primaryCopy,
 smtpServer,
 smtpServers,
 config,
 campaignId,
 totalLeads,
 batchSize = 300,
}: CampaignSetupStatusProps) {
 const t = useTranslations();
 const [isLeadUploadOpen, setIsLeadUploadOpen] = useState(false);
 const [isVariationConfigOpen, setIsVariationConfigOpen] = useState(false);
 const [isFunnelConfigOpen, setIsFunnelConfigOpen] = useState(false);
 const [isBatchSizeConfigOpen, setIsBatchSizeConfigOpen] = useState(false);
 const [isCopyCreatedOpen, setIsCopyCreatedOpen] = useState(false);
 const [isCampaignSetupStatusOpen, setIsCampaignSetupStatusOpen] =
 useState(false);
 const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false);

 const setupSteps = [
 {
 id:"leadsUploaded",
 label: t("setupStatus.uploadLeads"),
 description: t("setupStatus.uploadLeadsDesc"),
 completed: config.total_leads > 0,
 icon: Upload,
 can_update: true,
 action: () => setIsLeadUploadOpen(true),
 },
 {
 id:"copyCreated",
 label: t("setupStatus.createCopy"),
 description: t("setupStatus.createCopyDesc"),
 completed: config.main_email_id,
 icon: FileText,
 can_update: true,
 action: () => setIsCopyCreatedOpen(true),
 },
 {
 id:"aiVariationConfigured",
 label: t("setupStatus.variationConfig"),
 description: t("setupStatus.variationConfigDesc"),
 completed: config.copy_variation_type,
 icon: Cpu,
 can_update: true,
 action: () => setIsVariationConfigOpen(true),
 },
 {
 id:"funnelConfigured",
 label: t("setupStatus.funnelConfig"),
 description: t("setupStatus.funnelConfigDesc"),
 completed: config.funnelConfigured,
 disabled: true,
 icon: Filter,
 can_update: true,
 action: () => setIsFunnelConfigOpen(true),
 },
 {
 id:"batchSizeConfirmed",
 label: t("setupStatus.batchSize"),
 description: t("setupStatus.batchSizeDesc"),
 completed: config.campaign_batch_size,
 icon: Settings,
 can_update: true,
 action: () => setIsBatchSizeConfigOpen(true),
 },
 ];

 const handleUpdateSmtpServer = (v: string) => {
 console.log(v);
 };

 const campaignSetupStatusSubmit = async () => {
 try {
 const response = await closeSetupService(campaignId);

 if (response?.error) {
 toast.error(response.message);
 } else {
 toast.success(t("setupStatus.configFinished"));
 }
 } catch (err: any) {
 console.log(err);
 }
 };

 return (
 <>
 <Card className="bg-white">
 <CardHeader>
 <CardTitle className="text-lg font-medium">
 {t("setupStatus.campaignConfig")}
 </CardTitle>
 </CardHeader>

 <CardContent>
 <div className="space-y-4">
 {setupSteps.map((step) => (
 <div
 key={step.id}
 className={`flex items-start ${step.disabled ?"opacity-50 pointer-events-auto !cursor-not-allowed" :""}`}
 >
 <div className="mr-3 mt-0.5">
 {step.completed ? (
 <CheckCircle className="h-5 w-5 text-emerald-500" />
 ) : (
 <Circle className="h-5 w-5 text-foreground" />
 )}
 </div>
 <div>
 <h3 className="text-sm font-medium flex items-center">
 {step.label}
 <step.icon className="h-4 w-4 ml-1.5 text-muted-foreground" />
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 {step.description}
 </p>
 {!step.completed && (
 <button
 className="text-xs text-emerald-600 font-medium mt-1 hover:text-emerald-700"
 onClick={step.action}
 disabled={step.disabled}
 >
 {t("setupStatus.configureNow")}
 </button>
 )}
 {step.completed && step.can_update && (
 <button
 className="text-xs text-emerald-600 font-medium mt-1 hover:text-emerald-700"
 onClick={step.action}
 disabled={step.disabled}
 >
 {t("setupStatus.updateNow")}
 </button>
 )}
 </div>
 </div>
 ))}

 <h2 className="text-lg font-medium mt-4">
 {t("setupStatus.smtpConfig")}
 </h2>

 <div className="flex items-center gap-4">
 <div>
 <Label htmlFor="smtp-server">
 {t("setupStatus.emailLabel")}
 </Label>
 <Input
 className="w-[200px]"
 type="text"
 value={smtpServer?.email}
 disabled
 />
 </div>

 <div>
 <Label htmlFor="smtp-server">
 {t("setupStatus.smtpServer")}
 </Label>
 <Select defaultValue={smtpServer?.id.toString()}>
 <SelectTrigger className="w-[200px] capitalize">
 <SelectValue placeholder={t("setupStatus.selectSmtp")} />
 </SelectTrigger>

 <SelectContent
 onChange={(v) =>
 handleUpdateSmtpServer(String(v.currentTarget.value))
 }
 >
 {smtpServers.map((smtpServer) => (
 <SelectItem
 key={smtpServer.id}
 value={smtpServer.id.toString()}
 className="cursor-pointer capitalize"
 >
 {smtpServer.name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>
 </div>
 </CardContent>

 <CardFooter className="flex justify-start items-center gap-3">
 <Button
 disabled={
 !config.main_email_id ||
 !config.total_leads ||
 !config.copy_variation_type ||
 !config.campaign_batch_size
 }
 onClick={() => setIsCampaignSetupStatusOpen(true)}
 >
 {t("setupStatus.finishConfig")}
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
 );
}
