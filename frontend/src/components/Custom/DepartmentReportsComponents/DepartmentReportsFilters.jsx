import { CheckCircle } from 'lucide-react';

/**
 * Filters component for Department Reports
 */
export const DepartmentReportsFilters = ({
  filters,
  handleFilterChange,
  handleApply,
  handleClear,
  isLoading,
  departments = []
}) => {
  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => handleFilterChange('toDate', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
          >
            <option value="all">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Leave">On Leave</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="flex-1 bg-gray-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-md hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <CheckCircle className="w-4 h-4" />
            Apply
          </button>
          <button
            onClick={handleClear}
            disabled={isLoading}
            className="flex-1 bg-gray-200 border border-gray-200 text-gray-800 font-medium px-4 py-2 rounded-lg text-sm shadow-md hover:bg-gray-300 transition-all disabled:opacity-50 active:scale-95"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentReportsFilters;
