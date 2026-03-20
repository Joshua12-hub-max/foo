// Optimized Administration Table Component
import React, { useCallback } from 'react';
import { AdminLeaveRequest } from '../../types';
import { CheckCircle, Trash2, Info } from 'lucide-react';

interface TableProps {
  data: AdminLeaveRequest[];
  onOpenApprove: (request: AdminLeaveRequest) => void;
  onOpenReject: (request: AdminLeaveRequest) => void;
  onOpenProcess?: (request: AdminLeaveRequest) => void;
}

const Table: React.FC<TableProps> = ({ data, onOpenApprove, onOpenReject, onOpenProcess }) => {
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
              {['Employee ID', 'Employee Name', 'Department', 'Leave Type', 'Payment', 'From Date', 'Status', 'To Date', 'Credits', 'Actions'].map((header) => (
                <th key={header} className="px-6 py-4 text-left text-sm font-semibold tracking-wide whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length ? (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">{item.employeeId || 'Missing'}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {`${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{item.department || 'No Department'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{item.leaveType || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                        item.isWithPay 
                          ? 'bg-gray-50 text-gray-600 border border-gray-100' 
                          : 'bg-gray-50 text-gray-600 border border-gray-100'
                      }`}
                    >
                      {item.isWithPay ? 'With Pay' : 'Without Pay'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`${getStatusBadge(item.status)} px-2 py-0.5 rounded-md text-[10px] font-semibold shadow-sm inline-block`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">{new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-white text-gray-900 border border-gray-200 shadow-sm`}>
                        <span className="text-sm font-medium">
                          {Number(item.workingDays || 0).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium tracking-tighter">Days</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {item.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => onOpenApprove(item)}
                            title="Approve"
                            className="px-3 py-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-gray-200"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => onOpenReject(item)}
                            title="Reject"
                            className="px-3 py-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-gray-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}
                      
                       {(item.status === 'Approved' || item.status === 'Rejected') && !onOpenProcess && (
                          <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-3 py-1 rounded border border-gray-100">
                             <span className="text-[10px] font-semibold">Locked</span>
                          </div>
                       )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2 opacity-60">
                    <p className="font-semibold tracking-tight">No leave applications found matching current filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;


