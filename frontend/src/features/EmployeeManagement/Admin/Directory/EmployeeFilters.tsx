import React from 'react';
import { Search } from 'lucide-react';

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
          <select 
            className="bg-white border border-gray-300 rounded-xl shadow-sm px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={filterDepartment}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            {filterOptions.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>

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
