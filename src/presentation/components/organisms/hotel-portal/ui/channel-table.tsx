"use client";

import { Card, CardBody } from "@heroui/react";

export interface ChannelColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Renderiza a célula. Recebe a linha inteira. */
  cell: (row: T) => React.ReactNode;
  className?: string;
}

/**
 * Tabela genérica por canal/campanha (Doc 03 §3.2).
 * Usada em OTA, Campanhas e WhatsApp. Scroll horizontal no mobile.
 */
export function ChannelTable<T>({
  columns,
  rows,
  getRowKey,
}: {
  columns: ChannelColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
}) {
  return (
    <Card className="bg-default-50 border border-border rounded-3xl shadow-none overflow-hidden">
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-default-100/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-5 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={getRowKey(row, i)}
                  className="border-b border-border/50 last:border-0 hover:bg-default-100/40 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-3.5 text-foreground ${
                        col.align === "right" ? "text-right" : "text-left"
                      } ${col.className ?? ""}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
