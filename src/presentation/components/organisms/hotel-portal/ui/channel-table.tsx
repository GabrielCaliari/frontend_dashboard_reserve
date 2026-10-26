"use client";

export interface ChannelColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Renderiza a célula. Recebe a linha inteira. */
  cell: (row: T) => React.ReactNode;
  className?: string;
}

/**
 * Tabela de canais/campanhas do painel: cabecalho em caixa normal, numeros
 * alinhados a direita e tabulares. Scroll horizontal so quando nao cabe.
 */
export function ChannelTable<T>({
  columns,
  rows,
  getRowKey,
  footer,
}: {
  columns: ChannelColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  /** Linha de totais, opcional. */
  footer?: React.ReactNode[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-default-50">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-[13px] font-medium text-muted-foreground ${
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
                className="border-b border-border/50 transition-colors last:border-0 hover:bg-default-100/50"
              >
                {columns.map((col, c) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${c === 0 ? "font-medium text-foreground" : "text-foreground/85"} ${
                      col.align === "right" ? "text-right tabular-nums" : "text-left"
                    } ${col.className ?? ""}`}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t border-border/80 bg-default-100/40">
                {footer.map((cell, c) => (
                  <td
                    key={columns[c]?.key ?? c}
                    className={`px-4 py-3 font-semibold text-foreground ${
                      columns[c]?.align === "right" ? "text-right tabular-nums" : "text-left"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
