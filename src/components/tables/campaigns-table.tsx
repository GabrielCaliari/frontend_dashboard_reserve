'use server'

import listEmailCampaignService from "@/src/common/services/email-campaign/list-email-campaign-service"
import EmailCampaignTableDropdownMenu from "../dropdow-menu/email-campaign-table-dropdown-menu"
import CampaignsTableRow from "./campaigns-table-row"
import { formatDate, getEnumLabel } from "@/src/lib/utils";
import { EEmailCampaignStatus } from "@/src/enums/email-campaign";
import { getTranslations } from "next-intl/server";

export async function CampaignsTable() {
  const listResponse = await listEmailCampaignService();
  const t = await getTranslations("campaign");

  // Verificar se a resposta é válida e é um array
  if (!listResponse || !Array.isArray(listResponse)) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t("errorLoadingCampaigns")}</p>
      </div>
    );
  }

  const campaigns = listResponse.map((campaign: any) => {
    const openRate = campaign.total_leads ? (campaign.open_rate / campaign.total_leads) * 100 : 0;
    const clickRate = campaign.total_leads ? (campaign.click_rate / campaign.total_leads) * 100 : 0;

    let status = getEnumLabel(EEmailCampaignStatus, campaign.status); 

    return {
      id: campaign.id,
      name: campaign.name,
      status: status,
      totalLeads: campaign.total_leads,
      openRate: openRate,
      clickRate: clickRate,
      createdAt: formatDate(campaign.created_at),
    }
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("campaignName")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("statusPending").split(' ')[0] === t("statusPending") ? "Status" : "Status"}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("openRate")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("clickRate")}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("createdAt")}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {campaigns.map((campaign) => (
            <CampaignsTableRow key={campaign.id} id={campaign.id}>
              <td className="px-6 py-4 whitespace-nowrap capitalize">
                <div className="font-medium text-gray-900">{campaign.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={campaign.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-700">{campaign.totalLeads.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${campaign.openRate}%` }}></div>
                  </div>
                  <span className="ml-2 text-gray-700">{campaign.openRate.toFixed(2)}%</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${campaign.clickRate}%` }}></div>
                  </div>
                  <span className="ml-2 text-gray-700">{campaign.clickRate.toFixed(2)}%</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                {campaign.createdAt}
              </td>
              <td
                className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
              >
                <EmailCampaignTableDropdownMenu id={campaign.id} />
              </td>
            </CampaignsTableRow>
          ))}
        </tbody>
      </table>
    </div>
  )
}

async function StatusBadge({ status }: { status: string }) {
  const t = await getTranslations("campaign");
  const statusConfig = {
    pending: { label: t("statusPending"), color: "bg-yellow-100 text-yellow-800" },
    draft: { label: t("statusDraft"), color: "bg-gray-100 text-gray-800" },
    scheduled: { label: t("statusScheduled"), color: "bg-blue-100 text-blue-800" },
    sent: { label: t("statusSent"), color: "bg-purple-100 text-purple-800" },
    active: { label: t("statusActive"), color: "bg-green-100 text-green-800" },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  )
}

function MoreHorizontalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
