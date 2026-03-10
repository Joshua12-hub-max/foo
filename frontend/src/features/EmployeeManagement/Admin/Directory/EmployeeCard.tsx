import React from 'react';
import { Mail, Users, Edit, Trash2 } from 'lucide-react';
// @ts-ignore
import { getStatusBadgeClass } from '../constants/employeeConstants';

import { Employee } from '@/types';

interface EmployeeCardProps {
  employee: Employee;
  onClick: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onClick,
  onEdit,
  onDelete
}) => {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(employee);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(employee);
  };

  const isTerminated = employee.employmentStatus === 'Terminated';

  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-md transition-all ${isTerminated ? 'opacity-75 grayscale-[0.5]' : ''}`}
      onClick={() => onClick(employee)}
    >
      <div className="p-6 relative">
        {/* Actions - Subtle */}
        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={handleEditClick} 
                className="p-1.5 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100" 
                title="Edit"
            >
                <Edit size={14} />
            </button>
            <button 
                onClick={handleDeleteClick} 
                className="p-1.5 bg-gray-50 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-gray-100" 
                title="Delete"
            >
                <Trash2 size={14} />
            </button>
        </div>

        <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gray-100 mb-4 overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 relative">
            {employee.avatarUrl ? (
                <img src={employee.avatarUrl} alt={employee.firstName} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-lg font-black uppercase">
                {(employee.firstName?.[0] || '')}{(employee.lastName?.[0] || '')}
                </div>
            )}
            </div>

            {/* Name & Title */}
            <h3 className={`font-bold text-gray-800 group-hover:text-gray-600 transition-colors text-sm ${isTerminated ? 'line-through decoration-red-400' : ''}`}>
                {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
                {employee.jobTitle || 'Member'}
            </p>

            {/* Info */}
            <div className="w-full mt-6 grid grid-cols-1 gap-2">
                <div className="flex items-center gap-3 text-xs text-gray-500 overflow-hidden bg-gray-50 p-2 rounded-xl border border-gray-50">
                    <Mail size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-50">
                    <Users size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{employee.department}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Footer ID Chip */}
      <div className="bg-gray-50/50 px-6 py-3 flex justify-between items-center border-t border-gray-100">
        <span className="text-[10px] font-mono font-medium text-gray-400">ID: {employee.employeeId}</span>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${getStatusBadgeClass(employee.employmentStatus || '')}`}>
            {employee.employmentStatus || 'Active'}
        </span>
      </div>
    </div>
  );
};

export default EmployeeCard;
