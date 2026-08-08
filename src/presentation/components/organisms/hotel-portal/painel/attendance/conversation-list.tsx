import Link from "next/link";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import { ExternalLink } from "lucide-react";
import type {
  ConversationListItem,
  FunnelStage,
} from "@/src/shared/domain/types/@hotel-painel";

export const STAGE_LABEL: Record<FunnelStage, string> = {
  NOVO: "Novo",
  QUALIFICADO: "Qualificado",
  PAGAMENTO: "Pagamento",
  FECHADO: "Fechado",
  PERDIDO: "Perdido",
};

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
    <div className="space-y-3">
      {conversations.map((conv) => (
        <Card key={conv.numeroContato} className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/dashboard/hotel/atendimento/${encodeURIComponent(conv.numeroContato)}`}
                className="font-medium hover:underline"
              >
                {conv.nome ?? conv.numeroContato}
              </Link>
              <p className="text-xs text-muted-foreground">
                {conv.numeroContato} · {STAGE_LABEL[conv.currentStage]}
              </p>
            </div>
            {conv.statusBot === "PAUSADO" && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Pausado — aguardando humano
              </span>
            )}
          </div>
          {!conv.consentimentoLgpd && (
            <p className="text-xs text-muted-foreground">
              Consentimento LGPD ainda não confirmado
            </p>
          )}
          {conv.chatwootDeepLink && (
            <Button asChild size="sm" variant="outline">
              <Link
                href={conv.chatwootDeepLink}
                target="_blank"
                rel="noreferrer"
              >
                Responder no Chatwoot <ExternalLink className="ml-1 size-3.5" />
              </Link>
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
