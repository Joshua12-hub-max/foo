import { formatDate, formatTime, getStatusColor } from '../utils/attendanceUtils';
import { STATUS_STYLES } from '../constants/attendanceConstants';
import { Search } from 'lucide-react';

const AttendanceTable = ({ data, headers, isLoading, pagination }) => {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm font-medium">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <Search className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-lg font-medium">No records found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto bg-gray-50 rounded-lg scrollbar-bg-white">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-[#274b46] text-[#F8F9FA]">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {/* Department */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.department}
                </td>

                {/* Employee ID */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.employee_id}
                </td>

                {/* Employee Name */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.employee_name}
                </td>

                {/* Present */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.present}
                </td>

                {/* Absent */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.absent}
                </td>

                {/* Late */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.late}
                </td>

                {/* WFH */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.wfh}
                </td>

                {/* Undertime */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.undertime}
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {formatDate(row.date)}
                </td>

                {/* Overtime */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.overtime}
                </td>

                {/* On Leave */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.on_leave}
                </td>

                {/* Lunch Break In */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.lunch_break_in}
                </td>

                {/* Lunch Break Out */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.lunch_break_out}
                </td>

                {/* Total Hours */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.total_hours}
                </td>

                {/* Time In */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.time_in}
                </td>

                {/* Time Out */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.time_out}
                </td>

                {/* Total Work */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.total_work}
                </td>

                {/* Daily Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(row.daily_status, STATUS_STYLES)}`}>
                    {row.daily_status}
                  </span>
                </td>

                {/* Notes */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap max-w-xs truncate">
                  {row.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - DTR Style */}
      {pagination && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-800">
            Showing <span className="font-semibold text-gray-800">{pagination.startIndex + 1}–{Math.min(pagination.endIndex, pagination.totalItems)}</span> of <span className="font-semibold text-gray-800">{pagination.totalItems}</span> records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={pagination.prevPage}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
            >
              Previous
            </button>
            <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={pagination.nextPage}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all text-sm font-medium text-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
