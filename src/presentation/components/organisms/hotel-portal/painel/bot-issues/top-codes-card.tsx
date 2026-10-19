"use client";

import type { BotIssueSummary } from "@/src/shared/domain/types/@hotel-painel";
import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { categoryLabel } from "./labels";

export function TopCodesCard({ porCodigo }: { porCodigo: BotIssueSummary["porCodigo"] }) {
  const top = porCodigo.slice(0, 5);
  return (
    <Card className="space-y-3 p-5">
      <h3 className="font-semibold">Mais frequentes na semana</h3>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum erro nos últimos 7 dias.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {top.map((row) => (
            <li key={row.codigo} className="flex items-center justify-between gap-3">
              <span>
                <span className="font-mono text-xs">{row.codigo}</span>
                <span className="ml-2 text-muted-foreground">{categoryLabel(row.categoria)}</span>
              </span>
              <span className="font-semibold">{row.quantidade}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
