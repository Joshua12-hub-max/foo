import { Calendar } from "lucide-react";

const AttendanceFilters = ({ 
  dateRange, 
  onDateRangeChange, 
  onClear, 
  onApply, 
  department, 
  onDepartmentChange, 
  employee, 
  onEmployeeChange, 
  showDepartmentFilter = true, 
  showEmployeeFilter = true, 
  isLoading = false,
  uniqueDepartments = [], 
  uniqueEmployees = []    
}) => {
  return (
    <div className="flex flex-wrap gap-6 mb-5 items-center bg-[#F8F9FA] p-4 rounded-lg shadow-md">
      {/* Department Filter */}
      {showDepartmentFilter && (
        <div className="w-full md:w-48">
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
            aria-label="Filter by department"
          >
            <option value="">Department</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
             {!uniqueDepartments.length && (
                <>
                  {/* Fallback options */}
                </>
             )}
          </select>
        </div>
      )}

      {/* Employee Filter */}
      {showEmployeeFilter && (
        <div className="w-full md:w-48">
          <select
            value={employee}
            onChange={(e) => onEmployeeChange(e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
            aria-label="Filter by employee"
          >
            <option value="">Employee</option>
            {uniqueEmployees.map((emp) => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
             {!uniqueEmployees.length && (
                <>
                  <option value="EMP-1001">Employee 1</option>
                  <option value="EMP-1002">Employee 2</option>
                </>
             )}
          </select>
        </div>
      )}

      {/* From Date Filter */}
      <div className="relative w-full md:w-48">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => onDateRangeChange('from', e.target.value)}
          disabled={isLoading}
          className="w-full pl-10 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="From date"
        />
      </div>

      {/* To Date Filter */}
      <div className="relative w-full md:w-48">
        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => onDateRangeChange('to', e.target.value)}
          disabled={isLoading}
          className="w-full pl-10 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
          aria-label="To date"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 w-full md:w-auto">
        <button
          onClick={onApply}
          disabled={isLoading}
          className="flex-1 md:flex-none px-6 py-2 bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold rounded-lg text-sm transition-all hover:bg-[#FFFFFF] active:scale-95"
          aria-label="Apply filters"
        >
          Apply
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="flex-1 md:flex-none px-6 py-2 bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold rounded-lg text-sm transition-all hover:bg-[#FFFFFF] active:scale-95"
          aria-label="Clear filters"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default AttendanceFilters;
