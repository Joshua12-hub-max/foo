import React, { useCallback, useState } from 'react';
import { Eye } from 'lucide-react';
import { AdminLeaveRequest } from '../../types';
const LeaveDetailsModal = React.lazy(() => import('../../Modals/LeaveDetailsModal'));

interface TableProps {
  data: AdminLeaveRequest[];
  onOpenApprove: (request: AdminLeaveRequest) => void;
  onOpenReject: (request: AdminLeaveRequest) => void;
  onOpenProcess?: (request: AdminLeaveRequest) => void;
}

const Table: React.FC<TableProps> = ({ data, onOpenApprove, onOpenReject, onOpenProcess }) => {
  const [selectedLeave, setSelectedLeave] = useState<AdminLeaveRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (leave: AdminLeaveRequest) => {
    setSelectedLeave(leave);
    setIsModalOpen(true);
  };
  
  const getStatusBadge = useCallback((status: string) => {
    const statusStyles: Record<string, string> = {
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Processing: 'bg-blue-100 text-blue-800',
      Finalizing: 'bg-purple-100 text-purple-800',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  }, []);

  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
        <table className="w-full min-w-[1500px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {['Status', 'Employee ID', 'Employee Name', 'Leave Type', 'Payment', 'From Date', 'To Date', 'Credits', 'Actions'].map((header) => (
                <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length ? (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`${getStatusBadge(item.status)} px-3 py-1 text-xs font-semibold rounded-full`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">{item.employee_id || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {item.name || item.first_name ? `${item.first_name || ''} ${item.last_name || ''}`.trim() : 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{item.department || 'No Department'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{item.leaveType || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                        item.with_pay 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {item.with_pay ? 'With Pay' : 'Without Pay'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{new Date(item.fromDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{new Date(item.toDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${
                      (item.current_balance || 0) > 0 ? 'text-teal-600' : 'text-gray-400'
                    }`}>
                      {item.current_balance !== undefined ? item.current_balance : '-'}
                    </span>
                  </td>
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
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onOpenReject(item)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
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
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <React.Suspense fallback={null}>
        <LeaveDetailsModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          leaveRequest={selectedLeave}
          onApprove={() => {
            setIsModalOpen(false);
            if (selectedLeave) onOpenApprove(selectedLeave);
          }}
          onReject={() => {
            setIsModalOpen(false);
            if (selectedLeave) onOpenReject(selectedLeave);
          }}
        />
      </React.Suspense>
    </div>
  );
};

export default Table;
