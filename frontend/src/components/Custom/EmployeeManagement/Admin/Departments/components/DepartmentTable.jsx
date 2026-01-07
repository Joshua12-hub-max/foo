import { memo } from 'react';
import { SquarePen, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENT_TABLE_HEADERS } from '@/components/Custom/EmployeeManagement/Admin/Departments/constants/departmentConstants';

const DepartmentTable = memo(({ departments, loading, onEdit, onDelete }) => {
  const navigate = useNavigate();

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
              {DEPARTMENT_TABLE_HEADERS.map(header => (
                <th key={header.key} className={`px-6 py-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap ${header.align === 'right' ? 'text-right' : ''}`}>
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {departments.map((dept, index) => (
              <tr key={dept.id} className="hover:bg-gray-50 transition-colors group">
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
                            <div className="h-full bg-gray-800" style={{ width: `${Math.min(dept.employee_count * 5, 100)}%` }}></div>
                         </div>
                         <span className="text-xs font-medium text-gray-600">
                            {dept.employee_count || 0} Members
                        </span>
                    </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={() => navigate(`/admin-dashboard/departments/${dept.id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all"
                    >
                        <span>Details</span>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

DepartmentTable.displayName = 'DepartmentTable';

export default DepartmentTable;
