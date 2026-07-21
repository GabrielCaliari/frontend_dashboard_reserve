"use client";

import { use } from "react";
import { usePortalReport } from "@/src/modules/portal/presentation/hooks/use-portal-reports";
import { PortalTableSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";

/** Matches master doc §3.7's fixed 4-part structure exactly. */
export default function PortalReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: report, isLoading } = usePortalReport(id);

  if (isLoading || !report) {
    return (
      <div className="p-4 md:p-6">
        <PortalTableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">{report.title}</h1>
      <p className="text-sm text-muted-foreground">
        {new Date(report.period_start).toLocaleDateString("pt-BR")} a{" "}
        {new Date(report.period_end).toLocaleDateString("pt-BR")}
      </p>
      <section>
        <p>{report.o_que_aconteceu}</p>
      </section>
      <section>
        <p>{report.por_que_aconteceu}</p>
      </section>
      <section>
        <p>{report.proximo_ciclo}</p>
      </section>
      {report.destaque && (
        <section className="rounded-md bg-muted p-3">
          <p>{report.destaque}</p>
        </section>
      )}
    </article>
  );
}
