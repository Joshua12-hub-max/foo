import { Users, Plus } from 'lucide-react';

/**
 * Employee Header Component
 * Page header with title and add employee button
 */
const EmployeeHeader = ({
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
        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors text-sm font-medium"
        onClick={onAddClick}
      >
        <Plus size={18} />
        Add Employee
      </button>
    </div>
  );
};

export default EmployeeHeader;
