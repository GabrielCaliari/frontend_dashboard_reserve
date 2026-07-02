import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/presentation/components/atoms/shadcn-ui/card";
import { PortalEmptyState } from "@/src/presentation/components/organisms/portal/empty-state";
import type { OverviewResponse } from "@/src/modules/portal/domain/portal-stats";

export function LastReportPreview({ report }: { report: OverviewResponse["last_report_preview"] }) {
  if (!report) {
    return (
      <PortalEmptyState
        title="Nenhum resumo publicado ainda"
        description="A cada quinze dias a Reserve publica um resumo explicando os resultados — o primeiro aparece aqui."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{report.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{report.excerpt}</p>
        <Link href={`/portal/relatorios/${report.id}`} className="text-sm font-medium text-primary hover:underline">
          Ler resumo completo
        </Link>
      </CardContent>
    </Card>
  );
}
