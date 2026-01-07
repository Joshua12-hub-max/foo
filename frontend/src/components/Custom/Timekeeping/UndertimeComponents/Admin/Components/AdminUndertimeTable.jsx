import { useState } from "react";
import { Search, Eye } from "lucide-react";
import { TABLE_HEADERS } from "../Constants/adminUndertime.constant";
import { UndertimeDetailsModal } from "../Modals/UndertimeDetailsModal";

export const AdminUndertimeTable = ({ 
  currentItems, 
  getStatusBadge,
  debouncedSearchQuery,
  filters,
  handleOpenApproveModal,
  handleOpenRejectModal
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
      <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
        <div className="overflow-x-auto bg-gray-50 rounded-lg">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-200 shadow-md text-gray-700">
              <tr>
                {TABLE_HEADERS.map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length ? (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                    <td className="px-6 py-4">
                      <span className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} style={{borderRadius: '20px'}}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.employeeId}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.employeeName}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{item.timeOut}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate" title={item.reason}>{item.reason}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {/* View Details Button */}
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-1.5 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {item.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleOpenApproveModal(item)}
                              className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(item)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Completed</span>
                        )}
                      </div>
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
                          : "No data available"}
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
      <UndertimeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        request={selectedRequest}
      />
    </>
  );
};

