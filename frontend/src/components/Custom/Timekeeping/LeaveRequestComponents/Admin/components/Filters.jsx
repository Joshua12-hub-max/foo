const Filters = ({ filters, departments, uniqueEmployees, onFilterChange, onApply, onClear }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-center bg-[#F8F9FA] p-4 rounded-lg shadow-md">
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
            <option value="">Leave Type</option>
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

        {/* Department Filter */}
         <div className="relative w-full">
          <select
            value={filters.department}
            onChange={(e) => onFilterChange('department', e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Departments</option>
             {departments.map((dept) => (
              <option key={dept.department_id || dept.id} value={dept.department_name}>
                {dept.department_name}
              </option>
            ))}
          </select>
           <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 md:col-span-2">
          <button
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all active:scale-95 whitespace-nowrap border border-gray-200"
          >
            Apply Filter
          </button>
          <button
            onClick={onClear}
            className="flex-1 bg-[#F8F9FA] text-gray-700 font-medium px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-[#F8F9FA] transition-all active:scale-95 border border-gray-200"
          >
             Clear
          </button>
        </div>
    </div>
  );
};

export default Filters;
