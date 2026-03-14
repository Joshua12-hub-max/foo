import React, { memo, useMemo, useCallback } from 'react';
import { Users, Phone, SquarePen, Trash2, Calendar, Fingerprint } from 'lucide-react';
import EmploymentStatusBadge from '@/components/Custom/Common/EmploymentStatusBadge';

import { Employee } from '@/types';

interface EmployeeRowProps {
  employee: Employee;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (employee: Employee) => void;
}

// Memoized table row component
const EmployeeRow: React.FC<EmployeeRowProps> = memo(({ employee, onView, onEdit, onDelete }) => {
  const handleView = useCallback(() => onView(employee.id), [employee.id, onView]);
  const handleEdit = useCallback(() => onEdit(employee.id), [employee.id, onEdit]);
  const handleDelete = useCallback(() => onDelete(employee), [employee, onDelete]);

  const formatDate = (dateStr?: string | null) => {
    return dateStr ? new Date(dateStr).toLocaleDateString() : '—';
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            {employee.avatarUrl ? (
              <img src={employee.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span>{employee.firstName?.[0]}{employee.lastName?.[0]}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-800">{employee.firstName} {employee.lastName}</p>
            <p className="text-xs text-gray-500">{employee.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{employee.employeeId || '—'}</td>
      <td className="px-6 py-4 text-sm text-gray-800">{employee.positionTitle || employee.jobTitle || '—'}</td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span className="font-medium text-blue-600">{employee.duties || 'No Schedule'}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Phone size={14} />
          <span>{employee.phoneNumber || '—'}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span>{formatDate(employee.dateHired)}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-2">
            <EmploymentStatusBadge status={employee.employmentStatus || 'Active'} />
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold w-fit ${
                employee.isBiometricEnrolled ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
                <Fingerprint size={10} />
                <span>{employee.isBiometricEnrolled ? 'BIO ENROLLED' : 'NO BIOMETRICS'}</span>
            </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleView}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Users size={14} />
            <span>View</span>
          </button>
          <button 
            onClick={handleEdit}
            className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit Employee"
          >
            <SquarePen size={14} />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Remove from Department"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
});

EmployeeRow.displayName = 'EmployeeRow';

interface DepartmentEmployeeTableProps {
  employees: Employee[];
  onViewEmployee: (id: number) => void;
  onEditEmployee: (id: number) => void;
  onRemoveEmployee: (employee: Employee) => void;
}

const DepartmentEmployeeTable: React.FC<DepartmentEmployeeTableProps> = memo(({ 
  employees, 
  onViewEmployee, 
  onEditEmployee, 
  onRemoveEmployee 
}) => {
  // Memoize the rows rendering
  const tableRows = useMemo(() => {
    return employees.map((employee, index) => (
      <EmployeeRow
        key={`${employee.id}-${index}`}
        employee={employee}
        onView={onViewEmployee}
        onEdit={onEditEmployee}
        onDelete={onRemoveEmployee}
      />
    ));
  }, [employees, onViewEmployee, onEditEmployee, onRemoveEmployee]);

  if (employees.length === 0) {
    return (
      <tr>
        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
          No employees found in this department.
        </td>
      </tr>
    );
  }

  return <>{tableRows}</>;
});

DepartmentEmployeeTable.displayName = 'DepartmentEmployeeTable';

export default DepartmentEmployeeTable;
