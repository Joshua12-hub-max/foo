export const AdminUndertimePagination = ({ 
  startIndex, 
  endIndex, 
  totalRecords, 
  currentPage, 
  totalPages,
  handlePrevPage,
  handleNextPage,
  isLoading 
}) => {
  return (
    <div className="flex justify-between items-center mt-6">
      <div className="text-sm text-gray-800">
        Showing <span className="font-semibold text-gray-800">{startIndex + 1}–{Math.min(endIndex, totalRecords)}</span> of <span className="font-semibold text-gray-800">{totalRecords}</span> records
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1 || isLoading}
          className="px-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages || totalPages === 0 || isLoading}
          className="px-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
};
