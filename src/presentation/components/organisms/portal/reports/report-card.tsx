import Link from "next/link";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import type { PortalReportSummary } from "@/src/modules/portal/domain/portal-reports";

export function ReportCard({ report }: { report: PortalReportSummary }) {
  return (
    <Link href={`/portal/relatorios/${report.id}`}>
      <Card className="space-y-1 p-4 transition hover:border-primary">
        <p className="font-medium">{report.title}</p>
        <p className="text-sm text-muted-foreground">{report.excerpt}</p>
      </Card>
    </Link>
  );
}
