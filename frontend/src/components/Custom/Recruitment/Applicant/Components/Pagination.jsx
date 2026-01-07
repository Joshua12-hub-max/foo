const Pagination = ({ 
  currentPage, 
  itemsPerPage, 
  totalItems, 
  onPageChange 
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex justify-between items-center mt-6">
      <div className="text-sm text-gray-800">
        Showing <span className="font-semibold">{startIndex + 1}–{endIndex}</span> of <span className="font-semibold">{totalItems}</span>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))} 
          disabled={currentPage === 1} 
          className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Previous
        </button>
        <button 
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} 
          disabled={currentPage === totalPages} 
          className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
