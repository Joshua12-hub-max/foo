import React from 'react';
import { EmployeeLeaveFilters } from '../../types';
import Combobox from '@/components/Custom/Combobox';

interface FiltersProps {
  filters: EmployeeLeaveFilters;
  onFilterChange: (field: keyof EmployeeLeaveFilters, value: string) => void;
  onApplyFilters: () => void;
  onClear: () => void;
  onNewRequest: () => void;
  isLoading: boolean;
  hasCredits?: boolean;
}

export const Filters: React.FC<FiltersProps> = ({ 
  filters, 
  onFilterChange, 
  onApplyFilters, 
  onClear, 
  isLoading 
}) => {
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'Vacation Leave', label: 'Vacation Leave' },
    { value: 'Sick Leave', label: 'Sick Leave' },
    { value: 'Emergency Leave', label: 'Emergency Leave' },
    { value: 'Maternity Leave', label: 'Maternity Leave' },
    { value: 'Paternity Leave', label: 'Paternity Leave' },
  ];

  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
        {/* Status Filter */}
        <div className="relative w-full">
          <Combobox
            options={statusOptions}
            value={filters.status}
            onChange={(val) => onFilterChange('status', val)}
            placeholder="All Status"
            className="w-full"
            buttonClassName="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
          />
        </div>

        {/* Type Filter */}
        <div className="relative w-full">
          <Combobox
            options={typeOptions}
            value={filters.type}
            onChange={(val) => onFilterChange('type', val)}
            placeholder="All Types"
            className="w-full"
            buttonClassName="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm"
          />
        </div>

        {/* Date Filter */}
        <div className="relative w-full">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onFilterChange('date', e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer h-[38px]"
          />
        </div>

        {/* Buttons */}
        <div className="md:col-span-2 flex gap-2 w-full lg:col-span-2">
          <button
            onClick={onClear}
            disabled={isLoading}
            className="flex-1 bg-white text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 active:scale-95 border border-gray-200"
          >
             Clear
          </button>
          <button
            onClick={onApplyFilters}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-gray-800 transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap border border-transparent"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
