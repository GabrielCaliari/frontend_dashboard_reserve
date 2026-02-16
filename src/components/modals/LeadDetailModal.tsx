"use client"

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

export function LeadDetailModal({ isOpen, onClose, lead }: LeadDetailModalProps) {
    const t = useTranslations();

    if (!isOpen || !lead) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{t("leads.details")}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">ID</p>
                        <p className="font-medium">{lead.id}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t("common.name")}</p>
                        <p className="font-medium">{lead.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t("common.email")}</p>
                        <p className="font-medium">{lead.email || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t("common.phone")}</p>
                        <p className="font-medium">{lead.phone_number}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t("leads.originId")}</p>
                        <p className="font-medium">{lead.origin !== undefined ? lead.origin : '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t("leads.originSource")}</p>
                        <p className="font-medium">{lead.origin_font || '-'}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm text-gray-500">{t("leads.description")}</p>
                        <p className="font-medium">{lead.description}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t("leads.brand")}</p>
                        <p className="font-medium">{lead.brand || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t("leads.companySize")}</p>
                        <p className="font-medium">{lead.ad_company_size !== undefined ? lead.ad_company_size : '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t("leads.companySegment")}</p>
                        <p className="font-medium">{lead.ad_company_segment || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t("leads.marketTime")}</p>
                        <p className="font-medium">{lead.ad_company_on_market || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t("leads.website")}</p>
                        <p className="font-medium">{lead.ad_website ? 
                            <a href={lead.ad_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {lead.ad_website}
                            </a> : '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{t("common.createdAt")}</p>
                        <p className="font-medium">{lead.created_at}</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        {t("common.close")}
                    </button>
                </div>
            </div>
        </div>
    );
} 