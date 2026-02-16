'use client'

import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useEffect, useState } from "react";
import { LeadDetailModal, Lead } from "@/src/components/modals/LeadDetailModal";
import { LeadsTable } from "@/src/components/tables/LeadsTable";
import { Pagination } from "@/src/components/tables/Pagination";
import useListLeads from "@/src/common/hooks/use-list-leads";
import { useTranslations } from "next-intl";

export default function LeadsPage() {
    const { execListLeads } = useListLeads();
    const t = useTranslations();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [showing, setShowing] = useState({ start: 1, end: 10 });

    const [leads, setLeads] = useState<Lead[]>([]);

    useEffect(() => {
        loadLeads(currentPage);
    }, [currentPage]);

    const loadLeads = (page: number) => {
        setIsLoading(true);
        execListLeads(page).then(result => {
            setLeads(result.leads);
            setTotalPages(result.page.count_pages);
            setCurrentPage(result.page.current_page);
            setTotalResults(result.page.count);
            setShowing({ 
                start: 1, 
                end: 10 
            });
            setIsLoading(false);
        }).catch(() => {
            setIsLoading(false);
        });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleViewLead = (lead: Lead) => {
        setSelectedLead(lead);
        setIsModalOpen(true);
    };

    return (
        <>
            <LayoutScopeRoot routeActive="leads">
                <div className="p-4">
                    <h1 className="text-2xl font-bold mb-6 text-gray-100">{t("dashboard.leadsTitle")}</h1>
                    <div className="bg-[#12121f] rounded-lg shadow-lg border border-gray-800 p-6">
                        <div className="grid gap-4">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                    <span className="ml-3 text-gray-400">{t("common.loadingData")}</span>
                                </div>
                            ) : (
                                <>
                                    <LeadsTable leads={leads} onViewLead={handleViewLead} />
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        showing={showing}
                                        totalResults={totalResults}
                                        onPageChange={handlePageChange}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </LayoutScopeRoot>

            {/* Modal para visualização de leads */}
            <LeadDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                lead={selectedLead}
            />
        </>
    );
} 