import React, { memo } from 'react';
import { Eye, Trash2 } from 'lucide-react';
// @ts-ignore
import { getStatusBadgeClass } from '../constants/employeeConstants';

const EMPLOYEE_TABLE_HEADERS = [
  { key: 'employee', label: 'Employee', align: 'left' },
  { key: 'email', label: 'Email', align: 'left' },
  { key: 'department', label: 'Department', align: 'left' },
  { key: 'position', label: 'Position', align: 'left' },
  { key: 'status', label: 'Status', align: 'left' },
  { key: 'actions', label: 'Actions', align: 'right' }
];

interface Employee {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
  department?: string | null;
  positionTitle?: string | null;
  jobTitle?: string | null;
  employmentStatus?: string;
  avatarUrl?: string;
}

interface EmployeeGridProps {
  employees: Employee[];
  loading: boolean;
  onEmployeeClick: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
}

const EmployeeTable: React.FC<EmployeeGridProps> = ({
  employees,
  loading,
  onEmployeeClick,
  onEditEmployee,
  onDeleteEmployee
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">No employees found</h3>
        <p className="text-gray-500">Try adjusting your search or add a new employee.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              {EMPLOYEE_TABLE_HEADERS.map(header => (
                <th 
                  key={header.key} 
                  className={`px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap ${header.align === 'right' ? 'text-right' : ''}`}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((employee) => {
              const isTerminated = employee.employmentStatus === 'Terminated';
              return (
                <tr 
                  key={employee.id} 
                  className={`hover:bg-gray-50 transition-colors group cursor-pointer ${isTerminated ? 'opacity-60' : ''}`}
                  onClick={() => onEmployeeClick(employee)}
                >
                  {/* Employee Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white ring-1 ring-gray-200">
                        {employee.avatarUrl ? (
                          <img src={employee.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className={`font-bold text-gray-800 ${isTerminated ? 'line-through decoration-red-400' : ''}`}>
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-xs font-mono text-gray-500">{employee.employeeId}</div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{employee.email}</span>
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700 font-medium">{employee.department || <span className="text-gray-400 italic">Not Assigned</span>}</span>
                  </td>

                  {/* Position */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{employee.positionTitle || employee.jobTitle || <span className="text-gray-400 italic">—</span>}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${getStatusBadgeClass(employee.employmentStatus || 'Active')}`}>
                      {employee.employmentStatus || 'Active'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEmployeeClick(employee); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteEmployee(employee); }}
                        className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete Employee"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(EmployeeTable);
