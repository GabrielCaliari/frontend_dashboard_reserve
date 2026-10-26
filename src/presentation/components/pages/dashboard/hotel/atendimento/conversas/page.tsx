"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  useActiveHotelClient,
  useHotelBotChannels,
  useHotelFunnelMetrics,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { BotChannelCards } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/channel-status-card";
import { WhatsappInbox } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/whatsapp-inbox";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { PortalTableSkeleton } from "@/src/presentation/components/organisms/hotel-portal/painel/skeletons";
import { currentMonth } from "@/src/presentation/components/organisms/hotel-portal/painel/date-range-filter";

/**
 * Bloco Conversas (§5.3). Somente leitura por decisao de produto (Decisao 11):
 * o painel mostra historico, busca e status; responder acontece no WhatsApp
 * Business da pousada. Nao adicionar caixa de resposta aqui — duas caixas
 * dessincronizam o bot.
 * `?contato=<numero>` abre a conversa daquele contato: e o que funil, erros e
 * feedbacks usam para chegar aqui.
 */
export default function HotelConversasPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;
  const contato = useSearchParams().get("contato");

  const { data: channels, isLoading: channelsLoading } = useHotelBotChannels(clientId);
  const month = useMemo(currentMonth, []);
  const { data: metrics } = useHotelFunnelMetrics(clientId, month);

  return (
    <PainelPageShell
      wide
      title="Conversas"
      description="Histórico e status das conversas do WhatsApp. Para responder, abra a conversa no WhatsApp Web."
      isLoading={clientLoading}
    >
      <PainelSection title="Canais e origem">
        {channelsLoading || !channels ? (
          <PortalTableSkeleton rows={1} />
        ) : (
          <BotChannelCards channels={channels} volumePorOrigem={metrics?.volumePorOrigem} />
        )}
      </PainelSection>

      <PainelSection title="Conversas">
        {clientId ? (
          <WhatsappInbox clientId={clientId} initialContato={contato} />
        ) : (
          <PortalEmptyState
            title="Nenhum hotel configurado"
            description="Configure um hotel neste workspace para as conversas aparecerem aqui."
          />
        )}
      </PainelSection>
    </PainelPageShell>
  );
}
