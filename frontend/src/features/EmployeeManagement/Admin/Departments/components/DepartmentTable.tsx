import React, { memo, useState, useCallback, useEffect } from 'react';
import { SquarePen, Trash2, ChevronDown, ChevronRight, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import { DEPARTMENT_TABLE_HEADERS } from '@/components/Custom/EmployeeManagement/Admin/Departments/constants/departmentConstants';
// @ts-ignore
import { DepartmentEmployeeTable } from '@features/EmployeeManagement/Admin/Departments';
// @ts-ignore
import { fetchDepartmentEmployees } from '@api/departmentApi';

import { Department } from '@/types/org';
import { Employee } from '@/types';

interface DepartmentTableProps {
  departments: Department[];
  loading: boolean;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  onRemoveEmployee: (employee: Employee, deptId: number) => void;
  onRegister: (dept: Department) => void;
}

const DepartmentTable: React.FC<DepartmentTableProps> = memo(({ departments, loading, onEdit, onDelete, onRemoveEmployee, onRegister }) => {
  const navigate = useNavigate();
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [departmentEmployees, setDepartmentEmployees] = useState<Record<number, Employee[]>>({});
  const [loadingEmployees, setLoadingEmployees] = useState<Record<number, boolean>>({});

  const toggleRow = useCallback(async (deptId: number) => {
    const isExpanding = !expandedRows[deptId];
    setExpandedRows(prev => ({ ...prev, [deptId]: isExpanding }));

    if (isExpanding && !departmentEmployees[deptId]) {
      try {
        setLoadingEmployees(prev => ({ ...prev, [deptId]: true }));
        const response = await fetchDepartmentEmployees(deptId);
        if (response.success) {
          setDepartmentEmployees(prev => ({ ...prev, [deptId]: response.employees || [] }));
        }
      } catch (error) {
        console.error(`Failed to fetch employees for department ${deptId}:`, error);
      } finally {
        setLoadingEmployees(prev => ({ ...prev, [deptId]: false }));
      }
    }
  }, [expandedRows, departmentEmployees]);

  const navigateToEmployee = useCallback((employeeId: number) => {
    navigate(`/admin-dashboard/employees/${employeeId}/profile`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  if (departments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">No departments found</h3>
            <p className="text-gray-500">Try adjusting your search or add a new department.</p>
        </div>
      );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 w-10"></th>
              {DEPARTMENT_TABLE_HEADERS.map((header: { key: string; label: string; align?: string }) => (
                <th key={header.key} className={`px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap ${header.align === 'right' ? 'text-right' : ''}`}>
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {departments.map((dept, index) => {
                const isExpanded = !!expandedRows[dept.id];
                const employees = departmentEmployees[dept.id] || [];
                const isLoadingEmp = !!loadingEmployees[dept.id];

                return (
                    <React.Fragment key={`${dept.id}-${index}`}>
                        <tr className={`hover:bg-gray-50 transition-colors group ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                            <td className="px-4 py-4">
                                <button 
                                    onClick={() => toggleRow(dept.id)}
                                    className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-gray-500">
                                DEPT-{String(index + 1).padStart(3, '0')}
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-800">{dept.name}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                {dept.head_of_department || <span className="text-gray-400 italic">Not Assigned</span>}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gray-800" style={{ width: `${Math.min((dept.employee_count || 0) * 5, 100)}%` }}></div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">
                                        {dept.employee_count || 0} Members
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={() => toggleRow(dept.id)}
                                        className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all ${
                                            isExpanded 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-white hover:shadow-sm'
                                        }`}
                                    >
                                        <Users size={14} />
                                        <span>{isExpanded ? 'Hide Employees' : 'View Employees'}</span>
                                    </button>
                                    <button 
                                        onClick={() => onRegister(dept)}
                                        className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 transition-all"
                                        title="Register Employee"
                                    >
                                        <Users size={14} />
                                    </button>
                                    <button 
                                        onClick={() => onEdit(dept)}
                                        className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all"
                                        title="Edit Department"
                                    >
                                        <SquarePen size={14} />
                                    </button>
                                    <button 
                                        onClick={() => onDelete(dept)}
                                        className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                                        title="Delete Department"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        {isExpanded && (
                            <tr className="bg-gray-50/50">
                                <td colSpan={6} className="px-12 py-4">
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="px-4 py-2 bg-gray-100/50 border-b border-gray-200 flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                                                <Users size={14} />
                                                Employees in {dept.name}
                                            </span>
                                            <button 
                                                onClick={() => navigate(`/admin-dashboard/departments/${dept.id}`)}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide"
                                            >
                                                Manage Department Details
                                            </button>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {isLoadingEmp ? (
                                                <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
                                                    <Loader2 className="animate-spin" size={24} />
                                                    <span className="text-sm font-medium">Fetching workforce details...</span>
                                                </div>
                                            ) : (
                                                <table className="w-full text-left">
                                                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase">
                                                        <tr>
                                                            <th className="px-6 py-2">Member</th>
                                                            <th className="px-6 py-2">Employee ID</th>
                                                            <th className="px-6 py-2">Position</th>
                                                            <th className="px-6 py-2">Duties</th>
                                                            <th className="px-6 py-2">Phone</th>
                                                            <th className="px-6 py-2">Date Hired</th>
                                                            <th className="px-6 py-2">Status</th>
                                                            <th className="px-6 py-2 text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        <DepartmentEmployeeTable 
                                                            employees={employees}
                                                            onViewEmployee={navigateToEmployee}
                                                            onEditEmployee={navigateToEmployee}
                                                            onRemoveEmployee={(employee) => onRemoveEmployee(employee, dept.id)}
                                                        />
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

DepartmentTable.displayName = 'DepartmentTable';

export default DepartmentTable;
