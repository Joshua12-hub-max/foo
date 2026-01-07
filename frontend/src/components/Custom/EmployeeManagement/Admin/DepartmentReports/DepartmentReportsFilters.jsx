import { memo } from 'react';
import { CheckCircle } from 'lucide-react';

export const DepartmentReportsFilters = memo(({filters, handleFilterChange, handleApply, handleClear, isLoading, departments = []}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-start bg-[#F8F9FA] p-4 rounded-lg shadow-md">
      {/* Status Filter */}
      <div className="md:col-span-1">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          disabled={isLoading}
          className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
        >
          <option value="all">All Status</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late</option>
          <option value="Leave">On Leave</option>
        </select>
      </div>

      {/* Department Filter */}
      <div className="md:col-span-1">
        <select
          value={filters.department}
          onChange={(e) => handleFilterChange('department', e.target.value)}
          disabled={isLoading}
          className="w-full bg-[#F8F9FA] border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* From Date */}
      <div className="md:col-span-1">
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => handleFilterChange('fromDate', e.target.value)}
          disabled={isLoading}
          className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
          aria-label="From date"
        />
      </div>

      {/* To Date */}
      <div className="md:col-span-1">
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => handleFilterChange('toDate', e.target.value)}
          disabled={isLoading}
          className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
          aria-label="To date"
        />
      </div>

      {/* Action Buttons */}
      <div className="md:col-span-2 flex gap-2">
        <button
          onClick={handleApply}
          disabled={isLoading}
          className="flex-1 bg-[#F8F9FA] border border-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
        >
          <CheckCircle className="w-4 h-4" />
          Apply
        </button>
        <button
          onClick={handleClear}
          disabled={isLoading}
          className="flex-1 bg-[#F8F9FA] border border-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-100 transition-all disabled:opacity-50 active:scale-95"
        >
          Clear
        </button>
      </div>
    </div>
  );
});

DepartmentReportsFilters.displayName = 'DepartmentReportsFilters';

export default DepartmentReportsFilters;
