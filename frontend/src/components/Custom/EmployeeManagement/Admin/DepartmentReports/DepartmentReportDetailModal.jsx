import { X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const DepartmentReportDetailModal = ({isOpen, department, data, isLoading, filters, meta, onClose, onFilterChange, onPageChange}) => {
  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
  };

  const getStatusBadge = (status) => {const styles = {Present: 'bg-green-100 text-green-700',Absent: 'bg-red-100 text-red-700',Late: 'bg-amber-100 text-amber-700',Leave: 'bg-blue-100 text-blue-700'};
  return styles[status] || 'bg-gray-100 text-gray-700';};

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center rounded-xl overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 rounded-xl" onClick={onClose}/>

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 max-h-[85vh] flex flex-col overflow-hidden p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              {department} - Attendance Details
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {meta?.fromDate && meta?.toDate && (
                <>
                  {formatDate(meta.fromDate)} to {formatDate(meta.toDate)} • {meta.totalRecords} records
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee name or ID..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || 'all'}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Leave">On Leave</option>
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 text-sm">Loading records...</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No records found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-200 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Employee ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Position</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Time In</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Time Out</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Late</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-800">Undertime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-mono">
                      {record.employeeId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                      {record.employeeName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.jobTitle}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center font-medium">
                      {record.timeIn}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center font-medium">
                      {record.timeOut}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {record.lateMinutes > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-sm font-semibold text-amber-700 bg-amber-50 rounded">
                          {record.lateMinutes}m
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {record.undertimeMinutes > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-sm font-semibold text-red-700 bg-red-50 rounded">
                          {record.undertimeMinutes}m
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Page <span className="font-semibold">{meta.currentPage}</span> of <span className="font-semibold">{meta.totalPages}</span> ({meta.totalRecords} total records)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(meta.currentPage - 1)}
                disabled={meta.currentPage <= 1 || isLoading}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => onPageChange(meta.currentPage + 1)}
                disabled={meta.currentPage >= meta.totalPages || isLoading}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentReportDetailModal;
