import { Calendar } from 'lucide-react';

export const NotificationHistoryFilters = ({
  filters,
  handleFilterChange,
  handleApply,
  handleClear,
  isLoading,
  departments,
  employees,
  isAdmin = true
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-start bg-[#F8F9FA] p-4 rounded-lg shadow-md">
      {/* Department Filter */}
      {isAdmin && (
        <div className="md:col-span-1">
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
            aria-label="Filter by department"
          >
            <option value="">Department</option>
            {departments.map((dept) => (
              <option key={dept.id || dept.name} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Employee Filter */}
      {isAdmin && (
        <div className="md:col-span-1">
          <select
            value={filters.employee}
            onChange={(e) => handleFilterChange('employee', e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
            aria-label="Filter by employee"
          >
            <option value="">Employee</option>
            {employees.map((emp) => (
              <option key={emp.employee_id || emp.id} value={emp.employee_id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* From Date Filter */}
      <div className="relative md:col-span-1">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          disabled={isLoading}
          className="w-full pl-10 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="From date"
        />
      </div>

      {/* To Date Filter */}
      <div className="relative md:col-span-1">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          disabled={isLoading}
          className="w-full pl-10 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="To date"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 md:col-span-2">
        <button
          onClick={handleApply}
          disabled={isLoading}
          className="flex-1 bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-3 py-2 rounded-lg text-sm transition-all hover:bg-[#FFFFFF] active:scale-95"
          aria-label="Apply filters"
        >
          Apply
        </button>
        <button
          onClick={handleClear}
          disabled={isLoading}
          className="flex-1 bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-3 py-2 rounded-lg text-sm transition-all hover:bg-[#FFFFFF] active:scale-95"
          aria-label="Clear filters"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
