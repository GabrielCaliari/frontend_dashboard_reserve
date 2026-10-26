"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, Clock, FileText, X } from "lucide-react";
import {
  useActiveHotelClient,
  useHotelPortalReports,
} from "@/src/shared/hooks/hotel-portal";
import type { EReportStatus, MonthlyReport } from "@/src/shared/domain/types/@hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { ScreenLinks } from "@/src/presentation/components/organisms/hotel-portal/painel/screen-links";
import { ManageDataButton } from "@/src/presentation/components/organisms/hotel-portal/manage-data-button";
import { formatMonthLabel } from "@/src/shared/utils/hotel-format";

const STATUS: Record<EReportStatus, { label: string; tone: string }> = {
  DRAFT: { label: "Em preparação", tone: "bg-default-100 text-foreground/70" },
  REVIEW: { label: "Em revisão", tone: "bg-warning/15 text-warning-600" },
  PUBLISHED: { label: "Publicado", tone: "bg-success/15 text-success-600" },
};

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

/** "outubro de 2026" com a inicial maiuscula, para titulo. */
function monthTitle(referenceMonth: string) {
  const label = formatMonthLabel(referenceMonth);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function StatusChip({ status }: { status: EReportStatus }) {
  const cfg = STATUS[status];
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${cfg.tone}`}>
      {cfg.label}
    </span>
  );
}

function ReportRow({
  report,
  selected,
  onSelect,
}: {
  report: MonthlyReport;
  selected: boolean;
  onSelect: () => void;
}) {
  const published = report.status === "PUBLISHED";
  return (
    <li>
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={onSelect}
        className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          selected
            ? "border-primary/40 bg-primary/[0.06]"
            : "border-border/80 bg-default-50 hover:border-primary/30"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            published ? "bg-success/10 text-success-600" : "bg-default-100 text-muted-foreground"
          }`}
        >
          {published ? <FileText className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-foreground">{monthTitle(report.reference_month)}</span>
          <span className="block text-xs text-muted-foreground">
            {published && report.published_at
              ? `Publicado em ${longDate(report.published_at)}`
              : "A equipe RÉSERVE está preparando este relatório"}
          </span>
        </span>
        <StatusChip status={report.status} />
        <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  );
}

function ReportDetail({ report, onClose }: { report: MonthlyReport; onClose: () => void }) {
  return (
    <article className="animate-fade-in space-y-6 rounded-2xl border border-border/80 bg-default-50 p-5 sm:p-7">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {monthTitle(report.reference_month)}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StatusChip status={report.status} />
            {report.published_at && <span>Publicado em {longDate(report.published_at)}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar relatório"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-default-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {report.status !== "PUBLISHED" ? (
        <PortalEmptyState
          icon={Clock}
          title="Relatório em preparação"
          description="A equipe RÉSERVE está fechando os números deste mês. Você recebe um e-mail assim que for publicado."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-6 lg:col-span-2">
            {report.executive_summary && (
              <section>
                <h3 className="mb-2 text-sm font-medium text-foreground">Resumo do mês</h3>
                <p className="max-w-[70ch] text-[15px] leading-relaxed text-foreground/85">
                  {report.executive_summary}
                </p>
              </section>
            )}
          </div>

          {report.highlights && report.highlights.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">Destaques</h3>
              <ul className="space-y-2">
                {report.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
                    <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-success-600" />
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.next_steps && report.next_steps.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">Próximos passos</h3>
              {/* Numerado porque e uma sequencia: a ordem em que a RÉSERVE vai agir. */}
              <ol className="space-y-2">
                {report.next_steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {report.admin_comment && (
            <section className="rounded-xl border border-primary/25 bg-primary/[0.06] p-4 lg:col-span-2">
              <h3 className="mb-1.5 text-sm font-medium text-foreground">Comentário da RÉSERVE</h3>
              <p className="max-w-[70ch] text-sm leading-relaxed text-foreground/85">{report.admin_comment}</p>
            </section>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Relatorio mensal: a lista de meses de um lado e o relatorio aberto do
 * outro. O mais recente publicado ja abre sozinho — e o que a pessoa veio ver.
 */
export default function HotelReportsPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const { data: reports, isLoading, isError } = useHotelPortalReports(client?.id ?? null);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = [...(reports ?? [])].sort((a, b) => b.reference_month.localeCompare(a.reference_month));
  const selected = list.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId !== null || list.length === 0) return;
    const first = list.find((r) => r.status === "PUBLISHED") ?? null;
    if (first) setSelectedId(first.id);
    // So na primeira carga: depois a escolha e da pessoa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  return (
    <PainelPageShell
      title="Relatório mensal"
      description="Todo mês a equipe RÉSERVE fecha os números e escreve o que aconteceu, o que deu certo e o que vem a seguir."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar os relatórios."
      actions={<ManageDataButton clientId={client?.id} tab="report" />}
    >
      {list.length === 0 ? (
        <PortalEmptyState
          icon={FileText}
          title="Nenhum relatório ainda"
          description="O primeiro relatório mensal é publicado pela equipe RÉSERVE ao fim do mês."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <PainelSection title="Meses">
            <ol className="space-y-2">
              {list.map((r) => (
                <ReportRow
                  key={r.id}
                  report={r}
                  selected={r.id === selectedId}
                  onSelect={() => setSelectedId(r.id)}
                />
              ))}
            </ol>
          </PainelSection>

          <div className="min-w-0">
            {selected ? (
              <ReportDetail report={selected} onClose={() => setSelectedId(null)} />
            ) : (
              <PortalEmptyState
                icon={FileText}
                title="Escolha um mês"
                description="Clique num mês ao lado para ler o relatório."
              />
            )}
          </div>
        </div>
      )}

      <ScreenLinks
        links={[
          { href: "/dashboard/hotel/retorno", label: "Retorno (ROI)", hint: "Os números por trás do relatório" },
          { href: "/dashboard/hotel/evolucao", label: "Evolução", hint: "Os marcos desde a entrada da RÉSERVE" },
          { href: "/dashboard/hotel/plano", label: "Plano", hint: "O que está previsto para o semestre" },
        ]}
      />
    </PainelPageShell>
  );
}
