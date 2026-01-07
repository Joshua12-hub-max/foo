import { Calendar, CheckCircle } from "lucide-react";

const AttendanceFilters = ({ dateRange, onDateRangeChange, onClear, onApply, department, onDepartmentChange, employee, onEmployeeChange,
    showDepartmentFilter = true, showEmployeeFilter = true, isLoading = false, uniqueDepartments = [], uniqueEmployees = []    
}) => {
  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className={`grid grid-cols-1 gap-4 items-center ${showDepartmentFilter || showEmployeeFilter ? 'md:grid-cols-6' : 'md:grid-cols-4'}`}>
        
        {/* Department and Employee Filters removed for Employee View */}

        {/* From Date Filter */}
        <div className="md:col-span-1">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => onDateRangeChange('from', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            aria-label="From date"
          />
        </div>

        {/* To Date Filter */}
        <div className="md:col-span-1">
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => onDateRangeChange('to', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
            aria-label="To date"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 md:col-span-2">
          <button
            onClick={onApply}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all disabled:opacity-50 active:scale-95 border border-gray-200"
            aria-label="Apply filters"
          >
            Apply Filter
          </button>
          <button
            onClick={onClear}
            disabled={isLoading}
            className="flex-1 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all disabled:opacity-50 active:scale-95 border border-gray-200"
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
