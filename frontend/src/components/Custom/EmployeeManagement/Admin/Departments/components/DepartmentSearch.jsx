

const DepartmentSearch = ({ searchTerm, onSearchChange, totalRecords, onAdd }) => {
  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
            <input
                type="text"
                placeholder="Search by name or head..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg shadow-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all rounded-xl"
            />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 font-medium">
            {totalRecords} total departments
          </span>
        </div>
      </div>
    </div>
  );
};

export default DepartmentSearch;
