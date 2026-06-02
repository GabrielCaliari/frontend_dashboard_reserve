"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";

interface EntityListPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange(page: number): void;
}

export function EntityListPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: EntityListPaginationProps) {
  if (totalItems === 0) return null;

  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const from = (currentPage - 1) * safePageSize + 1;
  const to = Math.min(currentPage * safePageSize, totalItems);

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">{`${from}–${to} de ${totalItems}`}</p>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Página anterior"
          className="min-h-11 min-w-11"
          disabled={currentPage <= 1}
          size="icon"
          type="button"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </Button>
        <span className="min-w-16 text-center text-sm text-muted-foreground">
          {`${currentPage} / ${totalPages}`}
        </span>
        <Button
          aria-label="Próxima página"
          className="min-h-11 min-w-11"
          disabled={currentPage >= totalPages}
          size="icon"
          type="button"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
