import { memo } from 'react';
import { Building2, Users, Clock, Eye } from 'lucide-react';

/**
 * Summary table component for Department Reports
 * Shows aggregated attendance stats per department
 */
export const DepartmentReportsSummaryTable = memo(({
  data,
  isLoading,
  onDepartmentClick,
  meta
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm font-medium">Loading department reports...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Building2 className="w-12 h-12 opacity-50" />
          <p className="text-sm font-medium">No department data found for the selected period</p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totals = data.reduce((acc, dept) => ({
    totalEmployees: acc.totalEmployees + dept.totalEmployees,
    presentDays: acc.presentDays + dept.presentDays,
    absentDays: acc.absentDays + dept.absentDays,
    lateDays: acc.lateDays + dept.lateDays,
    leaveDays: acc.leaveDays + dept.leaveDays,
    totalLateMinutes: acc.totalLateMinutes + dept.totalLateMinutes,
    totalUndertimeMinutes: acc.totalUndertimeMinutes + dept.totalUndertimeMinutes
  }), {
    totalEmployees: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
    totalLateMinutes: 0,
    totalUndertimeMinutes: 0
  });

  const formatMinutes = (mins) => {
    if (!mins || mins === 0) return '-';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Meta Info Bar */}
      {meta && (
        <div className="bg-gray-100 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-700">
            Period: <span className="font-semibold text-gray-800">{new Date(meta.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> to <span className="font-semibold text-gray-800">{new Date(meta.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </span>
          <span className="text-sm text-gray-700">Working Days: <span className="font-semibold text-gray-800">{meta.workingDays}</span></span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200 shadow-sm">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 whitespace-nowrap">
                Department
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-800 whitespace-nowrap">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Employees
                </div>
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-800 whitespace-nowrap">
                Present
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-800 whitespace-nowrap">
                Absent
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-800 whitespace-nowrap">
                Late
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-800 whitespace-nowrap">
                On Leave
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-800 whitespace-nowrap">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Late Time
                </div>
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-800 whitespace-nowrap">
                Undertime
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-gray-800 whitespace-nowrap">
                Attendance %
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((dept, index) => (
              <tr 
                key={dept.department || index}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onDepartmentClick(dept.department)}
              >
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-800 text-sm">{dept.department}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-sm font-semibold text-gray-800">{dept.totalEmployees}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[32px] px-3 py-1.5 text-sm font-semibold rounded-full bg-green-100 text-green-700">
                    {dept.presentDays}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[32px] px-3 py-1.5 text-sm font-semibold rounded-full bg-red-100 text-red-700">
                    {dept.absentDays}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[32px] px-3 py-1.5 text-sm font-semibold rounded-full bg-amber-100 text-amber-700">
                    {dept.lateDays}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center justify-center min-w-[32px] px-3 py-1.5 text-sm font-semibold rounded-full bg-blue-100 text-blue-700">
                    {dept.leaveDays}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-sm text-gray-700 font-medium">
                  {formatMinutes(dept.totalLateMinutes)}
                </td>
                <td className="px-4 py-4 text-center text-sm text-gray-700 font-medium">
                  {formatMinutes(dept.totalUndertimeMinutes)}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`inline-flex items-center justify-center min-w-[48px] px-3 py-1.5 text-sm font-bold rounded-full ${
                    parseFloat(dept.attendanceRate) >= 90 ? 'bg-green-100 text-green-700' :
                    parseFloat(dept.attendanceRate) >= 70 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {dept.attendanceRate}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDepartmentClick(dept.department);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totals Row */}
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-gray-300">
              <td className="px-6 py-4 font-bold text-gray-800">
                Total ({data.length} departments)
              </td>
              <td className="px-4 py-4 text-center font-bold text-gray-800">
                {totals.totalEmployees}
              </td>
              <td className="px-4 py-4 text-center font-bold text-green-700">
                {totals.presentDays}
              </td>
              <td className="px-4 py-4 text-center font-bold text-red-700">
                {totals.absentDays}
              </td>
              <td className="px-4 py-4 text-center font-bold text-amber-700">
                {totals.lateDays}
              </td>
              <td className="px-4 py-4 text-center font-bold text-blue-700">
                {totals.leaveDays}
              </td>
              <td className="px-4 py-4 text-center font-bold text-gray-700">
                {formatMinutes(totals.totalLateMinutes)}
              </td>
              <td className="px-4 py-4 text-center font-bold text-gray-700">
                {formatMinutes(totals.totalUndertimeMinutes)}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

DepartmentReportsSummaryTable.displayName = 'DepartmentReportsSummaryTable';

export default DepartmentReportsSummaryTable;
