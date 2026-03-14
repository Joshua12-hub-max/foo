import React, { useMemo } from 'react';
import Combobox from '@/components/Custom/Combobox';

interface FiltersState {
  department: string;
  employee: string;
  status: string;
  [key: string]: unknown;
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
  const departmentOptions = useMemo(() => 
    uniqueDepartments.map(dept => ({ value: dept, label: dept })),
    [uniqueDepartments]
  );

  const employeeOptions = useMemo(() => 
    uniqueEmployees.map(emp => ({ value: emp, label: emp })),
    [uniqueEmployees]
  );

  const statusOptions = [
    { value: 'All Status', label: 'All Status' },
    { value: 'Not Started', label: 'Not Started' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Acknowledged', label: 'Acknowledged' },
    { value: 'Finalized', label: 'Finalized' },
    { value: 'Overdue', label: 'Overdue' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-start bg-[#F8F9FA] p-4 rounded-lg shadow-md border border-gray-100">
      {/* Department Filter */}
      <div className="md:col-span-1">
        <Combobox
          options={departmentOptions}
          value={filters.department}
          onChange={(val) => handleFilterChange("department", val)}
          placeholder="Department"
          disabled={isLoading}
          className="w-full"
          buttonClassName="bg-white border-gray-300 shadow-sm"
        />
      </div>

      {/* Employee Filter */}
      <div className="md:col-span-1">
        <Combobox
          options={employeeOptions}
          value={filters.employee}
          onChange={(val) => handleFilterChange("employee", val)}
          placeholder="Employee"
          disabled={isLoading}
          className="w-full"
          buttonClassName="bg-white border-gray-300 shadow-sm"
        />
      </div>

       {/* Status Filter */}
       <div className="md:col-span-1">
        <Combobox
          options={statusOptions}
          value={filters.status || 'All Status'}
          onChange={(val) => handleFilterChange("status", val)}
          placeholder="Status"
          disabled={isLoading}
          className="w-full"
          buttonClassName="bg-white border-gray-300 shadow-sm"
        />
      </div>

        {/* Action Buttons */}
        <div className="flex gap-2 md:col-span-2">
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white font-bold px-4 py-2.5 rounded-lg text-xs shadow-md shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
            aria-label="Apply filters"
          >
            Apply Filter
          </button>
          
          <button
            onClick={handleClear}
            disabled={isLoading}
            className="flex-1 bg-white text-gray-700 font-bold px-4 py-2.5 rounded-lg text-xs shadow-sm hover:bg-gray-50 transition-all active:scale-95 border border-gray-200 disabled:opacity-50"
            aria-label="Clear filters"
          >
            Clear
          </button>
        </div>
    </div>
  );
};
