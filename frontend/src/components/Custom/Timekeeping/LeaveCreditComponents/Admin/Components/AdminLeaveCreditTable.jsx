import { CheckCircle, XCircle } from 'lucide-react';

const getStatusBadge = (status) => {
  const statusStyles = {
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    Pending: 'bg-yellow-100 text-yellow-800',
  };
  return statusStyles[status] || 'bg-gray-100 text-gray-800';
};

export const AdminLeaveCreditTable = ({ activeTab, currentItems, formatDate, onOpenApproveModal, onOpenRejectModal }) => {
  // Define headers based on tab
  const creditHeaders = ['Employee ID', 'Employee Name', 'Department', 'Credit Type', 'Balance'];
  const requestHeaders = ['Status', 'Date', 'Employee', 'Department', 'Credit Type', 'Days', 'Reason', 'Actions'];

  const headers = activeTab === 'credits' ? creditHeaders : requestHeaders;

  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length ? (
              activeTab === 'credits' ? currentItems.map(item => (
                <tr key={`${item.employeeId}-${item.creditType}`} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800">{item.employeeId}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">{item.employeeName}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.creditType}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{item.balance}</td>
                </tr>
              )) : currentItems.map(req => (
                <tr key={req.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`${getStatusBadge(req.status)} px-3 py-1 text-sm font-medium inline-block`}
                      style={{ borderRadius: '20px' }}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{formatDate(req.created_at)}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">{req.first_name} {req.last_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{req.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{req.credit_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{req.requested_amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 max-w-[200px] truncate" title={req.reason}>{req.reason}</td>
                  <td className="px-6 py-4">
                    {req.status === 'Pending' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onOpenApproveModal(req)} 
                          className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => onOpenRejectModal(req)} 
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Completed</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
