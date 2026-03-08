import listEmailCampaignByIdService from "@/src/common/services/email-campaign/list-email-campaign-by-id-service";
import { EEmailCampaignStatus } from "@/src/common/enums/email-campaign";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Mail,
  MousePointer,
  XCircle,
  Zap,
} from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { formatDate } from "@/src/common/lib/utils";
import { CampaignSetupStatus } from "@/src/components/ui/campaign-setup-status";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import listSmtpServers from "@/src/common/actions/smtp-server/list-smtp-servers";
import { ISmtpServer } from "@/src/common/@types/@smtp-server";
import listPrimaryCopyByEmailCampaignService from "@/src/common/services/email-campaign/list-primary-copy-by-email-campaign-service";
import listBatchesByEmailCampaignService from "@/src/common/services/email-campaign/list-batches-by-email-campaign-service";
import { BatchTable } from "@/src/components/tables/batch-table";
import { StartCampaignConfirmDialog } from "@/src/components/email-builder/modals/start-campaign-confirm-dialog";
import CampaignActions from "@/src/components/campaign-actions";
import { getTranslations } from "next-intl/server";

export default async function EmailCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await listEmailCampaignByIdService(id);
  const smtpServers = await listSmtpServers();
  const t = await getTranslations("campaign");

  const batches = await listBatchesByEmailCampaignService(id);

  if (campaign.error || smtpServers.error || batches.error) {
    return (
      <div>{campaign.message || smtpServers.message || batches.message}</div>
    );
  }

  const primaryCopy = await listPrimaryCopyByEmailCampaignService(id);

  const defaultSMTP = smtpServers.find(
    (smtp: ISmtpServer) => smtp.id === campaign.smtp_server_id,
  );

  const isPending = campaign.status == EEmailCampaignStatus.draft;
  const funnelType = campaign.config?.funnelConfigured ? "funnel" : "single";

  const openRate = campaign.total_leads
    ? (campaign.open_rate / campaign.total_leads) * 100
    : 0;
  const clickRate = campaign.total_leads
    ? (campaign.click_rate / campaign.total_leads) * 100
    : 0;

  return (
    <LayoutScopeRoot routeActive="email-campaign">
      <div className="p-4">
        <div className="flex justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold capitalize">{campaign.name}</h1>

            {isPending && (
              <span className="bg-yellow-100 text-yellow-800 px-2 p-1 rounded-full text-xs font-medium flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {t("pendingConfig")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 block text-nowrap">
              {t("createdAt")} {formatDate(campaign.created_at)}
            </span>
          </div>
        </div>

        <div className="mb-6">
          {isPending && (
            <CampaignSetupStatus
              primaryCopy={primaryCopy}
              smtpServers={smtpServers}
              smtpServer={defaultSMTP}
              config={campaign}
              campaignId={campaign.id}
              totalLeads={campaign.total_leads}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Card de Leads */}
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">
                {t("totalLeads")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-emerald-600 mr-2" />
                <span className="text-2xl font-bold">
                  {campaign.total_leads.toLocaleString()}
                </span>
              </div>
              {isPending && !campaign.total_leads && (
                <div className="text-xs text-yellow-600 mt-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {t("noLeadsLoaded")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Disparos */}
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">
                {t("batches")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-2xl font-bold">{0}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {0 > 0
                  ? `${0} ${t("leadsPerBatch")}`
                  : t("batchSizeNotConfirmed")}
              </div>
              {isPending && !campaign.campaign_batch_size && (
                <div className="text-xs text-yellow-600 mt-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {t("batchSizeNotConfirmed")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Funil */}
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">
                {t("campaignType")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-2xl font-bold">
                  {isPending && !campaign.config?.funnelConfigured
                    ? t("campaignTypeNotDefined")
                    : funnelType === "funnel"
                      ? t("funnel")
                      : t("singleBatch")}
                </span>
              </div>
              {funnelType === "funnel" && campaign.config?.funnel && (
                <div className="text-sm text-gray-500 mt-1">
                  {campaign.config.funnel.steps.length} {t("stepsConfigured")}
                </div>
              )}
              {isPending && !campaign.config?.funnelConfigured && (
                <div className="text-xs text-yellow-600 mt-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {t("campaignTypeNotDefined")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Taxa de Abertura */}
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">
                {t("openRate")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-emerald-600 mr-2" />
                <span className="text-2xl font-bold">
                  {openRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full"
                  style={{ width: `${openRate}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Taxa de Clique */}
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">
                {t("clickRate")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <MousePointer className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-2xl font-bold">
                  {clickRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${clickRate}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Envios com Sucesso */}
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">
                {t("successfulSends")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-2xl font-bold">
                  {campaign.successfulSends?.toLocaleString() || "0"}
                </span>
              </div>
              {campaign.successfulSends && campaign.totalLeads > 0 && (
                <span className="text-sm text-gray-500 mt-1">
                  {(
                    (campaign.successfulSends / campaign.totalLeads) *
                    100
                  ).toFixed(1)}
                  {t("percentOfTotal")}
                </span>
              )}
            </CardContent>
          </Card>

          {/* Card de Envios com Erro */}
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">
                {t("failedSends")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-2xl font-bold">
                  {campaign.failedSends?.toLocaleString() || "0"}
                </span>
              </div>
              {campaign.failedSends && campaign.totalLeads > 0 && (
                <span className="text-sm text-gray-500 mt-1">
                  {((campaign.failedSends / campaign.totalLeads) * 100).toFixed(
                    1,
                  )}
                  {t("percentOfTotal")}
                </span>
              )}
            </CardContent>
          </Card>
        </div>

        <CampaignActions
          primaryCopy={primaryCopy}
          smtpServers={smtpServers}
          smtpServer={defaultSMTP}
          config={campaign}
          campaignId={campaign.id}
          totalLeads={campaign.total_leads}
        />

        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">{t("batches")}</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <BatchTable
              batches={batches || []}
              campaignId={Number(campaign.id)}
            />
          </div>
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
