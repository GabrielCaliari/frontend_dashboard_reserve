"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import {
  useActiveHotelClient,
  useHotelFunnelBoard,
  useHotelFunnelMetrics,
  useMoveFunnelStage,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { FunnelBoard } from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-board";
import { stageLabel } from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages";
import { FollowupEffectivenessChart } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/followup-effectiveness-chart";
import { PortalCardSkeleton } from "@/src/presentation/components/organisms/hotel-portal/painel/skeletons";
import { MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui";
import { resolvePreset } from "@/src/presentation/components/organisms/hotel-portal/ui/period-picker";
import { formatNumber, formatPercent } from "@/src/shared/utils/hotel-format";
import type { FunnelStageChangeDto } from "@/src/shared/domain/types/@hotel-painel";

function formatSeconds(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.round(seconds / 60)} min`;
}

// mesma logica de src/presentation/components/organisms/motor/grade-cell-modal.tsx
function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;

  return typeof message === "string" && message.length > 0 ? message : fallback;
}

/**
 * Funil do bot (§5.4). Fica em Atendimento, nao no modulo Leads: o grupo Leads
 * e a captacao de leads do site; isto aqui e o kanban das conversas de
 * WhatsApp, outro fluxo. O quadro deixou de ser somente leitura: com a
 * permissao certa da capacidade "hotel-portal.whatsapp-funnel.manage" o
 * usuario move o lead por drag ou pelo menu do card. As conversas em si
 * seguem read-only, geridas pelo Chatwoot.
 */
export default function HotelFunilPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;
  const { tenantId, hasPermission } = useTenantCapabilities();
  const canManage = hasPermission("hotel-portal.whatsapp-funnel.manage");
  const [preset] = useState<"current-month">("current-month");
  const period = useMemo(() => resolvePreset(preset), [preset]);

  const { data: board, isLoading: boardLoading, isError } =
    useHotelFunnelBoard(clientId);
  const { data: metrics } = useHotelFunnelMetrics(clientId, period);
  const moveStage = useMoveFunnelStage(tenantId, clientId);

  const handleMove = async (numeroContato: string, dto: FunnelStageChangeDto) => {
    try {
      await moveStage.mutateAsync({ numeroContato, dto });
      toast.success(`Movido para ${stageLabel(dto.para_estagio)}.`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível mover o card."));
      throw error; // modal aberto decide permanecer aberto
    }
  };

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
        {board ? (
          <FunnelBoard columns={board} canManage={canManage} onMove={handleMove} />
        ) : (
          <PortalCardSkeleton />
        )}
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
