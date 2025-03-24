// Interface para as props de paginação
interface PaginationProps {
    currentPage?: number;
    totalPages?: number;
    showing: { start: number; end: number };
    totalResults: number;
    onPageChange?: (page: number) => void;
}

// Componente de Paginação
export function Pagination({ 
    currentPage = 1, 
    totalPages = 10, 
    showing, 
    totalResults,
    onPageChange 
}: PaginationProps) {
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
                <span className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{showing.start}</span> a <span className="font-medium">{showing.end}</span> de <span className="font-medium">{totalResults}</span> resultados
                </span>
            </div>

            <div className="flex space-x-2">
                <button 
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Anterior
                </button>
                
                {getPageNumbers().map(page => (
                    <button 
                        key={page}
                        className={`px-3 py-1 border rounded text-sm ${
                            currentPage === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handlePageChange(page)}
                    >
                        {page}
                    </button>
                ))}
                
                <button 
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Próximo
                </button>
            </div>
        </div>
    );
} 