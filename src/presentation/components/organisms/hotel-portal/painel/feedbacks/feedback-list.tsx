"use client";

import Link from "next/link";
import type { FeedbackItem, FeedbackSentiment } from "@/src/shared/domain/types/@hotel-painel";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";

export const SENTIMENT_LABELS: Record<FeedbackSentiment, string> = {
  positivo: "Positivo",
  neutro: "Neutro",
  negativo: "Negativo",
};

const SENTIMENT_CLASS: Record<FeedbackSentiment, string> = {
  positivo: "bg-green-100 text-green-800",
  neutro: "bg-gray-100 text-gray-700",
  negativo: "bg-red-100 text-red-800",
};

/** Formata YYYY-MM-DD como dd/MM/yyyy sem passar por Date (evita deslocamento de fuso). */
export function formatCheckOut(value: string | null): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}

export function FeedbackCard({ item }: { item: FeedbackItem }) {
  const checkOut = formatCheckOut(item.checkOut);
  return (
    <Card className="space-y-2 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${SENTIMENT_CLASS[item.sentimento]}`}>
          {SENTIMENT_LABELS[item.sentimento]}
        </span>
        {item.nota !== null && <span className="font-semibold">Nota {item.nota}</span>}
        {checkOut && <span className="text-muted-foreground">Check-out {checkOut}</span>}
        {item.linkEnviado && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">
            Link de avaliação enviado
          </span>
        )}
      </div>
      <p className="text-sm">{item.texto ?? item.resumo ?? "—"}</p>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {item.nomeContato ? `${item.nomeContato} · ` : ""}
          {item.numeroContato}
        </span>
        <Link
          href={`/dashboard/hotel/atendimento/${item.numeroContato}`}
          className="font-medium text-primary hover:underline"
        >
          Abrir conversa
        </Link>
      </div>
    </Card>
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
