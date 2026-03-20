import React from 'react';
import { Plus } from 'lucide-react';
import { EmployeeLeaveFilters } from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/types';
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
  onNewRequest, 
  isLoading 
}) => {
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'Vacation Leave', label: 'Vacation Leave' },
    { value: 'Sick Leave', label: 'Sick Leave' },
    { value: 'Emergency Leave', label: 'Emergency Leave' },
    { value: 'Maternity Leave', label: 'Maternity Leave' },
    { value: 'Paternity Leave', label: 'Paternity Leave' }
  ];

  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Status Filter */}
        <div className="z-30">
          <Combobox
            options={statusOptions}
            value={filters.status}
            onChange={(val) => onFilterChange('status', val)}
            placeholder="All Status"
            buttonClassName="bg-white border-gray-200"
          />
        </div>

        {/* Type Filter */}
        <div className="z-20">
          <Combobox
            options={typeOptions}
            value={filters.type}
            onChange={(val) => onFilterChange('type', val)}
            placeholder="All Types"
            buttonClassName="bg-white border-gray-200"
          />
        </div>

        {/* Date Filter */}
        <div className="relative w-full">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onFilterChange('date', e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="md:col-span-2 flex gap-2 w-full">
          <button
            onClick={onApplyFilters}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#E9ECEF] transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap border border-gray-200"
          >
            Apply
          </button>
          <button
            onClick={onClear}
            disabled={isLoading}
            className="flex-1 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#E9ECEF] transition-all disabled:opacity-50 active:scale-95 border border-gray-200"
          >
             Clear
          </button>
          <button
            onClick={onNewRequest}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium shadow-md transition-all bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 whitespace-nowrap"
            aria-label="New Request"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
