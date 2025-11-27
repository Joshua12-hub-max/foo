import { Calendar } from 'lucide-react';

const EmployeeAttendanceFilter = ({ 
    filters, 
    handleFilterChange, 
    handleApply, 
    handleClear, 
    statusOptions, 
    isLoading 
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-start bg-[#274b46] p-4 rounded-lg shadow-md">
            {/* Status Filter */}
            <div className="md:col-span-1">
                <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
                    aria-label="Filter by status"
                >
                    <option value="">Status</option>
                    {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
            
            {/* From Date Filter */}
            <div className="relative md:col-span-1">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
                <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
                    aria-label="From date"
                />
            </div>

            {/* To Date Filter */}
            <div className="relative md:col-span-1">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#274b46] pointer-events-none z-10" />
                <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => handleFilterChange("toDate", e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-10 bg-[#F8F9FA] border border-gray-300 rounded-lg shadow-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-200 transition-all disabled:opacity-50"
                    aria-label="To date"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:col-span-2">
                <button
                    onClick={handleApply}
                    disabled={isLoading}
                    className="flex-1 bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Apply filters"
                >
                    Apply
                </button>
                <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className="flex-1 bg-[#F8F9FA] border border-gray-300 text-gray-800 font-semibold px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Clear filters"
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default EmployeeAttendanceFilter;