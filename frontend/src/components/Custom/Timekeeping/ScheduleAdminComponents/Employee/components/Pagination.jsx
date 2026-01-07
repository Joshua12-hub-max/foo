const Pagination = ({ currentPage, totalPages, totalRecords, pageSize, isLoading, onPageChange }) => {
  const startRecord = ((currentPage - 1) * pageSize) + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex justify-between items-center mt-6">
      <div className="text-sm text-gray-800">
        Showing <span className="font-semibold text-gray-800">{startRecord}–{endRecord}</span> of <span className="font-semibold text-gray-800">{totalRecords}</span> records
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange("prev")}
          disabled={currentPage === 1 || isLoading}
          className="px-4 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange("next")}
          disabled={currentPage === totalPages || isLoading}
          className="px-6 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
