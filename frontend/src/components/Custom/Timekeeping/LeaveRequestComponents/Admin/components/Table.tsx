import React, { useCallback, useState } from 'react';
import { Eye } from 'lucide-react';
import { AdminLeaveRequest } from '../types';
import LeaveDetailsModal from '../Modals/LeaveDetailsModal';

interface TableProps {
  data: AdminLeaveRequest[];
  onOpenApprove: (request: AdminLeaveRequest) => void;
  onOpenReject: (request: AdminLeaveRequest) => void;
}

const Table: React.FC<TableProps> = ({ data, onOpenApprove, onOpenReject }) => {
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
        <table className="w-full min-w-[1400px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {['Status', 'Department', 'Employee ID', 'Employee Name', 'Leave Type', 'From Date', 'To Date', 'Credits', 'Actions'].map((header) => (
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
                  <td className="px-6 py-4">
                    <span
                      className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`}
                      style={{ borderRadius: '20px' }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.department || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.employeeId || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.name || item.employeeId || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.leaveType || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{new Date(item.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{new Date(item.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${
                      (item.currentBalance || 0) > 0 ? 'text-teal-600' : 'text-gray-400'
                    }`}>
                      {item.currentBalance !== undefined ? item.currentBalance : '-'}
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
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
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
        leave={selectedLeave} 
      />
    </div>
  );
};

export default Table;
