import React from 'react';
import { Users, Plus } from 'lucide-react';

interface EmployeeHeaderProps {
  onAddClick: () => void;
}

/**
 * Employee Header Component
 * Page header with title and add employee button
 */
const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
  onAddClick
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-gray-600" />
          Employee Directory
        </h1>
        <p className="text-gray-800 text-sm mt-1">Manage and view all employee records</p>
      </div>
      <button 
        className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
        onClick={onAddClick}
      >
        <Plus size={18} />
        Add Employee
      </button>
    </div>
  );
};

export default EmployeeHeader;
