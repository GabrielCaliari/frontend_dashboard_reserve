"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  isLoading?: boolean;
  onChange: (page: number) => void;
}

/** Paginas a mostrar: primeira, ultima, a atual e uma de cada lado; "…" no vao. */
function pagesToShow(page: number, last: number): (number | "…")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const set = new Set([1, last, page - 1, page, page + 1].filter((p) => p >= 1 && p <= last));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

/**
 * Rodape paginado das listas do painel: "21–40 de 132" e as paginas. Substitui
 * o "carregar mais", que deixava a pagina crescer sem fim.
 */
export function Pagination({ page, pageSize, total, isLoading = false, onChange }: PaginationProps) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const btn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40";

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 pt-3 text-sm text-muted-foreground"
    >
      <span className="tabular-nums">
        {total === 0 ? "Nenhum item" : `${first}–${end} de ${total}`}
      </span>
      {last > 1 && (
        <div className="flex items-center gap-1">
          <button
            aria-label="Página anterior"
            className={`${btn} hover:bg-default-100`}
            disabled={page <= 1 || isLoading}
            type="button"
            onClick={() => onChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pagesToShow(page, last).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1">
                …
              </span>
            ) : (
              <button
                key={p}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Página ${p}`}
                className={`${btn} ${
                  p === page ? "bg-foreground font-semibold text-background" : "hover:bg-default-100"
                }`}
                disabled={isLoading}
                type="button"
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            ),
          )}
          <button
            aria-label="Próxima página"
            className={`${btn} hover:bg-default-100`}
            disabled={page >= last || isLoading}
            type="button"
            onClick={() => onChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  );
}
