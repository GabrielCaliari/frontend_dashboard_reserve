"use client";

import { useState } from "react";
import type { Batch } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadListDialog } from "./lead-list-dialog";
import { EmailPreviewDialog } from "./email-preview-dialog";

interface BatchTableProps {
  batches: Batch[];
  campaignId: string;
}

export function BatchTable({ batches, campaignId }: BatchTableProps) {
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isLeadListOpen, setIsLeadListOpen] = useState(false);
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);

  if (!batches || batches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum disparo realizado para esta campanha.
      </div>
    );
  }

  const handleViewLeads = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsLeadListOpen(true);
  };

  const handleViewEmail = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsEmailPreviewOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                N
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Leads
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sucesso
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Erro
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Abertura
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Clique
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Data de Envio
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-gray-800">
            {batches.map((batch) => (
              <tr
                key={batch.id}
                className="hover:bg-default-100 transition-colors"
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  {batch.batchNumber}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {batch.id}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {batch.leadsCount}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-foreground">
                      {batch.successCount}
                    </span>
                    <span className="ml-2 text-xs text-green-400">
                      (
                      {((batch.successCount / batch.leadsCount) * 100).toFixed(
                        1,
                      )}
                      %)
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-foreground">
                      {batch.errorCount}
                    </span>
                    <span className="ml-2 text-xs text-red-400">
                      (
                      {((batch.errorCount / batch.leadsCount) * 100).toFixed(1)}
                      %)
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-foreground">
                      {batch.openCount}
                    </span>
                    <span className="ml-2 text-xs text-emerald-400">
                      ({((batch.openCount / batch.leadsCount) * 100).toFixed(1)}
                      %)
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-foreground">
                      {batch.clickCount}
                    </span>
                    <span className="ml-2 text-xs text-blue-400">
                      (
                      {((batch.clickCount / batch.leadsCount) * 100).toFixed(1)}
                      %)
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(batch.sentAt).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-full hover:bg-default-100 transition-colors">
                        <MoreHorizontalIcon className="h-5 w-5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewLeads(batch)}>
                        <UsersIcon className="h-4 w-4 mr-2" />
                        Ver Lista de Leads
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewEmail(batch)}>
                        <MailIcon className="h-4 w-4 mr-2" />
                        Visualizar Email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedBatch && selectedBatch.leads && (
        <LeadListDialog
          isOpen={isLeadListOpen}
          onClose={() => setIsLeadListOpen(false)}
          leads={selectedBatch.leads}
          batchNumber={selectedBatch.batchNumber}
        />
      )}

      {selectedBatch && selectedBatch.emailContent && (
        <EmailPreviewDialog
          isOpen={isEmailPreviewOpen}
          onClose={() => setIsEmailPreviewOpen(false)}
          emailContent={selectedBatch.emailContent}
          batchNumber={selectedBatch.batchNumber}
        />
      )}
    </>
  );
}

function MoreHorizontalIcon(props) {
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

function UsersIcon(props) {
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

function MailIcon(props) {
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
