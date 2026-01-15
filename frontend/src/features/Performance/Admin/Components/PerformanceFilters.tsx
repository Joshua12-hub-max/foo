import React from 'react';

interface FiltersState {
  department: string;
  employee: string;
  status: string;
  [key: string]: any;
}

interface PerformanceFiltersProps {
  filters: FiltersState;
  handleFilterChange: (key: string, value: string) => void;
  handleApply: () => void;
  handleClear: () => void;
  isLoading: boolean;
  uniqueDepartments: string[];
  uniqueEmployees: string[];
}

export const PerformanceFilters: React.FC<PerformanceFiltersProps> = ({ 
  filters, 
  handleFilterChange, 
  handleApply, 
  handleClear, 
  isLoading, 
  uniqueDepartments, 
  uniqueEmployees 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-start bg-[#F8F9FA] p-4 rounded-lg shadow-md">
      {/* Department Filter */}
      <div className="md:col-span-1">
        <select
          value={filters.department}
          onChange={(e) => handleFilterChange("department", e.target.value)}
          disabled={isLoading}
          className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="Filter by department"
        >
          <option value="">Department</option>
          {uniqueDepartments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Employee Filter */}
      <div className="md:col-span-1">
        <select
          value={filters.employee}
          onChange={(e) => handleFilterChange("employee", e.target.value)}
          disabled={isLoading}
          className="w-full bg-[#F8F9FA] border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
          aria-label="Filter by employee"
        >
          <option value="">Employee</option>
          {uniqueEmployees.map((emp) => (
            <option key={emp} value={emp}>{emp}</option>
          ))}
        </select>
      </div>

       {/* Status Filter - Unique to Performance */}
       <div className="md:col-span-1">
        <select
          value={filters.status || 'All Status'}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          disabled={isLoading}
          className="w-full bg-[#F8F9FA] border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
          aria-label="Filter by status"
        >
            <option value="All Status">All Status</option>
            <option value="Not Started">Not Started</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Finalized">Finalized</option>
            <option value="Overdue">Overdue</option>
        </select>
      </div>

        {/* Action Buttons */}
        <div className="flex gap-2 md:col-span-2">
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all active:scale-95 border border-gray-200 disabled:opacity-50"
            aria-label="Apply filters"
          >
            Apply Filter
          </button>
          
          <button
            onClick={handleClear}
            disabled={isLoading}
            className="flex-1 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all active:scale-95 border border-gray-200 disabled:opacity-50"
            aria-label="Clear filters"
          >
            Clear
          </button>
        </div>
    </div>
  );
};
