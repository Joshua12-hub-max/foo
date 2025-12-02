import { Calendar } from "lucide-react";

const AttendanceFilters = ({ 
  dateRange, 
  onDateRangeChange, 
  onClear, 
  onApply, 
  isLoading = false
}) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6 items-center bg-[#F8F9FA] p-4 rounded-lg shadow-md">
      {/* From Date Filter */}
      <div className="relative w-full md:w-48">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => onDateRangeChange('from', e.target.value)}
          disabled={isLoading}
          className="w-full pl-10 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="From date"
        />
      </div>

      {/* To Date Filter */}
      <div className="relative w-full md:w-48">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => onDateRangeChange('to', e.target.value)}
          disabled={isLoading}
          className="w-full pl-10 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="To date"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 w-full md:w-auto">
        <button
          onClick={onApply}
          disabled={isLoading}
          className="flex-1 md:flex-none px-6 py-2 bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold rounded-lg text-sm transition-all hover:bg-[#FFFFFF] active:scale-95"
          aria-label="Apply filters"
        >
          Apply
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="flex-1 md:flex-none px-6 py-2 bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold rounded-lg text-sm transition-all hover:bg-[#FFFFFF] active:scale-95"
          aria-label="Clear filters"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default AttendanceFilters;
