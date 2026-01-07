import { Calendar, CheckCircle } from "lucide-react";

export const AdvancedFilters = ({filters, uniqueDepartments, uniqueEmployees, onFilterChange, onApply, onClear, isLoading}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-start bg-[#F8F9FA] p-4 rounded-lg shadow-md">
      {/* Department Filter */}
      <div className="md:col-span-1">
        <select
          value={filters.department}
          onChange={(e) => onFilterChange("department", e.target.value)}
          disabled={isLoading}
          className="w-full bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50 cursor-pointer"
          aria-label="Filter by department"
        >
          <option value="">Department</option>
          {uniqueDepartments.map((dept, index) => (
            <option key={dept + index} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Employee Filter */}
      <div className="md:col-span-1">
        <select
          value={filters.employee}
          onChange={(e) => onFilterChange("employee", e.target.value)}
          disabled={isLoading}
          className="w-full bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50 cursor-pointer"
          aria-label="Filter by employee"
        >
          <option value="">Employee</option>
          {uniqueEmployees.map((emp, index) => (
            <option key={emp + index} value={emp}>{emp}</option>
          ))}
        </select>
      </div>

      {/* From Date Filter */}
      <div className="relative md:col-span-1">
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => onFilterChange("fromDate", e.target.value)}
          disabled={isLoading}
          className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
          aria-label="From date"
        />
      </div>

      {/* To Date Filter */}
      <div className="relative md:col-span-1">
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => onFilterChange("toDate", e.target.value)}
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
          className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FA] border border-gray-200 text-gray-700 font-medium px-6 py-2 rounded-lg shadow-sm text-sm transition-all hover:bg-[#F8F9FA] active:scale-95 whitespace-nowrap"
          aria-label="Apply filters"
        >
          Apply
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="flex-1 bg-[#F8F9FA] border border-gray-200 text-gray-700 font-medium px-6 py-2 rounded-lg shadow-sm text-sm transition-all hover:bg-[#F8F9FA] active:scale-95"
          aria-label="Clear filters"
        >
          Clear
        </button>
      </div>
    </div>
  );
};