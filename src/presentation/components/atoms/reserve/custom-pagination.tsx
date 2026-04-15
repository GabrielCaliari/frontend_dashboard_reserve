import { ArrowLeft, ArrowRight } from "lucide-react";

export const CustomPagination = ({
  currentPage,
  totalPages,
  onChange,
  disabled = false,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}) => {
  const generatePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pages = totalPages > 0 ? generatePages() : [];

  return (
    <div className="flex gap-2">
      <button
        className="px-3 py-2 bg-white border rounded-lg"
        disabled={disabled || currentPage === 1 || totalPages === 0}
        onClick={() => onChange(currentPage - 1)}
      >
        <ArrowLeft size={15} />
      </button>
      {pages.map((page, index) => (
        <button
          key={index}
          className={`px-3 py-2 border rounded-lg ${
            page === currentPage ? "bg-primary text-white" : "bg-white"
          }`}
          disabled={disabled || page === "..." || totalPages === 0}
          onClick={() => typeof page === "number" && onChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        className="px-3 py-2 bg-white border rounded-lg"
        disabled={disabled || currentPage === totalPages || totalPages === 0}
        onClick={() => onChange(currentPage + 1)}
      >
        <ArrowRight size={15} />
      </button>
    </div>
  );
};
