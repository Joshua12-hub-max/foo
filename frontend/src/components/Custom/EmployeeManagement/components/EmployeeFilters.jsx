import { Search, Filter } from 'lucide-react';

/**
 * Employee Filters Component
 * Search bar and department filter dropdown
 */
const EmployeeFilters = ({
  searchTerm,
  onSearchChange,
  filterDepartment,
  onFilterChange,
  filterOptions
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
      {/* Search Input */}
      <div className="flex-1 relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or ID..." 
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300 transition-all text-sm"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Department Filter */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Filter size={18} className="text-gray-400" />
        <select 
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 outline-none text-sm text-gray-600 w-full focus:border-gray-300"
          value={filterDepartment}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {filterOptions.map(dept => (
            <option key={dept} value={dept}>
              {dept === 'All' ? 'All Departments' : dept}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default EmployeeFilters;
