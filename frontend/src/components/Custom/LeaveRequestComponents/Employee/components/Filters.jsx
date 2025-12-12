import { Calendar, Plus, Filter, CheckCircle } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

export const Filters = ({filters, onFilterChange, onApplyFilters, onClear, onNewRequest, isLoading}) => {
  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
        {/* Status Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            aria-label="Status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div className="relative">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => onFilterChange('fromDate', e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            aria-label="From Date"
          />
        </div>

        {/* To Date */}
        <div className="relative">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => onFilterChange('toDate', e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            aria-label="To Date"
          />
        </div>

        {/* Apply Filter */}
        <button
          onClick={onApplyFilters}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-md hover:bg-gray-300 transition-all disabled:opacity-50"
          aria-label="Apply Filter"
       >
          <CheckCircle className="w-4 h-4" />
          Apply Filter
        </button>

        {/* Clear */}
        <button
          onClick={onClear}
          disabled={isLoading}
          className="bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-md hover:bg-gray-300 transition-all disabled:opacity-50"
          aria-label="Clear Filters"
        >
          Clear Filters
        </button>

        {/* New Request - NO credit restriction */}
        <button
          onClick={onNewRequest}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium shadow-md transition-all bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          aria-label="New Request"
       >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>
    </div>
  );
};

export default Filters;
