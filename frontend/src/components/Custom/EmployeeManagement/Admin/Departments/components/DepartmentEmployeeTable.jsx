import React, { memo, useMemo, useCallback } from 'react';
import { Users, Phone, SquarePen, Trash2, Calendar } from 'lucide-react';
import EmploymentStatusBadge from '@components/Custom/Common/EmploymentStatusBadge';

// Memoized table row component
const EmployeeRow = memo(({ employee, onView, onEdit, onDelete }) => {
  const handleView = useCallback(() => onView(employee.id), [employee.id, onView]);
  const handleEdit = useCallback(() => onEdit(employee.id), [employee.id, onEdit]);
  const handleDelete = useCallback(() => onDelete(employee), [employee, onDelete]);

  const formatDate = (dateStr) => {
    return dateStr ? new Date(dateStr).toLocaleDateString() : '—';
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            {employee.avatar_url ? (
              <img src={employee.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span>{employee.first_name?.[0]}{employee.last_name?.[0]}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-800">{employee.first_name} {employee.last_name}</p>
            <p className="text-xs text-gray-500">{employee.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{employee.employee_id || '—'}</td>
      <td className="px-6 py-4 text-sm text-gray-800">{employee.position_title || employee.job_title || '—'}</td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Phone size={14} />
          <span>{employee.phone_number || '—'}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <span>{formatDate(employee.date_hired)}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <EmploymentStatusBadge status={employee.employment_status || 'Active'} />
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

const DepartmentEmployeeTable = memo(({ 
  employees, 
  onViewEmployee, 
  onEditEmployee, 
  onRemoveEmployee 
}) => {
  // Memoize the rows rendering
  const tableRows = useMemo(() => {
    return employees.map((employee) => (
      <EmployeeRow
        key={employee.id}
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
        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
          No employees found in this department.
        </td>
      </tr>
    );
  }

  return <>{tableRows}</>;
});

DepartmentEmployeeTable.displayName = 'DepartmentEmployeeTable';

export default DepartmentEmployeeTable;
