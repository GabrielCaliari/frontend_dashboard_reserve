import Link from "next/link";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import { ExternalLink } from "lucide-react";
import type { Conversation } from "@/src/modules/portal/domain/portal-attendance";

const stageLabel: Record<Conversation["stage"], string> = {
  NOVO: "Novo",
  QUALIFICADO: "QUALIFICADO",
  PAGAMENTO: "Pagamento",
  FECHADO: "Fechado",
  FRIO: "Frio",
};

/**
 * Read-only by construction (master doc Decisão 11 / §5.3 / §9 risk table):
 * this never renders a reply textbox — the only outbound action is a deep
 * link into Chatwoot, where the hotel's team actually replies.
 */
export function ConversationList({ conversations }: { conversations: Conversation[] }) {
  return (
    <div className="space-y-3">
      {conversations.map((conv) => (
        <Card key={conv.id} className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/portal/atendimento/${conv.id}`} className="font-medium hover:underline">
                {conv.contact_name ?? conv.contact_number}
              </Link>
              <p className="text-xs text-muted-foreground">
                {conv.origin === "anuncio" ? conv.campaign_name ?? "Anúncio" : "Orgânico"} · {stageLabel[conv.stage]}
              </p>
            </div>
            {conv.bot_status === "PAUSADO" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Pausado — {conv.pause_reason}
              </span>
            )}
          </div>
          {!conv.consentimento_lgpd && (
            <p className="text-xs text-muted-foreground">Consentimento LGPD ainda não confirmado</p>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={conv.chatwoot_url} target="_blank" rel="noreferrer">
              Responder no Chatwoot <ExternalLink className="ml-1 size-3.5" />
            </Link>
          </Button>
        </Card>
      ))}
    </div>
  );
}
