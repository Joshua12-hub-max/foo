import React from 'react';
import { Search } from 'lucide-react';
import Combobox from '@/components/Custom/Combobox';

interface EmployeeFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterDepartment: string;
  onFilterChange: (value: string) => void;
  filterOptions: string[];
  totalRecords?: number;
}

const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterDepartment,
  onFilterChange,
  filterOptions,
  totalRecords
}) => {
  const options = filterOptions.map(dept => ({
    value: dept,
    label: dept === 'All' ? 'All Departments' : dept
  }));

  return (
    <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Right Side: Filter + Count */}
        <div className="flex items-center gap-4">
          <Combobox 
            options={options}
            value={filterDepartment}
            onChange={(val) => onFilterChange(val)}
            placeholder="All Departments"
            className="w-56 z-50"
            buttonClassName="bg-white border-gray-300 rounded-xl"
          />

          {totalRecords !== undefined && (
            <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
              {totalRecords} total employees
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeFilters;
