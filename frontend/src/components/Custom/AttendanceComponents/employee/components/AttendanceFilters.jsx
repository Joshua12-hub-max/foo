import { Calendar, Filter, CheckCircle } from 'lucide-react';

const AttendanceFilters = ({ dateRange, onDateRangeChange, status, onStatusChange, onClear, onApply, isLoading }) => {
  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Status Filter */}
        <div className="relative w-full">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Leave">Leave</option>
            <option value="Undertime">Undertime</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* From Date Filter */}
        <div className="relative w-full">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => onDateRangeChange('from', e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50"
            aria-label="From date"
          />
        </div>

        {/* To Date Filter */}
        <div className="relative w-full">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => onDateRangeChange('to', e.target.value)}
            disabled={isLoading}
            className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50"
            aria-label="To date"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 md:col-span-2">
          <button
            onClick={onApply}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-300 transition-all disabled:opacity-50 active:scale-95"
            aria-label="Apply filters"
          >
            <CheckCircle className="w-4 h-4" />
            Apply Filter
          </button>
          <button
            onClick={onClear}
            disabled={isLoading}
            className="flex-1 bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-300 transition-all disabled:opacity-50 active:scale-95"
            aria-label="Clear filters"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceFilters;
