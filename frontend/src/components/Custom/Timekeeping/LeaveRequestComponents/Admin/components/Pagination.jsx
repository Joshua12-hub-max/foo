const Pagination = ({ currentPage, totalPages, startIndex, endIndex, totalItems, onPrevPage, onNextPage }) => {
  if (totalItems === 0) return null;
  return (
    <div className="flex justify-between items-center mt-6">
      <div className="text-sm text-gray-800">
        Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onPrevPage}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
        >
          Previous
        </button>
        <span className="text-sm px-4 py-2 bg-gray-50 rounded-lg font-semibold">
          Page {currentPage}
        </span>
        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className="px-6 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
