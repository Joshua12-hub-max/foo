import { memo, useMemo, useCallback } from 'react';
import { Building2, Users, Clock, Eye, Search } from 'lucide-react';

/**
 * Summary table component for Department Reports
 * Redesigned to match Timekeeping table style
 */
export const DepartmentReportsSummaryTable = memo(({
  data,
  isLoading,
  onDepartmentClick,
  meta
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
        <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm font-medium">Loading department reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
        <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Search className="w-12 h-12 opacity-50" />
            <p className="text-lg font-medium">No records found</p>
            <p className="text-sm">No department data found for the selected period</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totals = useMemo(() => data.reduce((acc, dept) => ({
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
  }), [data]);

  const formatMinutes = useCallback((mins) => {
    if (!mins || mins === 0) return '-';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }, []);

  const getAttendanceBadge = (rate) => {
    const numRate = parseFloat(rate);
    if (numRate >= 90) return 'bg-green-100 text-green-700';
    if (numRate >= 70) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      {/* Meta Info Bar */}
      {meta && (
        <div className="bg-white px-6 py-3 mb-1 rounded-lg flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <span className="text-gray-600">
              Period: <span className="font-semibold text-gray-800">{new Date(meta.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> to <span className="font-semibold text-gray-800">{new Date(meta.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-600">
              Working Days: <span className="font-semibold text-gray-800">{meta.workingDays}</span>
            </span>
          </div>
          <span className="text-gray-500 text-sm">{data.length} department{data.length !== 1 ? 's' : ''} found</span>
        </div>
      )}

      <div className="overflow-x-auto bg-gray-50 rounded-lg">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Department</th>
              <th className="px-4 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Employees
                </div>
              </th>
              <th className="px-4 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Present</th>
              <th className="px-4 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Absent</th>
              <th className="px-4 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Late</th>
              <th className="px-4 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">On Leave</th>
              <th className="px-4 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Late Time
                </div>
              </th>
              <th className="px-4 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Undertime</th>
              <th className="px-4 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Attendance %</th>
              <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((dept, index) => (
              <tr 
                key={dept.department || index}
                className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors cursor-pointer bg-white"
                onClick={() => onDepartmentClick(dept.department)}
              >
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-800 text-sm">{dept.department}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-sm font-semibold text-gray-800">{dept.totalEmployees}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="bg-green-100 text-green-700 px-3 py-1 text-sm font-medium inline-block" style={{borderRadius: '20px'}}>
                    {dept.presentDays}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="bg-red-100 text-red-700 px-3 py-1 text-sm font-medium inline-block" style={{borderRadius: '20px'}}>
                    {dept.absentDays}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 text-sm font-medium inline-block" style={{borderRadius: '20px'}}>
                    {dept.lateDays}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 text-sm font-medium inline-block" style={{borderRadius: '20px'}}>
                    {dept.leaveDays}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-sm text-gray-800">
                  {formatMinutes(dept.totalLateMinutes)}
                </td>
                <td className="px-4 py-4 text-center text-sm text-gray-800">
                  {formatMinutes(dept.totalUndertimeMinutes)}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`${getAttendanceBadge(dept.attendanceRate)} px-3 py-1 text-sm font-bold inline-block`} style={{borderRadius: '20px'}}>
                    {dept.attendanceRate}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDepartmentClick(dept.department);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                    style={{borderRadius: '20px'}}
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
              <td className="px-6 py-3 font-bold text-gray-800 text-sm">
                Total ({data.length} departments)
              </td>
              <td className="px-4 py-3 text-center font-bold text-gray-800 text-sm">
                {totals.totalEmployees}
              </td>
              <td className="px-4 py-3 text-center font-bold text-green-700 text-sm">
                {totals.presentDays}
              </td>
              <td className="px-4 py-3 text-center font-bold text-red-700 text-sm">
                {totals.absentDays}
              </td>
              <td className="px-4 py-3 text-center font-bold text-amber-700 text-sm">
                {totals.lateDays}
              </td>
              <td className="px-4 py-3 text-center font-bold text-blue-700 text-sm">
                {totals.leaveDays}
              </td>
              <td className="px-4 py-3 text-center font-bold text-gray-700 text-sm">
                {formatMinutes(totals.totalLateMinutes)}
              </td>
              <td className="px-4 py-3 text-center font-bold text-gray-700 text-sm">
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
