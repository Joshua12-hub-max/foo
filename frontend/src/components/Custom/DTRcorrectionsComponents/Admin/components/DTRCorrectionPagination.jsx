export const Pagination = ({currentPage, totalPages, startIndex, endIndex, totalRecords, onPageChange}) => {
  return (
    <div className="flex justify-between items-center mt-6">
      <div className="text-sm text-gray-800">
        Showing <span className="font-semibold text-gray-800">{startIndex + 1}–{Math.min(endIndex, totalRecords)}</span> of <span className="font-semibold text-gray-800">{totalRecords}</span> records
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
        >
          Previous
        </button>
        <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-6 py-2 bg-gray-200 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  );
};