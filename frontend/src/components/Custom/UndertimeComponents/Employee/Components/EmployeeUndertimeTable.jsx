import { Search, XCircle, Download, FileText } from "lucide-react";
import { TABLE_HEADERS } from "../Constants/employeeUndertime.constant";

export const EmployeeUndertimeTable = ({ 
  currentItems, 
  getStatusBadge,
  debouncedSearchQuery,
  filters,
  handleCancelRequest,
  isLoading,
  handleExportCSV,
  handleExportPDF,
  filteredDataLength,
  searchQuery,
  handleSearchChange
}) => {
  const hasActiveFilters = debouncedSearchQuery || Object.values(filters).some(v => v);
  
  return (
    <>
      {/* Search and Export Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#274b46]" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by date, status, or reason..."
            disabled={isLoading}
            className="pl-10 pr-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-lg w-full text-sm"
            aria-label="Search undertime requests"  
          />
        </div>
        <div className="flex items-center gap-6">
          {searchQuery && (
            <div className="text-sm text-gray-600">
              Found <span className="font-semibold text-gray-800">{filteredDataLength}</span> result{filteredDataLength !== 1 ? 's' : ''}
            </div>
          )}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-gray-800">Export:</span>
            <button
              onClick={handleExportCSV}
              disabled={isLoading || filteredDataLength === 0}
              className="text-green-700 flex items-center text-sm font-medium space-x-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Export to CSV"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isLoading || filteredDataLength === 0}
              className="text-red-700 flex items-center text-sm font-medium space-x-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Export to PDF"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1 mb-6">
        <div className="overflow-x-auto bg-gray-50 rounded-lg">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-[#274b46] text-[#F8F9FA]">
              <tr>
                {TABLE_HEADERS.map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length ? (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#34645c] transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-800">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.timeOut}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} style={{borderRadius: '20px'}}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {item.reviewedAt ? new Date(item.reviewedAt).toLocaleDateString() : 'Pending'}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'Pending' ? (
                        <button
                          onClick={() => handleCancelRequest(item.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
                          title="Cancel request"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">No Action</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-medium">No records found</p>
                      <p className="text-sm mt-1">
                        {hasActiveFilters
                          ? "Try adjusting your filters or search terms" 
                          : "No undertime requests yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
