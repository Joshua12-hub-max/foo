import { Calendar, CheckCircle, Filter, Plus } from "lucide-react";

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

export const EmployeeUndertimeFilters = ({  filters,  handleFilterChange,  handleApply,  handleClear, onNewRequest, isLoading
}) => {
  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
        {/* Status Filter */}
        <div className="relative w-full">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* From Date Filter */}
        <div className="relative w-full">
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            aria-label="From date"
          />
        </div>

        {/* To Date Filter */}
        <div className="relative w-full">
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            aria-label="To date"
          />
        </div>

        {/* Apply Filter Button */}
        <button
          onClick={handleApply}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-[#F8F9FA] text-gray-700 font-medium px-6 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-300 transition-all disabled:opacity-50 active:scale-95 border border-gray-200"
          aria-label="Apply filters"
        >
          Apply Filter
        </button>

        {/* Clear Button */}
        <button
          onClick={handleClear}
          disabled={isLoading}
          className="bg-[#F8F9FA] text-gray-700 font-medium px-6 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-300 transition-all disabled:opacity-50 active:scale-95 border border-gray-200"
          aria-label="Clear filters"
        >
          Clear
        </button>

        {/* New Request Button */}
        <button
          onClick={onNewRequest}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-300 transition-all disabled:opacity-50 active:scale-95"
          aria-label="New request"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>
    </div>
  );
};

