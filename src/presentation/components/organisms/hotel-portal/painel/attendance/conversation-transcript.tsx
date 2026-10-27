"use client";

import { useEffect, useRef } from "react";
import { format, isSameDay, isValid, subDays } from "date-fns";
import { cn } from "@/src/shared/lib/utils";
import type { ConversationMessage } from "@/src/shared/domain/types/@hotel-painel";

/**
 * Quem fala decide lado e cor: hospede a esquerda em superficie neutra; bot e
 * equipe a direita (o lado da pousada), bot em salvia (cor da marca) e equipe
 * em ambar, para a passagem bot -> humano saltar aos olhos.
 */
const roleStyles: Record<string, { side: "left" | "right"; bubble: string; label: string }> = {
  user: {
    side: "left",
    bubble: "bg-content1 text-foreground border border-border/70",
    label: "text-foreground/55",
  },
  assistant: {
    side: "right",
    bubble: "bg-primary/[0.16] text-foreground border border-primary/20",
    label: "text-primary",
  },
  human: {
    side: "right",
    bubble: "bg-warning/[0.14] text-foreground border border-warning/30",
    label: "text-warning-600",
  },
};

const roleLabel: Record<string, string> = {
  user: "Hóspede",
  assistant: "Bot",
  human: "Equipe do hotel",
};

/** Mensagens do mesmo autor com ate 5 min de intervalo formam um bloco. */
const GROUP_GAP_MS = 5 * 60 * 1000;

const mediaLabel: Record<string, string> = {
  audio: "Áudio",
  image: "Imagem",
  imagem: "Imagem",
  video: "Vídeo",
  document: "Documento",
  documento: "Documento",
  sticker: "Figurinha",
  location: "Localização",
  contact: "Contato",
};

/** "Hoje", "Ontem" ou dd/MM/yyyy, relativo ao momento atual. */
export function dayLabel(date: Date, now: Date = new Date()): string {
  if (isSameDay(date, now)) return "Hoje";
  if (isSameDay(date, subDays(now, 1))) return "Ontem";
  return format(date, "dd/MM/yyyy");
}

function parse(iso: string): Date | null {
  const d = new Date(iso);
  return isValid(d) ? d : null;
}

/**
 * O bot guarda "[tipo]" quando a mensagem do WhatsApp nao e texto. O caso
 * "[unsupported]" e o proprio WhatsApp dizendo que nao entrega aquele tipo ao
 * bot (figurinha animada, enquete, visualizacao unica, convite de grupo...):
 * o conteudo nunca chega, entao a tela explica em vez de mostrar o colchete.
 */
const PLACEHOLDERS: Record<string, string> = {
  unsupported: "Mensagem que o WhatsApp não entrega ao bot (figurinha animada, enquete, visualização única ou convite). Veja no celular.",
  sticker: "Figurinha",
  reaction: "Reação a uma mensagem",
  video: "Vídeo",
  location: "Localização",
  contacts: "Contato compartilhado",
  documento: "Documento",
  document: "Documento",
  ephemeral: "Mensagem temporária",
  system: "Aviso do sistema do WhatsApp",
  midia: "Mídia",
};

function placeholderLabel(text: string): string | null {
  // "[unsupported]" sozinho ou seguido do motivo que o WhatsApp mandou.
  const m = /^\[([a-z_]+)\]\s*(.*)$/is.exec(text.trim());
  if (!m) return null;
  const base = PLACEHOLDERS[m[1].toLowerCase()] ?? `Mensagem do tipo "${m[1]}"`;
  return m[2] ? `${base} (${m[2].trim()})` : base;
}

function MessageBody({ msg }: { msg: ConversationMessage }) {
  const text = msg.content ?? msg.contentPreview ?? "—";
  const kind = msg.mediaKind ?? (msg.tipo === "audio" || msg.tipo === "imagem" ? msg.tipo : null);
  const placeholder = !kind ? placeholderLabel(text) : null;

  if (placeholder) {
    return <p className="italic text-foreground/60">{placeholder}</p>;
  }

  if (kind === "audio") {
    return (
      <p className="whitespace-pre-wrap">
        🎤 transcrição: {msg.mediaText ?? msg.content ?? msg.contentPreview ?? "—"}
      </p>
    );
  }
  if (kind === "image" || kind === "imagem") {
    return (
      <>
        <p className="whitespace-pre-wrap">🖼 descrição: {msg.mediaText ?? "—"}</p>
        {msg.caption ? <p className="mt-1 whitespace-pre-wrap">{msg.caption}</p> : null}
      </>
    );
  }
  if (kind) {
    return (
      <>
        <p className="font-medium">{mediaLabel[kind] ?? kind}</p>
        {msg.mediaText ? <p className="whitespace-pre-wrap">{msg.mediaText}</p> : null}
        {msg.caption ? <p className="mt-1 whitespace-pre-wrap">{msg.caption}</p> : null}
      </>
    );
  }
  return <p className="whitespace-pre-wrap">{text}</p>;
}

