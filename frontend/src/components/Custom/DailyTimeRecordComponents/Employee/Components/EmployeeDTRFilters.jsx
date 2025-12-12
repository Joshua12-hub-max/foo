import { Calendar, CheckCircle } from "lucide-react";

export const EmployeeDTRFilters = ({ 
  filters, 
  handleFilterChange, 
  handleApply, 
  handleClear,
  isLoading 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-start bg-[#F8F9FA] p-4 rounded-lg shadow-md">
      {/* From Date Filter */}
      <div className="relative md:col-span-1">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => handleFilterChange("fromDate", e.target.value)}
          disabled={isLoading}
          className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
          aria-label="From date"
        />
      </div>

      {/* To Date Filter */}
      <div className="relative md:col-span-1">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => handleFilterChange("toDate", e.target.value)}
          disabled={isLoading}
          className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
          aria-label="To date"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 md:col-span-2">
        <button
          onClick={handleApply}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-200 border border-gray-200 text-gray-800 font-medium px-3 py-2 rounded-lg shadow-md text-sm transition-all hover:bg-gray-200 active:scale-95"
          aria-label="Apply filters"
        > 
         <CheckCircle className="w-4 h-4" />
          Apply
        </button>
        <button
          onClick={handleClear}
          disabled={isLoading}
          className="flex-1 bg-gray-200 border border-gray-200 text-gray-800 font-medium px-3 py-2 rounded-lg text-sm transition-all hover:bg-gray-200 active:scale-95"
          aria-label="Clear filters"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
