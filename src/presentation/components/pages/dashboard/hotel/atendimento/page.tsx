"use client";

import { useActiveHotelClient, useHotelBotChannels } from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { BotChannelCards } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/channel-status-card";
import { WhatsappInbox } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/whatsapp-inbox";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { PortalTableSkeleton } from "@/src/presentation/components/organisms/hotel-portal/painel/skeletons";

/**
 * Bloco Conversas (§5.3). Somente leitura por decisao de produto (Decisao 11):
 * o painel mostra historico, busca e status; responder acontece no Chatwoot,
 * via deep link. Nao adicionar caixa de resposta aqui — o Chatwoot e a fonte
 * unica da verdade do atendimento, e duas caixas dessincronizam o bot.
 * Layout estilo WhatsApp Web: lista com etiquetas de estagio + transcricao.
 */
export default function HotelAtendimentoPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;

  const { data: channels, isLoading: channelsLoading } = useHotelBotChannels(clientId);

  return (
    <PainelPageShell
      wide
      title="Conversas"
      description="Histórico e status das conversas do WhatsApp. Para responder, abra no Chatwoot."
      isLoading={clientLoading}
    >
      <PainelSection title="Canais">
        {channelsLoading || !channels ? (
          <PortalTableSkeleton rows={1} />
        ) : (
          <BotChannelCards channels={channels} />
        )}
      </PainelSection>

      <PainelSection title="Conversas">
        {clientId ? (
          <WhatsappInbox clientId={clientId} />
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
