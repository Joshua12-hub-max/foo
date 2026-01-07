export const AdminLeaveCreditPagination = ({ startIndex, endIndex, total, currentPage, totalPages, onPrevPage, onNextPage }) => {
  if (total === 0) return null;
  return (
    <div className="flex justify-between items-center mt-6">
      <span className="text-sm text-gray-600">
        Showing {startIndex + 1}–{Math.min(endIndex, total)} of {total}
      </span>
      <div className="flex gap-2">
        <button 
          onClick={onPrevPage} 
          disabled={currentPage === 1} 
          className="px-4 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
          aria-label="Previous Page"
        >
          Previous
        </button>
        <button 
          onClick={onNextPage} 
          disabled={currentPage === totalPages} 
          className="px-4 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
          aria-label="Next Page"
        >
          Next
        </button>
      </div>
    </div>
  );
};
