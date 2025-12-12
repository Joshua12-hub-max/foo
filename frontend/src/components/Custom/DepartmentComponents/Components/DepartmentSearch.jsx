import { Search, Plus } from 'lucide-react';

export const DepartmentSearch = ({ searchTerm, onSearchChange, totalRecords, onAdd }) => {
  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
                type="text"
                placeholder="Search by name or head..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">
            Showing {totalRecords} departments
          </span>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-sm hover:bg-gray-300 transition-all active:scale-95 text-sm font-medium"
          >
            <Plus size={16} />
            <span>Add Department</span>
          </button>
        </div>
      </div>
    </div>
  );
};
