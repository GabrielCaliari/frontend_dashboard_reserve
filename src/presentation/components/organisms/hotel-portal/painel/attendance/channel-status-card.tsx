import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { cn } from "@/src/shared/lib/utils";
import type { BotChannelsResponse } from "@/src/shared/domain/types/@hotel-painel";

const healthColor = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
} as const;

type Health = keyof typeof healthColor;

function ChannelShell({
  label,
  health,
  message,
  children,
}: {
  label: string;
  health: Health;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", healthColor[health])} />
        <p className="font-medium">{label}</p>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </Card>
  );
}

const MODE_LABELS: Record<string, string> = {
  hospedin: "Reserva direto no PMS",
  handoff: "Qualifica e passa para a equipe",
};

/**
 * O backend nao manda `health` pronto — manda os fatos (`connected`,
 * `heartbeatStale`, contadores). A traducao fatos -> semaforo mora aqui.
 */
export function BotChannelCards({ channels }: { channels: BotChannelsResponse }) {
  const { whatsapp, instagram, metaAds } = channels;

  const whatsappHealth: Health = !whatsapp.connected
    ? "error"
    : whatsapp.heartbeatStale
      ? "warning"
      : "ok";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <ChannelShell
        label="WhatsApp / bot"
        health={whatsappHealth}
        message={
          whatsapp.heartbeatAgeMinutes === null
            ? "Integração não provisionada"
            : whatsapp.heartbeatStale
              ? `Sem sinal do bot há ${whatsapp.heartbeatAgeMinutes} min`
              : `Ativo há ${whatsapp.heartbeatAgeMinutes} min`
        }
      >
        <div className="space-y-1 text-sm">
          <p>Atendimento automático: {whatsapp.botEnabled ? "ligado" : "pausado"}</p>
          {whatsapp.mode ? (
            <p className="text-muted-foreground">Modo: {MODE_LABELS[whatsapp.mode] ?? whatsapp.mode}</p>
          ) : null}
          {typeof whatsapp.aiEnabled === "boolean" ? (
            <p className="text-muted-foreground">IA: {whatsapp.aiEnabled ? "ligada" : "desligada"}</p>
          ) : null}
          <p className="text-muted-foreground">
            {whatsapp.activeConversations} conversa
            {whatsapp.activeConversations === 1 ? "" : "s"} ativa
            {whatsapp.activeConversations === 1 ? "" : "s"}
          </p>
          {Boolean(whatsapp.pausedAwaitingHuman) && (
            <p className="font-medium text-amber-600">
              {whatsapp.pausedAwaitingHuman} contato
              {whatsapp.pausedAwaitingHuman === 1 ? "" : "s"} aguardando um humano
            </p>
          )}
        </div>
      </ChannelShell>

      <ChannelShell
        label="Instagram"
        health={instagram.connected ? "ok" : "warning"}
        message={
          instagram.connected
            ? (instagram.tokenStatus ?? "Conectado")
            : "Não conectado"
        }
      />

      <ChannelShell
        label="Meta Ads"
        health={metaAds.connected ? "ok" : "warning"}
        message={metaAds.connected ? "Credencial ativa" : "Não conectado"}
      />
    </div>
  );
}
