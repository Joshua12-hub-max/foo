import React, { memo } from 'react';
import { formatDate, getStatusColor } from './utils/attendanceUtils';
import { STATUS_STYLES } from './constants/attendanceConstants';

interface AttendanceRow {
  employeeId: string;
  employee_name: string;
  department?: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  status: string;
  lateMinutes: number;
  undertimeMinutes: number;
  overtimeMinutes?: number;
  duties?: string;
  notes?: string;
  [key: string]: any;
}

interface AttendanceTableProps {
  data: AttendanceRow[];
  headers: string[];
  isLoading: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    onPageChange: (page: number) => void;
  };
}

const formatTime = (time?: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const AttendanceTable: React.FC<AttendanceTableProps> = memo(({ data, headers, isLoading, pagination }) => {
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
          <p className="text-lg font-medium">No records found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
        </div>
      </div>
    );
  }

  const startIndex = pagination ? (pagination.page - 1) * pagination.limit : 0;
  const endIndex = pagination ? Math.min(startIndex + pagination.limit, pagination.totalItems) : data.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto bg-gray-50 rounded-lg scrollbar-bg-white">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
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
              <tr key={row.id || `${row.employeeId}-${row.date}`} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                
                {/* Status - First Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(row.status || 'Present', STATUS_STYLES)}`}>
                    {row.status || 'Present'}
                  </span>
                </td>

                {/* Employee ID - Separate Column */}
                <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                  {row.employeeId}
                </td>

                {/* Employee Name - Separate Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{row.employee_name}</span>
                    <span className="text-xs text-gray-500">{row.department}</span>
                  </div>
                </td>

                {/* Duties */}
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 whitespace-nowrap">
                    {row.duties || 'No Schedule'}
                  </span>
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {formatDate(row.date)}
                </td>

                {/* Time In */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.timeIn ? formatTime(row.timeIn) : '-'}
                </td>

                {/* Time Out */}
                <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                  {row.timeOut ? formatTime(row.timeOut) : '-'}
                </td>

                {/* Late */}
                <td className="px-6 py-4 text-sm text-red-600 whitespace-nowrap">
                  {row.lateMinutes > 0 ? `${row.lateMinutes} min` : '-'}
                </td>

                {/* Undertime */}
                <td className="px-6 py-4 text-sm text-orange-600 whitespace-nowrap">
                  {row.undertimeMinutes > 0 ? `${row.undertimeMinutes} min` : '-'}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-800">
            Showing <span className="font-semibold text-gray-800">{startIndex + 1}–{endIndex}</span> of <span className="font-semibold text-gray-800">{pagination.totalItems}</span> records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 bg-gray-200 text-gray-800 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
            >
              Previous
            </button>
            <span className="text-sm px-4 py-2 bg-gray-50 text-gray-800 rounded-lg font-semibold">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-6 py-1.5 bg-gray-200 text-gray-800 border border-gray-200 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all text-sm font-medium text-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

AttendanceTable.displayName = 'AttendanceTable';

export default AttendanceTable;
