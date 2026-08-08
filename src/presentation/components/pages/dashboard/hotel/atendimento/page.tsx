"use client";

import { useState } from "react";
import {
  useActiveHotelClient,
  useHotelBotChannels,
  useHotelConversations,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { BotChannelCards } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/channel-status-card";
import { ConversationList } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/conversation-list";
import { ConversationSearch } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/conversation-search";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { PortalTableSkeleton } from "@/src/presentation/components/organisms/hotel-portal/painel/skeletons";
import type { ConversationFilters } from "@/src/shared/domain/types/@hotel-painel";

/**
 * Bloco Conversas (§5.3). Somente leitura por decisao de produto (Decisao 11):
 * o painel mostra historico, busca e status; responder acontece no Chatwoot,
 * via deep link. Nao adicionar caixa de resposta aqui — o Chatwoot e a fonte
 * unica da verdade do atendimento, e duas caixas dessincronizam o bot.
 */
export default function HotelAtendimentoPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;

  const [filters, setFilters] = useState<ConversationFilters>({});
  const { data: channels, isLoading: channelsLoading } =
    useHotelBotChannels(clientId);
  const {
    data: conversations,
    isLoading: conversationsLoading,
    isError,
  } = useHotelConversations(clientId, filters);

  return (
    <PainelPageShell
      title="Conversas"
      description="Histórico e status das conversas do WhatsApp. Para responder, abra no Chatwoot."
      isLoading={clientLoading}
      isError={isError}
      errorMessage="Erro ao carregar as conversas."
    >
      <PainelSection title="Canais">
        {channelsLoading || !channels ? (
          <PortalTableSkeleton rows={1} />
        ) : (
          <BotChannelCards channels={channels} />
        )}
      </PainelSection>

      <PainelSection title="Conversas">
        <ConversationSearch filters={filters} onChange={setFilters} />
        <div className="mt-3">
          {conversationsLoading ? (
            <PortalTableSkeleton />
          ) : conversations && conversations.length > 0 ? (
            <ConversationList conversations={conversations} />
          ) : (
            <PortalEmptyState
              title="Nenhuma conversa no período"
              description="Assim que o bot receber mensagens no WhatsApp, elas aparecem aqui."
            />
          )}
        </div>
      </PainelSection>
    </PainelPageShell>
  );
}
