"use client";

import Link from "next/link";
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
    <Card className="space-y-2 rounded-2xl border-border/80 bg-default-50 p-4 shadow-none">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", healthColor[health])} />
        <p className="font-semibold">{label}</p>
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

const ORIGEM_LABELS: Record<string, string> = {
  anuncio: "Anúncio",
  link: "Link rastreável",
  organico: "Orgânico",
  desconhecido: "Sem origem",
};

const ORIGEM_TONE: Record<string, string> = {
  anuncio: "bg-primary",
  link: "bg-warning",
  organico: "bg-foreground/50",
  desconhecido: "bg-foreground/20",
};

/**
 * O backend nao manda `health` pronto — manda os fatos (`connected`,
 * `heartbeatStale`, contadores). A traducao fatos -> semaforo mora aqui.
 *
 * Meta Ads nao e um canal de conversa: ninguem "abre uma conversa pelo Meta
 * Ads". A conversa chega pelo WhatsApp e a origem dela e que pode ser um
 * anuncio — por isso o terceiro cartao mostra de onde as conversas vieram.
 */
export function BotChannelCards({
  channels,
  volumePorOrigem,
}: {
  channels: BotChannelsResponse;
  /** Conversas iniciadas no mes por origem (metricas do funil). */
  volumePorOrigem?: { origem: string; count: number }[];
}) {
  const { whatsapp, instagram } = channels;

  const whatsappHealth: Health = !whatsapp.connected
    ? "error"
    : whatsapp.heartbeatStale
      ? "warning"
      : "ok";

  const origens = (volumePorOrigem ?? []).filter((o) => o.count > 0);
  const totalOrigens = origens.reduce((s, o) => s + o.count, 0);

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
        label="Instagram Direct"
        health={instagram.connected ? "ok" : "warning"}
        message={
          instagram.connected
            ? (instagram.tokenStatus ?? "Conectado")
            : "Não conectado"
        }
      >
        {!instagram.connected && (
          <p className="text-xs text-muted-foreground">
            As mensagens do Direct ainda não entram nesta caixa. Para conectar, a RÉSERVE precisa do
            acesso à conta profissional do Instagram da pousada —{" "}
            <Link className="font-medium text-primary hover:underline" href="/dashboard/hotel/config">
              veja em Configurações
            </Link>
            .
          </p>
        )}
      </ChannelShell>

      <Card className="space-y-2 rounded-2xl border-border/80 bg-default-50 p-4 shadow-none">
        <p className="font-semibold">De onde vêm as conversas</p>
        {totalOrigens === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conversa iniciada neste mês.</p>
        ) : (
          <>
            <div className="flex h-2 overflow-hidden rounded-full bg-default-100" aria-hidden>
              {origens.map((o) => (
                <span
                  key={o.origem}
                  className={ORIGEM_TONE[o.origem] ?? ORIGEM_TONE.desconhecido}
                  style={{ width: `${(o.count / totalOrigens) * 100}%` }}
                />
              ))}
            </div>
            <ul className="space-y-0.5 text-sm">
              {origens.map((o) => (
                <li key={o.origem} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span aria-hidden className={cn("size-2 rounded-full", ORIGEM_TONE[o.origem] ?? ORIGEM_TONE.desconhecido)} />
                    {ORIGEM_LABELS[o.origem] ?? o.origem}
                  </span>
                  <span className="tabular-nums">
                    {o.count}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {Math.round((o.count / totalOrigens) * 100)}%
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">Conversas iniciadas no mês atual.</p>
          </>
        )}
      </Card>
    </div>
  );
}
