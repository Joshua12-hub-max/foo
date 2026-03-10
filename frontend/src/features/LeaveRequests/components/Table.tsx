import React from 'react';
import { LEAVE_TABLE_HEADERS, STATUS_STYLES } from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/constants/leaveConstants';
import { EmployeeLeaveRequest, EmployeeLeaveFilters } from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/types';

interface TableProps {
  data: EmployeeLeaveRequest[];
  searchQuery: string;
  filters: EmployeeLeaveFilters;
  onFinalize?: (request: EmployeeLeaveRequest) => void;
}

export const Table: React.FC<TableProps> = ({ data, searchQuery, filters }) => {
  const getStatusBadge = (status: string) => {
    return STATUS_STYLES[status] || 'bg-gray-100 text-gray-800';
  };

  const hasActiveFilters = searchQuery || Object.values(filters).some(v => v);

  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {(LEAVE_TABLE_HEADERS as unknown as string[]).map((header) => (
                <th key={header} className="px-6 py-4 text-left text-sm font-bold tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 shadow-md">
            {data.length ? (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                  <td className="px-6 py-4">
                    <span 
                      className={`${getStatusBadge(item.status)} px-3 py-1 text-sm font-medium inline-block`} 
                      style={{borderRadius: '20px'}}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.employeeId}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{item.leaveType}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(item.fromDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(item.toDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {/* Actions removed */}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <p className="text-lg font-medium">No records found</p>
                    <p className="text-sm mt-1">
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
