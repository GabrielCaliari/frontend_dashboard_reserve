"use client";

import { useMemo, useState } from "react";
import {
  useActiveHotelClient,
  useHotelFunnelBoard,
  useHotelFunnelMetrics,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { FunnelColumns } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/funnel-columns";
import { FollowupEffectivenessChart } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/followup-effectiveness-chart";
import { PortalCardSkeleton } from "@/src/presentation/components/organisms/hotel-portal/painel/skeletons";
import { MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui";
import { resolvePreset } from "@/src/presentation/components/organisms/hotel-portal/ui/period-picker";
import { formatNumber, formatPercent } from "@/src/shared/utils/hotel-format";

function formatSeconds(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.round(seconds / 60)} min`;
}

/**
 * Funil do bot (§5.4). Fica em Atendimento, nao no modulo Leads: o grupo Leads
 * e a captacao de leads do site; isto aqui e o kanban das conversas de
 * WhatsApp, outro fluxo.
 */
export default function HotelFunilPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;
  const [preset] = useState<"current-month">("current-month");
  const period = useMemo(() => resolvePreset(preset), [preset]);

  const { data: board, isLoading: boardLoading, isError } =
    useHotelFunnelBoard(clientId);
  const { data: metrics } = useHotelFunnelMetrics(clientId, period);

  return (
    <PainelPageShell
      title="Funil do Bot"
      description="Onde cada conversa parou. A fronteira mostra com dado onde a Reserve entrega e onde o hotel converte."
      isLoading={clientLoading || boardLoading}
      isError={isError}
      errorMessage="Erro ao carregar o funil."
    >
      {metrics && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Conversas iniciadas"
            value={formatNumber(metrics.conversasIniciadas.value)}
            source={metrics.conversasIniciadas.source}
          />
          <MetricCard
            label="Taxa de qualificação"
            value={formatPercent(metrics.taxaQualificacao * 100)}
          />
          <MetricCard
            label="Leads prontos para fechar"
            value={formatNumber(metrics.leadsProntos)}
          />
          <MetricCard
            label="Tempo até 1ª resposta"
            value={formatSeconds(metrics.tempoMedioPrimeiraRespostaSegundos)}
          />
        </div>
      )}

      <PainelSection title="Quadro do funil">
        {board ? <FunnelColumns columns={board} /> : <PortalCardSkeleton />}
      </PainelSection>

      {metrics && metrics.efetividadeFollowup.length > 0 && (
        <PainelSection title="Efetividade do follow-up">
          <FollowupEffectivenessChart data={metrics.efetividadeFollowup} />
        </PainelSection>
      )}

      {metrics && Boolean(metrics.contatosPausados) && (
        <p className="text-sm font-medium text-amber-600">
          {metrics.contatosPausados} contato
          {metrics.contatosPausados === 1 ? "" : "s"} pausado
          {metrics.contatosPausados === 1 ? "" : "s"} aguardando atendimento
          humano.
        </p>
      )}
    </PainelPageShell>
  );
}
