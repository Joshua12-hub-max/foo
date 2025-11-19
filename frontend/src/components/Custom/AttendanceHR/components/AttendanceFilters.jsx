import { Calendar } from "lucide-react"; //Icons lang to! dont worry Remember always


const AttendanceFilters = ({
   filters, handleFilterChange, handleApply, handleClear, uniqueDepartments, uniqueEmployees, isLoading,}) => {
   return ( <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-start bg-white p-4 rounded-lg shadow-md">
            
            {/* Department */}
            <div className="flex flex-col gap-2 md:col-span-1">
                <select
                value={filters.department}
                onChange={(e) => handleFilterChange("department", e.target.value)}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                aria-label="Filter by department"
                >
                <option value="">Department</option>
                {uniqueDepartments.map((dept) => (
                    <option key={`dept-${dept}`} value={dept}>{dept}</option>
                ))}
                </select>
            </div>

            {/* Employee */}
            <select
                value={filters.employee}
                onChange={(e) => handleFilterChange("employee", e.target.value)}
                disabled={isLoading}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm md:col-span-1"
                aria-label="Filter by employee"
            >
                <option value="">Employee</option>
                {uniqueEmployees.map((emp) => (
                <option key={`emp-${emp}`} value={emp}>{emp}</option>
                ))}
            </select>

            {/* From Date */}
            <div className="relative md:col-span-1">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                aria-label="From date"
                />
            </div>

            {/* To Date */}
            <div className="relative md:col-span-1">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                aria-label="To date"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:col-span-2">
                <button
                onClick={handleApply}
                disabled={isLoading}
                className="flex-1 bg-[#F2F2F2] border border-gray-300 text-gray-800 font-semibold px-3 py-2 rounded-lg shadow-md text-sm transition-all hover:bg-[#FFFFFF] active:scale-95"
                >
                Apply
                </button>
                <button
                onClick={handleClear}
                disabled={isLoading}
                className="flex-1 bg-[#F2F2F2] border border-gray-300 text-gray-800 font-semibold px-3 py-2 rounded-lg shadow-md text-sm transition-all hover:bg-[#FFFFFF] active:scale-95 "
                >
                Clear
                </button>
            </div>
            </div>
        );
    };

export default AttendanceFilters;
