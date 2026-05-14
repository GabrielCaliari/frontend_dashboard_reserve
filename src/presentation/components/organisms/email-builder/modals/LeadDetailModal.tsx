"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

// Interface para os dados do lead
export interface Lead {
  id: number;
  name: string;
  email?: string;
  phone_number: string;
  origin?: number;
  origin_font?: string;
  description: string;
  brand?: string;
  ad_company_size?: number;
  ad_company_segment?: string;
  ad_company_on_market?: string;
  ad_website?: string;
  created_at: string;
}

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export function LeadDetailModal({
  isOpen,
  onClose,
  lead,
}: LeadDetailModalProps) {
  const t = useTranslations();

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-card border border-border p-6 rounded-lg w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-foreground">
            {t("leads.details")}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">ID</p>
            <p className="font-medium text-foreground">{lead.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("common.name")}</p>
            <p className="font-medium text-foreground">{lead.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("common.email")}</p>
            <p className="font-medium text-foreground">{lead.email || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("common.phone")}</p>
            <p className="font-medium text-foreground">{lead.phone_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("leads.originId")}
            </p>
            <p className="font-medium text-foreground">
              {lead.origin !== undefined ? lead.origin : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("leads.originSource")}
            </p>
            <p className="font-medium text-foreground">
              {lead.origin_font || "-"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">
              {t("leads.description")}
            </p>
            <p className="font-medium text-foreground">{lead.description}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("leads.brand")}</p>
            <p className="font-medium text-foreground">{lead.brand || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("leads.companySize")}
            </p>
            <p className="font-medium text-foreground">
              {lead.ad_company_size !== undefined ? lead.ad_company_size : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("leads.companySegment")}
            </p>
            <p className="font-medium text-foreground">
              {lead.ad_company_segment || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("leads.marketTime")}
            </p>
            <p className="font-medium text-foreground">
              {lead.ad_company_on_market || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("leads.website")}
            </p>
            <p className="font-medium text-foreground">
              {lead.ad_website ? (
                <a
                  href={lead.ad_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                  {lead.ad_website}
                </a>
              ) : (
                "-"
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t("common.createdAt")}
            </p>
            <p className="font-medium text-foreground">{lead.created_at}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-default-100 text-foreground rounded-md hover:bg-default-100 transition-colors"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