/**
 * Transcrição no estilo WhatsApp Web, somente leitura. Rola até o fim apenas
 * na primeira carga; ao carregar mensagens anteriores a posição é preservada.
 */
export function ConversationTranscript({
  messages,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: {
  messages: ConversationMessage[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrolled = useRef(false);
  const now = new Date();

  useEffect(() => {
    if (scrolled.current || messages.length === 0) return;
    scrolled.current = true;
    const el = endRef.current;
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView();
  }, [messages.length]);

  let lastDay: Date | null = null;
  let prev: { role: string; at: number } | null = null;
  return (
    <div className="flex flex-col">
      {hasMore && (
        <button
          className="mb-3 self-center rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
          disabled={isLoadingMore}
          onClick={onLoadMore}
          type="button"
        >
          {isLoadingMore ? "Carregando..." : "Carregar mensagens anteriores"}
        </button>
      )}
      {messages.map((msg, index) => {
        const when = parse(msg.ocorridoEm);
        const showDay = when !== null && (lastDay === null || !isSameDay(lastDay, when));
        if (when) lastDay = when;

        const isSystem = msg.tipo === "sistema";
        const at = when?.getTime() ?? 0;
        // Novo bloco quando muda o autor, o dia ou passa do intervalo.
        const startsGroup =
          isSystem || showDay || !prev || prev.role !== msg.role || at - prev.at > GROUP_GAP_MS;
        prev = isSystem ? null : { role: msg.role, at };

        const style = roleStyles[msg.role] ?? roleStyles.user;
        const right = style.side === "right";
        return (
          <div
            key={msg.id ?? `${msg.ocorridoEm}-${index}`}
            className={cn("flex flex-col", startsGroup ? "mt-3 first:mt-0" : "mt-0.5")}
          >
            {showDay && when && (
              <div
                data-testid="day-separator"
                className="sticky top-0 z-10 mb-3 self-center rounded-full border border-border/60 bg-background/85 px-3 py-0.5 text-[11px] font-medium text-foreground/60 backdrop-blur"
              >
                {dayLabel(when, now)}
              </div>
            )}
            {isSystem ? (
              <p
                data-role={msg.role}
                data-tipo="sistema"
                className="self-center max-w-[80%] text-center text-[11px] italic leading-snug text-foreground/50"
              >
                {msg.content ?? msg.contentPreview ?? "—"}
              </p>
            ) : (
              <div
                data-role={msg.role}
                className={cn(
                  "relative max-w-[78%] px-3 py-2 text-[13.5px] leading-relaxed shadow-[0_1px_0_hsl(var(--foreground)/0.04)]",
                  right ? "self-end" : "self-start",
                  style.bubble,
                  // Cauda so na primeira bolha do bloco, como no WhatsApp.
                  startsGroup
                    ? right
                      ? "rounded-2xl rounded-tr-md"
                      : "rounded-2xl rounded-tl-md"
                    : "rounded-2xl",
                )}
              >
                {startsGroup && (
                  <p className={cn("mb-0.5 text-[11px] font-semibold", style.label)}>
                    {roleLabel[msg.role] ?? msg.role}
                  </p>
                )}
                <MessageBody msg={msg} />
                {when && (
                  <p className="mt-0.5 text-right text-[10px] tabular-nums text-foreground/45">
                    {format(when, "HH:mm")}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

/** Rótulo da origem do contato; null quando desconhecida. */
export function originLabel(origem: string | null | undefined): string | null {
  if (origem === "anuncio") return "Anúncio";
  if (origem === "organico") return "Orgânico";
  if (origem === "link") return "Link rastreável";
  return null;
}
