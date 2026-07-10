"use client";

import { useState } from "react";
import { usePortalChannels } from "@/src/modules/portal/presentation/hooks/use-portal-channels";
import { usePortalConversations } from "@/src/modules/portal/presentation/hooks/use-portal-conversations";
import { useAttendanceFunnel } from "@/src/modules/portal/presentation/hooks/use-attendance-funnel";
import { useAttendanceMetrics } from "@/src/modules/portal/presentation/hooks/use-attendance-metrics";
import { ChannelStatusCard } from "@/src/presentation/components/organisms/portal/attendance/channel-status-card";
import { ConversationList } from "@/src/presentation/components/organisms/portal/attendance/conversation-list";
import { ConversationSearch } from "@/src/presentation/components/organisms/portal/attendance/conversation-search";
import { FunnelColumns } from "@/src/presentation/components/organisms/portal/attendance/funnel-columns";
import { FollowupEffectivenessChart } from "@/src/presentation/components/organisms/portal/attendance/followup-effectiveness-chart";
import { VariationBadge } from "@/src/presentation/components/organisms/portal/variation-badge";
import { PortalCardSkeleton, PortalTableSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";
import type { ConversationFilters } from "@/src/modules/portal/domain/portal-attendance";

export default function PortalAtendimentoPage() {
  const { data: channels, isLoading } = usePortalChannels();
  const [filters, setFilters] = useState<ConversationFilters>({});
  const { data: conversations, isLoading: conversationsLoading } = usePortalConversations(filters);
  const { data: funnelStages, isLoading: funnelLoading } = useAttendanceFunnel();
  const { data: metrics } = useAttendanceMetrics();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Automação de Atendimento</h1>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Canais</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <PortalCardSkeleton key={i} />)
            : channels?.map((channel) => <ChannelStatusCard key={channel.kind} channel={channel} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Conversas</h2>
        <ConversationSearch filters={filters} onChange={setFilters} />
        <div className="mt-3">
          {conversationsLoading ? (
            <PortalTableSkeleton />
          ) : (
            <ConversationList conversations={conversations ?? []} />
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Funil de atendimento</h2>
        {funnelLoading ? <PortalCardSkeleton /> : <FunnelColumns stages={funnelStages ?? []} />}
      </section>

      {/* the only role="figure" chart on this route (Canais/Conversas/Funil sections above
          render cards and columns, not charts) — no `hidden md:block` wrapper needed to
          respect the "max 1 chart per mobile viewport" rule (master doc §4.3). */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Métricas do atendimento</h2>
        {metrics && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Conversas iniciadas</p>
                <p className="text-xl font-semibold">{metrics.conversas_iniciadas.value}</p>
                <VariationBadge value={metrics.conversas_iniciadas.variation_pct} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa de qualificação</p>
                <p className="text-xl font-semibold">{metrics.taxa_qualificacao_pct}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Leads prontos para fechar</p>
                <p className="text-xl font-semibold">{metrics.leads_prontos_fechar}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contatos pausados aguardando humano</p>
                <p className="text-xl font-semibold text-amber-600">{metrics.contatos_pausados_aguardando}</p>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs text-muted-foreground">Efetividade do follow-up por toque</h3>
              <FollowupEffectivenessChart data={metrics.followup_effectiveness} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
