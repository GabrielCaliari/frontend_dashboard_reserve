"use client";

import { use } from "react";
import { ExternalLink } from "lucide-react";
import {
  useActiveHotelClient,
  useHotelConversationDetail,
  flattenConversationPages,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { ConversationTranscript, originLabel } from "@/src/presentation/components/organisms/hotel-portal/painel/attendance/conversation-transcript";
import { stageLabel } from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages";
import { botStatusLabel } from "@/src/presentation/components/organisms/hotel-portal/funil/bot-status";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";

export default function HotelConversationDetailPage({
  params,
}: {
  params: Promise<{ numeroContato: string }>;
}) {
  const { numeroContato } = use(params);
  const decoded = decodeURIComponent(numeroContato);

  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const { data: pages, isLoading, isError, fetchNextPage, isFetchingNextPage } =
    useHotelConversationDetail(client?.id ?? null, decoded);

  const { contact, messages, hasMore } = flattenConversationPages(pages);

  return (
    <PainelPageShell
      title={contact?.nome ?? decoded}
      description="Transcrição somente leitura. A equipe responde pelo WhatsApp Business da pousada."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Conversa não encontrada."
      actions={
        contact ? (
          <a
            className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
            href={contact.whatsappWebLink}
            rel="noreferrer"
            target="_blank"
          >
            Abrir no WhatsApp Web <ExternalLink aria-hidden className="ml-1 size-3.5" />
          </a>
        ) : undefined
      }
    >
      {contact && (
        <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
          <span>
            <span className="text-muted-foreground">Número: </span>
            {contact.numeroContato}
          </span>
          <span>
            <span className="text-muted-foreground">Estágio: </span>
            {stageLabel(contact.currentStage)}
          </span>
          <span>
            <span className="text-muted-foreground">Bot: </span>
            {botStatusLabel(contact.statusBot)}
          </span>
          {originLabel(contact.origem) ? (
            <span>
              <span className="text-muted-foreground">Origem: </span>
              {originLabel(contact.origem)}
              {contact.origem === "anuncio" && contact.sourceId ? (
                <span className="ml-1 text-xs text-muted-foreground">{contact.sourceId}</span>
              ) : null}
            </span>
          ) : null}
          {!contact.consentimentoLgpd && (
            <span className="text-amber-600">
              Consentimento LGPD não confirmado
            </span>
          )}
        </Card>
      )}

      <PainelSection title="Transcrição">
        <ConversationTranscript
          messages={messages}
          hasMore={hasMore}
          isLoadingMore={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      </PainelSection>
    </PainelPageShell>
  );
}
