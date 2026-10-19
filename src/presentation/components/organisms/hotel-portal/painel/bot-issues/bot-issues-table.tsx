"use client";

import type { BotIssueItem } from "@/src/shared/domain/types/@hotel-painel";
import {
  SEVERITY_CLASSES,
  SEVERITY_LABELS,
  STATUS_LABELS,
  formatDateTime,
} from "./labels";

export function BotIssuesTable({
  items,
  onOpen,
}: {
  items: BotIssueItem[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-default-50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Data/hora</th>
            <th className="px-3 py-2">Código</th>
            <th className="px-3 py-2">Gravidade</th>
            <th className="px-3 py-2">Contato</th>
            <th className="px-3 py-2">Etapa</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="cursor-pointer border-t border-border hover:bg-default-50"
              onClick={() => onOpen(item.id)}
            >
              <td className="whitespace-nowrap px-3 py-2">{formatDateTime(item.ocorridoEm)}</td>
              <td className="px-3 py-2 font-mono text-xs">
                {item.codigo}
                {item.socorro && (
                  <span
                    data-socorro
                    className="ml-2 rounded-full bg-danger/15 px-2 py-0.5 font-sans text-[11px] text-danger"
                  >
                    Socorro
                  </span>
                )}
              </td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${SEVERITY_CLASSES[item.gravidade]}`}>
                  {SEVERITY_LABELS[item.gravidade]}
                </span>
              </td>
              <td className="px-3 py-2">{item.nomeContato ?? item.numeroContato ?? "—"}</td>
              <td className="px-3 py-2">{item.etapa ?? "—"}</td>
              <td className="px-3 py-2">{STATUS_LABELS[item.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
