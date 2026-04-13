import React from 'react';
import { CheckCircle, Info } from 'lucide-react';
import { STATUS_STYLES } from './constants/leaveConstants';
import { EmployeeLeaveRequest } from '../../types';
import { useLeaveStore } from '@/stores/leaveStore';

interface TableProps {
  data: EmployeeLeaveRequest[];
  searchQuery: string;
  onFinalize?: (request: EmployeeLeaveRequest) => void;
}

export const Table: React.FC<TableProps> = ({ data, searchQuery, onFinalize }) => {
  const { filters } = useLeaveStore();
  const getStatusBadge = (status: string) => {
    return STATUS_STYLES[status] || 'bg-gray-100 text-gray-800';
  };

  const hasActiveFilters = searchQuery || Object.values(filters).some(v => v !== '' && v !== undefined);

  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {['Employee Id', 'Request Id', 'Department', 'Leave Type', 'Payment', 'From Date', 'Status', 'To Date', 'Credits', 'Actions'].map((header) => (
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
                  <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">{item.employeeId || 'Missing'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-mono whitespace-nowrap font-medium">#{String(item.id).slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{item.department || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium whitespace-nowrap">{item.leaveType}</td>
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
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                    {new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`${getStatusBadge(item.status)} px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm inline-block`} 
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                    {new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-700 border border-gray-100 shadow-sm`}>
                        <span className="text-sm font-medium">
                          {Number(item.workingDays || 0).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium tracking-tighter">Days</span>
                    </div>
                  </td>
                   <td className="px-6 py-4">
                    {item.status === 'Processing' && onFinalize && (
                      <button
                        onClick={() => onFinalize(item)}
                        title="Finalize Request"
                        className="px-3 py-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-indigo-100"
                      >
                        <CheckCircle size={14} />
                        Finalize
                      </button>
                    )}
                    {item.status !== 'Pending' && item.status !== 'Processing' && (
                       <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 w-fit shadow-inner">
                          <span className="text-[10px] font-bold tracking-widest">Archived</span>
                       </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500 opacity-60">
                    <Info size={40} strokeWidth={1.5} />
                    <p className="text-lg font-medium mt-2">No records found</p>
                    <p className="text-sm">
                      {hasActiveFilters 
                        ? 'Try adjusting your filters or search terms' 
                        : 'No leave requests available'}
                    </p>
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

