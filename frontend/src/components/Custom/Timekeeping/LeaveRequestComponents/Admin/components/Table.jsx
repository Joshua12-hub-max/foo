import { useCallback, useState } from 'react';
import { Eye } from 'lucide-react';
import LeaveDetailsModal from '../Modals/LeaveDetailsModal';

/**
 * Table component for Admin Leave Requests
 */
const Table = ({ data, onOpenApprove, onOpenReject }) => {
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (leave) => {
    setSelectedLeave(leave);
    setIsModalOpen(true);
  };
  const getStatusBadge = useCallback((status) => {
    const statusStyles = {
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Processing: 'bg-blue-100 text-blue-800',
      Finalizing: 'bg-purple-100 text-purple-800',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  }, []);

  const calculateDuration = useCallback((fromDate, toDate) => {
    if (!fromDate || !toDate) return 'N/A';
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (isNaN(from) || isNaN(to)) return 'Invalid';
    const diffTime = to - from;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? `${diffDays} day${diffDays > 1 ? 's' : ''}` : '0 days';
  }, []);

  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {['Status', 'Department', 'Employee ID', 'Employee Name', 'Leave Type', 'From Date', 'To Date', 'Duration', 'Actions'].map((header) => (
                <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length ? (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`}
                      style={{ borderRadius: '20px' }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.employee_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.leaveType}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{new Date(item.fromDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{new Date(item.toDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{calculateDuration(item.fromDate, item.toDate)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(item)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-1.5 rounded-md transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {item.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => onOpenApprove(item)}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onOpenReject(item)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(item.status === 'Approved' || item.status === 'Rejected') && (
                        <span className="text-gray-400 text-xs italic">Completed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <LeaveDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leaveRequest={selectedLeave}
        onApprove={() => {
          setIsModalOpen(false);
          onOpenApprove(selectedLeave);
        }}
        onReject={() => {
          setIsModalOpen(false);
          onOpenReject(selectedLeave);
        }}
      />
    </div>
  );
};

export default Table;
