"use client";

import { useState } from"react";
import { CampaignBatch } from"@/src/shared/domain/types/@campaign-batch";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from"@/src/presentation/components/atoms/shadcn-ui/dropdown-menu";
import { LeadListDialog } from"@/src/presentation/components/organisms/email-builder/modals/lead-list-dialog";
import { EmailPreviewDialog } from"@/src/presentation/components/organisms/email-builder/modals/email-preview-dialog";
import { formatDate } from"@/src/shared/lib/utils";
import { CopyDeliveryDialog } from"../email-builder/modals/copy-delivery-dialog";
import { useTranslations } from"next-intl";

interface BatchTableProps {
 batches: CampaignBatch[];
 campaignId: number;
}

export function BatchTable({ batches, campaignId }: BatchTableProps) {
 const t = useTranslations("batchTable");
 const [selectedBatch, setSelectedBatch] = useState<CampaignBatch | null>(
 null,
 );
 const [isLeadListOpen, setIsLeadListOpen] = useState(false);
 const [isCopyDeliveryOpen, setIsCopyDeliveryOpen] = useState(false);

 if (!batches || batches.length === 0) {
 return (
 <div className="text-center py-8 text-muted-foreground">{t("noBatches")}</div>
 );
 }

 const handleViewLeads = (batch: CampaignBatch) => {
 setSelectedBatch(batch);
 setIsLeadListOpen(true);
 };

 const handleViewEmail = (batch: CampaignBatch) => {
 setSelectedBatch(batch);
 setIsCopyDeliveryOpen(true);
 };

 return (
 <>
 <div className="rounded-lg border border-border overflow-hidden">
 <table className="w-full">
 <thead>
 <tr className="border-b border-border bg-default-100">
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t("number")}
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 ID
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Leads
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t("success")}
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t("error")}
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t("opening")}
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t("click")}
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t("sendDate")}
 </th>
 <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
 Ações
 </th>
 </tr>
 </thead>
 <tbody className="bg-card divide-y divide-gray-800">
 {batches.map((batch, index) => (
 <tr
 key={batch.id}
 className="hover:bg-default-100 transition-colors"
 >
 <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
 {index + 1}
 </td>
 <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
 {batch.id}
 </td>
 <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
 {batch.total_leads}
 </td>
 <td className="px-4 py-4 whitespace-nowrap">
 <div className="flex items-center">
 <span className="text-sm text-foreground">
 {batch.un_success_rate ??"-"}
 </span>
 <span className="ml-2 text-xs text-green-400">
 (
 {batch.un_success_rate
 ? (
 (batch.un_success_rate / batch.total_leads) *
 100
 ).toFixed(1)
 :"00.0"}
 %)
 </span>
 </div>
 </td>
 <td className="px-4 py-4 whitespace-nowrap">
 <div className="flex items-center">
 <span className="text-sm text-foreground">
 {batch.un_failed_rate ??"-"}
 </span>
 <span className="ml-2 text-xs text-red-400">
 (
 {batch.un_failed_rate
 ? (
 (batch.un_failed_rate / batch.total_leads) *
 100
 ).toFixed(1)
 :"00.0"}
 %)
 </span>
 </div>
 </td>
 <td className="px-4 py-4 whitespace-nowrap">
 <div className="flex items-center">
 <span className="text-sm text-foreground">
 {batch.un_open_rate ??"-"}
 </span>
 <span className="ml-2 text-xs text-emerald-400">
 (
 {batch.un_open_rate
 ? (
 (batch.un_open_rate / batch.total_leads) *
 100
 ).toFixed(1)
 :"00.0"}
 %)
 </span>
 </div>
 </td>
 <td className="px-4 py-4 whitespace-nowrap">
 <div className="flex items-center">
 <span className="text-sm text-foreground">
 {batch.un_click_rate ??"-"}
 </span>
 <span className="ml-2 text-xs text-blue-400">
 (
 {batch.un_click_rate
 ? (
 (batch.un_click_rate / batch.total_leads) *
 100
 ).toFixed(1)
 :"00.0"}
 %)
 </span>
 </div>
 </td>
 <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
 {batch.started_at ? formatDate(batch.started_at) :"-"}
 </td>
 <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="p-2 rounded-full hover:bg-default-100 transition-colors">
 <MoreHorizontalIcon className="h-5 w-5 text-muted-foreground" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="end"
 className="bg-default-100 border-border"
 >
 <DropdownMenuItem
 onClick={() => handleViewLeads(batch)}
 className="cursor-pointer text-foreground hover:bg-default-100"
 >
 <UsersIcon className="h-4 w-4 mr-2" />
 {t("viewLeadList")}
 </DropdownMenuItem>
 <DropdownMenuItem
 onClick={() => handleViewEmail(batch)}
 className="cursor-pointer text-foreground hover:bg-default-100"
 >
 <MailIcon className="h-4 w-4 mr-2" />
 {t("viewEmail")}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <LeadListDialog
 isOpen={isLeadListOpen}
 onClose={() => {
 setIsLeadListOpen(false);
 setSelectedBatch(null);
 }}
 batchId={selectedBatch?.id.toString() ??""}
 />

 <CopyDeliveryDialog
 isOpen={isCopyDeliveryOpen}
 onClose={() => setIsCopyDeliveryOpen(false)}
 campaignBatchId={selectedBatch?.id.toString() ??""}
 />

 {/*
 {selectedBatch && selectedBatch.emailContent && (
 <EmailPreviewDialog
 isOpen={isEmailPreviewOpen}
 onClose={() => setIsEmailPreviewOpen(false)}
 emailContent={selectedBatch.emailContent}
 batchNumber={selectedBatch.batchNumber}
 />
 )} */}
 </>
 );
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
 );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
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
 <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
 <circle cx="9" cy="7" r="4" />
 <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
 <path d="M16 3.13a4 4 0 0 1 0 7.75" />
 </svg>
 );
}

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
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
 <rect width="20" height="16" x="2" y="4" rx="2" />
 <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
 </svg>
 );
}
