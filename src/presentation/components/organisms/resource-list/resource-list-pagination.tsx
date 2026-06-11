"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ResourceListPaginationProps {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  labels?: {
    navigation: string;
    previous: string;
    next: string;
    range: (from: number, to: number, total: number) => string;
    page: (current: number, total: number) => string;
  };
}

export function ResourceListPagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  labels,
}: ResourceListPaginationProps) {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(totalPages, Math.max(1, page));

  useEffect(() => {
    if (page !== currentPage) onPageChange(currentPage);
  }, [currentPage, onPageChange, page]);
  if (totalItems === 0) return null;
  const from = (currentPage - 1) * safePageSize + 1;
  const to = Math.min(currentPage * safePageSize, totalItems);

  return (
    <nav
      aria-label={labels?.navigation ?? "Paginação"}
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">
        {labels?.range(from, to, totalItems) ?? `${from}–${to} de ${totalItems}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          aria-label={labels?.previous ?? "Página anterior"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-default-100 text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage <= 1}
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center text-sm text-muted-foreground">
          {labels?.page(currentPage, totalPages) ?? `${currentPage} / ${totalPages}`}
        </span>
        <button
          aria-label={labels?.next ?? "Próxima página"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-default-100 text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage >= totalPages}
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
