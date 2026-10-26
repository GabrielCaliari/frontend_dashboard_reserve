"use client";

import Link from "next/link";
import { MessageSquareText, Star } from "lucide-react";
import type { FeedbackItem, FeedbackSentiment } from "@/src/shared/domain/types/@hotel-painel";
import { conversationHref } from "@/src/presentation/components/organisms/hotel-portal/painel/conversation-link";

export const SENTIMENT_LABELS: Record<FeedbackSentiment, string> = {
  positivo: "Positivo",
  neutro: "Neutro",
  negativo: "Negativo",
};

/** Faixa a esquerda do card e selo: o sentimento e a primeira coisa a ler. */
const SENTIMENT_TONE: Record<FeedbackSentiment, { bar: string; chip: string }> = {
  positivo: { bar: "bg-success", chip: "bg-success/15 text-success-700 dark:text-success-400" },
  neutro: { bar: "bg-foreground/25", chip: "bg-default-100 text-foreground/70" },
  negativo: { bar: "bg-danger", chip: "bg-danger/10 text-danger" },
};

/** Formata YYYY-MM-DD como dd/MM/yyyy sem passar por Date (evita deslocamento de fuso). */
export function formatCheckOut(value: string | null): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}

export function FeedbackCard({ item }: { item: FeedbackItem }) {
  const checkOut = formatCheckOut(item.checkOut);
  const tone = SENTIMENT_TONE[item.sentimento];
  return (
    <article className="relative overflow-hidden rounded-2xl border border-border/80 bg-default-50 p-4 pl-5">
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-md px-1.5 py-px font-medium ${tone.chip}`}>
          {SENTIMENT_LABELS[item.sentimento]}
        </span>
        {item.nota !== null && (
          <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-foreground">
            <Star aria-hidden className="h-3 w-3 fill-current text-warning" />
            Nota {item.nota}
          </span>
        )}
        {checkOut && <span className="text-foreground/50">Check-out {checkOut}</span>}
        {item.linkEnviado && (
          <span className="rounded-md bg-primary/10 px-1.5 py-px font-medium text-primary">
            Link de avaliação enviado
          </span>
        )}
      </div>
      {/* Aspas tipograficas: e a voz do hospede, nao a nossa. */}
      <p className="mt-2 text-[15px] leading-relaxed text-foreground">
        <span aria-hidden className="text-foreground/40">“</span>
        <span>{item.texto ?? item.resumo ?? "—"}</span>
        <span aria-hidden className="text-foreground/40">”</span>
      </p>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-foreground/55">
        <span className="truncate">
          {item.nomeContato ? <span className="font-medium text-foreground/80">{item.nomeContato}</span> : null}
          {item.nomeContato ? " · " : ""}
          <span className="tabular-nums">{item.numeroContato}</span>
        </span>
        <Link
          href={conversationHref(item.numeroContato)}
          className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
        >
          <MessageSquareText aria-hidden className="h-3.5 w-3.5" />
          Abrir conversa
        </Link>
      </div>
    </article>
  );
}

export function FeedbackList({ items }: { items: FeedbackItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <FeedbackCard key={item.id} item={item} />
      ))}
    </div>
  );
}
