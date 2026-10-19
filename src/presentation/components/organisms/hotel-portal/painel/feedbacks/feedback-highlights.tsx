"use client";

import type { FeedbackItem } from "@/src/shared/domain/types/@hotel-painel";
import { FeedbackCard } from "./feedback-list";

function Column({ title, items }: { title: string; items: FeedbackItem[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum feedback na semana.</p>
      ) : (
        items.map((item) => <FeedbackCard key={item.id} item={item} />)
      )}
    </div>
  );
}

export function FeedbackHighlights({
  melhores,
  piores,
}: {
  melhores: FeedbackItem[];
  piores: FeedbackItem[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Column title="Melhores da semana" items={melhores} />
      <Column title="Piores da semana" items={piores} />
    </div>
  );
}
