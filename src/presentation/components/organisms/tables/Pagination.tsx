// Interface para as props de paginação
interface PaginationProps {
  currentPage?: number;
  totalPages?: number;
  showing: { start: number; end: number };
  totalResults: number;
  onPageChange?: (page: number) => void;
}
import { useTranslations } from "next-intl";

// Componente de Paginação
export function Pagination({
  currentPage = 1,
  totalPages = 10,
  showing,
  totalResults,
  onPageChange,
}: PaginationProps) {
  const t = useTranslations("pagination");
  const handlePageChange = (page: number) => {
    if (onPageChange && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Gera os números de página para exibição (máximo de 5)
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex justify-between items-center mt-4">
      <div>
        <span className="text-sm text-muted-foreground">
          {t("showing", {
            start: showing.start,
            end: showing.end,
            total: totalResults,
          })}
        </span>
      </div>

      <div className="flex space-x-2">
        <button
          className="px-3 py-1 border border-border rounded text-sm text-foreground hover:bg-default-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          {t("previous")}
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            className={`px-3 py-1 border rounded text-sm transition-colors ${
              currentPage === page
                ? "bg-accent text-accent-foreground border-accent"
                : "border-border text-muted-foreground hover:bg-accent/50"
            }`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}

        <button
          className="px-3 py-1 border border-border rounded text-sm text-foreground hover:bg-default-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
}
