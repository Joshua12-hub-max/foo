import React from 'react';
import { Plus } from 'lucide-react';
import { EmployeeLeaveFilters } from '../../types';

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
  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Status Filter */}
        <div className="relative w-full">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Type Filter */}
        <div className="relative w-full">
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="Vacation Leave">Vacation Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Emergency Leave">Emergency Leave</option>
            <option value="Maternity Leave">Maternity Leave</option>
            <option value="Paternity Leave">Paternity Leave</option>
          </select>
           <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
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
