"use client";

import { useState } from "react";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import {
  useActiveHotelClient,
  useHotelPortalReports,
} from "@/src/shared/hooks/hotel-portal";
import { Card, CardBody, Spinner, Chip } from "@heroui/react";
import { AlertCircle, FileText, CheckCircle2, Clock, Eye } from "lucide-react";
import type { MonthlyReport, EReportStatus } from "@/src/shared/domain/types/@hotel-portal";
import { ManageDataButton } from "@/src/presentation/components/organisms/hotel-portal/manage-data-button";

const STATUS_CONFIG: Record<
  EReportStatus,
  { label: string; color: "default" | "warning" | "success" }
> = {
  DRAFT: { label: "Em preparação", color: "default" },
  REVIEW: { label: "Em revisão", color: "warning" },
  PUBLISHED: { label: "Publicado", color: "success" },
};

function ReportDetail({ report, onClose }: { report: MonthlyReport; onClose: () => void }) {
  const cfg = STATUS_CONFIG[report.status];

  return (
    <Card className="bg-default-50 border border-border rounded-3xl shadow-none animate-fade-in">
      <CardBody className="p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-foreground">
                Relatório — {report.reference_month.slice(0, 7)}
              </h2>
              <Chip size="sm" variant="flat" color={cfg.color}>
                {cfg.label}
              </Chip>
            </div>
            {report.published_at && (
              <p className="text-xs text-muted-foreground">
                Publicado em {new Date(report.published_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-default-100"
          >
            Fechar
          </button>
        </div>

        {report.status !== "PUBLISHED" ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-warning mb-4 opacity-60" />
            <p className="font-semibold text-foreground">Relatório em preparação</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              A equipe RÉSERVE está preparando o relatório deste mês. Você receberá um email assim que for publicado.
            </p>
          </div>
        ) : (
          <>
            {/* Resumo executivo */}
            {report.executive_summary && (
              <div className="rounded-2xl bg-background border border-border p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Resumo Executivo
                </p>
                <p className="text-sm text-foreground leading-relaxed">{report.executive_summary}</p>
              </div>
            )}

            {/* Destaques */}
            {report.highlights && report.highlights.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Destaques do Mês
                </p>
                <ul className="space-y-2">
                  {report.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Próximos passos */}
            {report.next_steps && report.next_steps.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Próximos Passos
                </p>
                <ul className="space-y-2">
                  {report.next_steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                      </div>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Comentário estratégico */}
            {report.admin_comment && (
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                  Comentário Estratégico — RÉSERVE
                </p>
                <p className="text-sm text-foreground leading-relaxed">{report.admin_comment}</p>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

export default function HotelReportsPage() {
  const { data: client } = useActiveHotelClient();
  const { data: reports, isLoading } = useHotelPortalReports(client?.id ?? null);

  const [selected, setSelected] = useState<MonthlyReport | null>(null);

  if (isLoading) {
    return (
      <LayoutScopeRoot>
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" color="primary" />
        </div>
      </LayoutScopeRoot>
    );
  }

  const publishedReports = (reports ?? []).filter((r: MonthlyReport) => r.status === "PUBLISHED");
  const pendingReports = (reports ?? []).filter((r: MonthlyReport) => r.status !== "PUBLISHED");

  return (
    <LayoutScopeRoot>
      <div className="mx-auto space-y-8 px-4 py-8 sm:px-8 lg:px-10 max-w-[1000px] animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-default-50 border border-border p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Relatório Mensal</h1>
              <p className="text-muted-foreground mt-2 text-base">
                Acompanhe os relatórios mensais preparados pela equipe RÉSERVE.
              </p>
            </div>
            <ManageDataButton clientId={client?.id} tab="report" />
          </div>
        </div>

        {/* Relatório selecionado */}
        {selected && (
          <ReportDetail report={selected} onClose={() => setSelected(null)} />
        )}

        {/* Relatórios publicados */}
        {publishedReports.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 rounded-full bg-success" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Relatórios Disponíveis
              </h2>
            </div>
            <div className="space-y-3">
              {publishedReports.map((r: MonthlyReport) => (
                <Card
                  key={r.id}
                  className="bg-default-50 border border-border rounded-2xl shadow-none hover:border-primary/30 transition-all cursor-pointer"
                  isPressable
                  onPress={() => setSelected(r)}
                >
                  <CardBody className="p-5 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          Relatório {r.reference_month.slice(0, 7)}
                        </p>
                        {r.published_at && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Publicado em{" "}
                            {new Date(r.published_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.notification_sent && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        Ver relatório
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Em preparação */}
        {pendingReports.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 rounded-full bg-warning" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Em Preparação
              </h2>
            </div>
            <div className="space-y-3">
              {pendingReports.map((r: MonthlyReport) => {
                const cfg = STATUS_CONFIG[r.status];
                return (
                  <Card
                    key={r.id}
                    className="bg-default-50 border border-border rounded-2xl shadow-none"
                  >
                    <CardBody className="p-5 flex flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            Relatório {r.reference_month.slice(0, 7)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            A equipe RÉSERVE está preparando este relatório
                          </p>
                        </div>
                      </div>
                      <Chip size="sm" variant="flat" color={cfg.color}>
                        {cfg.label}
                      </Chip>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {(!reports || reports.length === 0) && (
          <Card className="border-border bg-default-50 shadow-none border-dashed rounded-3xl">
            <CardBody className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum relatório ainda
              </h3>
              <p className="text-muted-foreground max-w-sm">
                O primeiro relatório mensal será disponibilizado pela equipe RÉSERVE ao fim do mês.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </LayoutScopeRoot>
  );
}
