import { useState } from "react";
import { Search, XCircle, Download, Eye } from "lucide-react";
import { TABLE_HEADERS } from "../Constants/employeeUndertime.constant";
import { EmployeeUndertimeDetailsModal } from "../Modals/EmployeeUndertimeDetailsModal";

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
  handleSearchChange,
  employeeInfo
}) => {
  const hasActiveFilters = debouncedSearchQuery || Object.values(filters).some(v => v);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleViewDetails = (item) => {
    setSelectedRequest(item);
    setIsDetailsModalOpen(true);
  };
  
  return (
    <>
      {/* Search and Export Bar */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex justify-between items-center w-full">
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#274b46]" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by date, status, or reason..."
              disabled={isLoading}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm w-full text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all disabled:opacity-50"
              aria-label="Search undertime requests"  
            />
          </div>
          
          {searchQuery && (
            <div className="text-sm text-gray-600">
              Found <span className="font-semibold text-gray-800">{filteredDataLength}</span> result{filteredDataLength !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-800">Export Options:</span>
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
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1 mb-6">
        <div className="overflow-x-auto bg-gray-50 rounded-lg">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-200 shadow-md text-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Time Out</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Reason</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Submitted At</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Reviewed At</th>
                <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {currentItems.length ? (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                    <td className="px-6 py-4">
                      <span className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} style={{borderRadius: '20px'}}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.timeOut}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate" title={item.reason}>{item.reason}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {item.reviewedAt ? new Date(item.reviewedAt).toLocaleDateString() : 'Pending'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* View Details Button */}
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-1.5 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {/* Cancel Button - Only for Pending */}
                        {item.status === 'Pending' ? (
                          <button
                            onClick={() => handleCancelRequest(item.id)}
                            disabled={isLoading}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                            title="Cancel request"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
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

      {/* Undertime Details Modal */}
      <EmployeeUndertimeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        request={selectedRequest}
        employeeInfo={employeeInfo}
      />
    </>
  );
};

