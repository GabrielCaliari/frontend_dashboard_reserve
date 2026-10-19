"use client";

import { useEffect, useRef } from "react";
import { format, isSameDay, isValid, subDays } from "date-fns";
import { cn } from "@/src/shared/lib/utils";
import type { ConversationMessage } from "@/src/shared/domain/types/@hotel-painel";

const roleStyles: Record<string, string> = {
  user: "self-start bg-muted",
  assistant: "self-end bg-primary/10",
  human: "self-end bg-emerald-100",
};

const roleLabel: Record<string, string> = {
  user: "Hóspede",
  assistant: "Bot",
  human: "Equipe do hotel",
};

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

function MessageBody({ msg }: { msg: ConversationMessage }) {
  const text = msg.content ?? msg.contentPreview ?? "—";
  const kind = msg.mediaKind ?? (msg.tipo === "audio" || msg.tipo === "imagem" ? msg.tipo : null);

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
  return (
    <div className="flex flex-col gap-2">
      {hasMore && (
        <button
          className="self-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
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
        return (
          <div key={`${msg.ocorridoEm}-${index}`} className="flex flex-col gap-2">
            {showDay && when && (
              <div
                data-testid="day-separator"
                className="self-center rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground"
              >
                {dayLabel(when, now)}
              </div>
            )}
            {msg.tipo === "sistema" ? (
              <p
                data-role={msg.role}
                data-tipo="sistema"
                className="self-center text-center text-xs text-muted-foreground"
              >
                {msg.content ?? msg.contentPreview ?? "—"}
              </p>
            ) : (
              <div
                data-role={msg.role}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  roleStyles[msg.role] ?? "self-start bg-muted",
                )}
              >
                <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                  {roleLabel[msg.role] ?? msg.role}
                </p>
                <MessageBody msg={msg} />
                {when && (
                  <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
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
  return null;
}
