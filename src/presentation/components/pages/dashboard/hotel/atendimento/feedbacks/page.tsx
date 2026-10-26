"use client";

import { useMemo, useState } from "react";
import {
  useActiveHotelClient,
  useFeedbacks,
  useFeedbacksSummary,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import {
  DateRangeFilter,
  filterFieldClass,
  lastDays,
  type DateRange,
} from "@/src/presentation/components/organisms/hotel-portal/painel/date-range-filter";
import { Pagination } from "@/src/presentation/components/organisms/hotel-portal/painel/pagination";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui";
import {
  FeedbackList,
  SENTIMENT_LABELS,
} from "@/src/presentation/components/organisms/hotel-portal/painel/feedbacks/feedback-list";
import { FeedbackHighlights } from "@/src/presentation/components/organisms/hotel-portal/painel/feedbacks/feedback-highlights";
import type { FeedbackSentiment } from "@/src/shared/domain/types/@hotel-painel";

/** 20 por pagina: uma tela, sem rolar sem fim. */
const PAGE_SIZE = 20;

/** Feedbacks dos hospedes coletados pelo bot apos a estadia. */
export default function FeedbacksPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;

  const week = useMemo(() => lastDays(7), []);
  const [period, setPeriod] = useState<DateRange>(() => lastDays(30));
  const [sentimento, setSentimento] = useState<FeedbackSentiment | "">("");

  const baseFilters = useMemo(
    () => ({
      from: period.from,
      to: period.to,
      ...(sentimento ? { sentimento } : {}),
    }),
    [period, sentimento],
  );
  // A pagina volta para a primeira quando qualquer filtro muda.
  const filterKey = JSON.stringify(baseFilters);
  const [paged, setPaged] = useState({ key: filterKey, page: 1 });
  const page = paged.key === filterKey ? paged.page : 1;
  const filters = useMemo(() => ({ ...baseFilters, page, limit: PAGE_SIZE }), [baseFilters, page]);

  const { data: list, isLoading, isError, isFetching } = useFeedbacks(clientId, filters);
  const { data: summary } = useFeedbacksSummary(clientId, week);

  return (
    <PainelPageShell
      title="Feedbacks dos hóspedes"
      description="O que os hóspedes disseram ao bot depois da estadia, com destaques da semana."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar os feedbacks."
    >
      {summary && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(Object.keys(SENTIMENT_LABELS) as FeedbackSentiment[]).map((key) => (
              <MetricCard
                key={key}
                label={`${SENTIMENT_LABELS[key]} (últimos 7 dias)`}
                value={String(summary.porSentimento[key])}
                accent={key === "positivo"}
              />
            ))}
            <MetricCard
              label="Nota média"
              value={
                summary.notaMedia === null
                  ? "—"
                  : summary.notaMedia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
              }
            />
          </div>
          <FeedbackHighlights melhores={summary.melhores} piores={summary.piores} />
        </>
      )}

      <PainelSection title="Todos os feedbacks">
        <DateRangeFilter value={period} onChange={setPeriod}>
          <label className="flex items-center gap-1.5 text-xs text-foreground/60">
            Sentimento
            <select
              className={filterFieldClass}
              value={sentimento}
              onChange={(e) => setSentimento(e.target.value as FeedbackSentiment | "")}
            >
              <option value="">Todos</option>
              {Object.entries(SENTIMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </DateRangeFilter>

        {list && list.items.length > 0 ? (
          <>
            <FeedbackList items={list.items} />
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={list.total}
              isLoading={isFetching}
              onChange={(p) => setPaged({ key: filterKey, page: p })}
            />
          </>
        ) : (
          <PortalEmptyState
            title="Nenhum feedback encontrado"
            description="Não há feedbacks para os filtros escolhidos."
          />
        )}
      </PainelSection>
    </PainelPageShell>
  );
}
