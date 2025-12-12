import { Calendar, CheckCircle, Building, User } from 'lucide-react';

const Filters = ({ filters, departments, uniqueEmployees, onFilterChange, onApply, onClear }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-center bg-[#F8F9FA] p-4 rounded-lg shadow-md">
      {/* Department Filter */}
      <div className="relative md:col-span-1">
        <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <select
          value={filters.department}
          onChange={(e) => onFilterChange('department', e.target.value)}
          className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
          aria-label="Department"
        >
          <option value="">Department</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Employee Filter */}
      <div className="relative md:col-span-1">
        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <select
          value={filters.employee}
          onChange={(e) => onFilterChange('employee', e.target.value)}
          className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50 appearance-none cursor-pointer"
          aria-label="Employee"
        >
          <option value="">Employee</option>
          {uniqueEmployees.map((emp) => (
            <option key={emp} value={emp}>{emp}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* From Date Filter */}
      <div className="relative md:col-span-1">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => onFilterChange('fromDate', e.target.value)}
          className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50"
          aria-label="From Date"
        />
      </div>

      {/* To Date Filter */}
      <div className="relative md:col-span-1">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => onFilterChange('toDate', e.target.value)}
          className="w-full pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all disabled:opacity-50"
          aria-label="To Date"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 md:col-span-2">
        <button
          onClick={onApply}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 font-medium px-3 py-2 rounded-lg text-sm hover:bg-gray-300 transition-all shadow-md"
          aria-label="Apply Filter"
        >
          <CheckCircle className="w-4 h-4" />
          Apply Filter
        </button>
        <button
          onClick={onClear}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 font-medium px-3 py-2 rounded-lg text-sm hover:bg-gray-300 transition-all shadow-md"
          aria-label="Clear Filter"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default Filters;
