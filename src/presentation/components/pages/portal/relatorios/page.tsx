"use client";

import { usePortalReports } from "@/src/modules/portal/presentation/hooks/use-portal-reports";
import { ReportCard } from "@/src/presentation/components/organisms/portal/reports/report-card";
import { PortalEmptyState } from "@/src/presentation/components/organisms/portal/empty-state";
import { PortalTableSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";

export default function PortalRelatoriosPage() {
  const { data: reports, isLoading } = usePortalReports();

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Relatórios</h1>
      {isLoading ? (
        <PortalTableSkeleton rows={4} />
      ) : reports && reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      ) : (
        <PortalEmptyState
          title="Nenhum relatório publicado ainda"
          description="A cada quinze dias a Reserve publica um resumo explicando os resultados — o primeiro aparece aqui."
        />
      )}
    </div>
  );
}
