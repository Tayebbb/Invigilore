import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Logic to show a limited number of pages if there are many
  const visiblePages = pages.filter(p => {
    if (totalPages <= 7) return true;
    if (p === 1 || p === totalPages) return true;
    if (p >= currentPage - 1 && p <= currentPage + 1) return true;
    return false;
  });

  const renderPageButtons = () => {
    const buttons: React.ReactNode[] = [];
    let lastPage = 0;

    visiblePages.forEach((p) => {
      if (lastPage !== 0 && p - lastPage > 1) {
        buttons.push(
          <span key={`dots-${p}`} className="px-2 text-gray-500">...</span>
        );
      }
      
      buttons.push(
        <button
          key={p}
          onClick={() => onPageChange(p)}
          disabled={isLoading}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
            currentPage === p
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
          } disabled:opacity-50`}
        >
          {p}
        </button>
      );
      lastPage = p;
    });

    return buttons;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || isLoading}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-all disabled:opacity-30"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2">
        {renderPageButtons()}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || isLoading}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-all disabled:opacity-30"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
