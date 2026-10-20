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
import { LoadMoreFooter } from "@/src/presentation/components/organisms/hotel-portal/painel/load-more-footer";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import {
  FeedbackList,
  SENTIMENT_LABELS,
} from "@/src/presentation/components/organisms/hotel-portal/painel/feedbacks/feedback-list";
import { FeedbackHighlights } from "@/src/presentation/components/organisms/hotel-portal/painel/feedbacks/feedback-highlights";
import type { FeedbackSentiment } from "@/src/shared/domain/types/@hotel-painel";

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function lastDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return { from: isoDay(from), to: isoDay(to) };
}

const PAGE_SIZE = 50;

const fieldClass = "rounded-lg border border-border bg-background px-3 py-2 text-sm";

/** Feedbacks dos hospedes coletados pelo bot apos a estadia. */
export default function FeedbacksPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;

  const week = useMemo(() => lastDays(7), []);
  const [period, setPeriod] = useState(() => lastDays(30));
  const [sentimento, setSentimento] = useState<FeedbackSentiment | "">("");

  const baseFilters = useMemo(
    () => ({
      from: period.from,
      to: period.to,
      ...(sentimento ? { sentimento } : {}),
    }),
    [period, sentimento],
  );
  // O limite volta ao inicial quando qualquer filtro muda.
  const filterKey = JSON.stringify(baseFilters);
  const [loaded, setLoaded] = useState({ key: filterKey, limit: PAGE_SIZE });
  const limit = loaded.key === filterKey ? loaded.limit : PAGE_SIZE;
  const filters = useMemo(() => ({ ...baseFilters, limit }), [baseFilters, limit]);

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
          <div className="grid gap-3 sm:grid-cols-4">
            {(Object.keys(SENTIMENT_LABELS) as FeedbackSentiment[]).map((key) => (
              <Card key={key} className="p-4">
                <p className="text-xs text-muted-foreground">
                  {SENTIMENT_LABELS[key]} (últimos 7 dias)
                </p>
                <p className="text-2xl font-semibold">{summary.porSentimento[key]}</p>
              </Card>
            ))}
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Nota média</p>
              <p className="text-2xl font-semibold">
                {summary.notaMedia === null
                  ? "—"
                  : summary.notaMedia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              </p>
            </Card>
          </div>
          <FeedbackHighlights melhores={summary.melhores} piores={summary.piores} />
        </>
      )}

      <PainelSection title="Todos os feedbacks">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs">
            De
            <input
              type="date"
              className={fieldClass}
              value={period.from}
              onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Até
            <input
              type="date"
              className={fieldClass}
              value={period.to}
              onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Sentimento
            <select
              className={fieldClass}
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
        </div>

        {list && list.items.length > 0 ? (
          <>
            <FeedbackList items={list.items} />
            <LoadMoreFooter
              shown={list.items.length}
              total={list.total}
              isLoading={isFetching}
              onLoadMore={() => setLoaded({ key: filterKey, limit: limit + PAGE_SIZE })}
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
