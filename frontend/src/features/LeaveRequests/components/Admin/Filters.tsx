import React from 'react';
import { LeaveFilters } from '../../types';
import Combobox from '@/components/Custom/Combobox';

interface FiltersProps {
  filters: LeaveFilters;
  departments: string[];
  uniqueEmployees: string[];
  onFilterChange: (field: keyof LeaveFilters, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

const Filters: React.FC<FiltersProps> = ({ 
  filters, 
  departments, 
  uniqueEmployees, 
  onFilterChange, 
  onApply, 
  onClear 
}) => {
  const departmentOptions = [
    { value: '', label: 'Department' },
    ...departments.map(dept => ({ value: dept, label: dept }))
  ];

  const employeeOptions = [
    { value: '', label: 'Employee' },
    ...Array.from(new Set(uniqueEmployees)).map(emp => ({ value: emp, label: emp }))
  ];

  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
        {/* Department Filter */}
        <div className="w-full">
          <Combobox
            options={departmentOptions}
            value={filters.department}
            onChange={(val) => onFilterChange('department', val)}
            placeholder="Department"
            className="w-full"
            buttonClassName="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
          />
        </div>

        {/* Employee Filter */}
        <div className="w-full">
          <Combobox
            options={employeeOptions}
            value={filters.employee}
            onChange={(val) => onFilterChange('employee', val)}
            placeholder="Employee"
            className="w-full"
            buttonClassName="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
          />
        </div>

        {/* From Date Filter */}
        <div className="w-full">
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => onFilterChange('fromDate', e.target.value)}
            className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer h-[38px]"
          />
        </div>

        {/* To Date Filter */}
        <div className="w-full">
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => onFilterChange('toDate', e.target.value)}
            className="w-full px-3 bg-white border border-gray-200 rounded-lg shadow-sm py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer h-[38px]"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 md:col-span-2 lg:col-span-1 w-full">
          <button
            onClick={onClear}
            className="flex-1 bg-white text-gray-700 font-medium py-2 rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-all active:scale-95 border border-gray-200"
          >
             Clear
          </button>
          <button
            onClick={onApply}
            className="flex-1 bg-gray-900 text-white font-medium py-2 rounded-lg text-sm shadow-sm hover:bg-gray-800 transition-all active:scale-95 border border-transparent"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
