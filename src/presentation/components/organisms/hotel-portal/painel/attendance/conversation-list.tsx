import Link from "next/link";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import { ExternalLink, ShieldAlert } from "lucide-react";
import type { ConversationListItem } from "@/src/shared/domain/types/@hotel-painel";
import {
  STAGE_TONES,
  contactInitials,
  stageLabel,
} from "@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages";

/**
 * Somente leitura por construcao (Decisao 11 do plano mestre): nunca renderiza
 * caixa de resposta. A unica acao de saida e o deep link para o Chatwoot, onde
 * a equipe do hotel de fato responde. Quando o tenant nao tem
 * `chatwoot_base_url` configurado o backend manda `chatwootDeepLink: null` e o
 * botao simplesmente nao aparece — nunca um link quebrado.
 */
export function ConversationList({
  conversations,
}: {
  conversations: ConversationListItem[];
}) {
  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <Card
          key={conv.numeroContato}
          className="flex items-center gap-3 rounded-2xl bg-background p-3 transition-colors hover:border-primary/40"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
          >
            {contactInitials(conv.nome, conv.numeroContato)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={`/dashboard/hotel/atendimento/${encodeURIComponent(conv.numeroContato)}`}
                className="truncate text-sm font-semibold hover:underline"
              >
                {conv.nome ?? conv.numeroContato}
              </Link>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_TONES[conv.currentStage]}`}
              >
                {stageLabel(conv.currentStage)}
              </span>
              {conv.statusBot === "PAUSADO" && (
                <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning-600">
                  Pausado — aguardando humano
                </span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{conv.numeroContato}</span>
              {!conv.consentimentoLgpd && (
                <span className="flex items-center gap-1 text-foreground/50">
                  <ShieldAlert aria-hidden className="h-3 w-3" />
                  LGPD não confirmado
                </span>
              )}
            </p>
          </div>

          {conv.chatwootDeepLink && (
            <Button asChild className="shrink-0" size="sm" variant="outline">
              <Link href={conv.chatwootDeepLink} target="_blank" rel="noreferrer">
                Responder no Chatwoot <ExternalLink className="ml-1 size-3.5" />
              </Link>
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
