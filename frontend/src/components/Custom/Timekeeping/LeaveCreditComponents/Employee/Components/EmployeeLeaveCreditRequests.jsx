import { useState } from 'react';

const ITEMS_PER_PAGE = 10;

export const EmployeeLeaveCreditRequests = ({ requests, formatDate }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const getStatusBadge = (status) => {
    const statusStyles = {
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Pending: 'bg-yellow-100 text-yellow-800',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  // Pagination logic
  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = requests.slice(startIndex, endIndex);

  const handlePrevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));

  return (
    <div>
      {/* Table */}
      <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
        <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-200 shadow-md text-gray-700">
              <tr>
                {['Status', 'Date', 'Leave Type', 'Days', 'Reason'].map((header) => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length ? currentItems.map((r) => (
                <tr key={r.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`${getStatusBadge(r.status)} px-3 py-1 text-sm font-medium inline-block`}
                      style={{ borderRadius: '20px' }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{formatDate(r.created_at)}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{r.credit_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{r.requested_amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{r.reason}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No requests yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {requests.length > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-600">
            Showing <span className="font-medium text-[#274b46]">{startIndex + 1}-{Math.min(endIndex, requests.length)}</span> of <span className="font-medium text-[#274b46]">{requests.length}</span> records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages || 1}</span>
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
